'use client'

import { VolumeChart } from '../charts/VolumeChart'
import { DCAOrderCard } from '@/lib/dca/components/DCAOrderCard'
import { LimitOrderCard } from '@/lib/limitOrders/components/LimitOrderCard'
import { useLimitOrders } from '@/lib/limitOrders/hooks/useLimitOrders'
import { useDCAData } from '@/lib/dca/hooks/useDCAData'
import { useMemo, useState } from 'react'
import { SortButton } from './SortButton'
import type { LimitOrder } from '@/lib/limitOrders/types'
import type { Position } from '@/lib/dca/types/index'
import { SortOption } from '@/lib/shared/types'

interface TokenSectionProps {
  tokenSymbol: 'LOGOS' | 'CHAOS'
  currentPrice: number
  mode?: 'all' | 'dca' | 'limit'
  autoRefresh?: boolean
}

export function TokenSection({ tokenSymbol, currentPrice, mode = 'all', autoRefresh = false }: TokenSectionProps) {
  const [sortOption, setSortOption] = useState<SortOption>('amount-desc')
  
  const { orders, summary: loSummary, loading: loLoading, error: loError } = useLimitOrders(autoRefresh);
  const { positions: dcaPositions, summary: dcaSummary, loading: dcaLoading, error: dcaError } = useDCAData(autoRefresh);

  // Filter orders for the current token
  const tokenOrders = useMemo(() => orders.filter(order => 
    (order.inputMint.symbol === tokenSymbol || order.outputMint.symbol === tokenSymbol)
  ), [orders, tokenSymbol]);

  // Sort orders by amount, date, and price
  const sortLimitOrders = (orders: LimitOrder[], option: SortOption): LimitOrder[] => {
    return [...orders].sort((a, b) => {
      if (option.startsWith('date')) {
        // Parse dates consistently
        const dateA = new Date(a.createdAt.split('.')[0]).getTime()
        const dateB = new Date(b.createdAt.split('.')[0]).getTime()
        return option === 'date-asc' ? dateA - dateB : dateB - dateA
      }
      
      if (option.startsWith('price')) {
        // For limit orders, use the USDC price directly
        const priceA = a.price
        const priceB = b.price
        return option === 'price-asc' ? priceA - priceB : priceB - priceA
      }
      
      // Amount sort
      const amountA = a.orderType === 'BUY' ? a.takingAmount : a.makingAmount
      const amountB = b.orderType === 'BUY' ? b.takingAmount : b.makingAmount
      return option === 'amount-asc' ? amountA - amountB : amountB - amountA
    })
  }

  const sortDCAOrders = (orders: Position[], option: SortOption): Position[] => {
    return [...orders].sort((a, b) => {
      if (option.startsWith('date')) {
        return option === 'date-asc' ? a.lastUpdate - b.lastUpdate : b.lastUpdate - a.lastUpdate
      }
      
      if (option.startsWith('price')) {
        // For DCA orders, use minExecutionPrice if available
        const priceA = a.minExecutionPrice || 0
        const priceB = b.minExecutionPrice || 0
        return option === 'price-asc' ? priceA - priceB : priceB - priceA
      }
      
      // Amount sort
      return option === 'amount-asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount
    })
  }

  // Update the sorted orders
  const sortedBuyOrders = useMemo(() => 
    sortLimitOrders(tokenOrders.filter(o => o.orderType === 'BUY'), sortOption),
    [tokenOrders, sortOption]
  )

  const sortedSellOrders = useMemo(() => 
    sortLimitOrders(tokenOrders.filter(o => o.orderType === 'SELL'), sortOption),
    [tokenOrders, sortOption]
  )

  // Filter DCA positions for the current token
  const dcaBuyOrders = useMemo(() => 
    dcaPositions.filter(p => p.outputToken === tokenSymbol && p.type.toUpperCase() === 'BUY'),
    [dcaPositions, tokenSymbol]
  );

  const dcaSellOrders = useMemo(() => 
    dcaPositions.filter(p => p.inputToken === tokenSymbol && p.type.toUpperCase() === 'SELL'),
    [dcaPositions, tokenSymbol]
  );

  const sortedDcaBuyOrders = useMemo(() => 
    sortDCAOrders(dcaBuyOrders, sortOption),
    [dcaBuyOrders, sortOption]
  )

  const sortedDcaSellOrders = useMemo(() => 
    sortDCAOrders(dcaSellOrders, sortOption),
    [dcaSellOrders, sortOption]
  )

  const tokenLoSummary = loSummary[tokenSymbol] || {
    buyOrders: 0,
    sellOrders: 0,
    buyVolume: 0,
    sellVolume: 0
  };

  const tokenDcaSummary = dcaSummary[tokenSymbol] || {
    buyOrders: 0,
    sellOrders: 0,
    buyVolume: 0,
    sellVolume: 0
  };

  // Get the appropriate stats based on mode
  const displayStats = {
    buyOrders: mode === 'all' ? tokenLoSummary.buyOrders + tokenDcaSummary.buyOrders : 
               mode === 'dca' ? tokenDcaSummary.buyOrders : tokenLoSummary.buyOrders,
    sellOrders: mode === 'all' ? tokenLoSummary.sellOrders + tokenDcaSummary.sellOrders :
                mode === 'dca' ? tokenDcaSummary.sellOrders : tokenLoSummary.sellOrders,
    buyVolume: mode === 'all' ? tokenLoSummary.buyVolume + tokenDcaSummary.buyVolume :
               mode === 'dca' ? tokenDcaSummary.buyVolume : tokenLoSummary.buyVolume,
    sellVolume: mode === 'all' ? tokenLoSummary.sellVolume + tokenDcaSummary.sellVolume :
                mode === 'dca' ? tokenDcaSummary.sellVolume : tokenLoSummary.sellVolume
  };

  // Format large numbers consistently
  const formatNumber = (value: number | undefined, decimals: number = 0, token?: string) => {
    if (typeof value === 'undefined') return '0'
    // Use 2 decimals for SOL amounts
    if (token === 'SOL') {
      return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  // Format currency values
  const formatCurrency = (value: number | undefined) => {
    if (typeof value === 'undefined') return '0.00'
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Format price values
  const formatPrice = (value: number | undefined) => {
    if (typeof value === 'undefined') return '0.00'
    // Show more decimal places for very small numbers
    if (value < 0.000001) {
      return value.toLocaleString('en-US', {
        minimumFractionDigits: 12,
        maximumFractionDigits: 12
      })
    }
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6
    })
  }

  // Show loading state if either data source is loading
  if (loLoading || dcaLoading || !loSummary || !dcaSummary || !orders || !dcaPositions) {
    return (
      <section className="p-4 bg-gray-900 rounded-lg animate-pulse">
        <div className="h-96 bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-gray-400 text-lg">
            Loading orders...
          </div>
        </div>
      </section>
    );
  }

  // Show error state if there's an error
  if (loError || dcaError) {
    return (
      <section className="p-4 bg-gray-900 rounded-lg">
        <div className="text-red-500">
          {loError?.message || dcaError?.message}
        </div>
      </section>
    );
  }

  return (
    <div className="relative">
      <div className="sticky top-0 z-10 bg-gray-900 p-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{tokenSymbol}</h2>
          <div className="text-gray-400">
            Current Price: ${formatPrice(currentPrice)}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="text-green-500 mb-2">Buy Orders</h3>
            {mode === 'all' ? (
              <>
                <div className="mb-3">
                  <div className="text-gray-400 text-sm">DCA</div>
                  <div className="text-xl">{formatNumber(tokenDcaSummary.buyOrders)}</div>
                  <div className="text-4xl font-black tracking-tight text-green-400">
                    {formatNumber(tokenDcaSummary.buyVolume)} <span className="text-base font-medium text-green-500">{tokenSymbol}</span>
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Limit Orders</div>
                  <div className="text-xl">{formatNumber(tokenLoSummary.buyOrders)}</div>
                  <div className="text-4xl font-black tracking-tight text-green-400">
                    {formatNumber(tokenLoSummary.buyVolume)} <span className="text-base font-medium text-green-500">{tokenSymbol}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatNumber(displayStats.buyOrders)}</div>
                <div className="text-gray-400">Buy Volume</div>
                <div className="text-4xl font-black tracking-tight text-green-400">
                  {formatNumber(displayStats.buyVolume)} <span className="text-base font-medium text-green-500">{tokenSymbol}</span>
                </div>
                <div className="text-sm text-gray-400">${formatCurrency(displayStats.buyVolume * currentPrice)}</div>
              </>
            )}
          </div>
          
          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="text-red-500 mb-2">Sell Orders</h3>
            {mode === 'all' ? (
              <>
                <div className="mb-3">
                  <div className="text-gray-400 text-sm">DCA</div>
                  <div className="text-xl">{formatNumber(tokenDcaSummary.sellOrders)}</div>
                  <div className="text-4xl font-black tracking-tight text-red-400">
                    {formatNumber(tokenDcaSummary.sellVolume)} <span className="text-base font-medium text-red-500">{tokenSymbol}</span>
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Limit Orders</div>
                  <div className="text-xl">{formatNumber(tokenLoSummary.sellOrders)}</div>
                  <div className="text-4xl font-black tracking-tight text-red-400">
                    {formatNumber(tokenLoSummary.sellVolume)} <span className="text-base font-medium text-red-500">{tokenSymbol}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatNumber(displayStats.sellOrders)}</div>
                <div className="text-gray-400">Sell Volume</div>
                <div className="text-4xl font-black tracking-tight text-red-400">
                  {formatNumber(displayStats.sellVolume)} <span className="text-base font-medium text-red-500">{tokenSymbol}</span>
                </div>
                <div className="text-sm text-gray-400">${formatCurrency(displayStats.sellVolume * currentPrice)}</div>
              </>
            )}
          </div>
        </div>
      </div>

      <section className="bg-gray-900 rounded-lg p-4 mt-4">
        <div className="h-96 bg-gray-800 rounded-lg mb-4 p-4">
          <VolumeChart 
            buyVolume={[displayStats.buyVolume]} 
            sellVolume={[displayStats.sellVolume]}
            buyOrders={displayStats.buyOrders}
            sellOrders={displayStats.sellOrders}
            mode="daily"
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <SortButton currentSort={sortOption} onSortChange={setSortOption} />
        </div>

        {mode === 'all' ? (
          // Side by side layout for 'all' mode
          <div className="grid grid-cols-2 gap-4">
            {/* DCA Orders Column */}
            <div>
              {sortedDcaBuyOrders.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">DCA Buy Orders</h3>
                  <div className="space-y-2">
                    {sortedDcaBuyOrders.map(order => (
                      <DCAOrderCard 
                        key={order.id}
                        type="BUY"
                        totalAmount={order.totalAmount}
                        orderSize={order.amountPerCycle}
                        frequency={`Every ${order.cycleFrequency}s`}
                        status={order.isActive ? "Active" : "Inactive"}
                        remainingAmount={order.remainingAmount}
                        timestamp={new Date(order.lastUpdate).toLocaleString()}
                        minExecutionPrice={order.minExecutionPrice}
                        maxExecutionPrice={order.maxExecutionPrice}
                        estimatedOutput={order.estimatedTokens}
                        priceToken={order.priceToken}
                        inputToken={order.inputToken}
                        outputToken={order.outputToken}
                        totalCycles={order.totalCycles}
                        remainingCycles={order.remainingCycles}
                      />
                    ))}
                  </div>
                </div>
              )}
              {sortedDcaSellOrders.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">DCA Sell Orders</h3>
                  <div className="space-y-2">
                    {sortedDcaSellOrders.map(order => (
                      <DCAOrderCard 
                        key={order.id}
                        type="SELL"
                        totalAmount={order.totalAmount}
                        orderSize={order.amountPerCycle}
                        frequency={`Every ${order.cycleFrequency}s`}
                        status={order.isActive ? "Active" : "Inactive"}
                        remainingAmount={order.remainingAmount}
                        timestamp={new Date(order.lastUpdate).toLocaleString()}
                        minExecutionPrice={order.minExecutionPrice}
                        maxExecutionPrice={order.maxExecutionPrice}
                        estimatedOutput={order.estimatedTokens}
                        priceToken={order.priceToken}
                        inputToken={order.inputToken}
                        outputToken={order.outputToken}
                        totalCycles={order.totalCycles}
                        remainingCycles={order.remainingCycles}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Limit Orders Column */}
            <div>
              {sortedBuyOrders.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Limit Buy Orders</h3>
                  <div className="space-y-2">
                    {sortedBuyOrders.map(order => (
                      <LimitOrderCard key={order.id} order={order} />
                    ))}
                  </div>
                </div>
              )}
              {sortedSellOrders.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Limit Sell Orders</h3>
                  <div className="space-y-2">
                    {sortedSellOrders.map(order => (
                      <LimitOrderCard key={order.id} order={order} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Stacked layout for 'dca' and 'limit' modes
          <>
            {/* Buy Orders */}
            {(mode === 'limit') && sortedBuyOrders.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Buy Orders</h3>
                <div className="space-y-2">
                  {sortedBuyOrders.map(order => (
                    <LimitOrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}

            {/* DCA Buy Orders */}
            {(mode === 'dca') && sortedDcaBuyOrders.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">DCA Buy Orders</h3>
                <div className="space-y-2">
                  {sortedDcaBuyOrders.map(order => (
                    <DCAOrderCard 
                      key={order.id}
                      type="BUY"
                      totalAmount={order.totalAmount}
                      orderSize={order.amountPerCycle}
                      frequency={`Every ${order.cycleFrequency}s`}
                      status={order.isActive ? "Active" : "Inactive"}
                      remainingAmount={order.remainingAmount}
                      timestamp={new Date(order.lastUpdate).toLocaleString()}
                      minExecutionPrice={order.minExecutionPrice}
                      maxExecutionPrice={order.maxExecutionPrice}
                      estimatedOutput={order.estimatedTokens}
                      priceToken={order.priceToken}
                      inputToken={order.inputToken}
                      outputToken={order.outputToken}
                      totalCycles={order.totalCycles}
                      remainingCycles={order.remainingCycles}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sell Orders */}
            {(mode === 'limit') && sortedSellOrders.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Sell Orders</h3>
                <div className="space-y-2">
                  {sortedSellOrders.map(order => (
                    <LimitOrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}

            {/* DCA Sell Orders */}
            {(mode === 'dca') && sortedDcaSellOrders.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">DCA Sell Orders</h3>
                <div className="space-y-2">
                  {sortedDcaSellOrders.map(order => (
                    <DCAOrderCard 
                      key={order.id}
                      type="SELL"
                      totalAmount={order.totalAmount}
                      orderSize={order.amountPerCycle}
                      frequency={`Every ${order.cycleFrequency}s`}
                      status={order.isActive ? "Active" : "Inactive"}
                      remainingAmount={order.remainingAmount}
                      timestamp={new Date(order.lastUpdate).toLocaleString()}
                      minExecutionPrice={order.minExecutionPrice}
                      maxExecutionPrice={order.maxExecutionPrice}
                      estimatedOutput={order.estimatedTokens}
                      priceToken={order.priceToken}
                      inputToken={order.inputToken}
                      outputToken={order.outputToken}
                      totalCycles={order.totalCycles}
                      remainingCycles={order.remainingCycles}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
} 