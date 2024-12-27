import { DCA, Network } from '@jup-ag/dca-sdk'
import { Connection, PublicKey } from '@solana/web3.js'
import type { TokenSummary, Position, ChartDataPoint, DCAAccountType } from './types/index'
import { TOKENS, getTokenByMint, toDecimalAmount } from '../shared/tokenConfig'

const LOGOS_MINT = TOKENS.LOGOS.address
const CHAOS_MINT = TOKENS.CHAOS.address

export class JupiterDCAAPI {
  private dca: DCA | null = null
  private connection: Connection
  private jupiterApiUrl = 'https://api.jup.ag/price/v2'

  constructor() {
    this.connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!)
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
      await new Promise(resolve => setTimeout(resolve, 1000))
      this.connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!)
      this.initDCA()
    }
  }

  private async withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: unknown = new Error('Operation failed')
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation()
      } catch (error) {
        console.log(`Attempt ${i + 1} failed:`, error)
        lastError = error
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        // Try to reinitialize DCA if it failed
        if (i === maxRetries - 1) {
          await this.initDCA()
        }
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

  private async convertDCAAccount(account: DCAAccountType, price: number, token: string, type: "BUY" | "SELL"): Promise<Position> {
    // Debug logging for raw mint values
    console.log('Raw DCA Account Mints:', {
      inputMint: {
        raw: account.account.inputMint,
        toString: account.account.inputMint.toString(),
        isPublicKey: account.account.inputMint instanceof PublicKey
      },
      outputMint: {
        raw: account.account.outputMint,
        toString: account.account.outputMint.toString(),
        isPublicKey: account.account.outputMint instanceof PublicKey
      }
    });

    // Get input and output token info
    const inputToken = getTokenByMint(account.account.inputMint.toString())
    const outputToken = getTokenByMint(account.account.outputMint.toString())

    // Debug logging for token lookup results
    console.log('Token Lookup Results:', {
      inputMintStr: account.account.inputMint.toString(),
      outputMintStr: account.account.outputMint.toString(),
      inputToken,
      outputToken
    });

    if (!inputToken || !outputToken) {
      console.error('Unknown token:', {
        inputMint: account.account.inputMint.toString(),
        outputMint: account.account.outputMint.toString()
      })
    }

    // Get price in terms of input token
    const priceInInputToken = await this.getPriceInToken(outputToken?.address || "", inputToken?.address || "")

    // Use actual token decimals
    const inputDecimals = inputToken?.decimals ?? 6
    const outputDecimals = outputToken?.decimals ?? 6

    // Debug logging for decimal conversion
    const rawInAmount = account.account.inAmountPerCycle.toNumber()
    const rawTotalAmount = account.account.inDeposited.toNumber()
    const rawInUsed = account.account.inUsed.toNumber()
    const minOutAmount = account.account.minOutAmount?.toNumber() || 0
    const maxOutAmount = account.account.maxOutAmount?.toNumber() || 0

    // Calculate actual remaining amount (total - used)
    const rawRemainingAmount = rawTotalAmount - rawInUsed

    // Detect if this is a flash fill order (executed immediately) or a regular DCA order
    const isFlashFill = rawInUsed === rawTotalAmount && rawTotalAmount > 0
    const isDcaOrder = !isFlashFill && rawTotalAmount > 0

    // Special debug for CHAOS orders
    if (token === 'CHAOS') {
      const convertedAmount = toDecimalAmount(rawTotalAmount, type === 'BUY' ? inputDecimals : outputDecimals)
      console.log(`CHAOS ${type} Order [${convertedAmount.toFixed(6)} ${inputToken?.symbol}] [${account.publicKey.toString()}]:`, {
        orderType: isFlashFill ? 'Flash Fill' : 'DCA',
        rawBuffer: {
          inAmountPerCycle: account.account.inAmountPerCycle.toString(),
          inDeposited: account.account.inDeposited.toString(),
          inWithdrawn: account.account.inWithdrawn.toString(),
          inUsed: account.account.inUsed.toString(),
          nextCycleAt: account.account.nextCycleAt.toString(),
          minOutAmount: account.account.minOutAmount?.toString() || '0',
          maxOutAmount: account.account.maxOutAmount?.toString() || '0'
        },
        rawValues: {
          inAmountPerCycle: rawInAmount.toString(),
          inDeposited: rawTotalAmount.toString(),
          inWithdrawn: account.account.inWithdrawn.toNumber().toString(),
          inUsed: rawInUsed.toString(),
          remainingAmount: rawRemainingAmount.toString(),
          minOutAmount: minOutAmount.toString(),
          maxOutAmount: maxOutAmount.toString()
        },
        convertedValues: {
          inAmountPerCycle: toDecimalAmount(rawInAmount, inputDecimals),
          inDeposited: toDecimalAmount(rawTotalAmount, inputDecimals),
          inWithdrawn: toDecimalAmount(account.account.inWithdrawn.toNumber(), inputDecimals),
          inUsed: toDecimalAmount(rawInUsed, inputDecimals),
          remainingAmount: toDecimalAmount(rawRemainingAmount, inputDecimals),
          minOutAmount: toDecimalAmount(minOutAmount, outputDecimals),
          maxOutAmount: toDecimalAmount(maxOutAmount, outputDecimals)
        },
        cycleCalculations: {
          rawTotalAmount,
          rawInAmount,
          rawInUsed,
          calculatedTotalCycles: Math.floor(rawTotalAmount / rawInAmount),
          calculatedCompletedCycles: Math.floor(rawInUsed / rawInAmount),
          calculatedRemainingCycles: Math.floor(rawTotalAmount / rawInAmount) - Math.floor(rawInUsed / rawInAmount)
        },
        status: {
          isFlashFill,
          isDcaOrder,
          isCompleted: rawInUsed === rawTotalAmount,
          cycleFrequency: isDcaOrder ? account.account.cycleFrequency.toNumber() : 0,
          hasWithdrawnFunds: account.account.inWithdrawn.toNumber() > 0
        },
        decimalsUsed: {
          input: inputDecimals,
          output: outputDecimals,
          inputToken: inputToken?.symbol,
          outputToken: outputToken?.symbol
        }
      })
    }

    // Only calculate cycles for actual DCA orders
    const totalCycles = isDcaOrder ? Math.floor(rawTotalAmount / rawInAmount) : 1
    const completedCycles = isDcaOrder ? Math.floor(rawInUsed / rawInAmount) : (isFlashFill ? 1 : 0)
    const remainingCycles = isDcaOrder ? totalCycles - completedCycles : 0

    // Use actual input token symbol instead of assuming USDC
    const inputTokenSymbol = inputToken?.symbol ?? (type === "BUY" ? "USDC" : token)
    const outputTokenSymbol = outputToken?.symbol ?? (type === "BUY" ? token : "USDC")
    const priceToken = `${type === "BUY" ? inputTokenSymbol : outputTokenSymbol}/${type === "BUY" ? outputTokenSymbol : inputTokenSymbol}`

    // Calculate execution price from minOutAmount for buy orders
    let executionPrice: number | undefined
    let estimatedTokens = 0

    if (type === "BUY") {
      // For buy orders, calculate min and max execution prices if limits are set
      let minExecutionPrice: number | undefined
      let maxExecutionPrice: number | undefined
      let minEstimatedTokens = 0
      let maxEstimatedTokens = 0

      // Convert amounts to decimal for price calculation
      const inAmountDecimal = toDecimalAmount(rawInAmount, inputDecimals)
      
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

        console.log(`DCA ${type} Order execution price calculation:`, {
          rawInAmount,
          inAmountDecimal,
          minOutAmount,
          maxOutAmount,
          minExecutionPrice,
          maxExecutionPrice,
          minEstimatedTokens,
          maxEstimatedTokens,
          remainingAmount: toDecimalAmount(rawRemainingAmount, inputDecimals)
        })
      } else {
        // If no limits set, use market price
        minExecutionPrice = priceInInputToken
        maxExecutionPrice = priceInInputToken
        minEstimatedTokens = toDecimalAmount(rawRemainingAmount, inputDecimals) / priceInInputToken
        maxEstimatedTokens = minEstimatedTokens
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
        lastUpdate: account.account.nextCycleAt.toNumber() * 1000,
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
    } else {
      // For sell orders, use minOutAmount if available
      if (minOutAmount > 0) {
        // For sell orders, execution price is minOutAmount / inAmountPerCycle
        // Use raw values to calculate price, no need to convert to decimal first
        executionPrice = minOutAmount / rawInAmount
        estimatedTokens = toDecimalAmount(rawRemainingAmount, inputDecimals) * executionPrice
        
        console.log(`DCA SELL Order execution price calculation:`, {
          minOutAmount,
          rawInAmount,
          executionPrice,
          remainingAmount: toDecimalAmount(rawRemainingAmount, inputDecimals),
          estimatedTokens
        })
      } else {
        executionPrice = priceInInputToken
        estimatedTokens = toDecimalAmount(rawRemainingAmount, inputDecimals) * priceInInputToken
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
        lastUpdate: account.account.nextCycleAt.toNumber() * 1000,
        publicKey: account.publicKey.toString(),
        targetPrice: 0,
        currentPrice: price,
        priceToken,
        estimatedOutput: estimatedTokens,
        totalCycles,
        completedCycles,
        isActive: isDcaOrder && !isFlashFill && remainingCycles > 0,
        remainingAmount: toDecimalAmount(rawRemainingAmount, inputDecimals),
        minExecutionPrice: executionPrice,  // For sell orders, min is the only price
        remainingInCycle: toDecimalAmount(rawInAmount, inputDecimals),
        estimatedTokens
      }
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
      if (!this.dca) {
        await this.initDCA()
        if (!this.dca) {
          throw new Error('DCA SDK not initialized')
        }
      }

      const accounts = await this.dca.getAll()
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

      // Get current prices
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