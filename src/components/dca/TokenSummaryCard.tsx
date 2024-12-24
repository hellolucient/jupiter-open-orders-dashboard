import React from 'react'
import type { TokenSummary } from '@/lib/dca/types'

interface TokenSummaryCardProps {
  token: string;
  summary: TokenSummary;
}

export function TokenSummaryCard({ token, summary }: TokenSummaryCardProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4">
      {/* Buy Stats */}
      <div className="bg-[#2a2a2a] p-2 sm:p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-gray-400">Buy {token} Orders</span>
        </div>
        <p className="text-xl font-bold">{summary.buyOrders}</p>
        <div className="mt-4">
          <span className="text-gray-400">Buy {token} Volume</span>
          <p className="text-2xl font-extrabold">{summary.buyVolume.toLocaleString()}</p>
          <p className="text-sm text-gray-500">${summary.buyVolumeUSDC.toLocaleString()} USDC</p>
        </div>
      </div>

      {/* Sell Stats */}
      <div className="bg-[#2a2a2a] p-2 sm:p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-gray-400">Sell {token} Orders</span>
        </div>
        <p className="text-xl font-bold">{summary.sellOrders}</p>
        <div className="mt-4">
          <span className="text-gray-400">Sell {token} Volume</span>
          <p className="text-2xl font-extrabold">{summary.sellVolume.toLocaleString()}</p>
          <p className="text-sm text-gray-500">${summary.sellVolumeUSDC.toLocaleString()} USDC</p>
        </div>
      </div>
    </div>
  )
} 