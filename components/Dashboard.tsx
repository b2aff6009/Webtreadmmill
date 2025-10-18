
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { TreadmillData, Workout } from '../types';
import { SpeedIcon, InclineIcon, DistanceIcon, HeartIcon } from './Icons';

interface DashboardProps {
  data: TreadmillData;
  workoutHistory: { time: number; speed: number; incline: number; heartRate?: number; targetSpeed: number; targetIncline: number }[];
  workout: Workout | null;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; unit: string }> = ({ icon, label, value, unit }) => (
  <div className="bg-gray-800 p-4 rounded-lg flex items-center">
    <div className="p-3 bg-gray-700 rounded-full mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-white">
        {value} <span className="text-lg font-normal text-gray-300">{unit}</span>
      </p>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ data, workoutHistory, workout }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<SpeedIcon className="w-6 h-6 text-cyan-400" />} label="Speed" value={data.speed.toFixed(1)} unit="km/h" />
        <StatCard icon={<InclineIcon className="w-6 h-6 text-green-400" />} label="Incline" value={data.incline.toFixed(1)} unit="%" />
        <StatCard icon={<DistanceIcon className="w-6 h-6 text-yellow-400" />} label="Distance" value={data.distance.toFixed(2)} unit="km" />
        <StatCard icon={<HeartIcon className="w-6 h-6 text-red-400" />} label="Heart Rate" value={data.heartRate?.toString() ?? '--'} unit="bpm" />
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {workout && workoutHistory.length > 0 ? (
            <LineChart data={workoutHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis yAxisId="left" stroke="#38bdf8" label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', fill: '#38bdf8' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#4ade80" label={{ value: 'Incline (%)', angle: 90, position: 'insideRight', fill: '#4ade80' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#d1d5db' }}
              />
              <Legend wrapperStyle={{color: '#d1d5db'}}/>
              <Line yAxisId="left" type="monotone" dataKey="speed" stroke="#38bdf8" strokeWidth={2} name="Actual Speed" dot={false} />
              <Line yAxisId="left" type="step" dataKey="targetSpeed" stroke="#38bdf8" strokeDasharray="5 5" strokeWidth={1.5} name="Target Speed" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="incline" stroke="#4ade80" strokeWidth={2} name="Actual Incline" dot={false} />
              <Line yAxisId="right" type="step" dataKey="targetIncline" stroke="#4ade80" strokeDasharray="5 5" strokeWidth={1.5} name="Target Incline" dot={false} />
              {data.heartRate && <Line yAxisId="right" type="monotone" dataKey="heartRate" stroke="#f87171" strokeWidth={2} name="Heart Rate" dot={false} />}
            </LineChart>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
                {workout ? "Start workout to see live data" : "Load a workout or connect to a treadmill to begin"}
            </div>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
   