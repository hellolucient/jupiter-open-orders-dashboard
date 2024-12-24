import { PublicKey } from '@solana/web3.js'

interface TokenConfig {
  name: string
  address: string
  decimals: number
}

interface TokenConfigs {
  LOGOS: TokenConfig
  CHAOS: TokenConfig
  USDC: TokenConfig
  SOL: TokenConfig
  BONK: TokenConfig
  ORCA: TokenConfig
  RAY: TokenConfig
  MNGO: TokenConfig
  DUAL: TokenConfig
  SHDW: TokenConfig
  USDT: TokenConfig
}

// Our target tokens
export const TOKENS: TokenConfigs = {
  LOGOS: {
    name: 'LOGOS',
    address: 'HJUfqXoYjC653f2p33i84zdCC3jc4EuVnbruSe5kpump',
    decimals: 6
  },
  CHAOS: {
    name: 'CHAOS',
    address: '8SgNwESovnbG1oNEaPVhg6CR9mTMSK7jPvcYRe3wpump',
    decimals: 6
  },
  // Common input tokens for buys
  USDC: {
    name: 'USDC',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6
  },
  SOL: {
    name: 'SOL',
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9
  },
  BONK: {
    name: 'BONK',
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5
  },
  ORCA: {
    name: 'ORCA',
    address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    decimals: 6
  },
  RAY: {
    name: 'RAY',
    address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    decimals: 6
  },
  MNGO: {
    name: 'MNGO',
    address: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
    decimals: 6
  },
  DUAL: {
    name: 'DUAL',
    address: 'DUALa4FC2yREwZ59PHeu1un4wis36vHRv5hWVHHHbLZp',
    decimals: 6
  },
  SHDW: {
    name: 'SHDW',
    address: 'SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y',
    decimals: 9
  },
  USDT: {
    name: 'USDT',
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6
  }
} as const

// Tiered token lists for buy-side searches
export const TIER1_TOKENS = [
  TOKENS.USDC,
  TOKENS.SOL,
  TOKENS.BONK
] as const

export const TIER2_TOKENS = [
  TOKENS.ORCA,
  TOKENS.RAY,
  TOKENS.MNGO
] as const

export const TIER3_TOKENS = [
  TOKENS.DUAL,
  TOKENS.SHDW
] as const

export const JUPITER_LIMIT_PROGRAM_ID = new PublicKey('j1o2qRpjcyUwEvwtcfhEQefh773ZgjxcVRry7LDqg5X')

export const TOKEN_DECIMALS_CACHE = new Map<string, number>() 