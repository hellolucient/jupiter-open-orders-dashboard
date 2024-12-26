import { analyzeDcaOrders } from '../analyzer'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Run the analyzer
analyzeDcaOrders()
  .then(() => console.log('Analysis complete'))
  .catch(error => console.error('Error running analysis:', error)) 