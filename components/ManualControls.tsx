
import React, { useState } from 'react';
import { SpeedIcon, InclineIcon } from './Icons';

interface ManualControlsProps {
  onSetSpeed: (speed: number) => void;
  onSetIncline: (incline: number) => void;
  disabled: boolean;
}

export const ManualControls: React.FC<ManualControlsProps> = ({ onSetSpeed, onSetIncline, disabled }) => {
  const [speed, setSpeed] = useState(5.0);
  const [incline, setIncline] = useState(1.0);

  const handleSpeedChange = (delta: number) => {
    const newSpeed = Math.max(0, Math.round((speed + delta) * 10) / 10);
    setSpeed(newSpeed);
    onSetSpeed(newSpeed);
  };

  const handleInclineChange = (delta: number) => {
    const newIncline = Math.max(0, Math.round((incline + delta) * 10) / 10);
    setIncline(newIncline);
    onSetIncline(newIncline);
  };
  
  const buttonClass = "px-4 py-2 bg-gray-700 rounded-md font-bold text-lg hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-4 pt-4 border-t border-gray-700">
      <h3 className="text-lg font-semibold text-center text-gray-300">Manual Control</h3>
      <div className={`p-4 rounded-lg space-y-3 ${disabled ? 'opacity-50' : ''}`}>
        {/* Speed Controls */}
        <div className="flex items-center justify-between">
          <label className="font-medium flex items-center"><SpeedIcon className="w-5 h-5 mr-2 text-cyan-400"/> Speed</label>
          <div className="flex items-center space-x-2">
            <button onClick={() => handleSpeedChange(-0.1)} disabled={disabled} className={buttonClass}>-</button>
            <span className="w-20 text-center font-mono text-xl">{speed.toFixed(1)}</span>
            <button onClick={() => handleSpeedChange(0.1)} disabled={disabled} className={buttonClass}>+</button>
          </div>
        </div>
        {/* Incline Controls */}
        <div className="flex items-center justify-between">
          <label className="font-medium flex items-center"><InclineIcon className="w-5 h-5 mr-2 text-green-400"/> Incline</label>
          <div className="flex items-center space-x-2">
            <button onClick={() => handleInclineChange(-0.5)} disabled={disabled} className={buttonClass}>-</button>
            <span className="w-20 text-center font-mono text-xl">{incline.toFixed(1)}</span>
            <button onClick={() => handleInclineChange(0.5)} disabled={disabled} className={buttonClass}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
};
   