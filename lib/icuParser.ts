import type { Workout, WorkoutStep } from '../types';

interface IcuSettings {
  thresholdPace: string; // e.g. "4:30"
}

/**
 * Converts a pace string "mm:ss" into total seconds.
 */
const parsePaceToSeconds = (pace: string): number => {
  const parts = pace.split(':').map(Number);
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
    throw new Error(`Invalid pace format. Expected "mm:ss", but got "${pace}".`);
  }
  return parts[0] * 60 + parts[1];
};

/**
 * Converts a pace in seconds/km to speed in km/h.
 */
const paceToSpeed = (paceInSecondsPerKm: number): number => {
  if (paceInSecondsPerKm <= 0) return 0;
  return 3600 / paceInSecondsPerKm;
};

/**
 * Parses duration strings like "4m" or "30s" into seconds.
 */
const parseDuration = (durationStr: string): number => {
  const value = parseInt(durationStr, 10);
  if (isNaN(value)) {
    throw new Error(`Invalid duration value in "${durationStr}".`);
  }

  if (durationStr.endsWith('m')) {
    return value * 60;
  }
  if (durationStr.endsWith('s')) {
    return value;
  }
  throw new Error(`Unknown duration unit in "${durationStr}". Must be 'm' or 's'.`);
};

/**
 * Parses intensity strings like "120% Pace" into a speed object.
 */
const parseIntensity = (intensityStr: string, settings: IcuSettings): { speed: number; incline: number } => {
  const paceMatch = intensityStr.match(/(\d+)\s*%\s*Pace/i);
  if (paceMatch) {
    const percentage = parseInt(paceMatch[1], 10) / 100;
    if (percentage <= 0) {
      throw new Error(`Pace percentage must be positive, but got "${intensityStr}".`);
    }

    const thresholdPaceInSeconds = parsePaceToSeconds(settings.thresholdPace);
    const targetPaceInSeconds = thresholdPaceInSeconds / percentage;
    const speed = paceToSpeed(targetPaceInSeconds);

    return { speed, incline: 0 }; // .icu format doesn't specify incline, default to 0.
  }

  throw new Error(`Unsupported intensity format: "${intensityStr}". Only "% Pace" is supported.`);
};

/**
 * Parses a single workout step line. e.g., "- 4m 60% Pace"
 */
const parseStepLine = (line: string, settings: IcuSettings): WorkoutStep => {
  const content = line.substring(2).trim(); // Remove "- "
  const firstSpaceIndex = content.indexOf(' ');

  if (firstSpaceIndex === -1) {
    throw new Error(`Invalid step format: "${line}". Expected format like "- 4m 80% Pace".`);
  }

  const durationStr = content.substring(0, firstSpaceIndex);
  const intensityStr = content.substring(firstSpaceIndex + 1);

  const duration = parseDuration(durationStr);
  const { speed, incline } = parseIntensity(intensityStr, settings);

  return { duration, speed, incline };
};

/**
 * Parses a .txt file from Intervals.icu into a Workout object.
 */
export const parseIcuFile = (fileContent: string, settings: IcuSettings): Workout => {
  const lines = fileContent.split('\n').map(l => l.trim());
  const steps: WorkoutStep[] = [];
  let i = 0;

  // Try to find a title, otherwise use a default.
  const name = lines.find(l => l && !l.startsWith('-') && !l.match(/^\d+x$/i)) || 'Intervals.icu Workout';

  while (i < lines.length) {
    const line = lines[i];

    if (!line) {
      i++;
      continue;
    }

    const intervalMatch = line.match(/^(\d+)x$/i);
    if (intervalMatch) {
      const repeats = parseInt(intervalMatch[1], 10);
      const intervalSteps: WorkoutStep[] = [];
      i++; // Move to the first line of the interval block

      while (i < lines.length && lines[i] !== '') {
        const stepLine = lines[i];
        if (stepLine.startsWith('- ')) {
          intervalSteps.push(parseStepLine(stepLine, settings));
        }
        i++;
      }

      if (intervalSteps.length === 0) {
        throw new Error(`Interval block "${line}" has no steps.`);
      }

      for (let r = 0; r < repeats; r++) {
        steps.push(...JSON.parse(JSON.stringify(intervalSteps))); // Deep copy
      }
    } else if (line.startsWith('- ')) {
      steps.push(parseStepLine(line, settings));
      i++;
    } else {
      // It might be a comment or the workout title, ignore for step parsing.
      i++;
    }
  }

  if (steps.length === 0) {
    throw new Error('No valid workout steps found in the file.');
  }

  return { name, description: name, steps };
};
