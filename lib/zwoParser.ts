import type { Workout, WorkoutStep } from '../types';

export const parseZwoFile = (fileContent: string): Workout => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(fileContent, 'application/xml');

  const errorNode = xmlDoc.querySelector('parsererror');
  if (errorNode) {
    throw new Error('Failed to parse XML file.');
  }

  const workoutFile = xmlDoc.querySelector('workout_file');
  if (!workoutFile) {
    throw new Error('Invalid .zwo format: <workout_file> tag not found.');
  }

  const name = workoutFile.querySelector('name')?.textContent ?? 'Untitled Workout';
  const description = workoutFile.querySelector('description')?.textContent ?? '';
  const sportType = workoutFile.querySelector('sportType')?.textContent?.toLowerCase() ?? 'bike';
  const workoutNode = workoutFile.querySelector('workout');

  if (!workoutNode) {
    throw new Error('Invalid .zwo format: <workout> tag not found.');
  }

  const steps: WorkoutStep[] = [];

  workoutNode.childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as Element;
    const tagName = element.tagName;

    // Handle repeating interval blocks
    if (tagName === 'IntervalsT') {
      const repeat = parseInt(element.getAttribute('Repeat') || '1', 10);
      const onDuration = parseInt(element.getAttribute('OnDuration') || '0', 10);
      const offDuration = parseInt(element.getAttribute('OffDuration') || '0', 10);

      const onPaceAttr = element.getAttribute('OnPace');
      const offPaceAttr = element.getAttribute('OffPace');
      const onPowerAttr = element.getAttribute('OnPower');
      const offPowerAttr = element.getAttribute('OffPower');

      for (let i = 0; i < repeat; i++) {
        // ON Interval
        if (onDuration > 0) {
          const onStep: Partial<WorkoutStep> = { duration: onDuration };
          if (sportType === 'run' && onPaceAttr) {
            onStep.speed = parseFloat(onPaceAttr) * 3.6; // m/s to km/h
          } else if (onPowerAttr) {
            const power = parseFloat(onPowerAttr);
            onStep.power = power;
            if (sportType === 'run') {
              // Estimate running speed from power. 1.0 FTP ~ 14 km/h.
              onStep.speed = power * 14;
            } else { // Bike
              onStep.speed = power * 10;
              onStep.incline = power * 2;
            }
          }
          if (onStep.speed !== undefined) {
            if (onStep.incline === undefined) onStep.incline = 0;
            steps.push(onStep as WorkoutStep);
          }
        }

        // OFF Interval
        if (offDuration > 0) {
          const offStep: Partial<WorkoutStep> = { duration: offDuration };
          if (sportType === 'run' && offPaceAttr) {
            offStep.speed = parseFloat(offPaceAttr) * 3.6; // m/s to km/h
          } else if (offPowerAttr) {
            const power = parseFloat(offPowerAttr);
            offStep.power = power;
            if (sportType === 'run') {
              offStep.speed = power * 14;
            } else { // Bike
              offStep.speed = power * 10;
              offStep.incline = power * 2;
            }
          }
          if (offStep.speed !== undefined) {
            if (offStep.incline === undefined) offStep.incline = 0;
            steps.push(offStep as WorkoutStep);
          }
        }
      }
      return;
    }

    // Handle single steps (e.g., Warmup, SteadyState, Cooldown, Ramp)
    const duration = parseInt(element.getAttribute('Duration') || '0', 10);
    if (duration === 0) return;

    const step: Partial<WorkoutStep> = { duration };
    let powerValue: number | null = null;

    // Check for power attributes
    const powerAttr = element.getAttribute('Power');
    const powerLowAttr = element.getAttribute('PowerLow');
    const powerHighAttr = element.getAttribute('PowerHigh');

    if (powerAttr) {
      powerValue = parseFloat(powerAttr);
    } else if (powerLowAttr && powerHighAttr) {
      const low = parseFloat(powerLowAttr);
      const high = parseFloat(powerHighAttr);
      powerValue = (low + high) / 2;
    }

    // Check for pace attributes (running workouts) - This should have priority for runners
    const paceAttr = element.getAttribute('Pace');
    if (sportType === 'run' && paceAttr) {
      const pace = parseFloat(paceAttr);
      if (pace > 0) {
        step.speed = pace * 3.6; // Convert m/s to km/h
      }
    }

    // Use power as a fallback to derive speed if not set by pace
    if (powerValue !== null && step.speed === undefined) {
      step.power = powerValue;
      if (sportType === 'run') {
        step.speed = powerValue * 14; // More realistic conversion for running
      } else { // Bike
        step.speed = powerValue * 10;
        step.incline = powerValue * 2;
      }
    }

    // Allow explicit Speed/Incline attributes to override derived values
    const speedAttr = element.getAttribute('Speed');
    const inclineAttr = element.getAttribute('Incline');

    if (speedAttr) {
      step.speed = parseFloat(speedAttr);
    }
    if (inclineAttr) {
      step.incline = parseFloat(inclineAttr);
    }

    // A valid step must have a duration and a target intensity (speed or incline)
    if (step.speed !== undefined || step.incline !== undefined) {
      // If a step defines speed but not incline, assume flat ground.
      if (step.incline === undefined) {
        step.incline = 0;
      }
      steps.push(step as WorkoutStep);
    }
  });


  if (steps.length === 0) {
    throw new Error('No valid workout steps found in the file.');
  }

  return { name, description, steps };
};