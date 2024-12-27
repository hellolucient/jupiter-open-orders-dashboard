import { Connection, PublicKey } from '@solana/web3.js';
import { TOKENS } from './tokenConfig';
import { LimitOrder, TokenInfo } from './types';

const JUPITER_LIMIT_PROGRAM_ID = new PublicKey('j1o2qRpjcyUwEvwtcfhEQefh773ZgjxcVRry7LDqg5X');

// Cache for token decimals to reduce RPC calls
const TOKEN_DECIMALS_CACHE = new Map<string, number>();

export class JupiterLimitOrdersAPI {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  private async getTokenDecimals(mint: PublicKey): Promise<number> {
    const mintStr = mint.toString();
    
    // Check cache first
    if (TOKEN_DECIMALS_CACHE.has(mintStr)) {
      return TOKEN_DECIMALS_CACHE.get(mintStr)!;
    }

    // Check our known tokens
    const knownToken = Object.values(TOKENS).find(t => t.address === mintStr);
    if (knownToken) {
      TOKEN_DECIMALS_CACHE.set(mintStr, knownToken.decimals);
      return knownToken.decimals;
    }

    // Fetch from chain as last resort
    try {
      const info = await this.connection.getParsedAccountInfo(mint);
      if (info.value?.data && 'parsed' in info.value.data) {
        const decimals = info.value.data.parsed.info.decimals;
        TOKEN_DECIMALS_CACHE.set(mintStr, decimals);
        return decimals;
      }
    } catch (error) {
      console.error(`Error getting decimals for ${mintStr}:`, error);
    }

    // Default to 6 if all else fails
    return 6;
  }

  private async getTokenInfo(mint: string): Promise<TokenInfo> {
    const knownToken = Object.values(TOKENS).find(t => t.address === mint);
    const decimals = await this.getTokenDecimals(new PublicKey(mint));
    
    return {
      address: mint,
      symbol: knownToken?.symbol || 'UNKNOWN',
      decimals,
      isDecimalKnown: !!knownToken
    };
  }

  private parseRawOrder = async (
    orderAccount: PublicKey,
    data: Buffer,
    orderType: 'BUY' | 'SELL'
  ): Promise<LimitOrder> => {
    const maker = new PublicKey(data.slice(8, 40));
    const inputMint = new PublicKey(data.slice(40, 72));
    const outputMint = new PublicKey(data.slice(72, 104));

    // Get token info for input and output tokens
    const [inputTokenInfo, outputTokenInfo] = await Promise.all([
      this.getTokenInfo(inputMint.toString()),
      this.getTokenInfo(outputMint.toString())
    ]);

    // Parse amounts without using BigInt
    const dataView = new DataView(data.buffer, data.byteOffset);
    const parseAmount = (offset: number, decimals: number): number => {
      try {
        const low = dataView.getUint32(offset, true);
        const high = dataView.getUint32(offset + 4, true);
        const amount = low + (high * 4294967296); // 2^32
        return amount / Math.pow(10, decimals);
      } catch {
        return 0;
      }
    };

    const getMakingAmount = (offset: number) => parseAmount(offset, inputTokenInfo.decimals);
    const getTakingAmount = (offset: number) => parseAmount(offset, outputTokenInfo.decimals);

    // Parse timestamps
    const getTimestamp = (offset: number): string => {
      try {
        const low = dataView.getUint32(offset, true);
        const high = dataView.getUint32(offset + 4, true);
        const timestamp = low + (high * 4294967296); // 2^32
        return new Date(timestamp * 1000).toISOString();
      } catch {
        return new Date().toISOString();
      }
    };

    // Check for expiry first
    const expiredAtDiscriminator = data[248];
    let expiredAt: string | undefined;

    // Calculate offsets based on expiredAt length
    const expiredAtLength = expiredAtDiscriminator === 1 ? 9 : 1;
    const feeBpsStart = 248 + expiredAtLength;  // feeBps is 2 bytes
    const feeAccountStart = feeBpsStart + 2;    // feeAccount is 32 bytes
    const createdAtStart = feeAccountStart + 32; // createdAt is 8 bytes
    const updatedAtStart = createdAtStart + 8;   // updatedAt is 8 bytes

    // Parse timestamps with correct offsets
    const createdAt = getTimestamp(createdAtStart);
    const updatedAt = getTimestamp(updatedAtStart);

    // Parse expiredAt if it exists
    if (expiredAtDiscriminator === 1) {
      expiredAt = getTimestamp(249);
    }

    // Determine token type based on the output mint for buy orders and input mint for sell orders
    const tokenMint = orderType === 'BUY' ? outputMint : inputMint;
    const tokenType = tokenMint.equals(new PublicKey(TOKENS.CHAOS.address)) ? 'CHAOS' : 'LOGOS';

    // For buy orders:
    // - makingAmount is what we're paying (e.g. USDC)
    // - takingAmount is what we're getting (e.g. LOGOS)
    const makingAmount = getMakingAmount(224);
    const takingAmount = getTakingAmount(232);
    const oriMakingAmount = getMakingAmount(208);
    const oriTakingAmount = getTakingAmount(216);
    const borrowMakingAmount = getMakingAmount(240);

    // Calculate price based on order type
    const price = orderType === 'BUY' 
      ? makingAmount / takingAmount  // For buy orders: input/output (e.g. USDC/LOGOS)
      : takingAmount / makingAmount; // For sell orders: output/input (e.g. USDC/LOGOS)

    console.log(`${orderType} Order for ${tokenType}:`, {
      makingAmount,
      takingAmount,
      price,
      inputToken: inputTokenInfo.symbol,
      outputToken: outputTokenInfo.symbol
    });

    const order: LimitOrder = {
      id: orderAccount.toString(),
      maker: maker,
      inputMint: inputTokenInfo,
      outputMint: outputTokenInfo,
      makingAmount,
      takingAmount,
      oriMakingAmount,
      oriTakingAmount,
      borrowMakingAmount,
      price,
      status: 'open',
      createdAt,
      updatedAt,
      expiredAt,
      tokenType,
      orderType,
      feeBps: dataView.getUint16(250, true),
      feeAccount: new PublicKey(data.slice(252, 284)).toString(),
      bump: data[299],
      inputTokenProgram: new PublicKey(data.slice(104, 136)).toString(),
      outputTokenProgram: new PublicKey(data.slice(136, 168)).toString(),
      inputMintReserve: new PublicKey(data.slice(168, 200)).toString(),
      uniqueId: parseAmount(200, 0).toString()
    };

    return order;
  };

  private async retryGetProgramAccounts(filters: any[], maxAttempts = 3, delayMs = 1000): Promise<readonly { pubkey: PublicKey; account: { data: Buffer } }[]> {
    const orderType = filters[1].memcmp.offset === 40 ? 'SELL' : 'BUY';
    const tokenType = filters[1].memcmp.bytes === new PublicKey(TOKENS.CHAOS.address).toBase58() ? 'CHAOS' : 'LOGOS';
    let maxOrdersSeen = 0;
    let bestResult: readonly { pubkey: PublicKey; account: { data: Buffer } }[] = [];
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt} for ${tokenType} ${orderType} orders...`);
        const accounts = await this.connection.getProgramAccounts(JUPITER_LIMIT_PROGRAM_ID, {
          filters
        });
        console.log(`✅ ${tokenType} ${orderType}: Got ${accounts.length} orders on attempt ${attempt}`);
        
        // If we got more orders than before, update our best result
        if (accounts.length > maxOrdersSeen) {
          maxOrdersSeen = accounts.length;
          bestResult = accounts;
          // If this isn't our last attempt, try again to see if we can get even more
          if (attempt < maxAttempts) {
            console.log(`📈 ${tokenType} ${orderType}: New max found (${accounts.length}), trying again...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue;
          }
        }
        // If we got fewer orders than our max and we have more attempts, try again
        if (accounts.length < maxOrdersSeen && attempt < maxAttempts) {
          console.log(`📉 ${tokenType} ${orderType}: Got fewer orders than max (${accounts.length} vs ${maxOrdersSeen}), trying again...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        // Return our best result
        return bestResult.length > 0 ? bestResult : accounts;
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        console.warn(`❌ ${tokenType} ${orderType}: Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    console.warn(`⚠️ ${tokenType} ${orderType}: All attempts failed, returning empty array`);
    return [];
  }

  async getLimitOrders(): Promise<LimitOrder[]> {
    try {
      console.log('🚀 Starting to fetch limit orders...');
      const CHAOS_MINT = new PublicKey(TOKENS.CHAOS.address);
      const LOGOS_MINT = new PublicKey(TOKENS.LOGOS.address);

      // Fetch all orders in parallel with retry mechanism
      const [chaosSellOrders, logosSellOrders, chaosBuyOrders, logosBuyOrders] = await Promise.all([
        // Sell orders (CHAOS/LOGOS as input)
        this.retryGetProgramAccounts([
          { dataSize: 372 },
          { memcmp: { offset: 40, bytes: CHAOS_MINT.toBase58() }}
        ]),
        this.retryGetProgramAccounts([
          { dataSize: 372 },
          { memcmp: { offset: 40, bytes: LOGOS_MINT.toBase58() }}
        ]),
        // Buy orders (CHAOS/LOGOS as output)
        this.retryGetProgramAccounts([
          { dataSize: 372 },
          { memcmp: { offset: 72, bytes: CHAOS_MINT.toBase58() }}
        ]),
        this.retryGetProgramAccounts([
          { dataSize: 372 },
          { memcmp: { offset: 72, bytes: LOGOS_MINT.toBase58() }}
        ])
      ]);

      console.log('📊 Raw order counts:', {
        chaosSell: chaosSellOrders.length,
        logosSell: logosSellOrders.length,
        chaosBuy: chaosBuyOrders.length,
        logosBuy: logosBuyOrders.length
      });

      // Parse all orders
      const orders = await Promise.all([
        ...chaosSellOrders.map(o => this.parseRawOrder(o.pubkey, o.account.data, 'SELL')),
        ...logosSellOrders.map(o => this.parseRawOrder(o.pubkey, o.account.data, 'SELL')),
        ...chaosBuyOrders.map(o => this.parseRawOrder(o.pubkey, o.account.data, 'BUY')),
        ...logosBuyOrders.map(o => this.parseRawOrder(o.pubkey, o.account.data, 'BUY'))
      ]);

      // Log final counts by type
      const finalCounts = orders.reduce((acc, order) => {
        const key = `${order.tokenType}_${order.orderType}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('📈 Final parsed order counts:', finalCounts);
      return orders;
    } catch (error) {
      console.error('Error fetching limit orders:', error);
      throw error;
    }
  }
} 