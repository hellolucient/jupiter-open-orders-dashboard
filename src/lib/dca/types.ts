import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

export interface BasePosition {
  id: string
  token: string
  type: "BUY" | "SELL"
  inputToken: string
  outputToken: string
  inputAmount: number
  totalAmount: number
  amountPerCycle: number
  remainingCycles: number
  cycleFrequency: number
  lastUpdate: number
  publicKey: string
  targetPrice: number
  currentPrice: number
  priceToken: string
  estimatedOutput?: number
  totalCycles: number
  completedCycles: number
  isActive: boolean
  executionPrice: number
}

export interface Position extends BasePosition {
  minPrice?: number
  maxPrice?: number | "No limit"
  remainingAmount: number
  estimatedTokens: number
  remainingInCycle: number
}

export interface TokenSummary {
  buyOrders: number
  sellOrders: number
  buyVolume: number
  sellVolume: number
  buyVolumeUSDC: number
  sellVolumeUSDC: number
  price: number
}

export interface ChartDataPoint {
  timestamp: number
  buyVolume: number
  sellVolume: number
  buyOrders: number
  sellOrders: number
}

export interface DCAAccountType {
  publicKey: PublicKey
  account: {
    user: PublicKey
    inputMint: PublicKey
    outputMint: PublicKey
    idx: BN
    nextCycleAt: BN
    inDeposited: BN
    inWithdrawn: BN
    outWithdrawn: BN
    inUsed: BN
    inAmountPerCycle: BN
    cycleFrequency: BN
    bump: number
    minOutAmount?: BN
    maxOutAmount?: BN
    createdAt: BN
    nextCycleAmountLeft: BN
  }
} 