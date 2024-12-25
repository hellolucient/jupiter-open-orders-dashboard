import React, { useState, useMemo } from 'react'
import { VolumeChart } from './VolumeChart'
import { OrderTypeTabs } from './OrderTypeTabs'
import type { Position, TokenSummary, ChartDataPoint } from '@/lib/dca/types'
import type { LimitOrder } from '@/lib/limitOrders/types'
import { DCAOrderCard } from '../orders/DCAOrderCard'
import { TokenSummaryCard } from './TokenSummaryCard'
import { LimitOrderCard } from '../orders/LimitOrderCard'

interface TokenSectionProps {
  token: string
  summary?: TokenSummary
  chartData?: ChartDataPoint[]
  dcaOrders?: Position[]
  limitOrders?: LimitOrder[]
  currentPrice?: number
}

export function TokenSection({ 
  token, 
  summary, 
  chartData = [], 
  dcaOrders = [], 
  limitOrders = [], 
  currentPrice = 0 
}: TokenSectionProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'dca' | 'limit'>('all')
  
  // Calculate filtered summary
  const filteredSummary = useMemo(() => {
    if (!summary) return undefined

    const dcaOrdersFiltered = selectedType === 'dca' || selectedType === 'all' ? dcaOrders : []
    const limitOrdersFiltered = selectedType === 'limit' || selectedType === 'all' ? limitOrders : []

    const buyDcaOrders = dcaOrdersFiltered.filter(o => o.type === 'BUY')
    const sellDcaOrders = dcaOrdersFiltered.filter(o => o.type === 'SELL')
    const buyLimitOrders = limitOrdersFiltered.filter(o => o.orderType === 'BUY')
    const sellLimitOrders = limitOrdersFiltered.filter(o => o.orderType === 'SELL')

    return {
      ...summary,
      buyOrders: buyDcaOrders.length + buyLimitOrders.length,
      sellOrders: sellDcaOrders.length + sellLimitOrders.length,
      buyVolume: buyDcaOrders.reduce((sum, o) => sum + o.remainingAmount, 0) +
                buyLimitOrders.reduce((sum, o) => sum + o.makingAmount, 0),
      sellVolume: sellDcaOrders.reduce((sum, o) => sum + o.remainingAmount, 0) +
                 sellLimitOrders.reduce((sum, o) => sum + o.makingAmount, 0),
      buyVolumeUSDC: buyDcaOrders.reduce((sum, o) => sum + o.remainingAmount, 0) +
                    buyLimitOrders.reduce((sum, o) => sum + o.makingAmount, 0),
      sellVolumeUSDC: sellDcaOrders.reduce((sum, o) => sum + (o.remainingAmount * currentPrice), 0) +
                     sellLimitOrders.reduce((sum, o) => sum + (o.makingAmount * currentPrice), 0),
    }
  }, [summary, selectedType, dcaOrders, limitOrders, currentPrice])

  // Filter chart data based on selected type
  const filteredChartData = useMemo(() => {
    if (selectedType === 'all') return chartData
    if (selectedType === 'dca') {
      return chartData.map(point => ({
        ...point,
        buyVolume: point.buyVolume,
        sellVolume: point.sellVolume,
        buyOrders: point.buyOrders,
        sellOrders: point.sellOrders,
      }))
    }
    // For limit orders, we don't have historical data yet
    return []
  }, [selectedType, chartData])

  return (
    <div className="h-full flex flex-col space-y-2 sm:space-y-4">
      <div className="hidden sm:flex sm:items-center sm:justify-between sm:sticky sm:top-0 sm:z-10 sm:bg-gray-900 sm:p-4 sm:rounded-lg sm:shadow-lg">
        <h2 className="text-base sm:text-lg font-bold">{token}</h2>
        <div className="text-sm sm:text-base text-gray-400">Current Price: ${currentPrice.toFixed(6)}</div>
      </div>

      {/* Mobile header (non-sticky) */}
      <div className="flex sm:hidden items-center justify-between">
        <h2 className="text-base font-bold">{token}</h2>
        <div className="text-sm text-gray-400">Current Price: ${currentPrice.toFixed(6)}</div>
      </div>
      
      <OrderTypeTabs selectedType={selectedType} onChange={setSelectedType} />
      
      <TokenSummaryCard 
        token={token} 
        summary={filteredSummary || { 
          buyOrders: 0,
          sellOrders: 0,
          buyVolume: 0,
          sellVolume: 0,
          buyVolumeUSDC: 0,
          sellVolumeUSDC: 0,
          price: currentPrice
        }} 
      />
      
      <div className="h-[200px] landscape:h-[250px] sm:h-[300px] bg-[#2a2a2a] rounded-lg p-2 sm:p-4">
        <VolumeChart data={filteredChartData} />
      </div>
      
      {/* Orders Grid Layout */}
      <div className="grid grid-cols-1 landscape:grid-cols-2 sm:grid-cols-2 gap-4">
        {/* DCA Orders Section */}
        {(selectedType === 'all' || selectedType === 'dca') && (
          <div>
            <h3 className="text-base sm:text-lg mb-2 sm:mb-4">DCA Orders</h3>
            <div className="space-y-2 sm:space-y-4">
              {dcaOrders.map(order => (
                <DCAOrderCard 
                  key={order.id}
                  type={order.type.toLowerCase()}
                  totalAmount={`${order.totalAmount.toLocaleString()} ${order.inputToken}`}
                  splitInfo={`${order.totalCycles} cycles (${order.remainingCycles} remaining)`}
                  orderSize={`${order.amountPerCycle.toLocaleString()} ${order.inputToken} per cycle`}
                  frequency={`Every ${order.cycleFrequency}s`}
                  status={order.isActive ? '🚥 Active' : '⚪️ Completed'}
                  remainingAmount={`${order.remainingAmount.toLocaleString()} ${order.inputToken}`}
                  timestamp={new Date(order.lastUpdate).toLocaleString()}
                  estimatedOutput={`${Math.round(order.estimatedTokens).toLocaleString()} ${order.outputToken}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Limit Orders Section */}
        {(selectedType === 'all' || selectedType === 'limit') && (
          <div>
            <h3 className="text-base sm:text-lg mb-2 sm:mb-4">Limit Orders</h3>
            <div className="space-y-2 sm:space-y-4">
              {limitOrders.map(order => (
                <LimitOrderCard 
                  key={order.id}
                  order={order}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 