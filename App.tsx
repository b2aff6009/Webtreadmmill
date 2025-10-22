import { useCallback, useState } from 'react'
import { ConnectButton } from './components/ConnectButton'
import { Dashboard } from './components/Dashboard'
import { Header } from './components/Header'
import { ManualControls } from './components/ManualControls'
import { Settings } from './components/Settings'
import { TabbedView } from './components/TabbedView'
import { WorkoutImporter } from './components/WorkoutImporter'
import { WorkoutLibrary } from './components/WorkoutLibrary'
import { WorkoutPlayer } from './components/WorkoutPlayer'
import { useFtms } from './hooks/useFtms'
import { useWorkout } from './hooks/useWorkout'
import type { Workout, WorkoutStep } from './types'
import { ConnectionStatus } from './types'

function App() {
  const [workoutHistory, setWorkoutHistory] = useState<
    {
      time: number
      speed: number
      incline: number
      heartRate?: number
      targetSpeed: number
      targetIncline: number
    }[]
  >([])
  const [isTestMode, setIsTestMode] = useState(false)
  const [settings, setSettings] = useState({
    thresholdPace: '4:30',
    thresholdHr: 165,
  })
  const [activeTab, setActiveTab] = useState('workout')

  const onTreadmillData = useCallback((data: { speed: number; incline: number; heartRate?: number }) => {
    setWorkoutHistory(prev => {
      const lastPoint = prev[prev.length - 1]
      const targetSpeed = lastPoint ? lastPoint.targetSpeed : 0
      const targetIncline = lastPoint ? lastPoint.targetIncline : 0
      const newPoint = {
        time: prev.length,
        ...data,
        targetSpeed,
        targetIncline,
      }
      return [...prev, newPoint]
    })
  }, [])

  const ftms = useFtms({ onData: onTreadmillData, testMode: isTestMode })

  const onStepChange = useCallback(
    (step: WorkoutStep) => {
      if (ftms.connectionStatus === ConnectionStatus.CONNECTED) {
        if (step.speed !== undefined) {
          ftms.setTargetSpeed(step.speed)
        }
        if (step.incline !== undefined) {
          ftms.setTargetIncline(step.incline)
        }
        setWorkoutHistory(prev => {
          const lastPoint = prev[prev.length - 1] || {
            time: 0,
            speed: 0,
            incline: 0,
            targetSpeed: 0,
            targetIncline: 0,
          }
          return [
            ...prev,
            {
              ...lastPoint,
              time: prev.length,
              targetSpeed: step.speed ?? lastPoint.targetSpeed,
              targetIncline: step.incline ?? lastPoint.targetIncline,
            },
          ]
        })
      }
    },
    [ftms]
  )

  const workoutControl = useWorkout({ onStepChange })

  const handleLoadWorkout = (workout: Workout) => {
    // Stop any currently running activity (workout or manual) before loading a new one.
    workoutControl.stop() // Resets the workout state
    if (ftms.connectionStatus === ConnectionStatus.CONNECTED) {
      ftms.stopWorkout() // Stops the physical treadmill
    }

    setWorkoutHistory([])
    setActiveTab('workout')
    workoutControl.loadWorkout(workout)
  }

  const handleStopWorkout = () => {
    workoutControl.stop()
    if (ftms.connectionStatus === ConnectionStatus.CONNECTED) {
      ftms.stopWorkout()
    }
  }

  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [pendingStart, setPendingStart] = useState(false)

  const handleStartWorkout = () => {
    if (!showDisclaimer) {
      setShowDisclaimer(true)
      setPendingStart(true)
      return
    }
    if (ftms.connectionStatus === ConnectionStatus.CONNECTED) {
      ftms.startWorkout()
      workoutControl.play()
    } else {
      alert(`Please connect to a treadmill first${isTestMode ? ' (in test mode)' : ''}.`)
    }
  }

  const handleAcceptDisclaimer = () => {
    setShowDisclaimer(false)
    if (pendingStart) {
      setPendingStart(false)
      handleStartWorkout()
    }
  }

  const handleDeclineDisclaimer = () => {
    setShowDisclaimer(false)
    setPendingStart(false)
  }

  const handleResetWorkout = () => {
    workoutControl.loadWorkout(null)
  }

  const isConnected = ftms.connectionStatus === ConnectionStatus.CONNECTED

  const workoutTabContent = (
    <div className="flex flex-col h-full">
      <div className="flex-grow">
        {!workoutControl.workout ? (
          <div className="h-full flex items-center justify-center">
            <WorkoutImporter onLoad={handleLoadWorkout} settings={settings} />
          </div>
        ) : (
          <WorkoutPlayer
            workout={workoutControl.workout}
            currentStepIndex={workoutControl.currentStepIndex}
            timeInStep={workoutControl.timeInStep}
            totalTime={workoutControl.totalTime}
            isPaused={workoutControl.isPaused}
            onPlay={handleStartWorkout}
            onPause={workoutControl.pause}
            onStop={handleStopWorkout}
            onReset={handleResetWorkout}
            connectionStatus={ftms.connectionStatus}
          />
        )}
      </div>
      <div className="flex-shrink-0">
        <ManualControls
          onSetSpeed={ftms.setTargetSpeed}
          onSetIncline={ftms.setTargetIncline}
          onStart={ftms.startWorkout}
          onStop={ftms.stopWorkout}
          disabled={ftms.connectionStatus !== ConnectionStatus.CONNECTED || workoutControl.isActive}
        />
      </div>
    </div>
  )

  const isProduction = process.env.NODE_ENV === 'production'

  return (
    <div className="h-full bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8 flex flex-col">
      <Header
        isTestMode={isTestMode}
        onTestModeChange={setIsTestMode}
        isConnected={isConnected}
        isProduction={isProduction}
      >
        <ConnectButton status={ftms.connectionStatus} onConnect={ftms.connect} onDisconnect={ftms.disconnect} />
      </Header>

      {showDisclaimer && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-8">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-cyan-400">Disclaimer</h2>
            <p className="text-gray-200 text-base">
              The provider and/or developer of this app is not responsible for any damage, injury, or loss resulting
              from the use of this application. Use at your own risk. Always consult a medical professional before
              starting any exercise program.
            </p>
            <div className="flex justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={handleDeclineDisclaimer}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAcceptDisclaimer}
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition font-semibold"
              >
                I Accept
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow flex flex-col lg:flex-row gap-6 mt-6 min-h-0">
        <div className="lg:w-2/3 flex flex-col gap-6 h-full min-h-0">
          <div className="flex-grow h-full min-h-0">
            <Dashboard
              data={ftms.treadmillData}
              workoutHistory={workoutHistory}
              workout={workoutControl.workout}
              settings={settings}
            />
          </div>
        </div>

        <div className="lg:w-1/3 bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col gap-6">
          <div className="flex-grow min-h-0">
            <TabbedView
              tabs={[
                {
                  key: 'workout',
                  label: 'Workout',
                  content: workoutTabContent,
                },
                {
                  key: 'library',
                  label: 'Library',
                  content: <WorkoutLibrary onLoad={handleLoadWorkout} settings={settings} />,
                },
                {
                  key: 'settings',
                  label: 'Settings',
                  content: (
                    <Settings
                      thresholdPace={settings.thresholdPace}
                      onThresholdPaceChange={pace => setSettings(s => ({ ...s, thresholdPace: pace }))}
                      thresholdHr={settings.thresholdHr}
                      onThresholdHrChange={hr => setSettings(s => ({ ...s, thresholdHr: hr }))}
                    />
                  ),
                },
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
