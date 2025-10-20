import { useCallback, useEffect, useRef, useState } from 'react';
import type { Workout, WorkoutStep } from '../types';

interface UseWorkoutProps {
  onStepChange?: (step: WorkoutStep) => void;
}

export const useWorkout = ({ onStepChange }: UseWorkoutProps) => {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeInStep, setTimeInStep] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const onStepChangeRef = useRef(onStepChange);

  useEffect(() => {
    onStepChangeRef.current = onStepChange;
  }, [onStepChange]);

  useEffect(() => {
    if (!workout || isPaused || isFinished) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setTimeInStep(prev => prev + 1);
      setTotalTime(prev => prev + 1);

      if (timeInStep + 1 >= workout.steps[currentStepIndex].duration) {
        const nextStepIndex = currentStepIndex + 1;
        if (nextStepIndex < workout.steps.length) {
          setCurrentStepIndex(nextStepIndex);
          setTimeInStep(0);
          onStepChangeRef.current?.(workout.steps[nextStepIndex]);
        } else {
          setIsFinished(true);
          setIsPaused(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [workout, isPaused, isFinished, currentStepIndex, timeInStep]);

  const loadWorkout = useCallback((newWorkout: Workout | null) => {
    setWorkout(newWorkout);
    setCurrentStepIndex(0);
    setTimeInStep(0);
    setTotalTime(0);
    setIsPaused(true);
    setIsFinished(false);
    // Do not send the first step's command on load.
    // This will be handled by the play() function.
  }, []);

  const play = useCallback(() => {
    if (workout && !isFinished) {
      setIsPaused(false);
      // Fire initial step change on first play
      if (totalTime === 0) {
        onStepChangeRef.current?.(workout.steps[0]);
      }
    }
  }, [workout, isFinished, totalTime]);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const stop = useCallback(() => {
    setIsPaused(true);
    setCurrentStepIndex(0);
    setTimeInStep(0);
    setTotalTime(0);
    setIsFinished(false);
  }, []);

  return {
    workout,
    currentStepIndex,
    timeInStep,
    totalTime,
    isPaused,
    isFinished,
    isActive: workout !== null && !isPaused && !isFinished,
    loadWorkout,
    play,
    pause,
    stop,
  };
};