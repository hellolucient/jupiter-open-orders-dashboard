import { PriceService } from '../PriceService'

async function testPriceService() {
  console.log('🧪 Testing PriceService...\n')
  
  const service = PriceService.getInstance()

  // Test 1: Get SOL price in USDC
  console.log('Test 1: Get SOL price in USDC')
  const solPrice = await service.getUsdcPrice('SOL')
  console.log('SOL Price:', `$${solPrice.toFixed(2)} USDC`)
  console.log('Cache hit test:', await service.getUsdcPrice('SOL'), '(should be same as above)\n')

  // Test 2: Get USDT price in USDC
  console.log('Test 2: Get USDT price in USDC')
  const usdtPrice = await service.getUsdcPrice('USDT')
  console.log('USDT Price:', `$${usdtPrice.toFixed(2)} USDC\n`)

  // Test 3: Convert amount to USDC
  console.log('Test 3: Convert 1.5 SOL to USDC')
  const convertedAmount = await service.convertToUsdc(1.5, 'SOL')
  console.log('1.5 SOL =', `$${convertedAmount.toFixed(2)} USDC\n`)

  // Test 4: Convert execution price (SOL/LOGOS to USDC/LOGOS)
  console.log('Test 4: Convert execution price from SOL/LOGOS to USDC/LOGOS')
  const solLogosPrice = 0.000047 // Example from previous order
  const usdcLogosPrice = await service.convertExecutionPrice(solLogosPrice, 'SOL', 'LOGOS')
  console.log(`${solLogosPrice} SOL/LOGOS = $${usdcLogosPrice?.toFixed(6)} USDC/LOGOS\n`)

  // Test 5: Test cache expiry
  console.log('Test 5: Cache expiry test')
  console.log('Clearing cache...')
  service.clearCache()
  console.log('Fetching SOL price again (should hit API)...')
  const newSolPrice = await service.getUsdcPrice('SOL')
  console.log('New SOL Price:', `$${newSolPrice.toFixed(2)} USDC\n`)

  // Test 6: Test unsupported token
  console.log('Test 6: Test unsupported token')
  const unknownPrice = await service.getUsdcPrice('UNKNOWN')
  console.log('Unknown token price:', unknownPrice, '(should be 0)\n')

  // Test 7: Test direct USDC conversion
  console.log('Test 7: Test USDC price (should be 1:1)')
  const usdcPrice = await service.getUsdcPrice('USDC')
  console.log('USDC Price:', usdcPrice, '(should be 1)\n')

  // Test 8: Complex conversion example
  console.log('Test 8: Complex conversion example')
  const testOrder = {
    amount: 150000, // LOGOS
    executionPrice: 0.000047, // SOL/LOGOS
    total: 7.05 // SOL
  }
  
  const priceInUsdc = await service.convertExecutionPrice(
    testOrder.executionPrice,
    'SOL',
    'LOGOS'
  )
  const totalInUsdc = await service.convertToUsdc(testOrder.total, 'SOL')

  console.log('Order Analysis:')
  console.log('Amount:', testOrder.amount.toLocaleString(), 'LOGOS')
  console.log('Original Price:', testOrder.executionPrice, 'SOL/LOGOS')
  console.log('Price in USDC:', `$${priceInUsdc?.toFixed(6)} USDC/LOGOS`)
  console.log('Total in SOL:', testOrder.total, 'SOL')
  console.log('Total in USDC:', `$${totalInUsdc.toFixed(2)} USDC`)
}

// Run the tests
console.log('Starting PriceService tests...\n')
testPriceService()
  .then(() => console.log('\nAll tests completed!'))
  .catch(error => console.error('\nTest failed:', error)) 