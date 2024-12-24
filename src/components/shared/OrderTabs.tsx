'use client'

interface OrderTabsProps {
  activeMode: 'all' | 'dca' | 'limit'
  onModeChange: (mode: 'all' | 'dca' | 'limit') => void
}

export function OrderTabs({ activeMode, onModeChange }: OrderTabsProps) {
  return (
    <div className="flex gap-2 mt-4">
      {[
        { id: 'all', label: 'All Orders' },
        { id: 'dca', label: 'DCA Only' },
        { id: 'limit', label: 'Limit Orders' },
      ].map((tab) => (
        <button
          key={tab.id}
          className={`px-4 py-2 rounded ${
            activeMode === tab.id 
              ? 'bg-blue-600' 
              : 'bg-gray-800'
          }`}
          onClick={() => onModeChange(tab.id as 'all' | 'dca' | 'limit')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
} 