import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { ChartDataPoint } from '@/lib/dca/types'

interface VolumeChartProps {
  data: ChartDataPoint[]
  token: string
}

export function VolumeChart({ data, token }: VolumeChartProps) {
  return (
    <div className="h-[300px] bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">{token} Volume</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={(timestamp: number) => new Date(timestamp).toLocaleDateString()}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(timestamp: number) => new Date(timestamp).toLocaleString()}
            formatter={(value: number) => [`${value.toLocaleString()} ${token}`, '']}
          />
          <Area 
            type="monotone" 
            dataKey="buyVolume" 
            stackId="1" 
            stroke="#22c55e" 
            fill="#22c55e" 
            fillOpacity={0.3}
            name="Buy Volume"
          />
          <Area 
            type="monotone" 
            dataKey="sellVolume" 
            stackId="1" 
            stroke="#ef4444" 
            fill="#ef4444" 
            fillOpacity={0.3}
            name="Sell Volume"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
} 