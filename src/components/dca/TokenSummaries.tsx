import React from 'react'
import { TokenSummaryCard } from './TokenSummaryCard'
import type { TokenSummary } from '@/lib/dca/types'

interface TokenSummariesProps {
  summaries: Record<string, TokenSummary>
}

export function TokenSummaries({ summaries }: TokenSummariesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(summaries).map(([token, summary]) => (
        <TokenSummaryCard key={token} token={token} summary={summary} />
      ))}
    </div>
  )
} 