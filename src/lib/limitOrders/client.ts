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
      symbol: knownToken?.name || 'UNKNOWN',
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
      } catch (err) {
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
      } catch (err) {
        return new Date().toISOString();
      }
    };

    const createdAt = getTimestamp(282);
    const updatedAt = getTimestamp(290);

    // Check for expiry
    const expiredAtDiscriminator = data[248];
    let expiredAt: string | undefined;
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

  async getLimitOrders(): Promise<LimitOrder[]> {
    try {
      const CHAOS_MINT = new PublicKey(TOKENS.CHAOS.address);
      const LOGOS_MINT = new PublicKey(TOKENS.LOGOS.address);

      // Fetch all orders in parallel
      const [chaosSellOrders, logosSellOrders, chaosBuyOrders, logosBuyOrders] = await Promise.all([
        // Sell orders (CHAOS/LOGOS as input)
        this.connection.getProgramAccounts(JUPITER_LIMIT_PROGRAM_ID, {
          filters: [
            { dataSize: 372 },
            { memcmp: { offset: 40, bytes: CHAOS_MINT.toBase58() }}
          ]
        }),
        this.connection.getProgramAccounts(JUPITER_LIMIT_PROGRAM_ID, {
          filters: [
            { dataSize: 372 },
            { memcmp: { offset: 40, bytes: LOGOS_MINT.toBase58() }}
          ]
        }),
        // Buy orders (CHAOS/LOGOS as output)
        this.connection.getProgramAccounts(JUPITER_LIMIT_PROGRAM_ID, {
          filters: [
            { dataSize: 372 },
            { memcmp: { offset: 72, bytes: CHAOS_MINT.toBase58() }}
          ]
        }),
        this.connection.getProgramAccounts(JUPITER_LIMIT_PROGRAM_ID, {
          filters: [
            { dataSize: 372 },
            { memcmp: { offset: 72, bytes: LOGOS_MINT.toBase58() }}
          ]
        })
      ]);

      // Parse all orders
      const orders = await Promise.all([
        ...chaosSellOrders.map(o => this.parseRawOrder(o.pubkey, o.account.data, 'SELL')),
        ...logosSellOrders.map(o => this.parseRawOrder(o.pubkey, o.account.data, 'SELL')),
        ...chaosBuyOrders.map(o => this.parseRawOrder(o.pubkey, o.account.data, 'BUY')),
        ...logosBuyOrders.map(o => this.parseRawOrder(o.pubkey, o.account.data, 'BUY'))
      ]);

      return orders;
    } catch (error) {
      console.error('Error fetching limit orders:', error);
      throw error;
    }
  }
} 