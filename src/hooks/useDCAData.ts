import { useState, useEffect } from 'react'
import { jupiterDCA } from '@/lib/dca/client'
import type { Position, TokenSummary, ChartDataPoint } from '@/lib/dca/types'

export function useDCAData(autoRefresh = false) {
  const [positions, setPositions] = useState<Position[]>([])
  const [summary, setSummary] = useState<Record<string, TokenSummary>>({})
  const [chartData, setChartData] = useState<Record<string, ChartDataPoint[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await jupiterDCA.getDCAAccounts()
      console.log('DCA Data received:', {
        positions: data.positions,
        summary: data.summary,
        chartData: data.chartData
      })
      
      setPositions(data.positions)
      setSummary(data.summary)
      setChartData(data.chartData)
    } catch (err) {
      console.error('Error fetching DCA data:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch DCA data'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Set up auto-refresh only if enabled
    let intervalId: NodeJS.Timeout | undefined
    if (autoRefresh) {
      intervalId = setInterval(fetchData, 30000) // 30 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [autoRefresh])

  return {
    positions,
    summary,
    chartData,
    loading,
    error,
    refetch: fetchData
  }
} 