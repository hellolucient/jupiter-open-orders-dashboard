import fs from 'fs'
import { Connection } from '@solana/web3.js'
import { JupiterLimitOrdersAPI } from '../client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function exportLimitOrders() {
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

    // Sort orders by token type and order type
    const sortedOrders = orders.sort((a, b) => {
      if (a.tokenType !== b.tokenType) {
        return a.tokenType.localeCompare(b.tokenType)
      }
      if (a.orderType !== b.orderType) {
        return a.orderType.localeCompare(b.orderType)
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Create output string
    let output = 'Jupiter Limit Orders Export\n'
    output += `Generated at: ${new Date().toISOString()}\n`
    output += '----------------------------------------\n\n'

    // Group orders by token and type
    const tokens = ['LOGOS', 'CHAOS'] as const
    const types = ['BUY', 'SELL'] as const

    for (const token of tokens) {
      output += `=== ${token} Orders ===\n\n`
      
      for (const type of types) {
        const filteredOrders = sortedOrders.filter(
          o => o.tokenType === token && o.orderType === type
        )

        output += `${type} Orders (${filteredOrders.length})\n`
        output += '----------------------------------------\n'

        // Calculate totals
        const totalAmount = filteredOrders.reduce((sum, o) => 
          sum + (type === 'BUY' ? o.takingAmount : o.makingAmount), 0
        )
        const totalValue = filteredOrders.reduce((sum, o) => 
          sum + (type === 'BUY' ? o.makingAmount : o.takingAmount), 0
        )

        output += `Total ${token}: ${Math.round(totalAmount).toLocaleString()}\n`
        output += `Total USDC: ${totalValue.toLocaleString()}\n\n`

        // Output individual orders
        filteredOrders.forEach((order, i) => {
          const amount = type === 'BUY' ? order.takingAmount : order.makingAmount
          const total = type === 'BUY' ? order.makingAmount : order.takingAmount
          
          output += `${i + 1}. Order ID: ${order.id}\n`
          output += `   Amount: ${Math.round(amount).toLocaleString()} ${token}\n`
          output += `   Price: ${order.price.toFixed(6)} USDC\n`
          output += `   Total: ${total.toLocaleString()} USDC\n`
          output += `   Created: ${new Date(order.createdAt).toLocaleString()}\n`
          output += `   Status: ${order.status.toUpperCase()}\n`
          if (order.expiredAt) {
            output += `   Expires: ${new Date(order.expiredAt).toLocaleString()}\n`
          }
          output += `   Maker: ${order.maker.toString()}\n`
          output += '\n'
        })

        output += '\n'
      }
    }

    // Write to file
    fs.writeFileSync('limit_orders_export.txt', output)
    console.log('Export completed: limit_orders_export.txt')

  } catch (error) {
    console.error('Error exporting limit orders:', error)
  }
}

// Run the export
exportLimitOrders() 