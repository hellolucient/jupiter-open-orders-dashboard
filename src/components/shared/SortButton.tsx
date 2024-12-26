'use client'

type SortOption = 'amount-desc' | 'amount-asc' | 'date-desc' | 'date-asc'

interface SortButtonProps {
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
}

export function SortButton({ currentSort, onSortChange }: SortButtonProps) {
  const handleClick = (value: 'amount' | 'date') => {
    // Toggle between desc and asc
    if (currentSort === `${value}-desc`) {
      onSortChange(`${value}-asc` as SortOption)
    } else {
      onSortChange(`${value}-desc` as SortOption)
    }
  }

  const getButtonLabel = (value: 'amount' | 'date') => {
    const label = value === 'amount' ? 'Amount' : 'Date'
    const isDesc = currentSort === `${value}-desc`
    return `${label} ${isDesc ? '↓' : '↑'}`
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">Sort by:</span>
      <div className="flex rounded-md overflow-hidden">
        <button
          onClick={() => handleClick('amount')}
          className={`px-3 py-1 text-sm ${
            currentSort.startsWith('amount')
              ? 'bg-gray-700 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {getButtonLabel('amount')}
        </button>
        <button
          onClick={() => handleClick('date')}
          className={`px-3 py-1 text-sm ${
            currentSort.startsWith('date')
              ? 'bg-gray-700 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {getButtonLabel('date')}
        </button>
      </div>
    </div>
  )
} 