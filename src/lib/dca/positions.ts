import { Connection, PublicKey } from '@solana/web3.js'
import { DCA, Network } from '@jup-ag/dca-sdk'
import { TOKENS } from '../limitOrders/tokenConfig'
import BN from 'bn.js'

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

interface DCAAccountData {
  user: PublicKey
  inputMint: PublicKey
  outputMint: PublicKey
  idx: BN
  nextCycleAt: BN
  inDeposited: BN
  inWithdrawn: BN
  outWithdrawn: BN
  inAmountPerCycle: BN
  inUsed: BN
  cycleFrequency: BN
}

interface ProgramAccount<T> {
  publicKey: PublicKey
  account: T
}

// Helper function to safely convert BN to number with decimals
function bnToNumber(bn: BN, decimals: number): number {
  const str = bn.toString()
  const paddedStr = str.padStart(decimals + 1, '0')
  const integerPart = paddedStr.slice(0, -decimals) || '0'
  const decimalPart = paddedStr.slice(-decimals)
  return parseFloat(`${integerPart}.${decimalPart}`)
}

export async function getDcaPositions(connection: Connection): Promise<DCAPosition[]> {
  // Initialize Jupiter DCA SDK
  const dca = new DCA(connection, Network.MAINNET)

  // Get all DCA accounts
  const allAccounts = await dca.getAll()
  console.log(`Found ${allAccounts.length} total DCA accounts`)

  // Create PublicKey objects for our tokens and get their decimals
  const USDC_MINT = new PublicKey(TOKENS.USDC.address)
  const CHAOS_MINT = new PublicKey(TOKENS.CHAOS.address)
  const LOGOS_MINT = new PublicKey(TOKENS.LOGOS.address)

  // First filter for only CHAOS and LOGOS related accounts
  const relevantAccounts = allAccounts.filter(account => {
    const inputMint = account.account.inputMint.toString()
    const outputMint = account.account.outputMint.toString()
    return (
      inputMint === CHAOS_MINT.toString() ||
      outputMint === CHAOS_MINT.toString() ||
      inputMint === LOGOS_MINT.toString() ||
      outputMint === LOGOS_MINT.toString()
    )
  })

  console.log(`Found ${relevantAccounts.length} CHAOS/LOGOS related DCA accounts`)

  // Process each account into our DCAPosition format
  const positions: DCAPosition[] = relevantAccounts.map((account: ProgramAccount<DCAAccountData>) => {
    const isBuy = account.account.inputMint.equals(USDC_MINT)
    const token = isBuy 
      ? (account.account.outputMint.equals(CHAOS_MINT) ? 'CHAOS' : 'LOGOS')
      : (account.account.inputMint.equals(CHAOS_MINT) ? 'CHAOS' : 'LOGOS')

    // Get correct decimals from token config
    const inputDecimals = isBuy ? TOKENS.USDC.decimals : TOKENS[token].decimals
    const outputDecimals = isBuy ? TOKENS[token].decimals : TOKENS.USDC.decimals

    // For amounts in the input token
    const totalAmount = bnToNumber(account.account.inDeposited, inputDecimals)
    const amountPerCycle = bnToNumber(account.account.inAmountPerCycle, inputDecimals)

    // Calculate cycles using string operations to avoid overflow
    const totalCycles = Math.ceil(
      Number(account.account.inDeposited.toString()) / 
      Number(account.account.inAmountPerCycle.toString())
    )
    const completedCycles = Math.floor(
      Number(account.account.inUsed.toString()) / 
      Number(account.account.inAmountPerCycle.toString())
    )
    const remainingCycles = totalCycles - completedCycles

    const remainingAmount = bnToNumber(
      account.account.inDeposited.sub(account.account.inWithdrawn),
      inputDecimals
    )

    return {
      id: account.publicKey.toString(),
      owner: account.account.user.toString(),
      token,
      type: isBuy ? 'BUY' : 'SELL',
      totalAmount,
      amountPerCycle,
      totalCycles,
      remainingCycles,
      cycleFrequency: account.account.cycleFrequency.toNumber(),
      remainingAmount,
      remainingInCycle: amountPerCycle,
      isActive: true, // We'll assume active if we can fetch it
      lastUpdate: account.account.nextCycleAt.toNumber() * 1000 // Convert to milliseconds
    }
  })

  // Double check we only have CHAOS and LOGOS positions
  const validPositions = positions.filter(pos => pos.token === 'CHAOS' || pos.token === 'LOGOS')
  console.log(`Found ${validPositions.length} valid CHAOS/LOGOS DCA positions`)

  return validPositions
} 