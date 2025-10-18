
export interface WorkoutStep {
  duration: number;
  speed?: number;
  incline?: number;
  power?: number; // from ZWO, can be mapped to intensity
}

export interface Workout {
  name: string;
  description: string;
  steps: WorkoutStep[];
}

export interface TreadmillData {
  speed: number;
  incline: number;
  distance: number;
  heartRate?: number;
  calories?: number;
  time?: string;
}

export enum ConnectionStatus {
  DISCONNECTED = 'Disconnected',
  CONNECTING = 'Connecting...',
  CONNECTED = 'Connected',
  ERROR = 'Error',
}
   