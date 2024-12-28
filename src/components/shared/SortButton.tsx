'use client'

import { SortOption } from '@/lib/shared/types'

interface SortButtonProps {
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
}

export function SortButton({ currentSort, onSortChange }: SortButtonProps) {
  const handleClick = (value: 'amount' | 'date' | 'price') => {
    // Toggle between desc and asc
    if (currentSort === `${value}-desc`) {
      onSortChange(`${value}-asc` as SortOption)
    } else {
      onSortChange(`${value}-desc` as SortOption)
    }
  }

  const getButtonLabel = (value: 'amount' | 'date' | 'price') => {
    const labels = {
      amount: 'Amount',
      date: 'Date',
      price: 'Price'
    }
    const isDesc = currentSort === `${value}-desc`
    return `${labels[value]} ${isDesc ? '↓' : '↑'}`
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
          onClick={() => handleClick('price')}
          className={`px-3 py-1 text-sm ${
            currentSort.startsWith('price')
              ? 'bg-gray-700 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {getButtonLabel('price')}
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