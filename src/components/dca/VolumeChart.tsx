import React from 'react'
import type { ChartDataPoint } from '@/lib/dca/types'
import { VolumeChart as BaseVolumeChart } from '@/components/charts/VolumeChart'

interface Props {
  data: ChartDataPoint[]
}

export function VolumeChart({ data }: Props) {
  const latestData = data[0] || {
    buyVolume: 0,
    sellVolume: 0,
    buyOrders: 0,
    sellOrders: 0
  }

  return (
    <div className="h-[300px]">
      <BaseVolumeChart
        buyVolume={[latestData.buyVolume]}
        sellVolume={[latestData.sellVolume]}
        buyOrders={latestData.buyOrders}
        sellOrders={latestData.sellOrders}
      />
    </div>
  )
} 