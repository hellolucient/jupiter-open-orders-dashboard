import { Connection, PublicKey } from '@solana/web3.js'
import { DCA, Network } from '@jup-ag/dca-sdk'
import { TOKENS } from '../limitOrders/tokenConfig'
import BN from 'bn.js'
import type { Position } from './types/index'

// Extend the SDK's account type to include updatedAt
interface ExtendedDCAAccount {
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
    updatedAt: BN
    nextCycleAmountLeft: BN
  }
}

// Helper function to safely convert BN to number with decimals
function bnToNumber(bn: BN, decimals: number): number {
  const str = bn.toString()
  const paddedStr = str.padStart(decimals + 1, '0')
  const integerPart = paddedStr.slice(0, -decimals) || '0'
  const decimalPart = paddedStr.slice(-decimals)
  return parseFloat(`${integerPart}.${decimalPart}`)
}

export async function getDcaPositions(connection: Connection): Promise<Position[]> {
  // Initialize Jupiter DCA SDK
  const dca = new DCA(connection, Network.MAINNET)

  // Get all DCA accounts
  const allAccounts = await dca.getAll() as unknown as ExtendedDCAAccount[]
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

  // Process each account into our Position format
  const positions: Position[] = relevantAccounts.map((account: ExtendedDCAAccount) => {
    const isBuy = account.account.inputMint.equals(USDC_MINT)
    const token = isBuy 
      ? (account.account.outputMint.equals(CHAOS_MINT) ? 'CHAOS' : 'LOGOS')
      : (account.account.inputMint.equals(CHAOS_MINT) ? 'CHAOS' : 'LOGOS')

    // Get correct decimals from token config
    const inputDecimals = isBuy ? TOKENS.USDC.decimals : TOKENS[token].decimals

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
      token,
      type: isBuy ? 'BUY' : 'SELL',
      inputToken: isBuy ? 'USDC' : token,
      outputToken: isBuy ? token : 'USDC',
      inputAmount: amountPerCycle,
      totalAmount,
      amountPerCycle,
      remainingCycles,
      cycleFrequency: account.account.cycleFrequency.toNumber(),
      lastUpdate: (account.account.updatedAt || account.account.createdAt).toNumber() * 1000,
      publicKey: account.publicKey.toString(),
      targetPrice: 0,
      currentPrice: 0,
      priceToken: isBuy ? `USDC/${token}` : `${token}/USDC`,
      estimatedOutput: 0,
      totalCycles,
      completedCycles,
      isActive: true,
      remainingAmount,
      remainingInCycle: amountPerCycle,
      estimatedTokens: 0
    }
  })

  // Double check we only have CHAOS and LOGOS positions
  const validPositions = positions.filter(pos => pos.token === 'CHAOS' || pos.token === 'LOGOS')
  console.log(`Found ${validPositions.length} valid CHAOS/LOGOS DCA positions`)

  return validPositions
} 