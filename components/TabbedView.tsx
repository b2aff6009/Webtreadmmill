import type React from 'react'

interface TabButtonProps {
  label: string
  isActive: boolean
  onClick: () => void
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 focus:outline-none
      ${isActive ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-gray-200'}
    `}
  >
    {label}
  </button>
)

interface TabbedViewProps {
  tabs: {
    key: string
    label: string
    content: React.ReactNode
  }[]
  activeTab: string
  onTabChange: (key: string) => void
}

export const TabbedView: React.FC<TabbedViewProps> = ({ tabs, activeTab, onTabChange }) => {
  const activeContent = tabs.find(tab => tab.key === activeTab)?.content

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-700 flex-shrink-0">
        {tabs.map(tab => (
          <TabButton
            key={tab.key}
            label={tab.label}
            isActive={tab.key === activeTab}
            onClick={() => onTabChange(tab.key)}
          />
        ))}
      </div>
      <div className="pt-6 flex-grow min-h-0 overflow-y-auto">{activeContent}</div>
    </div>
  )
}
