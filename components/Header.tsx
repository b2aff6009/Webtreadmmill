import type React from 'react'
import { useId } from 'react'

interface HeaderProps {
  children?: React.ReactNode
  isTestMode: boolean
  onTestModeChange: (enabled: boolean) => void
  isConnected: boolean
}

export const Header: React.FC<HeaderProps> = ({ children, isTestMode, onTestModeChange, isConnected }) => {
  return (
    <header className="flex items-center justify-between pb-4 border-b border-gray-700">
      <h1 className="text-3xl font-bold text-cyan-400 tracking-wider">
        Treadmill <span className="font-light text-gray-300">WEB</span>
      </h1>
      <div className="flex items-center space-x-4">
        <div className="flex items-center" title="Simulate treadmill connection without Bluetooth hardware">
          <input
            type="checkbox"
            id={useId()}
            checked={isTestMode}
            onChange={e => onTestModeChange(e.target.checked)}
            disabled={isConnected}
            className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label
            htmlFor="test-mode"
            className={`ml-2 text-sm font-medium ${isConnected ? 'text-gray-500' : 'text-gray-300'}`}
          >
            Test Mode
          </label>
        </div>
        {children}
      </div>
    </header>
  )
}
