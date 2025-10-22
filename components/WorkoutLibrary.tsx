import type React from 'react'
import { useId, useState } from 'react'
import { parseIcuFile } from '../lib/icuParser'
import type { Workout } from '../types'

interface WorkoutLibraryProps {
  onLoad: (workout: Workout) => void
  settings: {
    thresholdPace: string
    thresholdHr: number
  }
}

const availableWorkouts = [
  { file: 'easy_recovery.txt', name: 'Easy Recovery Run' },
  { file: 'pyramid_intervals.txt', name: 'Pyramid Intervals' },
  { file: 'tempo_run.txt', name: 'Tempo Run' },
  { file: 'absolute_pace_example.txt', name: 'Absolute Pace Example' },
]

// A more representative graph for workout previews
const WorkoutGraph: React.FC<{ workout: Workout }> = ({ workout }) => {
  if (!workout.steps || workout.steps.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center bg-gray-700 rounded text-gray-400">
        No graph data available.
      </div>
    )
  }

  const totalDuration = workout.steps.reduce((sum, step) => sum + step.duration, 0)
  if (totalDuration === 0) {
    return (
      <div className="h-32 flex items-center justify-center bg-gray-700 rounded text-gray-400">
        Workout has no duration.
      </div>
    )
  }

  const maxSpeed = workout.steps.reduce((max, step) => Math.max(max, step.speed ?? 0), 5) // Use a minimum max speed of 5km/h to avoid tiny bars for recovery workouts
  const maxIncline = workout.steps.reduce((max, step) => Math.max(max, step.incline ?? 0), 2) // Min max incline of 2%

  const SVG_WIDTH = 500
  const SVG_HEIGHT = 120
  const SPEED_HEIGHT_RATIO = 0.7 // 70% of height for speed
  const INCLINE_HEIGHT_RATIO = 0.25 // 25% for incline

  let accumulatedDuration = 0

  return (
    <div className="bg-gray-900 p-2 rounded">
      <svg
        width="100%"
        height={SVG_HEIGHT}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Workout graph"
      >
        <title>Workout graph preview</title>
        {workout.steps.map((step, i) => {
          const stepWidth = (step.duration / totalDuration) * SVG_WIDTH

          const speedHeight = maxSpeed > 0 ? ((step.speed ?? 0) / maxSpeed) * SVG_HEIGHT * SPEED_HEIGHT_RATIO : 0
          const speedY = SVG_HEIGHT - speedHeight

          const inclineHeight =
            maxIncline > 0 ? ((step.incline ?? 0) / maxIncline) * SVG_HEIGHT * INCLINE_HEIGHT_RATIO : 0
          const inclineY = SVG_HEIGHT - speedHeight - inclineHeight

          const x = (accumulatedDuration / totalDuration) * SVG_WIDTH
          accumulatedDuration += step.duration

          return (
            <g key={i}>
              <title>
                {`Step ${i + 1}: ${step.duration}s\nSpeed: ${
                  step.speed?.toFixed(1) ?? 'N/A'
                } km/h\nIncline: ${step.incline?.toFixed(1) ?? 'N/A'}%`}
              </title>
              <rect x={x} y={speedY} width={stepWidth} height={speedHeight} fill="rgba(56, 189, 248, 0.6)" />
              <rect x={x} y={inclineY} width={stepWidth} height={inclineHeight} fill="rgba(74, 222, 128, 0.6)" />
            </g>
          )
        })}
        <line x1="0" y1={SVG_HEIGHT - 1} x2={SVG_WIDTH} y2={SVG_HEIGHT - 1} stroke="#4b5563" strokeWidth="2" />
      </svg>
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
        <span>Start</span>
        <span>{Math.round(totalDuration / 60)} min</span>
      </div>
    </div>
  )
}

export const WorkoutLibrary: React.FC<WorkoutLibraryProps> = ({ onLoad, settings }) => {
  const dialogTitleId = useId()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<{ file: string; name: string } | null>(null)
  const [workoutText, setWorkoutText] = useState<string>('')
  const [workoutData, setWorkoutData] = useState<Workout | null>(null)

  const handlePreviewWorkout = async (fileName: string, workoutName: string) => {
    setLoading(fileName)
    setError(null)
    setWorkoutData(null)
    try {
      const response = await fetch(`/workouts/${fileName}`)
      if (!response.ok) {
        throw new Error(`Could not load workout file: ${response.statusText}`)
      }
      const fileContent = await response.text()
      const workout = parseIcuFile(fileContent, settings)
      setSelectedWorkout({ file: fileName, name: workoutName })
      setWorkoutText(fileContent)
      setWorkoutData(workout)
      setDialogOpen(true)
    } catch (err) {
      console.error('Failed to load library workout:', err)
      setError(err instanceof Error ? err.message : 'Could not load workout.')
      setDialogOpen(false)
    } finally {
      setLoading(null)
    }
  }

  const handleConfirmLoad = () => {
    if (workoutData) {
      onLoad(workoutData)
      setDialogOpen(false)
    }
  }

  const handleCancel = () => {
    setDialogOpen(false)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-100">Workout Library</h3>
      <p className="text-sm text-gray-400">Select a predefined workout to get started.</p>
      <div className="space-y-3">
        {availableWorkouts.map(workout => (
          <button
            type="button"
            key={workout.file}
            onClick={() => handlePreviewWorkout(workout.file, workout.name)}
            disabled={loading === workout.file}
            className="w-full text-left p-3 bg-gray-700 rounded-md hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-wait"
          >
            <p className="font-semibold text-cyan-400">{workout.name}</p>
            <p className="text-xs text-gray-400">{workout.file}</p>
          </button>
        ))}
      </div>
      {error && <p className="text-red-400 mt-2">{error}</p>}

      {dialogOpen && selectedWorkout && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-16"
          onClick={handleCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          onKeyDown={e => {
            if (e.key === 'Escape') handleCancel()
          }}
        >
          <div
            className="bg-gray-800 rounded-2xl shadow-2xl p-12 max-w-4xl w-full flex flex-col gap-8"
            style={{ minHeight: '800px' }}
            onClick={e => e.stopPropagation()}
            role="document"
            tabIndex={-1}
            onKeyDown={e => {
              if (e.key === 'Escape') handleCancel()
            }}
          >
            <div>
              <h4 id={dialogTitleId} className="text-xl font-bold text-cyan-300">
                {selectedWorkout.name}
              </h4>
              <p className="text-xs text-gray-400">{selectedWorkout.file}</p>
            </div>

            <div>
              {workoutData ? (
                <div style={{ minHeight: '300px' }}>
                  <WorkoutGraph workout={workoutData} />
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center bg-gray-700 rounded text-lg">
                  Loading workout preview...
                </div>
              )}
            </div>

            <div className="bg-gray-900 rounded p-3 text-sm text-gray-200 overflow-auto max-h-48">
              <pre style={{ minHeight: '200px', maxHeight: '400px', fontSize: '1.1em' }}>{workoutText}</pre>
            </div>

            <div className="flex justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLoad}
                disabled={!workoutData}
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
