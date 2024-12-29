import { DCA, Network } from '@jup-ag/dca-sdk'
import { Connection, PublicKey } from '@solana/web3.js'
import type { TokenSummary, Position, ChartDataPoint } from './types/index'
import { TOKENS, getTokenByMint, toDecimalAmount } from '../shared/tokenConfig'
import BN from 'bn.js'

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

const LOGOS_MINT = TOKENS.LOGOS.address
const CHAOS_MINT = TOKENS.CHAOS.address

export class JupiterDCAAPI {
  private dca: DCA | null = null
  private connection: Connection
  private jupiterApiUrl = 'https://api.jup.ag/price/v2'
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY = 1000 // 1 second

  constructor() {
    this.connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!, {
      commitment: 'confirmed',
      wsEndpoint: undefined // Disable WebSocket to prevent connection issues
    })
    this.initDCA()
  }

  private async initDCA() {
    try {
      if (!this.dca) {
        this.dca = new DCA(this.connection, Network.MAINNET)
      }
    } catch (error) {
      console.error('Failed to initialize DCA:', error)
      // Try to reconnect
      await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY))
      this.connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!, {
        commitment: 'confirmed',
        wsEndpoint: undefined
      })
      this.initDCA()
    }
  }

  private async withRetry<T>(operation: () => Promise<T>, maxRetries = this.MAX_RETRIES): Promise<T> {
    let lastError: unknown = new Error('Operation failed')
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation()
      } catch (error) {
        console.log(`Attempt ${i + 1} failed:`, error)
        lastError = error
        
        // Check if it's a connection error
        if (error instanceof Error && error.message.includes('Failed to fetch')) {
          console.log('Connection error detected, reinitializing connection...')
          this.connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!, {
            commitment: 'confirmed',
            wsEndpoint: undefined
          })
          await this.initDCA()
        }
        
        // Wait longer between each retry
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (i + 1)))
      }
    }
    throw lastError
  }

  private async getCurrentPrice(mint: string): Promise<{ price: number; mint: string }> {
    const maxRetries = 3;
    let lastError: unknown;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`${this.jupiterApiUrl}?ids=${mint}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const price = data.data?.[mint]?.price || 0;
        return {
          price: Number(price),
          mint
        };
      } catch (error) {
        console.error(`Attempt ${i + 1} failed to fetch price for ${mint}:`, error);
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }

    console.error('All retries failed for price fetch:', lastError);
    return { price: 0, mint };
  }

  private async getPriceInToken(mint: string, inputToken: string): Promise<number> {
    try {
      // If input is USDC, just get the USDC price directly
      if (inputToken === "USDC") {
        const { price } = await this.getCurrentPrice(mint)
        return price
      }

      // Otherwise, get both token prices in USDC and calculate the ratio
      const [tokenPrice, inputTokenPrice] = await Promise.all([
        this.getCurrentPrice(mint),
        this.getCurrentPrice(inputToken)
      ])

      // Calculate price in input token (e.g., SOL)
      return tokenPrice.price / inputTokenPrice.price
    } catch (error) {
      console.error('Error calculating price:', error)
      return 0
    }
  }

  private async convertDCAAccount(account: ExtendedDCAAccount, price: number, token: string, type: "BUY" | "SELL"): Promise<Position> {
    console.log('Raw timestamps for account', account.publicKey.toString(), {
      updatedAt: account.account.updatedAt?.toString(),
      createdAt: account.account.createdAt?.toString(),
      nextCycleAt: account.account.nextCycleAt?.toString()
    })
    // Get input and output token info
    const inputToken = getTokenByMint(account.account.inputMint.toString())
    const outputToken = getTokenByMint(account.account.outputMint.toString())

    // Use actual input token symbol instead of assuming USDC
    const inputTokenSymbol = inputToken?.symbol ?? (type === "BUY" ? "USDC" : token)
    const outputTokenSymbol = outputToken?.symbol ?? (type === "BUY" ? token : "USDC")
    const priceToken = `${type === "BUY" ? inputTokenSymbol : outputTokenSymbol}/${type === "BUY" ? outputTokenSymbol : inputTokenSymbol}`

    // Use actual token decimals
    const inputDecimals = inputToken?.decimals ?? 6
    const outputDecimals = outputToken?.decimals ?? 6

    // Convert amounts to decimal
    const rawInAmount = account.account.inAmountPerCycle.toNumber()
    const rawTotalAmount = account.account.inDeposited.toNumber()
    const rawInUsed = account.account.inUsed.toNumber()
    const minOutAmount = account.account.minOutAmount?.toNumber() || 0
    const maxOutAmount = account.account.maxOutAmount?.toNumber() || 0
    const rawRemainingAmount = rawTotalAmount - rawInUsed

    // Detect if this is a flash fill order or a regular DCA order
    const isFlashFill = rawInUsed === rawTotalAmount && rawTotalAmount > 0
    const isDcaOrder = !isFlashFill && rawTotalAmount > 0

    // Calculate cycles
    const totalCycles = isDcaOrder ? Math.floor(rawTotalAmount / rawInAmount) : 1
    const completedCycles = isDcaOrder ? Math.floor(rawInUsed / rawInAmount) : (isFlashFill ? 1 : 0)
    const remainingCycles = isDcaOrder ? totalCycles - completedCycles : 0

    // Convert amounts to decimal for price calculation
    const inAmountDecimal = toDecimalAmount(rawInAmount, inputDecimals)
    let minExecutionPrice: number | undefined
    let maxExecutionPrice: number | undefined
    let minEstimatedTokens = 0
    let maxEstimatedTokens = 0

    if (type === "BUY") {
      if (minOutAmount > 0 || maxOutAmount > 0) {
        if (minOutAmount > 0) {
          // Max execution price = inAmountPerCycle / minOutAmount
          const minOutDecimal = toDecimalAmount(minOutAmount, outputDecimals)
          maxExecutionPrice = inAmountDecimal / minOutDecimal
          minEstimatedTokens = toDecimalAmount(rawRemainingAmount, inputDecimals) / maxExecutionPrice
        }
        
        if (maxOutAmount > 0) {
          // Min execution price = inAmountPerCycle / maxOutAmount
          const maxOutDecimal = toDecimalAmount(maxOutAmount, outputDecimals)
          minExecutionPrice = inAmountDecimal / maxOutDecimal
          maxEstimatedTokens = toDecimalAmount(rawRemainingAmount, inputDecimals) / minExecutionPrice
        }
      } else {
        // If no limits set, use market price
        minExecutionPrice = price
        maxExecutionPrice = price
        minEstimatedTokens = toDecimalAmount(rawRemainingAmount, inputDecimals) / price
        maxEstimatedTokens = minEstimatedTokens
      }
    } else {
      // For sell orders, use minOutAmount if available
      if (minOutAmount > 0) {
        // For sell orders, execution price is minOutAmount / inAmountPerCycle
        const minOutDecimal = toDecimalAmount(minOutAmount, outputDecimals)
        minExecutionPrice = minOutDecimal / inAmountDecimal
        minEstimatedTokens = toDecimalAmount(rawRemainingAmount, inputDecimals) * minExecutionPrice
      } else {
        minExecutionPrice = price
        minEstimatedTokens = toDecimalAmount(rawRemainingAmount, inputDecimals) * price
      }
    }

    return {
      id: account.publicKey.toString(),
      type,
      token,
      inputToken: inputTokenSymbol,
      outputToken: outputTokenSymbol,
      inputAmount: toDecimalAmount(rawInAmount, inputDecimals),
      totalAmount: toDecimalAmount(rawTotalAmount, inputDecimals),
      amountPerCycle: toDecimalAmount(rawInAmount, inputDecimals),
      remainingCycles,
      cycleFrequency: isDcaOrder ? account.account.cycleFrequency.toNumber() : 0,
      lastUpdate: ((account.account.updatedAt || account.account.createdAt).toNumber()) * 1000,
      publicKey: account.publicKey.toString(),
      targetPrice: 0,
      currentPrice: price,
      priceToken,
      estimatedOutput: minEstimatedTokens,  // Use min for backward compatibility
      minEstimatedOutput: minEstimatedTokens,
      maxEstimatedOutput: maxEstimatedTokens,
      totalCycles,
      completedCycles,
      isActive: isDcaOrder && !isFlashFill && remainingCycles > 0,
      remainingAmount: toDecimalAmount(rawRemainingAmount, inputDecimals),
      minExecutionPrice,
      maxExecutionPrice,
      remainingInCycle: toDecimalAmount(rawInAmount, inputDecimals),
      estimatedTokens: minEstimatedTokens
    }
  }

  private async getDCASummary(positions: Position[]): Promise<Record<string, TokenSummary>> {
    const summary: Record<string, TokenSummary> = {}

    // Initialize summaries
    summary.CHAOS = {
      buyOrders: 0,
      sellOrders: 0,
      buyVolume: 0,
      sellVolume: 0,
      buyVolumeUSDC: 0,
      sellVolumeUSDC: 0,
      price: 0
    }
    summary.LOGOS = {
      buyOrders: 0,
      sellOrders: 0,
      buyVolume: 0,
      sellVolume: 0,
      buyVolumeUSDC: 0,
      sellVolumeUSDC: 0,
      price: 0
    }

    // Get current prices
    const [chaosPrice, logosPrice] = await Promise.all([
      this.getCurrentPrice(CHAOS_MINT),
      this.getCurrentPrice(LOGOS_MINT)
    ])

    summary.CHAOS.price = chaosPrice.price
    summary.LOGOS.price = logosPrice.price

    positions.forEach(position => {
      const token = position.outputToken === 'USDC' ? position.inputToken : position.outputToken
      if (token !== 'CHAOS' && token !== 'LOGOS') return

      if (position.type === 'BUY') {
        summary[token].buyOrders++
        // For buy orders, use estimatedTokens (amount of token we're getting)
        summary[token].buyVolume += Math.round(position.estimatedTokens || 0)
        summary[token].buyVolumeUSDC += Math.round((position.estimatedTokens || 0) * summary[token].price)
      } else {
        summary[token].sellOrders++
        // For sell orders, use remaining amount
        summary[token].sellVolume += Math.round(position.remainingAmount)
        summary[token].sellVolumeUSDC += Math.round(position.remainingAmount * summary[token].price)
      }
    })

    return summary
  }

  async getDCAAccounts() {
    return this.withRetry(async () => {
      try {
        if (!this.dca) {
          await this.initDCA()
          if (!this.dca) {
            throw new Error('DCA SDK not initialized')
          }
        }

        // Try to get accounts with retries
        const accounts = await this.withRetry(async () => {
          const result = await this.dca!.getAll()
          if (!result) throw new Error('Failed to fetch DCA accounts')
          return result as unknown as ExtendedDCAAccount[]
        })

        console.log('Raw DCA accounts:', accounts)

        // Filter out flash fill orders
        const activeDcaAccounts = accounts.filter(acc => {
          const isFlashFill = acc.account.inUsed.eq(acc.account.inDeposited) && !acc.account.inDeposited.isZero()
          return !isFlashFill
        })

        console.log('Active DCA accounts:', activeDcaAccounts)

        // Process accounts by token
        const accountsByToken = {
          LOGOS: {
            buys: activeDcaAccounts.filter(acc => acc.account.outputMint.equals(new PublicKey(LOGOS_MINT))),
            sells: activeDcaAccounts.filter(acc => acc.account.inputMint.equals(new PublicKey(LOGOS_MINT)))
          },
          CHAOS: {
            buys: activeDcaAccounts.filter(acc => acc.account.outputMint.equals(new PublicKey(CHAOS_MINT))),
            sells: activeDcaAccounts.filter(acc => acc.account.inputMint.equals(new PublicKey(CHAOS_MINT)))
          }
        }

        // Get current prices with retries
        const [logosPrice, chaosPrice] = await Promise.all([
          this.getCurrentPrice(LOGOS_MINT),
          this.getCurrentPrice(CHAOS_MINT)
        ])

        // Convert accounts to positions
        const positions = await Promise.all([
          ...accountsByToken.LOGOS.buys.map(acc => this.convertDCAAccount(acc, logosPrice.price, "LOGOS", "BUY")),
          ...accountsByToken.LOGOS.sells.map(acc => this.convertDCAAccount(acc, logosPrice.price, "LOGOS", "SELL")),
          ...accountsByToken.CHAOS.buys.map(acc => this.convertDCAAccount(acc, chaosPrice.price, "CHAOS", "BUY")),
          ...accountsByToken.CHAOS.sells.map(acc => this.convertDCAAccount(acc, chaosPrice.price, "CHAOS", "SELL"))
        ])

        const summary = await this.getDCASummary(positions)
        const chartData = this.generateChartData(summary)

        return {
          positions,
          summary,
          chartData
        }
      } catch (error) {
        console.error('Error in getDCAAccounts:', error)
        throw error
      }
    })
  }

  private generateChartData(summary: Record<string, TokenSummary>): Record<string, ChartDataPoint[]> {
    const chartData: Record<string, ChartDataPoint[]> = {}
    
    Object.entries(summary).forEach(([token, data]) => {
      chartData[token] = [{
        timestamp: Date.now(),
        buyVolume: data.buyVolume,
        sellVolume: data.sellVolume,
        buyOrders: data.buyOrders,
        sellOrders: data.sellOrders
      }]
    })

    return chartData
  }
}

export const jupiterDCA = new JupiterDCAAPI() 