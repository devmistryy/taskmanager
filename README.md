# Task Manager App

A simple and intuitive task management application built with React Native and Expo.

## Features

- Add new tasks with a brief description
- Mark tasks as complete/incomplete
- Delete tasks from the list
- Clean and modern user interface
- Responsive design that works on both iOS and Android

## Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

## Setup Instructions

1. Clone the repository:

```bash
git clone [repository-url]
cd taskmanager
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npx expo start
```

4. Run the app:
   - Press 'w' to open in web browser
   - Press 'i' to open in iOS simulator (requires Xcode)
   - Press 'a' to open in Android emulator (requires Android Studio)
   - Scan the QR code with your phone's camera (iOS) or Expo Go app (Android)

## Technologies Used

- React Native
- Expo
- React Hooks (useState)

## Project Structure

- `App.js` - Main application component containing all the task management logic and UI
- `package.json` - Project dependencies and scripts
- `app.json` - Expo configuration

## How to Use

1. Adding a Task:

   - Type your task in the input field at the top
   - Press the "Add" button or hit Enter

2. Completing a Task:

   - Tap the circular checkbox next to any task
   - The task will be marked as complete and appear with a strikethrough

3. Deleting a Task:
   - Tap the "×" button next to any task
   - The task will be removed from the list

## Notes

- This is a frontend-only application using local state management
- Tasks are not persisted between app restarts
- The app uses native React Native components for optimal performance
