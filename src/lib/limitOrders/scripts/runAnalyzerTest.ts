import { runAnalyzer } from './runAnalyzer';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    console.log('Starting limit orders analysis...');
    await runAnalyzer();
    console.log('Analysis completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
main(); 