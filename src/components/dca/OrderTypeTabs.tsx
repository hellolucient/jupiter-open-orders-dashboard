import React from 'react'

type OrderType = 'all' | 'dca' | 'limit'

interface OrderTypeTabsProps {
  selectedType: OrderType
  onChange: (type: OrderType) => void
}

export function OrderTypeTabs({ selectedType, onChange }: OrderTypeTabsProps) {
  return (
    <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-4">
      <button
        onClick={() => onChange('all')}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors
          ${selectedType === 'all' 
            ? 'bg-blue-500 text-white' 
            : 'text-gray-400 hover:text-white'
          }`}
      >
        All Orders
      </button>
      <button
        onClick={() => onChange('dca')}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors
          ${selectedType === 'dca' 
            ? 'bg-blue-500 text-white' 
            : 'text-gray-400 hover:text-white'
          }`}
      >
        DCA Only
      </button>
      <button
        onClick={() => onChange('limit')}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors
          ${selectedType === 'limit' 
            ? 'bg-blue-500 text-white' 
            : 'text-gray-400 hover:text-white'
          }`}
      >
        Limit Orders
      </button>
    </div>
  )
} 