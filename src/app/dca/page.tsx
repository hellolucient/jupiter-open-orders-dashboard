'use client'

import { useDCAData } from '@/hooks/useDCAData'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { TokenSection } from '@/components/dca/TokenSection'

export default function DCAPage() {
  const { positions, summary, chartData, loading, error, refetch } = useDCAData()

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-500">Error: {error.message}</p>
        <button 
          onClick={refetch}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Jupiter DCA Dashboard</h1>
          <button 
            onClick={refetch}
            className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* LOGOS Section */}
          <div>
            <TokenSection
              token="LOGOS"
              summary={summary.LOGOS}
              chartData={chartData.LOGOS}
              dcaOrders={positions.filter(p => p.token === 'LOGOS')}
              limitOrders={[]}
              currentPrice={summary.LOGOS?.price || 0}
            />
          </div>

          {/* CHAOS Section */}
          <div>
            <TokenSection
              token="CHAOS"
              summary={summary.CHAOS}
              chartData={chartData.CHAOS}
              dcaOrders={positions.filter(p => p.token === 'CHAOS')}
              limitOrders={[]}
              currentPrice={summary.CHAOS?.price || 0}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 