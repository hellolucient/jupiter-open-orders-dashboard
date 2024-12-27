import { useState, useCallback } from 'react'
import { jupiterDCA } from '../client'
import type { Position, TokenSummary, ChartDataPoint } from '../types/index'
import { useAutoRefresh } from '@/lib/shared/hooks/useAutoRefresh'

export function useDCAData(autoRefresh = false) {
  const [positions, setPositions] = useState<Position[]>([])
  const [summary, setSummary] = useState<Record<string, TokenSummary>>({})
  const [chartData, setChartData] = useState<Record<string, ChartDataPoint[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
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
  }, [])

  // Use shared auto-refresh hook
  useAutoRefresh(fetchData, autoRefresh)

  return {
    positions,
    summary,
    chartData,
    loading,
    error,
    refetch: fetchData
  }
} 