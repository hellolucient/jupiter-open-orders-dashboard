'use client'

import { VolumeChart } from '../charts/VolumeChart'
import { DCAOrderCard } from '@/lib/dca/components/DCAOrderCard'
import { LimitOrderCard } from '@/lib/limitOrders/components/LimitOrderCard'
import { useLimitOrders } from '@/lib/limitOrders/hooks/useLimitOrders'
import { useDCAData } from '@/lib/dca/hooks/useDCAData'
import { useMemo } from 'react'

interface TokenSectionProps {
  tokenSymbol: 'LOGOS' | 'CHAOS'
  currentPrice: number
  mode?: 'all' | 'dca' | 'limit'
  autoRefresh?: boolean
}

export function TokenSection({ tokenSymbol, currentPrice, mode = 'all', autoRefresh = false }: TokenSectionProps) {
  const { orders, summary: loSummary, loading: loLoading, error: loError } = useLimitOrders(autoRefresh);
  const { positions: dcaPositions, summary: dcaSummary, loading: dcaLoading, error: dcaError } = useDCAData(autoRefresh);

  // Filter orders for the current token
  const tokenOrders = useMemo(() => orders.filter(order => 
    (order.inputMint.symbol === tokenSymbol || order.outputMint.symbol === tokenSymbol)
  ), [orders, tokenSymbol]);

  // Split into buy and sell orders
  const buyOrders = useMemo(() => 
    tokenOrders.filter(order => order.orderType === 'BUY'), 
    [tokenOrders]
  );
  
  const sellOrders = useMemo(() => 
    tokenOrders.filter(order => order.orderType === 'SELL'),
    [tokenOrders]
  );

  // Sort orders by amount and date
  const sortedBuyOrders = useMemo(() => {
    return [...buyOrders].sort((a, b) => {
      const amountDiff = b.takingAmount - a.takingAmount;
      if (amountDiff !== 0) return amountDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [buyOrders]);

  const sortedSellOrders = useMemo(() => {
    return [...sellOrders].sort((a, b) => {
      const amountDiff = b.makingAmount - a.makingAmount;
      if (amountDiff !== 0) return amountDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [sellOrders]);

  // Filter DCA positions for the current token
  const dcaBuyOrders = useMemo(() => 
    dcaPositions.filter(p => p.outputToken === tokenSymbol && p.type.toUpperCase() === 'BUY'),
    [dcaPositions, tokenSymbol]
  );

  const dcaSellOrders = useMemo(() => 
    dcaPositions.filter(p => p.inputToken === tokenSymbol && p.type.toUpperCase() === 'SELL'),
    [dcaPositions, tokenSymbol]
  );

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

  // Show loading state if either data source is loading
  if (loLoading || dcaLoading || !loSummary || !dcaSummary || !orders || !dcaPositions) {
    return (
      <section className="p-4 bg-gray-900 rounded-lg animate-pulse">
        <div className="h-96 bg-gray-800 rounded-lg"></div>
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
            Current Price: ${currentPrice.toFixed(6)}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="text-green-500 mb-2">Buy Orders</h3>
            {mode === 'all' ? (
              <>
                <div className="mb-3">
                  <div className="text-gray-400 text-sm">DCA</div>
                  <div className="text-xl">{tokenDcaSummary.buyOrders}</div>
                  <div className="text-4xl font-black tracking-tight text-green-400">{tokenDcaSummary.buyVolume.toLocaleString()} <span className="text-base font-medium text-green-500">{tokenSymbol}</span></div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Limit Orders</div>
                  <div className="text-xl">{tokenLoSummary.buyOrders}</div>
                  <div className="text-4xl font-black tracking-tight text-green-400">{tokenLoSummary.buyVolume.toLocaleString()} <span className="text-base font-medium text-green-500">{tokenSymbol}</span></div>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{displayStats.buyOrders}</div>
                <div className="text-gray-400">Buy Volume</div>
                <div className="text-4xl font-black tracking-tight text-green-400">{displayStats.buyVolume.toLocaleString()} <span className="text-base font-medium text-green-500">{tokenSymbol}</span></div>
                <div className="text-sm text-gray-400">${(displayStats.buyVolume * currentPrice).toFixed(2)}</div>
              </>
            )}
          </div>
          
          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="text-red-500 mb-2">Sell Orders</h3>
            {mode === 'all' ? (
              <>
                <div className="mb-3">
                  <div className="text-gray-400 text-sm">DCA</div>
                  <div className="text-xl">{tokenDcaSummary.sellOrders}</div>
                  <div className="text-4xl font-black tracking-tight text-red-400">{tokenDcaSummary.sellVolume.toLocaleString()} <span className="text-base font-medium text-red-500">{tokenSymbol}</span></div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Limit Orders</div>
                  <div className="text-xl">{tokenLoSummary.sellOrders}</div>
                  <div className="text-4xl font-black tracking-tight text-red-400">{tokenLoSummary.sellVolume.toLocaleString()} <span className="text-base font-medium text-red-500">{tokenSymbol}</span></div>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{displayStats.sellOrders}</div>
                <div className="text-gray-400">Sell Volume</div>
                <div className="text-4xl font-black tracking-tight text-red-400">{displayStats.sellVolume.toLocaleString()} <span className="text-base font-medium text-red-500">{tokenSymbol}</span></div>
                <div className="text-sm text-gray-400">${(displayStats.sellVolume * currentPrice).toFixed(2)}</div>
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

        <div className="grid grid-cols-2 gap-4">
          {mode === 'limit' && (
            <>
              <div>
                <h3 className="mb-2 text-green-500">Buy Orders</h3>
                {sortedBuyOrders.length > 0 ? (
                  sortedBuyOrders.map(order => (
                    <LimitOrderCard
                      key={order.id}
                      order={order}
                    />
                  ))
                ) : (
                  <div className="text-gray-400">No buy orders found</div>
                )}
              </div>
              <div>
                <h3 className="mb-2 text-red-500">Sell Orders</h3>
                {sortedSellOrders.length > 0 ? (
                  sortedSellOrders.map(order => (
                    <LimitOrderCard
                      key={order.id}
                      order={order}
                    />
                  ))
                ) : (
                  <div className="text-gray-400">No sell orders found</div>
                )}
              </div>
            </>
          )}
          {mode === 'dca' && (
            <>
              <div>
                <h3 className="mb-2 text-green-500">Buy Orders</h3>
                {dcaBuyOrders.length > 0 ? (
                  dcaBuyOrders.map(order => (
                    <DCAOrderCard
                      key={order.id}
                      type="buy"
                      totalAmount={`${order.totalAmount} ${order.inputToken}`}
                      splitInfo={`${order.totalCycles} orders (${order.remainingCycles} remaining)`}
                      orderSize={`${order.amountPerCycle} ${order.inputToken} per cycle`}
                      frequency={`Every ${order.cycleFrequency}s`}
                      status={order.isActive ? "Active" : "Inactive"}
                      remainingAmount={`~${order.remainingAmount} ${order.inputToken}`}
                      timestamp={new Date(order.lastUpdate).toLocaleString()}
                      estimatedOutput={`~${Math.round(order.estimatedTokens).toLocaleString()} ${order.outputToken}`}
                    />
                  ))
                ) : (
                  <div className="text-gray-400">No DCA buy orders found</div>
                )}
              </div>
              <div>
                <h3 className="mb-2 text-red-500">Sell Orders</h3>
                {dcaSellOrders.length > 0 ? (
                  dcaSellOrders.map(order => (
                    <DCAOrderCard
                      key={order.id}
                      type="sell"
                      totalAmount={`${order.totalAmount} ${tokenSymbol}`}
                      splitInfo={`${order.totalCycles} orders (${order.remainingCycles} remaining)`}
                      orderSize={`${order.amountPerCycle} ${tokenSymbol} per cycle`}
                      frequency={`Every ${order.cycleFrequency}s`}
                      status={order.isActive ? "Active" : "Inactive"}
                      remainingAmount={`~${order.remainingAmount} ${tokenSymbol}`}
                      timestamp={new Date(order.lastUpdate).toLocaleString()}
                      estimatedOutput={`~${Math.round(order.estimatedTokens).toLocaleString()} ${order.outputToken}`}
                    />
                  ))
                ) : (
                  <div className="text-gray-400">No DCA sell orders found</div>
                )}
              </div>
            </>
          )}
          {mode === 'all' && (
            <>
              <div>
                <h3 className="mb-2">DCA Orders</h3>
                {dcaBuyOrders.length > 0 || dcaSellOrders.length > 0 ? (
                  <>
                    {dcaBuyOrders.map(order => (
                      <DCAOrderCard
                        key={order.id}
                        type="buy"
                        totalAmount={`${order.totalAmount} ${order.inputToken}`}
                        splitInfo={`${order.totalCycles} orders (${order.remainingCycles} remaining)`}
                        orderSize={`${order.amountPerCycle} ${order.inputToken} per cycle`}
                        frequency={`Every ${order.cycleFrequency}s`}
                        status={order.isActive ? "Active" : "Inactive"}
                        remainingAmount={`~${order.remainingAmount} ${order.inputToken}`}
                        timestamp={new Date(order.lastUpdate).toLocaleString()}
                        estimatedOutput={`~${Math.round(order.estimatedTokens).toLocaleString()} ${order.outputToken}`}
                      />
                    ))}
                    {dcaSellOrders.map(order => (
                      <DCAOrderCard
                        key={order.id}
                        type="sell"
                        totalAmount={`${order.totalAmount} ${tokenSymbol}`}
                        splitInfo={`${order.totalCycles} orders (${order.remainingCycles} remaining)`}
                        orderSize={`${order.amountPerCycle} ${tokenSymbol} per cycle`}
                        frequency={`Every ${order.cycleFrequency}s`}
                        status={order.isActive ? "Active" : "Inactive"}
                        remainingAmount={`~${order.remainingAmount} ${tokenSymbol}`}
                        timestamp={new Date(order.lastUpdate).toLocaleString()}
                        estimatedOutput={`~${Math.round(order.estimatedTokens).toLocaleString()} ${order.outputToken}`}
                      />
                    ))}
                  </>
                ) : (
                  <div className="text-gray-400">No DCA orders found</div>
                )}
              </div>
              <div>
                <h3 className="mb-2">Limit Orders</h3>
                {sortedBuyOrders.length > 0 || sortedSellOrders.length > 0 ? (
                  <>
                    {sortedBuyOrders.map(order => (
                      <LimitOrderCard
                        key={order.id}
                        order={order}
                      />
                    ))}
                    {sortedSellOrders.map(order => (
                      <LimitOrderCard
                        key={order.id}
                        order={order}
                      />
                    ))}
                  </>
                ) : (
                  <div className="text-gray-400">No limit orders found</div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
} 