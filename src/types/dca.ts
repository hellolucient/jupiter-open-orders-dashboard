export interface DCAPosition {
  id: string
  owner: string
  token: string
  type: 'BUY' | 'SELL'
  totalAmount: number
  amountPerCycle: number
  totalCycles: number
  remainingCycles: number
  cycleFrequency: number
  remainingAmount: number
  remainingInCycle: number
  isActive: boolean
  lastUpdate: number
} 