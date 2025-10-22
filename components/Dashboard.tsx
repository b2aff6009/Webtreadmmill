import type React from 'react'
import { useMemo } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TreadmillData, Workout } from '../types'
import { DistanceIcon, HeartIcon, InclineIcon, SpeedIcon } from './Icons'

interface DashboardProps {
  data: TreadmillData
  workoutHistory: {
    time: number
    speed: number
    incline: number
    heartRate?: number
    targetSpeed: number
    targetIncline: number
  }[]
  workout: Workout | null
  settings: {
    thresholdPace: string
    thresholdHr: number
  }
}

const StatCard: React.FC<{
  icon: React.ReactNode
  label: string
  value: string
  unit: string
}> = ({ icon, label, value, unit }) => (
  <div className="bg-gray-800 p-4 rounded-lg flex items-center">
    <div className="p-3 bg-gray-700 rounded-full mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-white">
        {value} <span className="text-lg font-normal text-gray-300">{unit}</span>
      </p>
    </div>
  </div>
)

// Friel LTHR Zones as a common standard
const heartRateZoneConfig = [
  { name: 'Z1', lower: 0, upper: 0.85, color: '#3b82f6' }, // Blue
  { name: 'Z2', lower: 0.85, upper: 0.89, color: '#22c55e' }, // Green
  { name: 'Z3', lower: 0.9, upper: 0.94, color: '#eab308' }, // Yellow
  { name: 'Z4', lower: 0.95, upper: 0.99, color: '#f97316' }, // Orange
  { name: 'Z5', lower: 1.0, upper: 1.06, color: '#ef4444' }, // Red
]

// Helper to convert km/h to total seconds per kilometer
const speedKmhToPaceSecs = (speedKmh: number): number => {
  if (speedKmh <= 0) {
    return Infinity // Represents a stopped state
  }
  return 3600 / speedKmh
}

// Helper to format total seconds into a "mm:ss" pace string
const formatPaceSecs = (totalSeconds: number): string => {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '--:--'
  }
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.round(totalSeconds % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Define a set of "nice" ticks for the pace axis in seconds/km
const paceTicks = [
  180, // 3:00
  210, // 3:30
  240, // 4:00
  270, // 4:30
  300, // 5:00
  330, // 5:30
  360, // 6:00
  420, // 7:00
  480, // 8:00
  540, // 9:00
  600, // 10:00
]

export const Dashboard: React.FC<DashboardProps> = ({ data, workoutHistory, workout, settings }) => {
  const chartData = useMemo(() => {
    if (!workout) {
      return []
    }

    const profileData: {
      time: number
      targetPace: number
      targetIncline: number
      pace: number | null
      incline: number | null
      heartRate: number | null
    }[] = []
    let cumulativeTime = 0
    for (const step of workout.steps) {
      for (let i = 0; i < step.duration; i++) {
        profileData.push({
          time: cumulativeTime + i,
          targetPace: speedKmhToPaceSecs(step.speed ?? 0),
          targetIncline: step.incline ?? 0,
          pace: null,
          incline: null,
          heartRate: null,
        })
      }
      cumulativeTime += step.duration
    }

    for (const historyPoint of workoutHistory) {
      if (profileData[historyPoint.time]) {
        profileData[historyPoint.time].pace = speedKmhToPaceSecs(historyPoint.speed)
        profileData[historyPoint.time].incline = historyPoint.incline
        if (historyPoint.heartRate) {
          profileData[historyPoint.time].heartRate = historyPoint.heartRate
        }
      }
    }

    return profileData
  }, [workout, workoutHistory])

  const paceDomain = useMemo(() => {
    if (chartData.length === 0) return [180, 600] // Default 3:00 to 10:00 pace

    let minPace = Infinity
    let maxPace = 0

    for (const d of chartData) {
      const paces = [d.targetPace, d.pace].filter(p => p !== null && Number.isFinite(p)) as number[]
      for (const p of paces) {
        if (p < minPace) minPace = p
        if (p > maxPace) maxPace = p
      }
    }

    if (!Number.isFinite(minPace)) return [180, 600]

    // Add padding of 30 seconds
    const domainMin = Math.max(0, minPace - 30)
    const domainMax = maxPace + 30

    return [domainMin, domainMax]
  }, [chartData])

  const zones = useMemo(() => {
    return heartRateZoneConfig.map(zone => ({
      ...zone,
      y1: Math.round(settings.thresholdHr * zone.lower),
      y2: Math.round(settings.thresholdHr * zone.upper),
    }))
  }, [settings.thresholdHr])

  const yAxisMinHr = Math.round(settings.thresholdHr / 3)
  const yAxisMaxHr = Math.round(settings.thresholdHr * 1.1)

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 flex flex-col h-full gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
        <StatCard
          icon={<SpeedIcon className="w-6 h-6 text-cyan-400" />}
          label="Pace"
          value={formatPaceSecs(speedKmhToPaceSecs(data.speed))}
          unit="min/km"
        />
        <StatCard
          icon={<InclineIcon className="w-6 h-6 text-green-400" />}
          label="Incline"
          value={data.incline.toFixed(1)}
          unit="%"
        />
        <StatCard
          icon={<DistanceIcon className="w-6 h-6 text-yellow-400" />}
          label="Distance"
          value={data.distance.toFixed(2)}
          unit="km"
        />
        <StatCard
          icon={<HeartIcon className="w-6 h-6 text-red-400" />}
          label="Heart Rate"
          value={data.heartRate?.toString() ?? '--'}
          unit="bpm"
        />
      </div>
      <div className="flex-grow w-full min-h-0">
        {workout ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              barGap={0}
              barCategoryGap={0}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" tickFormatter={time => `${Math.floor(time / 60)}m`} />
              <YAxis
                yAxisId="left"
                stroke="#38bdf8"
                label={{
                  value: 'Pace (min/km)',
                  angle: -90,
                  position: 'center',
                  dx: -25,
                  fill: '#38bdf8',
                }}
                tickFormatter={formatPaceSecs}
                reversed={true}
                domain={paceDomain}
                ticks={paceTicks}
                type="number"
                width={80}
              />
              {/* This Y-axis is for Incline data, but it's hidden to avoid clutter. The data still scales to it. */}
              <YAxis yAxisId="incline-hidden" orientation="right" stroke="transparent" tick={false} axisLine={false} />

              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#f87171"
                label={{
                  value: 'Heart Rate (bpm)',
                  angle: 90,
                  position: 'center',
                  dx: 25,
                  fill: '#f87171',
                }}
                domain={[yAxisMinHr, yAxisMaxHr]}
                allowDataOverflow={true}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                }}
                labelStyle={{ color: '#d1d5db' }}
                formatter={(value: number, name: string) => {
                  if (name === 'Target Pace' || name === 'Actual Pace') {
                    return [formatPaceSecs(value), name]
                  }
                  if (typeof value === 'number') {
                    return [value.toFixed(1), name]
                  }
                  return [value as string, name]
                }}
              />
              <Legend wrapperStyle={{ color: '#d1d5db' }} />

              {/* HR Zone Backgrounds */}
              {zones.map(zone => (
                <ReferenceArea
                  key={zone.name}
                  yAxisId="right"
                  y1={zone.y1}
                  y2={zone.y2}
                  stroke="none"
                  fill={zone.color}
                  fillOpacity={0.1}
                  label={{
                    value: zone.name,
                    position: 'insideTopRight',
                    fill: zone.color,
                    fontSize: 10,
                    dy: 12,
                    dx: -10,
                  }}
                />
              ))}

              {/* Workout Profile Bars */}
              <Bar
                yAxisId="left"
                dataKey="targetPace"
                fill="#38bdf8"
                fillOpacity={0.4}
                name="Target Pace"
                isAnimationActive={false}
              />
              <Bar
                yAxisId="incline-hidden"
                dataKey="targetIncline"
                fill="#4ade80"
                fillOpacity={0.4}
                name="Target Incline"
                isAnimationActive={false}
              />

              {/* Live Data Lines */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="pace"
                stroke="#0ea5e9"
                strokeWidth={3}
                name="Actual Pace"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="incline-hidden"
                type="monotone"
                dataKey="incline"
                stroke="#22c55e"
                strokeWidth={3}
                name="Actual Incline"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="heartRate"
                stroke="#f87171"
                strokeWidth={2}
                name="Heart Rate"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Load a workout or connect to a treadmill to begin
          </div>
        )}
      </div>
    </div>
  )
}
