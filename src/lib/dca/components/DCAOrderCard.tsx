'use client'

import { useEffect, useState } from 'react'
import { PriceService } from '@/lib/shared/services/PriceService'
import { formatNumber, formatPrice } from '@/lib/shared/utils/format'
import clsx from 'clsx'

interface DCAOrderCardProps {
  type: 'BUY' | 'SELL'
  totalAmount: number
  orderSize: number
  frequency: string
  status: string
  remainingAmount: number
  timestamp: string
  estimatedOutput: number
  minExecutionPrice?: number
  maxExecutionPrice?: number
  priceToken?: string
  inputToken?: string
  outputToken?: string
  totalCycles?: number
  remainingCycles?: number
}

export function DCAOrderCard({
  type,
  totalAmount,
  orderSize,
  frequency,
  status,
  remainingAmount,
  timestamp,
  estimatedOutput,
  minExecutionPrice,
  maxExecutionPrice,
  priceToken,
  inputToken,
  outputToken,
  totalCycles,
  remainingCycles
}: DCAOrderCardProps) {
  const [minUsdcPrice, setMinUsdcPrice] = useState<number | null>(null)
  const [maxUsdcPrice, setMaxUsdcPrice] = useState<number | null>(null)

  useEffect(() => {
    const fetchUsdcPrices = async () => {
      try {
        const priceService = PriceService.getInstance()

        if (minExecutionPrice && !priceToken?.includes('USDC')) {
          const minPriceInUsdc = await priceService.convertExecutionPrice(
            minExecutionPrice,
            inputToken || '',
            outputToken || ''
          )
          setMinUsdcPrice(minPriceInUsdc || null)
        }

        if (maxExecutionPrice && !priceToken?.includes('USDC')) {
          const maxPriceInUsdc = await priceService.convertExecutionPrice(
            maxExecutionPrice,
            inputToken || '',
            outputToken || ''
          )
          setMaxUsdcPrice(maxPriceInUsdc || null)
        }
      } catch (error) {
        console.error('Error converting prices to USDC:', error)
      }
    }

    if (inputToken && outputToken) {
      fetchUsdcPrices()
    }
  }, [minExecutionPrice, maxExecutionPrice, inputToken, outputToken, priceToken])

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

  return (
    <div className={clsx(
      'bg-gray-900 rounded-lg p-4 border',
      type === 'BUY' ? 'border-green-500/20' : 'border-red-500/20'
    )}>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Type:</span>
          <span className={type === 'BUY' ? 'text-green-500' : 'text-red-500'}>
            {type}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Total Amount:</span>
          <span className="text-white">
            {formatNumber(totalAmount, 0, inputToken)} {inputToken}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Split Info:</span>
          <span className="text-white">
            {totalCycles} orders ({remainingCycles} remaining)
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Order Size:</span>
          <span className="text-white">
            {formatNumber(orderSize, 0, inputToken)} {inputToken} per cycle
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Frequency:</span>
          <span className="text-white">{frequency}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Status:</span>
          <span className={status === 'Active' ? 'text-green-500' : 'text-white'}>
            {status}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Remaining Amount:</span>
          <span className="text-white">
            {remainingAmount < 0 ? '~' : ''}{formatNumber(Math.abs(remainingAmount), 0, inputToken)} {inputToken}
          </span>
        </div>

        {minExecutionPrice && (
          <div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Min. Execution Price:</span>
              {minUsdcPrice && !priceToken?.includes('USDC') ? (
                <span className="text-white">
                  ≈ ${formatPrice(minUsdcPrice)} USDC/{outputToken}
                </span>
              ) : (
                <span className="text-white">
                  {formatPrice(minExecutionPrice)} {priceToken}
                </span>
              )}
            </div>
            {minUsdcPrice && !priceToken?.includes('USDC') && (
              <div className="text-right text-sm text-gray-400">
                {formatPrice(minExecutionPrice)} {priceToken}
              </div>
            )}
          </div>
        )}

        {maxExecutionPrice && maxExecutionPrice !== minExecutionPrice && (
          <div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Max. Execution Price:</span>
              {maxUsdcPrice && !priceToken?.includes('USDC') ? (
                <span className="text-white">
                  ≈ ${formatPrice(maxUsdcPrice)} USDC/{outputToken}
                </span>
              ) : (
                <span className="text-white">
                  {formatPrice(maxExecutionPrice)} {priceToken}
                </span>
              )}
            </div>
            {maxUsdcPrice && !priceToken?.includes('USDC') && (
              <div className="text-right text-sm text-gray-400">
                {formatPrice(maxExecutionPrice)} {priceToken}
              </div>
            )}
          </div>
        )}

        {estimatedOutput !== 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Estimated Output:</span>
            <span className="text-white">
              ≈ {formatNumber(Math.abs(estimatedOutput), 0, outputToken)} {outputToken}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Last Update:</span>
          <span className="text-white">{formatDate(timestamp)}</span>
        </div>
      </div>
    </div>
  )
} 