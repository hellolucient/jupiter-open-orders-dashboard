import React from 'react'
import type { TokenSummary } from '@/lib/dca/types'

interface TokenSummaryCardProps {
  token: string;
  summary: TokenSummary;
}

export function TokenSummaryCard({ token, summary }: TokenSummaryCardProps) {
  return (
    <div className="grid grid-cols-1 landscape:grid-cols-2 sm:grid-cols-2 gap-2">
      {/* Buy Stats */}
      <div className="bg-[#2a2a2a] p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-400">Buy {token} Orders</span>
        </div>
        <p className="text-base font-medium">{summary.buyOrders}</p>
        <div className="mt-2">
          <span className="text-xs text-gray-400 uppercase tracking-wider">Buy {token} Volume</span>
          <p className="text-3xl font-black tracking-tight text-green-400 break-all">{summary.buyVolume.toLocaleString()}</p>
          <p className="text-xs text-gray-500">${summary.buyVolumeUSDC.toLocaleString()} USDC</p>
        </div>
      </div>

      {/* Sell Stats */}
      <div className="bg-[#2a2a2a] p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-sm text-gray-400">Sell {token} Orders</span>
        </div>
        <p className="text-base font-medium">{summary.sellOrders}</p>
        <div className="mt-2">
          <span className="text-xs text-gray-400 uppercase tracking-wider">Sell {token} Volume</span>
          <p className="text-3xl font-black tracking-tight text-red-400 break-all">{summary.sellVolume.toLocaleString()}</p>
          <p className="text-xs text-gray-500">${summary.sellVolumeUSDC.toLocaleString()} USDC</p>
        </div>
      </div>
    </div>
  )
} 