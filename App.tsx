import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { WorkoutImporter } from './components/WorkoutImporter';
import { WorkoutPlayer } from './components/WorkoutPlayer';
import { ManualControls } from './components/ManualControls';
import { useFtms } from './hooks/useFtms';
import { useWorkout } from './hooks/useWorkout';
import type { Workout, WorkoutStep } from './types';
import { ConnectionStatus } from './types';
import { ConnectButton } from './components/ConnectButton';

function App() {
  const [workoutHistory, setWorkoutHistory] = useState<
    { time: number; speed: number; incline: number; heartRate?: number; targetSpeed: number; targetIncline: number }[]
  >([]);
  const [isTestMode, setIsTestMode] = useState(false);

  const onTreadmillData = useCallback((data: { speed: number; incline: number; heartRate?: number }) => {
    setWorkoutHistory(prev => {
      const lastPoint = prev[prev.length - 1];
      const targetSpeed = lastPoint ? lastPoint.targetSpeed : 0;
      const targetIncline = lastPoint ? lastPoint.targetIncline : 0;
      const newPoint = {
        time: prev.length,
        ...data,
        targetSpeed,
        targetIncline,
      };
      return [...prev, newPoint];
    });
  }, []);

  const ftms = useFtms({ onData: onTreadmillData, testMode: isTestMode });

  const onStepChange = useCallback((step: WorkoutStep) => {
    if (ftms.connectionStatus === ConnectionStatus.CONNECTED) {
      if (step.speed !== undefined) {
        ftms.setTargetSpeed(step.speed);
      }
      if (step.incline !== undefined) {
        ftms.setTargetIncline(step.incline);
      }
      setWorkoutHistory(prev => {
        const lastPoint = prev[prev.length-1] || { time: 0, speed: 0, incline: 0, targetSpeed: 0, targetIncline: 0 };
        return [...prev, {
          ...lastPoint,
          time: prev.length,
          targetSpeed: step.speed ?? lastPoint.targetSpeed,
          targetIncline: step.incline ?? lastPoint.targetIncline,
        }];
      });
    }
  }, [ftms]);
  
  const workoutControl = useWorkout({ onStepChange });

  const handleLoadWorkout = (workout: Workout) => {
    setWorkoutHistory([]);
    workoutControl.loadWorkout(workout);
  };
  
  const handleStopWorkout = () => {
    workoutControl.stop();
    if (ftms.connectionStatus === ConnectionStatus.CONNECTED) {
      ftms.stopWorkout();
    }
  }

  const handleStartWorkout = () => {
    if(ftms.connectionStatus === ConnectionStatus.CONNECTED) {
      ftms.startWorkout();
      workoutControl.play();
    } else {
      alert(`Please connect to a treadmill first${isTestMode ? ' (in test mode)' : ''}.`);
    }
  }

  const isConnected = ftms.connectionStatus === ConnectionStatus.CONNECTED;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8 flex flex-col">
      <Header
        isTestMode={isTestMode}
        onTestModeChange={setIsTestMode}
        isConnected={isConnected}
      >
        <ConnectButton 
          status={ftms.connectionStatus} 
          onConnect={ftms.connect}
          onDisconnect={ftms.disconnect}
        />
      </Header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Dashboard 
            data={ftms.treadmillData}
            workoutHistory={workoutHistory}
            workout={workoutControl.workout}
          />
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col gap-6">
          {!workoutControl.workout ? (
            <WorkoutImporter onLoad={handleLoadWorkout} />
          ) : (
            <WorkoutPlayer 
              workout={workoutControl.workout}
              currentStepIndex={workoutControl.currentStepIndex}
              timeInStep={workoutControl.timeInStep}
              totalTime={workoutControl.totalTime}
              isPaused={workoutControl.isPaused}
              onPlay={handleStartWorkout}
              onPause={workoutControl.pause}
              onStop={handleStopWorkout}
              onReset={() => workoutControl.loadWorkout(null)}
              connectionStatus={ftms.connectionStatus}
            />
          )}
          <ManualControls 
            onSetSpeed={ftms.setTargetSpeed}
            onSetIncline={ftms.setTargetIncline}
            disabled={ftms.connectionStatus !== ConnectionStatus.CONNECTED || workoutControl.isActive}
          />
        </div>
      </main>
    </div>
  );
}

export default App;