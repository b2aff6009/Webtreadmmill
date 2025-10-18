import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

  const chartData = useMemo(() => {
    if (!workout) {
      return [];
    }

    const profileData: { time: number; targetSpeed: number; targetIncline: number; speed: number | null; incline: number | null; heartRate: number | null; }[] = [];
    let cumulativeTime = 0;
    for (const step of workout.steps) {
      for (let i = 0; i < step.duration; i++) {
        profileData.push({
          time: cumulativeTime + i,
          targetSpeed: step.speed ?? 0,
          targetIncline: step.incline ?? 0,
          speed: null,
          incline: null,
          heartRate: null,
        });
      }
      cumulativeTime += step.duration;
    }

    workoutHistory.forEach((historyPoint) => {
      if (profileData[historyPoint.time]) {
        profileData[historyPoint.time].speed = historyPoint.speed;
        profileData[historyPoint.time].incline = historyPoint.incline;
        if (historyPoint.heartRate) {
          profileData[historyPoint.time].heartRate = historyPoint.heartRate;
        }
      }
    });

    return profileData;
  }, [workout, workoutHistory]);


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
          {workout ? (
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} barGap={0} barCategoryGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" tickFormatter={(time) => `${Math.floor(time/60)}m`}/>
              <YAxis yAxisId="left" stroke="#38bdf8" label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', fill: '#38bdf8' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#4ade80" label={{ value: 'Incline (%)', angle: 90, position: 'insideRight', fill: '#4ade80' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#d1d5db' }}
                formatter={(value, name, props) => [typeof value === 'number' ? value.toFixed(1) : value, name]}
              />
              <Legend wrapperStyle={{color: '#d1d5db'}}/>
              
              {/* Workout Profile Bars */}
              <Bar yAxisId="left" dataKey="targetSpeed" fill="#38bdf8" fillOpacity={0.4} name="Target Speed" isAnimationActive={false}/>
              <Bar yAxisId="right" dataKey="targetIncline" fill="#4ade80" fillOpacity={0.4} name="Target Incline" isAnimationActive={false}/>

              {/* Live Data Lines */}
              <Line yAxisId="left" type="monotone" dataKey="speed" stroke="#0ea5e9" strokeWidth={3} name="Actual Speed" dot={false} connectNulls={false} isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" dataKey="incline" stroke="#22c55e" strokeWidth={3} name="Actual Incline" dot={false} connectNulls={false} isAnimationActive={false} />
              {chartData.some(p => p.heartRate) && <Line yAxisId="right" type="monotone" dataKey="heartRate" stroke="#f87171" strokeWidth={2} name="Heart Rate" dot={false} connectNulls={false} isAnimationActive={false} />}
            </ComposedChart>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
                Load a workout or connect to a treadmill to begin
            </div>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};