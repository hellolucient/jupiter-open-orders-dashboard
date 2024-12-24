import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

export interface TokenInfo {
  address: string
  symbol: string
  decimals: number
  isDecimalKnown: boolean
}

export interface LimitOrder {
  id: string
  maker: PublicKey
  inputMint: TokenInfo
  outputMint: TokenInfo
  makingAmount: number
  takingAmount: number
  oriMakingAmount: number
  oriTakingAmount: number
  borrowMakingAmount: number
  price: number
  status: 'open' | 'filled' | 'cancelled'
  createdAt: string
  updatedAt: string
  expiredAt?: string
  tokenType: 'LOGOS' | 'CHAOS'
  orderType: 'BUY' | 'SELL'
  feeBps: number
  feeAccount: string
  bump: number
  inputTokenProgram: string
  outputTokenProgram: string
  inputMintReserve: string
  uniqueId: string
}

export interface LimitOrderAccountType {
  publicKey: PublicKey
  account: {
    owner: PublicKey
    inputMint: PublicKey
    outputMint: PublicKey
    inAmount: BN
    minOutAmount: BN
    expiryTimestamp: BN | null
    filledInAmount: BN
    filledOutAmount: BN
    status: number
    createdAt: BN
  }
}

export interface LimitOrderSummary {
  buyOrders: number
  sellOrders: number
  buyVolume: number
  sellVolume: number
  buyVolumeUSDC: number
  sellVolumeUSDC: number
  price: number
}

export interface OrderAnalysis {
  maker: string
  inputMint: string
  outputMint: string
  uniqueId: string
  oriMakingAmount: number
  oriTakingAmount: number
  makingAmount: number
  takingAmount: number
  borrowMakingAmount: number
  expiredAt: string | null
  feeBps: number
  feeAccount: string
  createdAt: string
  updatedAt: string
  bump: number
} 