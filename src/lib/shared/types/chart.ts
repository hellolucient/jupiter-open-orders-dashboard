// Basic chart data point
export interface ChartDataPoint {
  timestamp: number
  buyVolume: number
  sellVolume: number
  buyOrders: number
  sellOrders: number
}

// Price history data point
export interface PriceDataPoint {
  timestamp: number
  value: number
} 