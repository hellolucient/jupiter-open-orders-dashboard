import { PublicKey } from '@solana/web3.js'
import { TOKENS, TIER1_TOKENS, TIER2_TOKENS, TIER3_TOKENS } from '../shared/tokenConfig'

export { TOKENS, TIER1_TOKENS, TIER2_TOKENS, TIER3_TOKENS }

export const JUPITER_LIMIT_PROGRAM_ID = new PublicKey('j1o2qRpjcyUwEvwtcfhEQefh773ZgjxcVRry7LDqg5X')

export const TOKEN_DECIMALS_CACHE = new Map<string, number>() 