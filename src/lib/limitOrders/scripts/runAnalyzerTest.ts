import { runAnalyzer } from '../runAnalyzer';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Run the analyzer
runAnalyzer()
  .then(() => console.log('Analysis complete'))
  .catch((error: unknown) => console.error('Error running analysis:', error)); 