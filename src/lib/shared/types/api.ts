// Generic API response wrapper
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
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