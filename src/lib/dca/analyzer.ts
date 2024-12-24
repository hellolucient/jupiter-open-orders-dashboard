import { Connection, PublicKey } from '@solana/web3.js'
import { DCA, Network } from '@jup-ag/dca-sdk'
import fs from 'fs'
import { TOKENS } from './tokenConfig'

const LOGOS_MINT = new PublicKey(TOKENS.LOGOS.address)
const CHAOS_MINT = new PublicKey(TOKENS.CHAOS.address)

export async function analyzeDcaOrders() {
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!)
  const dca = new DCA(connection, Network.MAINNET)
  
  console.log('Fetching DCA positions...')
  const accounts = await dca.getAll()
  console.log(`Found ${accounts.length} total positions`)

  // Debug: Log RPC URL being used
  console.log('Using RPC URL:', process.env.NEXT_PUBLIC_RPC_URL)

  // Filter for CHAOS/LOGOS orders
  const relevantAccounts = accounts.filter(acc => {
    const isChaosOrder = acc.account.inputMint.equals(CHAOS_MINT) || acc.account.outputMint.equals(CHAOS_MINT)
    const isLogosOrder = acc.account.inputMint.equals(LOGOS_MINT) || acc.account.outputMint.equals(LOGOS_MINT)
    
    // Debug: Log each CHAOS order we find
    if (isChaosOrder) {
      const orderType = acc.account.inputMint.equals(CHAOS_MINT) ? 'CHAOS Sell' : 'CHAOS Buy'
      console.log(`Found ${orderType} order:`, acc.publicKey.toString())
      console.log('Input mint:', acc.account.inputMint.toString())
      console.log('Output mint:', acc.account.outputMint.toString())
    }
    
    return isChaosOrder || isLogosOrder
  })

  console.log(`Found ${relevantAccounts.length} CHAOS/LOGOS positions`)

  let output = 'DCA Orders Analysis\n'
  output += '===================\n\n'
  output += `Total positions found: ${accounts.length}\n`
  output += `CHAOS/LOGOS positions: ${relevantAccounts.length}\n\n`

  output += 'Detailed Order Analysis\n'
  output += '=====================\n\n'

  const analyzeOrder = async (acc: any) => {
    const inAmount = acc.account.inAmountPerCycle.toString()
    const totalAmount = acc.account.inDeposited.toString()
    const usedAmount = acc.account.inUsed.toString()
    const withdrawnAmount = acc.account.inWithdrawn.toString()
    const remainingAmount = acc.account.inDeposited.sub(acc.account.inWithdrawn).toString()
    const cycleFrequency = acc.account.cycleFrequency.toString()
    const nextCycleAt = new Date(acc.account.nextCycleAt.toNumber() * 1000).toISOString()
    const createdAt = new Date(acc.account.createdAt.toNumber() * 1000).toISOString()

    // Calculate cycles
    const totalCycles = Math.ceil(Number(totalAmount) / Number(inAmount))
    const completedCycles = Math.floor(Number(usedAmount) / Number(inAmount))
    const remainingCycles = totalCycles - completedCycles

    // Determine order type
    const isChaosOrder = acc.account.inputMint.equals(CHAOS_MINT) || acc.account.outputMint.equals(CHAOS_MINT)
    const isLogosOrder = acc.account.inputMint.equals(LOGOS_MINT) || acc.account.outputMint.equals(LOGOS_MINT)
    
    let orderType = ''
    if (isChaosOrder) {
      orderType = acc.account.inputMint.equals(CHAOS_MINT) ? 'CHAOS Sell' : 'CHAOS Buy'
    } else if (isLogosOrder) {
      orderType = acc.account.inputMint.equals(LOGOS_MINT) ? 'LOGOS Sell' : 'LOGOS Buy'
    }

    // Check if this was an instant fill (all amount used immediately)
    const wasInstantFill = acc.account.inUsed.eq(acc.account.inDeposited) && 
                          acc.account.createdAt.toNumber() === acc.account.nextCycleAt.toNumber()

    // Check if this is still an active DCA order:
    // 1. Has remaining cycles
    // 2. Has unused deposit amount
    // 3. Next cycle is in the future
    // 4. Was not an instant fill
    const hasRemainingCycles = remainingCycles > 0
    const hasUnusedDeposit = acc.account.inUsed.lt(acc.account.inDeposited)
    const nextCycleInFuture = acc.account.nextCycleAt.toNumber() > Math.floor(Date.now() / 1000)
    const isActive = hasRemainingCycles && hasUnusedDeposit && nextCycleInFuture && !wasInstantFill

    // Debug: Log filtering decisions for CHAOS orders
    if (isChaosOrder) {
      console.log(`\nAnalyzing ${orderType} order ${acc.publicKey.toString()}:`)
      console.log('- Remaining cycles:', remainingCycles)
      console.log('- Has unused deposit:', hasUnusedDeposit)
      console.log('- Next cycle in future:', nextCycleInFuture)
      console.log('- Was instant fill:', wasInstantFill)
      console.log('- Is active:', isActive)
    }

    return {
      isActive,
      wasInstantFill,
      output: `Order: ${acc.publicKey.toString()}\n` +
             `Type: ${orderType}\n` +
             `Input Mint: ${acc.account.inputMint.toString()}\n` +
             `Output Mint: ${acc.account.outputMint.toString()}\n` +
             '\nAmounts:\n' +
             `- Amount per cycle (raw): ${inAmount}\n` +
             `- Total deposited (raw): ${totalAmount}\n` +
             `- Amount used (raw): ${usedAmount}\n` +
             `- Amount withdrawn (raw): ${withdrawnAmount}\n` +
             `- Remaining amount (raw): ${remainingAmount}\n` +
             `- Next cycle amount left: ${acc.account.nextCycleAmountLeft.toString()}\n` +
             '\nCycles:\n' +
             `- Total cycles: ${totalCycles}\n` +
             `- Completed cycles: ${completedCycles}\n` +
             `- Remaining cycles: ${remainingCycles}\n` +
             `- Cycle frequency: ${cycleFrequency} seconds (${Math.floor(Number(cycleFrequency)/86400)} days)\n` +
             `- Next cycle at: ${nextCycleAt}\n` +
             `- Created at: ${createdAt}\n` +
             '\nState Analysis:\n' +
             `- Was instant fill: ${wasInstantFill}\n` +
             `- Has remaining cycles: ${hasRemainingCycles}\n` +
             `- Has unused deposit: ${hasUnusedDeposit}\n` +
             `- Next cycle in future: ${nextCycleInFuture}\n` +
             `- Is active DCA: ${isActive}\n` +
             '\n----------------------------------------\n\n'
    }
  }

  // Analyze orders sequentially
  console.log('\nAnalyzing orders...')
  let inactiveCount = 0
  let instantFillCount = 0
  let activeCount = 0
  
  for (const acc of relevantAccounts) {
    const analysis = await analyzeOrder(acc)
    if (analysis.wasInstantFill) {
      instantFillCount++
    } else if (!analysis.isActive) {
      inactiveCount++
    } else {
      activeCount++
      output += analysis.output
    }
  }

  output += '\nSummary:\n'
  output += '========\n'
  output += `Total CHAOS/LOGOS positions: ${relevantAccounts.length}\n`
  output += `Instant fill orders filtered out: ${instantFillCount}\n`
  output += `Inactive orders filtered out: ${inactiveCount}\n`
  output += `Active DCA orders shown: ${activeCount}\n`

  fs.writeFileSync('dca_orders_analysis.txt', output)
  console.log('Analysis written to dca_orders_analysis.txt')
} 