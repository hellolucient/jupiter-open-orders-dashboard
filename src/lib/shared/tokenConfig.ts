export const TOKENS = {
  CHAOS: {
    address: '8SgNwESovnbG1oNEaPVhg6CR9mTMSK7jPvcYRe3wpump',
    decimals: 6,
    name: 'CHAOS',
    symbol: 'CHAOS'
  },
  LOGOS: {
    address: 'HJUfqXoYjC653f2p33i84zdCC3jc4EuVnbruSe5kpump',
    decimals: 6,
    name: 'LOGOS',
    symbol: 'LOGOS'
  },
  USDC: {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC'
  },
  USDT: {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    name: 'USDT',
    symbol: 'USDT'
  },
  SOL: {
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    name: 'SOL',
    symbol: 'SOL'
  },
  BONK: {
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    name: 'BONK',
    symbol: 'BONK'
  },
  RAY: {
    address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    decimals: 6,
    name: 'RAY',
    symbol: 'RAY'
  },
  MSOL: {
    address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    decimals: 9,
    name: 'MSOL',
    symbol: 'MSOL'
  },
  JITOSOL: {
    address: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
    decimals: 9,
    name: 'JitoSOL',
    symbol: 'JITOSOL'
  }
} as const

export type TokenSymbol = keyof typeof TOKENS
export type TokenInfo = typeof TOKENS[TokenSymbol]

export interface TokenDecimalInfo {
  decimals: number
  isKnown: boolean
}

// Get token info by mint address
export function getTokenByMint(mintAddress: string): TokenInfo | undefined {
  return Object.values(TOKENS).find(t => t.address === mintAddress)
}

// Get token decimals with fallback
export function getTokenDecimals(mintAddress: string): TokenDecimalInfo {
  const token = getTokenByMint(mintAddress)
  return {
    decimals: token?.decimals ?? 6,
    isKnown: !!token
  }
}

// Convert raw amount to decimal amount
export function toDecimalAmount(rawAmount: number | string, decimals: number): number {
  return Number(rawAmount) / Math.pow(10, decimals)
}

// Convert decimal amount to raw amount
export function toRawAmount(decimalAmount: number, decimals: number): number {
  return Math.floor(decimalAmount * Math.pow(10, decimals))
} 