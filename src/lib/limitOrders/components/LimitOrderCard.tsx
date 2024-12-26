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
      return Math.round(value).toLocaleString()
    }
    return value.toLocaleString()
  }

  // Format date to be more readable
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    })
  }

  const amountSymbol = isBuy ? order.outputMint.symbol : order.inputMint.symbol
  const totalSymbol = isBuy ? order.inputMint.symbol : order.outputMint.symbol

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${dotColorClass}`}></div>
        <span className={`font-medium ${colorClass}`}>
          {order.orderType}
        </span>
        <span className="text-gray-400 text-sm ml-auto">
          {formatDate(order.createdAt)}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div>Amount: {formatAmount(amount, amountSymbol)} {amountSymbol}</div>
        <div>Price: {order.price.toFixed(6)} {isBuy ? order.inputMint.symbol : order.outputMint.symbol}</div>
        <div>Total: {formatAmount(total, totalSymbol)} {totalSymbol}</div>
      </div>
    </div>
  )
} 