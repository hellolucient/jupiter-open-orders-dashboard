'use client'

type SortOption = 'amount' | 'date'

interface SortButtonProps {
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
}

export function SortButton({ currentSort, onSortChange }: SortButtonProps) {
  const options: { value: SortOption; label: string }[] = [
    { value: 'amount', label: 'Amount' },
    { value: 'date', label: 'Date' }
  ]

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">Sort by:</span>
      <div className="flex rounded-md overflow-hidden">
        {options.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onSortChange(value)}
            className={`px-3 py-1 text-sm ${
              currentSort === value
                ? 'bg-gray-700 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
} 