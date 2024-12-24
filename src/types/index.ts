// Basic token interface
export interface Token {
  address: string
  symbol: string
  decimals: number
  name: string
  logoURI?: string
}

// DCA Order related types
export interface DCAOrder {
  id: string
  inToken: Token
  outToken: Token
  inAmount: number
  frequency: 'hourly' | 'daily' | 'weekly'
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  remainingBatches: number
  totalBatches: number
  nextExecutionAt?: Date
  createdAt: Date
  batchAmount: number
  executedBatches: number
  totalValue?: number
  averagePrice?: number
}

export interface DCAStats {
  totalOrders: number
  activeOrders: number
  totalValue: number
  averageOrderSize: number
}

// Limit Order related types
export interface LimitOrder {
  id: string
  inToken: Token
  outToken: Token
  inAmount: number
  outAmount: number
  price: number
  status: 'open' | 'filled' | 'cancelled'
  createdAt: Date
  expiresAt?: Date
  fillAmount?: number
  remainingAmount?: number
  executionPrice?: number
}

export interface LimitOrderStats {
  totalOrders: number
  openOrders: number
  totalValue: number
  averageOrderSize: number
}

// Summary types for dashboard
export interface TokenSummary {
  token: Token
  dcaStats: {
    inflow: number
    outflow: number
    activeOrders: number
    totalOrders: number
  }
  limitStats: {
    buyOrders: number
    sellOrders: number
    totalValue: number
  }
}

export interface DashboardStats {
  totalDCAOrders: number
  activeDCAOrders: number
  totalLimitOrders: number
  openLimitOrders: number
  totalValueLocked: number
}

// API Response types
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Filter types
export interface OrderFilters {
  status?: string[]
  tokenAddress?: string
  startDate?: Date
  endDate?: Date
}

// Pagination types
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Chart data types
export interface ChartDataPoint {
  timestamp: number
  value: number
}

export interface TokenPriceHistory {
  tokenAddress: string
  data: ChartDataPoint[]
}