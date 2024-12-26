import { Connection, PublicKey } from '@solana/web3.js'
import { DCA, Network } from '@jup-ag/dca-sdk'
import fs from 'fs'
import { TOKENS } from '@/lib/shared/tokenConfig'
import { toDecimalAmount } from '@/lib/shared/tokenConfig'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Initialize constants
const LOGOS_MINT = new PublicKey(TOKENS.LOGOS.address)
const CHAOS_MINT = new PublicKey(TOKENS.CHAOS.address)

async function fetchDCAHistory() {
  // Initialize connection and DCA client
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!)
  const dca = new DCA(connection, Network.MAINNET)

  console.log('Fetching DCA positions...')
  const accounts = await dca.getAll()
  console.log(`Found ${accounts.length} total positions`)

  // Filter for CHAOS/LOGOS orders
  const relevantAccounts = accounts.filter(acc => {
    const isChaosOrder = acc.account.inputMint.equals(CHAOS_MINT) || acc.account.outputMint.equals(CHAOS_MINT)
    const isLogosOrder = acc.account.inputMint.equals(LOGOS_MINT) || acc.account.outputMint.equals(LOGOS_MINT)
    return isChaosOrder || isLogosOrder
  })

  console.log(`Found ${relevantAccounts.length} CHAOS/LOGOS positions`)

  // Get one week ago timestamp
  const oneWeekAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60)

  let output = 'DCA Orders History (Last 7 Days)\n'
  output += '===============================\n\n'

  // Process each token separately
  for (const token of ['LOGOS', 'CHAOS'] as const) {
    const tokenMint = token === 'LOGOS' ? LOGOS_MINT : CHAOS_MINT
    const tokenDecimals = TOKENS[token].decimals

    // Filter orders for this token from the last week
    const tokenOrders = relevantAccounts.filter(acc => {
      const createdAt = acc.account.createdAt.toNumber()
      const isRelevantToken = acc.account.inputMint.equals(tokenMint) || acc.account.outputMint.equals(tokenMint)
      return isRelevantToken && createdAt >= oneWeekAgo
    })

    output += `${token} Orders\n`
    output += '='.repeat(token.length + 7) + '\n\n'

    // Separate buy and sell orders
    const buyOrders = tokenOrders.filter(acc => acc.account.outputMint.equals(tokenMint))
    const sellOrders = tokenOrders.filter(acc => acc.account.inputMint.equals(tokenMint))

    // Process buy orders
    output += 'Buy Orders\n----------\n'
    let totalBuyVolume = 0
    const totalBuyOrders = buyOrders.length

    for (const order of buyOrders) {
      const inAmount = order.account.inAmountPerCycle.toNumber()
      const totalAmount = order.account.inDeposited.toNumber()
      const usedAmount = order.account.inUsed.toNumber()
      const createdAt = new Date(order.account.createdAt.toNumber() * 1000).toLocaleString()
      
      // For buy orders, we're interested in the output amount (token amount)
      const amountPerCycle = toDecimalAmount(inAmount, TOKENS.USDC.decimals)
      const totalTokenAmount = toDecimalAmount(totalAmount, TOKENS.USDC.decimals)
      const usedTokenAmount = toDecimalAmount(usedAmount, TOKENS.USDC.decimals)
      
      totalBuyVolume += usedTokenAmount

      output += `Order ID: ${order.publicKey.toString()}\n`
      output += `Created: ${createdAt}\n`
      output += `Amount per cycle: ${amountPerCycle.toFixed(6)} USDC\n`
      output += `Total amount: ${totalTokenAmount.toFixed(6)} USDC\n`
      output += `Used amount: ${usedTokenAmount.toFixed(6)} USDC\n`
      output += `Status: ${usedAmount === totalAmount ? 'COMPLETED' : 'ACTIVE'}\n\n`
    }

    output += `Total Buy Orders: ${totalBuyOrders}\n`
    output += `Total Buy Volume: ${totalBuyVolume.toFixed(6)} USDC\n\n`

    // Process sell orders
    output += 'Sell Orders\n-----------\n'
    let totalSellVolume = 0
    const totalSellOrders = sellOrders.length

    for (const order of sellOrders) {
      const inAmount = order.account.inAmountPerCycle.toNumber()
      const totalAmount = order.account.inDeposited.toNumber()
      const usedAmount = order.account.inUsed.toNumber()
      const createdAt = new Date(order.account.createdAt.toNumber() * 1000).toLocaleString()
      
      // For sell orders, we're interested in the input amount (token amount)
      const amountPerCycle = toDecimalAmount(inAmount, tokenDecimals)
      const totalTokenAmount = toDecimalAmount(totalAmount, tokenDecimals)
      const usedTokenAmount = toDecimalAmount(usedAmount, tokenDecimals)
      
      totalSellVolume += usedTokenAmount

      output += `Order ID: ${order.publicKey.toString()}\n`
      output += `Created: ${createdAt}\n`
      output += `Amount per cycle: ${amountPerCycle.toFixed(6)} ${token}\n`
      output += `Total amount: ${totalTokenAmount.toFixed(6)} ${token}\n`
      output += `Used amount: ${usedTokenAmount.toFixed(6)} ${token}\n`
      output += `Status: ${usedAmount === totalAmount ? 'COMPLETED' : 'ACTIVE'}\n\n`
    }

    output += `Total Sell Orders: ${totalSellOrders}\n`
    output += `Total Sell Volume: ${totalSellVolume.toFixed(6)} ${token}\n\n`
    output += '----------------------------------------\n\n'
  }

  // Write output to file
  fs.writeFileSync('data/dca/dca_history.txt', output)
  console.log('DCA history has been written to data/dca/dca_history.txt')
}

// Run the script
fetchDCAHistory().catch(console.error)
