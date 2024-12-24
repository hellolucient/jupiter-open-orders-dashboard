import { Connection, PublicKey } from '@solana/web3.js';
import { analyzeOrder } from './orderAnalyzer';
import { TOKENS } from './tokenConfig';
import * as fs from 'fs';

const JUPITER_LIMIT_PROGRAM_ID = new PublicKey('j1o2qRpjcyUwEvwtcfhEQefh773ZgjxcVRry7LDqg5X');

export const runAnalyzer = async () => {
  try {
    const heliusUrl = process.env.NEXT_PUBLIC_RPC_URL;
    if (!heliusUrl) {
      throw new Error('NEXT_PUBLIC_RPC_URL environment variable is not set');
    }
    console.log('Initializing connection...');
    const connection = new Connection(heliusUrl);

    // Test connection
    try {
      await connection.getSlot();
      console.log('Connection test successful');
    } catch (connError: unknown) {
      console.error('Connection test failed:', connError);
      throw new Error(`Failed to connect to RPC: ${connError instanceof Error ? connError.message : 'Unknown error'}`);
    }

    const programId = JUPITER_LIMIT_PROGRAM_ID;
    const CHAOS_MINT = new PublicKey(TOKENS.CHAOS.address);
    const LOGOS_MINT = new PublicKey(TOKENS.LOGOS.address);

    // Add debug for memcmp
    console.log('Memcmp Debug:', {
      CHAOS_MINT: CHAOS_MINT.toBase58(),
      LOGOS_MINT: LOGOS_MINT.toBase58()
    });

    // Add more detailed debug
    console.log('Query Debug:', {
      programId: JUPITER_LIMIT_PROGRAM_ID.toString(),
      dataSize: 372,
      chaosMint: CHAOS_MINT.toBase58(),
      logosMint: LOGOS_MINT.toBase58()
    });

    console.log('Fetching program accounts...');
    const [chaosSellOrders, logosSellOrders, chaosBuyOrders, logosBuyOrders] = await Promise.all([
      // Sell orders (CHAOS/LOGOS as input)
      connection.getProgramAccounts(programId, {
        filters: [
          { dataSize: 372 },
          { memcmp: { offset: 40, bytes: CHAOS_MINT.toBase58() }}
        ]
      }).then(orders => orders.map(o => ({ ...o, type: 'SELL' as const }))),
      connection.getProgramAccounts(programId, {
        filters: [
          { dataSize: 372 },
          { memcmp: { offset: 40, bytes: LOGOS_MINT.toBase58() }}
        ]
      }).then(orders => orders.map(o => ({ ...o, type: 'SELL' as const }))),
      // Buy orders (CHAOS/LOGOS as output)
      connection.getProgramAccounts(programId, {
        filters: [
          { dataSize: 372 },
          { memcmp: { offset: 72, bytes: CHAOS_MINT.toBase58() }}
        ]
      }).then(orders => orders.map(o => ({ ...o, type: 'BUY' as const }))),
      connection.getProgramAccounts(programId, {
        filters: [
          { dataSize: 372 },
          { memcmp: { offset: 72, bytes: LOGOS_MINT.toBase58() }}
        ]
      }).then(orders => orders.map(o => ({ ...o, type: 'BUY' as const })))
    ]).catch(error => {
      console.error('Failed to fetch program accounts:', error);
      throw new Error(`Failed to fetch program accounts: ${error.message}`);
    });

    // Log counts after fetch
    console.log('Order Counts After Fetch:', {
      chaosSell: chaosSellOrders.length,
      logosSell: logosSellOrders.length,
      chaosBuy: chaosBuyOrders.length,
      logosBuy: logosBuyOrders.length
    });

    // Create output file
    const outputPath = 'limit_orders_analysis.txt';
    const outputStream = fs.createWriteStream(outputPath);

    // Combine all orders
    const allOrders = [...chaosSellOrders, ...logosSellOrders, ...chaosBuyOrders, ...logosBuyOrders];

    // Process each order
    for (const order of allOrders) {
      await analyzeOrder(
        order.pubkey.toString(),
        Buffer.from(order.account.data).toString('hex'),
        outputStream,
        connection
      );
    }

    console.log(`Analysis complete. Results written to ${outputPath}`);
    outputStream.end();

    return allOrders;

  } catch (error) {
    console.error('Error in analyzer:', error);
    throw error;
  }
}; 