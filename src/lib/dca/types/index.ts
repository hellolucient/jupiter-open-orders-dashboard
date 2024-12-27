import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { ChartDataPoint } from '@/lib/shared/types/chart'
import { TokenSummaryBase } from '@/lib/shared/types/token'

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
  estimatedTokens: number
  executionPrice?: number
}

export interface Position extends BasePosition {
  minPrice?: number
  maxPrice?: number | "No limit"
  remainingAmount: number
  remainingInCycle: number
  minExecutionPrice?: number
  maxExecutionPrice?: number
  minEstimatedOutput?: number
  maxEstimatedOutput?: number
}

export type TokenSummary = TokenSummaryBase

export type { ChartDataPoint }

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