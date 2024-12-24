'use client'

import { useState, useCallback } from 'react'
import { DashboardHeader } from '../components/shared/DashboardHeader'
import { OrderTabs } from '../components/shared/OrderTabs'
import { TokenSection } from '../components/shared/TokenSection'

export default function Dashboard() {
  const [mode, setMode] = useState<'all' | 'dca' | 'limit'>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefreshNow = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-4">
      <DashboardHeader />
      <div className="flex justify-between items-center mb-4">
        <OrderTabs activeMode={mode} onModeChange={setMode} />
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefreshNow}
            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Refresh Now
          </button>
          <label className="flex items-center text-sm text-gray-400">
            <input
              type="checkbox"
              className="mr-2"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <TokenSection 
          key={`logos-${refreshKey}`}
          tokenSymbol={'LOGOS' as const} 
          currentPrice={0.003244}
          mode={mode}
          autoRefresh={autoRefresh}
        />
        <TokenSection 
          key={`chaos-${refreshKey}`}
          tokenSymbol={'CHAOS' as const}
          currentPrice={0.006677}
          mode={mode}
          autoRefresh={autoRefresh}
        />
      </div>
    </main>
  )
}
