import React from 'react';

interface SettingsProps {
  thresholdPace: string;
  onThresholdPaceChange: (pace: string) => void;
  thresholdHr: number;
  onThresholdHrChange: (hr: number) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  thresholdPace,
  onThresholdPaceChange,
  thresholdHr,
  onThresholdHrChange,
}) => {
  return (
    <div className="space-y-6 text-gray-300">
      <div>
        <h3 className="text-lg font-semibold text-gray-100">Workout Settings</h3>
        <p className="text-sm text-gray-400 mt-1">
          These values can be used to customize workout calculations and displays.
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <label htmlFor="threshold-pace" className="block text-sm font-medium mb-1">
            Threshold Pace
          </label>
          <div className="flex items-center">
            <input
              type="text"
              id="threshold-pace"
              value={thresholdPace}
              onChange={(e) => onThresholdPaceChange(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
              placeholder="e.g., 4:30"
            />
            <span className="ml-2 text-gray-400 text-sm">min/km</span>
          </div>
        </div>
        <div>
          <label htmlFor="threshold-hr" className="block text-sm font-medium mb-1">
            Threshold Heart Rate
          </label>
          <div className="flex items-center">
            <input
              type="number"
              id="threshold-hr"
              value={thresholdHr}
              onChange={(e) => onThresholdHrChange(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            />
            <span className="ml-2 text-gray-400 text-sm">bpm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
