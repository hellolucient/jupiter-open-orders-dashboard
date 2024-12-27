'use client'

import type { LimitOrder } from '@/lib/limitOrders/types'

interface LimitOrderCardProps {
  order: LimitOrder
}

export function LimitOrderCard({ order }: LimitOrderCardProps) {
  const isBuy = order.orderType === 'BUY'
  const colorClass = isBuy ? 'text-green-500' : 'text-red-500'
  const dotColorClass = isBuy ? 'bg-green-500' : 'bg-red-500'

  // For buy orders:
  // - Amount is what we're getting (takingAmount)
  // - Price is what we're paying per unit (makingAmount/takingAmount)
  // - Total is what we're paying (makingAmount)
  const amount = isBuy ? order.takingAmount : order.makingAmount
  const total = isBuy ? order.makingAmount : order.takingAmount

  // Format amounts based on token type
  const formatAmount = (value: number, symbol: string) => {
    if (symbol === 'CHAOS' || symbol === 'LOGOS') {
      return Math.round(value).toLocaleString('en-US', { maximumFractionDigits: 0 })
    }
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
  }

  // Format price with consistent decimals
  const formatPrice = (value: number) => {
    // For very small numbers (less than 0.000001), show more decimal places
    if (value > 0 && value < 0.000001) {
      return value.toLocaleString('en-US', { minimumFractionDigits: 12, maximumFractionDigits: 12 })
    }
    return value.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })
  }

  // Format date to be more readable
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZoneName: 'short'
    })
  }

  const amountSymbol = isBuy ? order.outputMint.symbol : order.inputMint.symbol
  const totalSymbol = isBuy ? order.inputMint.symbol : order.outputMint.symbol
  const priceSymbol = isBuy ? `${totalSymbol}/${amountSymbol}` : `${totalSymbol}/${amountSymbol}`

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full ${dotColorClass}`} />
          <span className={`ml-2 font-medium ${colorClass}`}>{order.orderType}</span>
        </div>
        <div className="text-gray-400 text-sm">
          {formatDate(order.createdAt)}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Amount:</span>
          <span>{formatAmount(amount, amountSymbol)} {amountSymbol}</span>
        </div>
        <div className="flex justify-between">
          <span>Execution Price:</span>
          <span>{formatPrice(order.price)} {priceSymbol}</span>
        </div>
        <div className="flex justify-between">
          <span>Total:</span>
          <span>{formatAmount(total, totalSymbol)} {totalSymbol}</span>
        </div>
      </div>
    </div>
  )
} 