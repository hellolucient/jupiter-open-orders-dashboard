'use client'

import { useState, useEffect } from 'react'

export function DashboardHeader() {
  const [timestamp, setTimestamp] = useState<string>('')

  useEffect(() => {
    const updateTimestamp = () => {
      const now = new Date()
      setTimestamp(now.toLocaleString())
    }

    updateTimestamp()
    const interval = setInterval(updateTimestamp, 30000) // Update every 30s
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex justify-between items-center p-4 border-b border-gray-800">
      <div className="text-gray-400">
        Data as of {timestamp}
      </div>
    </div>
  )
} 