import { Connection } from '@solana/web3.js'
import { JupiterLimitOrdersAPI } from '../client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function findLogosOrder() {
  // Initialize connection and API
  if (!process.env.NEXT_PUBLIC_RPC_URL) {
    throw new Error('NEXT_PUBLIC_RPC_URL environment variable is not set')
  }

  const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL)
  const api = new JupiterLimitOrdersAPI(connection)

  try {
    // Fetch all limit orders
    console.log('Fetching limit orders...')
    const orders = await api.getLimitOrders()

    // Find LOGOS buy orders
    const logosBuyOrders = orders.filter(
      o => o.tokenType === 'LOGOS' && o.orderType === 'BUY'
    )

    console.log(`\nFound ${logosBuyOrders.length} LOGOS buy orders`)
    
    // Display each order's details
    logosBuyOrders.forEach((order, i) => {
      console.log(`\nOrder ${i + 1}:`)
      console.log('Amount:', order.takingAmount, 'LOGOS')
      console.log('Execution Price:', order.price, `${order.inputMint.symbol}/${order.outputMint.symbol}`)
      console.log('Total:', order.makingAmount, order.inputMint.symbol)
      console.log('Created:', new Date(order.createdAt).toLocaleString())
    })

  } catch (error) {
    console.error('Error finding LOGOS orders:', error)
  }
}

// Run the script
findLogosOrder(); 