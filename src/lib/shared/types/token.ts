// Basic token interface used across features
export interface TokenInfo {
  address: string
  symbol: string
  decimals: number
  name: string
  isDecimalKnown?: boolean
}

// Token summary interface shared between DCA and LO
export interface TokenSummaryBase {
  buyOrders: number
  sellOrders: number
  buyVolume: number
  sellVolume: number
  buyVolumeUSDC: number
  sellVolumeUSDC: number
  price: number
} 