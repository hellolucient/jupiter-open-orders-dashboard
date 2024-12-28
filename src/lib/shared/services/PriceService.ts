interface CoinGeckoResponse {
  solana: {
    usd: number
  }
  'bonk-inu': {
    usd: number
  }
}

export class PriceService {
  private static instance: PriceService
  private priceCache: Map<string, { price: number; timestamp: number }>
  private readonly CACHE_DURATION = 60000 // 1 minute in milliseconds
  private lastRequestTime: number = 0
  private readonly MIN_REQUEST_INTERVAL = 2000 // 2 seconds between requests

  private constructor() {
    this.priceCache = new Map()
  }

  public static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService()
    }
    return PriceService.instance
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async throttledRequest<T>(): Promise<T> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await this.delay(this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    }

    try {
      const response = await fetch('/api/prices')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      this.lastRequestTime = Date.now()
      return response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  private async fetchTokenPrices(): Promise<void> {
    try {
      const data = await this.throttledRequest<CoinGeckoResponse>()

      if (data?.solana?.usd) {
        this.setCachedPrice('SOL', data.solana.usd)
      }
      if (data?.['bonk-inu']?.usd) {
        this.setCachedPrice('BONK', data['bonk-inu'].usd)
      }
    } catch (error) {
      console.error('Error fetching token prices:', error)
    }
  }

  private async fetchSolPrice(): Promise<number> {
    const cachedPrice = this.getCachedPrice('SOL')
    if (cachedPrice !== null) {
      return cachedPrice
    }

    await this.fetchTokenPrices()
    return this.getCachedPrice('SOL') || 0
  }

  private async fetchBonkPrice(): Promise<number> {
    const cachedPrice = this.getCachedPrice('BONK')
    if (cachedPrice !== null) {
      return cachedPrice
    }

    await this.fetchTokenPrices()
    return this.getCachedPrice('BONK') || 0
  }

  private async fetchUsdtPrice(): Promise<number> {
    return 1 // USDT is pegged to USD
  }

  private getCachedPrice(symbol: string): number | null {
    const cached = this.priceCache.get(symbol)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.priceCache.delete(symbol)
      return null
    }

    return cached.price
  }

  private setCachedPrice(symbol: string, price: number): void {
    this.priceCache.set(symbol, {
      price,
      timestamp: Date.now()
    })
  }

  public async getUsdcPrice(symbol: string): Promise<number> {
    const cachedPrice = this.getCachedPrice(symbol)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    let price: number
    switch (symbol.toUpperCase()) {
      case 'SOL':
        price = await this.fetchSolPrice()
        break
      case 'BONK':
        price = await this.fetchBonkPrice()
        break
      case 'USDT':
        price = await this.fetchUsdtPrice()
        break
      case 'USDC':
        price = 1 // USDC is the base currency
        break
      case 'CHAOS':
      case 'LOGOS':
        // For CHAOS and LOGOS, we'll calculate their prices based on the order data
        price = 0
        break
      default:
        console.warn(`Price not available for token: ${symbol}`)
        return 0
    }

    this.setCachedPrice(symbol, price)
    return price
  }

  public async convertToUsdc(amount: number, symbol: string): Promise<number> {
    const price = await this.getUsdcPrice(symbol)
    return amount * price
  }

  public async convertExecutionPrice(
    price: number,
    inputSymbol: string,
    outputSymbol: string
  ): Promise<number | undefined> {
    try {
      // Special handling for CHAOS and LOGOS pairs
      if (outputSymbol === 'CHAOS' || outputSymbol === 'LOGOS') {
        if (inputSymbol === 'BONK') {
          // For BONK/TOKEN pairs, convert BONK to USDC first
          const bonkPrice = await this.getUsdcPrice('BONK')
          return price * bonkPrice
        } else if (inputSymbol === 'SOL') {
          // For SOL/TOKEN pairs, convert SOL to USDC first
          const solPrice = await this.getUsdcPrice('SOL')
          return price * solPrice
        } else if (inputSymbol === 'USDC') {
          // For USDC/TOKEN pairs, price is already in USDC
          return price
        }
      }

      // Handle reverse pairs (TOKEN/SOL, TOKEN/BONK, TOKEN/USDC)
      if (inputSymbol === 'CHAOS' || inputSymbol === 'LOGOS') {
        if (outputSymbol === 'SOL') {
          const solPrice = await this.getUsdcPrice('SOL')
          return price * solPrice
        } else if (outputSymbol === 'BONK') {
          const bonkPrice = await this.getUsdcPrice('BONK')
          return price * bonkPrice
        } else if (outputSymbol === 'USDC') {
          return price
        }
      }

      // For other pairs, use the standard conversion
      const inputPrice = await this.getUsdcPrice(inputSymbol)
      const outputPrice = await this.getUsdcPrice(outputSymbol)

      if (inputPrice === 0 || outputPrice === 0) {
        return undefined
      }

      return (price * inputPrice) / outputPrice
    } catch (error) {
      console.error('Error converting execution price:', error)
      return undefined
    }
  }

  public clearCache(): void {
    this.priceCache.clear()
  }
} 