import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import {Platform} from "react-native";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  static async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const {status: existingStatus} =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const {status} = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
      alert("Must use physical device for Push Notifications");
    }

    return token;
  }

  static async scheduleTaskNotification(task) {
    if (!task.dueDate) return;

    const trigger = new Date(task.dueDate);
    const now = new Date();

    // Only schedule if the due date is in the future
    if (trigger > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Task Due",
          body: `Your task "${task.text}" is due!`,
          data: {taskId: task.id},
        },
        trigger,
      });
    }
  }

  static async cancelTaskNotification(taskId) {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();
    const notificationToCancel = scheduledNotifications.find(
      (notification) => notification.content.data.taskId === taskId
    );

    if (notificationToCancel) {
      await Notifications.cancelScheduledNotificationAsync(
        notificationToCancel.identifier
      );
    }
  }

  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}
