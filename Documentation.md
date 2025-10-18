# Treadmill Web App Documentation

## 1. Introduction

Welcome to the Treadmill Web App! This application allows you to control your Bluetooth-enabled treadmill directly from your web browser. You can import structured workouts from `.zwo` files (used by platforms like Zwift) and have the app automatically adjust your treadmill's speed and incline according to the workout plan. You can also take manual control at any time.

All processing is done client-side, meaning your data stays private and the application can even work offline after the initial load.

## 2. Key Features

- **Direct Hardware Control**: Connects to any treadmill that supports the Fitness Machine Service (FTMS) Bluetooth Low Energy (BLE) protocol.
- **Workout Importer**: Load custom running workouts from `.zwo` files.
- **Workout Player**: Automatically executes the loaded workout, sending speed and incline commands to the treadmill.
- **Live Dashboard**: See your real-time speed, incline, distance, and heart rate (if available) on a chart.
- **Manual Control**: Adjust speed and incline manually when not running a structured workout.
- **Client-Side Logic**: No server is needed. The entire application runs in your browser.

## 3. Getting Started

### Requirements

- A modern web browser that supports Web Bluetooth (e.g., Google Chrome, Microsoft Edge on desktop or Android).
- A treadmill with Bluetooth FTMS support.
- A workout file in the `.zwo` format.

### Step-by-Step Guide

#### Step 1: Connect to Your Treadmill

1.  Make sure your treadmill is turned on and Bluetooth is enabled. It should be in a discoverable state.
2.  Click the **"Connect"** button in the top-right corner of the application.
3.  A browser pop-up will appear, showing a list of nearby Bluetooth devices.
4.  Select your treadmill from the list and click **"Pair"**.
5.  Once connected, the status indicator will change to "Connected" with a green icon.

#### Step 2: Load a Workout

1.  On the right-hand side of the screen, you will see the **"Import Workout"** panel.
2.  Click **"Choose File"** and select a `.zwo` file from your computer.
3.  The app will parse the file and display the workout name and its steps in the **Workout Player**.

#### Step 3: Control the Workout

Once a workout is loaded and the treadmill is connected:

- **Play**: Click the large **Play** button to start the workout. The app will send the initial speed and incline commands to the treadmill and the timer will start.
- **Pause**: Click the **Pause** button to temporarily stop the workout timer. The treadmill will maintain its current speed and incline. You can resume by clicking **Play** again.
- **Stop**: Click the **Stop** button to end the workout session completely. This will send a stop command to the treadmill and reset the workout player.
- **Reset**: Click the small circular arrow icon next to the workout name to unload the current workout and go back to the workout importer screen.

#### Step 4: Use Manual Controls

If no workout is loaded, or if a workout is paused/stopped, you can use the **Manual Control** panel:

1.  Ensure your treadmill is connected.
2.  Use the `+` and `-` buttons for **Speed** and **Incline** to adjust the treadmill settings in real-time.
3.  The manual controls are automatically disabled when a workout is actively running to prevent conflicts.

## 4. Troubleshooting

- **Cannot Connect to Treadmill**:
    - Ensure your browser supports Web Bluetooth.
    - Make sure Bluetooth is enabled on your computer/device.
    - Check that your treadmill is powered on and not connected to another device (like a phone or tablet).
    - Try moving closer to the treadmill to ensure a strong signal.
- **Workout File Fails to Load**:
    - The app currently only supports the `.zwo` file format.
    - Ensure the file is not corrupted and follows the standard `.zwo` XML structure. The app will show an error message if the file is invalid.
- **"GATT operation already in progress" errors**:
    - This can happen if commands are sent too quickly. The app has a built-in queue to manage this, but if you see this error, try operating the controls more slowly.
