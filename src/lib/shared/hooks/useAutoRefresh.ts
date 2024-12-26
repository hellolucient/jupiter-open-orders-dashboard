import { useEffect } from 'react'

export function useAutoRefresh(callback: () => Promise<void>, enabled: boolean = false, interval: number = 30000) {
  useEffect(() => {
    // Initial fetch
    callback()
    
    // Set up auto-refresh only if enabled
    let intervalId: NodeJS.Timeout | undefined
    if (enabled) {
      intervalId = setInterval(callback, interval)
    }
    
    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [callback, enabled, interval])
} 