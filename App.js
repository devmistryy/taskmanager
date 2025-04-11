import {StatusBar} from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from "react-native";
import {useState, useEffect, useRef} from "react";
import {NotificationService} from "./services/NotificationService";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [priority, setPriority] = useState("Medium");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sortBy, setSortBy] = useState("none"); // none, priority, date
  const [showSortModal, setShowSortModal] = useState(false);
  const [animatingTaskId, setAnimatingTaskId] = useState(null);
  const [nextTaskId, setNextTaskId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const translateYCurrent = useRef(new Animated.Value(0)).current;
  const translateYNext = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    NotificationService.registerForPushNotificationsAsync();
  }, []);

  const addTask = async () => {
    if (newTask.trim() !== "") {
      const task = {
        id: Date.now().toString(),
        text: newTask.trim(),
        completed: false,
        priority: priority,
        dueDate: selectedDate,
      };

      setTasks([...tasks, task]);
      setNewTask("");
      setPriority("Medium");
      setSelectedDate(new Date());
      setShowAddTask(false);
    }
  };

  const toggleTask = (id) => {
    // Find the index of the current task and the next task
    const currentIndex = sortedTasks.findIndex((task) => task.id === id);
    const nextTask = sortedTasks[currentIndex + 1];

    setAnimatingTaskId(id);
    if (nextTask) {
      setNextTaskId(nextTask.id);
    }

    // Animate both tasks simultaneously
    Animated.parallel([
      Animated.timing(translateYCurrent, {
        toValue: 50, // Move current task down
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateYNext, {
        toValue: -50, // Move next task up
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Update task completion status
      const updatedTasks = tasks.map((task) => {
        if (task.id === id) {
          return {...task, completed: !task.completed};
        }
        return task;
      });
      setTasks(updatedTasks);

      // Reset animation values
      translateYCurrent.setValue(0);
      translateYNext.setValue(0);
      setAnimatingTaskId(null);
      setNextTaskId(null);
    });
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const togglePriority = () => {
    const priorities = ["Low", "Medium", "High"];
    const currentIndex = priorities.indexOf(priority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    setPriority(priorities[nextIndex]);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "#ff3b30";
      case "Medium":
        return "#FFC000";
      case "Low":
        return "#4CAF50";
      default:
        return "#007AFF";
    }
  };

  const sortTasks = (tasksToSort) => {
    const priorityOrder = {High: 0, Medium: 1, Low: 2};

    // First, separate completed and uncompleted tasks
    const uncompletedTasks = tasksToSort.filter((task) => !task.completed);
    const completedTasks = tasksToSort.filter((task) => task.completed);

    // Sort uncompleted tasks based on selected criteria
    let sortedUncompletedTasks = [...uncompletedTasks];
    switch (sortBy) {
      case "priority":
        sortedUncompletedTasks.sort(
          (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
        );
        break;
      case "date":
        sortedUncompletedTasks.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
        break;
    }

    // Sort completed tasks using the same criteria
    let sortedCompletedTasks = [...completedTasks];
    switch (sortBy) {
      case "priority":
        sortedCompletedTasks.sort(
          (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
        );
        break;
      case "date":
        sortedCompletedTasks.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
        break;
    }

    // Return combined array with completed tasks at the bottom
    return [...sortedUncompletedTasks, ...sortedCompletedTasks];
  };

  const sortedTasks = sortTasks(tasks);

  const startEditingTask = (task) => {
    setEditingTask(task);
    setNewTask(task.text);
    setPriority(task.priority);
    setSelectedDate(new Date(task.dueDate));
    setShowEditModal(true);
  };

  const saveEditedTask = () => {
    if (newTask.trim() !== "") {
      const updatedTasks = tasks.map((task) =>
        task.id === editingTask.id
          ? {
              ...task,
              text: newTask.trim(),
              priority: priority,
              dueDate: selectedDate,
            }
          : task
      );
      setTasks(updatedTasks);
      setShowEditModal(false);
      setEditingTask(null);
      setNewTask("");
      setPriority("Medium");
      setSelectedDate(new Date());
    }
  };

  const renderTask = ({item}) => (
    <Animated.View
      style={[
        styles.taskItem,
        item.id === animatingTaskId && {
          transform: [{translateY: translateYCurrent}],
        },
        item.id === nextTaskId && {
          transform: [{translateY: translateYNext}],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.checkbox, item.completed && styles.checked]}
        onPress={() => toggleTask(item.id)}
      >
        {item.completed && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
      <View style={styles.taskContent}>
        <Text style={[styles.taskText, item.completed && styles.completedText]}>
          {item.text}
        </Text>
        <View style={styles.taskDetails}>
          <Text
            style={[
              styles.priorityText,
              {color: getPriorityColor(item.priority)},
            ]}
          >
            {item.priority}
          </Text>
          {item.dueDate && (
            <Text style={styles.dueDateText}>
              Due: {item.dueDate.toLocaleDateString()}{" "}
              {item.dueDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => startEditingTask(item)}
      >
        <Text style={styles.editButtonText}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteTask(item.id)}
      >
        <Text style={styles.deleteText}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView key={refreshKey} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Task Manager</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setShowSortModal(true)}
            >
              <Text style={styles.sortButtonText}>⇅</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plusButton}
              onPress={() => setShowAddTask(!showAddTask)}
            >
              <Text style={styles.plusButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.taskList}>
          <Text style={styles.subtitle}>Your Tasks</Text>
          <FlatList
            data={sortedTasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id}
            style={styles.list}
          />
        </View>

        <Modal
          visible={showAddTask}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddTask(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add New Task</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      setShowAddTask(false);
                      setNewTask("");
                      setPriority("Medium");
                    }}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Add a new task..."
                  value={newTask}
                  onChangeText={setNewTask}
                />

                <View style={styles.prioritySection}>
                  <View style={styles.priorityRow}>
                    <Text style={styles.priorityLabel}>Priority:</Text>
                    <View style={styles.priorityContainer}>
                      <TouchableOpacity
                        style={[
                          styles.priorityOption,
                          priority === "Low" && styles.selectedPriority,
                          {backgroundColor: "#4CAF50"},
                        ]}
                        onPress={() => setPriority("Low")}
                      >
                        <Text style={styles.priorityOptionText}>Low</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.priorityOption,
                          priority === "Medium" && styles.selectedPriority,
                          {backgroundColor: "#FFC000"},
                        ]}
                        onPress={() => setPriority("Medium")}
                      >
                        <Text style={styles.priorityOptionText}>Medium</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.priorityOption,
                          priority === "High" && styles.selectedPriority,
                          {backgroundColor: "#ff3b30"},
                        ]}
                        onPress={() => setPriority("High")}
                      >
                        <Text style={styles.priorityOptionText}>High</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.dateTimeSection}>
                  <View style={styles.dateTimeRow}>
                    <Text style={styles.dateTimeLabel}>Date & Time:</Text>
                    <View style={styles.dateTimePickers}>
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                          if (date) {
                            setSelectedDate(date);
                          }
                        }}
                      />
                      <DateTimePicker
                        value={selectedDate}
                        mode="time"
                        display="default"
                        onChange={(event, date) => {
                          if (date) {
                            setSelectedDate(date);
                          }
                        }}
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.addButton} onPress={addTask}>
                  <Text style={styles.addButtonText}>Add Task</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <Modal
          visible={showSortModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowSortModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowSortModal(false)}>
            <View style={styles.sortModalOverlay}>
              <View style={styles.sortModalContent}>
                <Text style={styles.sortModalTitle}>Sort by</Text>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortBy === "priority" && styles.selectedSort,
                  ]}
                  onPress={() => {
                    setSortBy("priority");
                    setShowSortModal(false);
                  }}
                >
                  <Text style={styles.sortOptionText}>Priority</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortBy === "date" && styles.selectedSort,
                  ]}
                  onPress={() => {
                    setSortBy("date");
                    setShowSortModal(false);
                  }}
                >
                  <Text style={styles.sortOptionText}>Due Date</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortBy === "none" && styles.selectedSort,
                  ]}
                  onPress={() => {
                    setSortBy("none");
                    setShowSortModal(false);
                  }}
                >
                  <Text style={styles.sortOptionText}>None</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <Modal
          visible={showEditModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowEditModal(false);
            setEditingTask(null);
            setNewTask("");
            setPriority("Medium");
          }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Task</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      setShowEditModal(false);
                      setEditingTask(null);
                      setNewTask("");
                      setPriority("Medium");
                    }}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Edit task..."
                  value={newTask}
                  onChangeText={setNewTask}
                />

                <View style={styles.prioritySection}>
                  <View style={styles.priorityRow}>
                    <Text style={styles.priorityLabel}>Priority:</Text>
                    <View style={styles.priorityContainer}>
                      <TouchableOpacity
                        style={[
                          styles.priorityOption,
                          priority === "Low" && styles.selectedPriority,
                          {backgroundColor: "#4CAF50"},
                        ]}
                        onPress={() => setPriority("Low")}
                      >
                        <Text style={styles.priorityOptionText}>Low</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.priorityOption,
                          priority === "Medium" && styles.selectedPriority,
                          {backgroundColor: "#FFC000"},
                        ]}
                        onPress={() => setPriority("Medium")}
                      >
                        <Text style={styles.priorityOptionText}>Medium</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.priorityOption,
                          priority === "High" && styles.selectedPriority,
                          {backgroundColor: "#ff3b30"},
                        ]}
                        onPress={() => setPriority("High")}
                      >
                        <Text style={styles.priorityOptionText}>High</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.dateTimeSection}>
                  <View style={styles.dateTimeRow}>
                    <Text style={styles.dateTimeLabel}>Date & Time:</Text>
                    <View style={styles.dateTimePickers}>
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                          if (date) {
                            setSelectedDate(date);
                          }
                        }}
                      />
                      <DateTimePicker
                        value={selectedDate}
                        mode="time"
                        display="default"
                        onChange={(event, date) => {
                          if (date) {
                            setSelectedDate(date);
                          }
                        }}
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.addButton, styles.saveButton]}
                  onPress={saveEditedTask}
                >
                  <Text style={styles.addButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  sortButtonText: {
    fontSize: 24,
    color: "#ffffff",
    fontWeight: "bold",
  },
  plusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  plusButtonText: {
    fontSize: 32,
    color: "#ffffff",
    fontWeight: "bold",
    marginTop: -2,
  },
  taskList: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2a2a2a",
    marginBottom: 15,
  },
  list: {
    flex: 1,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  taskContent: {
    flex: 1,
    marginRight: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#007AFF",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checked: {
    backgroundColor: "#007AFF",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  taskText: {
    fontSize: 16,
    color: "#1a1a1a",
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  deleteButton: {
    padding: 5,
  },
  deleteText: {
    fontSize: 24,
    color: "#ff3b30",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxHeight: "90%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 32,
    color: "#666",
    fontWeight: "bold",
  },
  input: {
    height: 50,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  prioritySection: {
    marginBottom: 8,
  },
  priorityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginRight: 10,
  },
  priorityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    opacity: 1,
  },
  selectedPriority: {
    opacity: 1,
    transform: [{scale: 1.05}],
  },
  priorityOptionText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  priorityText: {
    fontSize: 12,
    marginTop: 4,
  },
  dateTimeSection: {
    marginBottom: 15,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateTimeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginRight: 5,
    width: 80,
  },
  dateTimePickers: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
    marginLeft: -20,
    marginRight: -10,
    paddingRight: 15,
  },
  dateTimePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flex: 1,
  },
  dueDateText: {
    fontSize: 12,
    color: "#666",
  },
  dateTimePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  dateTimeDoneButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  dateTimeDoneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  sortModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  sortModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sortModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 15,
    textAlign: "center",
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginVertical: 5,
    backgroundColor: "#f5f5f5",
  },
  selectedSort: {
    backgroundColor: "#007AFF",
  },
  sortOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
    textAlign: "center",
  },
  editButton: {
    padding: 5,
    marginRight: 5,
  },
  editButtonText: {
    fontSize: 18,
    color: "#007AFF",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
});
