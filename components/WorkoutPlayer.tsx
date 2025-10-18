import React from 'react';
import type { Workout, WorkoutStep } from '../types';
import { ConnectionStatus } from '../types';
import { PlayIcon, PauseIcon, StopIcon, ResetIcon, SpeedIcon, InclineIcon } from './Icons';

interface WorkoutPlayerProps {
  workout: Workout;
  currentStepIndex: number;
  timeInStep: number;
  totalTime: number;
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  connectionStatus: ConnectionStatus;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const formatSpeedToPace = (speedKmh: number): string => {
  if (speedKmh <= 0) {
    return '--:--';
  }
  const paceDecimalMinutes = 60 / speedKmh;
  const minutes = Math.floor(paceDecimalMinutes);
  const seconds = Math.round((paceDecimalMinutes - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const WorkoutStepView: React.FC<{ step: WorkoutStep, title: string, isActive?: boolean }> = ({ step, title, isActive = false }) => (
  <div className={`p-3 rounded-md ${isActive ? 'bg-cyan-900/50 ring-2 ring-cyan-500' : 'bg-gray-700'}`}>
    <p className={`font-semibold ${isActive ? 'text-cyan-400' : 'text-gray-400'}`}>{title}</p>
    <div className="flex justify-between items-baseline mt-1">
      <p className="text-xl font-bold">{formatTime(step.duration)}</p>
      <div className="flex items-center space-x-3 text-sm">
        {step.speed !== undefined && <span className="flex items-center"><SpeedIcon className="w-4 h-4 mr-1 text-cyan-400"/> {formatSpeedToPace(step.speed)} min/km</span>}
        {step.incline !== undefined && <span className="flex items-center"><InclineIcon className="w-4 h-4 mr-1 text-green-400"/> {step.incline.toFixed(1)}%</span>}
      </div>
    </div>
  </div>
);

export const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({
  workout, currentStepIndex, timeInStep, totalTime, isPaused, onPlay, onPause, onStop, onReset, connectionStatus
}) => {
  const currentStep = workout.steps[currentStepIndex];
  const nextStep = workout.steps[currentStepIndex + 1];
  const totalDuration = workout.steps.reduce((acc, step) => acc + step.duration, 0);

  const stepProgress = currentStep ? (timeInStep / currentStep.duration) * 100 : 0;
  const totalProgress = totalDuration > 0 ? (totalTime / totalDuration) * 100 : 0;
  
  const isConnected = connectionStatus === ConnectionStatus.CONNECTED;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold truncate" title={workout.name}>{workout.name}</h2>
        <button onClick={onReset} className="p-1 text-gray-400 hover:text-white transition">
            <ResetIcon className="w-5 h-5"/>
        </button>
      </div>

      {currentStep && <WorkoutStepView step={currentStep} title="Current Step" isActive={true} />}
      {nextStep && <WorkoutStepView step={nextStep} title="Next Step" />}

      <div className="space-y-4 pt-2">
        {/* Total Progress Bar */}
        <div>
          <div className="flex justify-between text-sm font-medium mb-1 text-gray-200">
            <span>Total Progress</span>
            <span>{formatTime(totalTime)} / {formatTime(totalDuration)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div className="bg-green-500 h-3 rounded-full transition-all duration-500 ease-in-out" style={{ width: `${totalProgress}%` }}></div>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1 text-gray-400">
            <span>Step Progress</span>
            <span>{formatTime(timeInStep)} / {formatTime(currentStep?.duration ?? 0)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-cyan-500 h-2 rounded-full transition-all duration-500 ease-in-out" style={{ width: `${stepProgress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center space-x-4 pt-4">
        <button
          onClick={onStop}
          className="p-3 bg-red-600 rounded-full text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isConnected}
          title={!isConnected ? "Connect to treadmill to stop workout" : "Stop Workout"}
        >
          <StopIcon className="w-6 h-6" />
        </button>
        <button
          onClick={isPaused ? onPlay : onPause}
          className="p-4 bg-cyan-600 rounded-full text-white hover:bg-cyan-700 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isPaused && !isConnected}
          title={!isConnected && isPaused ? "Connect to treadmill to start workout" : (isPaused ? "Play Workout" : "Pause Workout")}
        >
          {isPaused ? <PlayIcon className="w-8 h-8" /> : <PauseIcon className="w-8 h-8" />}
        </button>
      </div>
    </div>
  );
};