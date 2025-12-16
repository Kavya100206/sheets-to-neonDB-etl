/**
 * etl.js
 * Main ETL orchestrator - runs the complete pipeline
 */

import { ETLLogger } from './logger.js';
import { extractData } from './extract.js';
import { transformData } from './transform.js';
import { loadData } from './load.js';

/**
 * Main ETL pipeline function
 */
async function runETL() {
  const logger = new ETLLogger();
  
  try {
    // Start logging
    logger.start();

    // PHASE 1: EXTRACT
    console.log('\n🔍 PHASE 1: EXTRACT');
    console.log('─'.repeat(60));
    const rawData = await extractData(logger);

    // PHASE 2: TRANSFORM
    console.log('\n⚙️  PHASE 2: TRANSFORM');
    console.log('─'.repeat(60));
    const entities = transformData(rawData, logger);

    // PHASE 3: LOAD
    console.log('\n💾 PHASE 3: LOAD');
    console.log('─'.repeat(60));
    await loadData(entities, logger);

    // Finish logging
    logger.finish();
    logger.writeReport();

    process.exit(0);  // Success exit code

  } catch (error) {
    console.error('\n❌ ETL PIPELINE FAILED');
    console.error('─'.repeat(60));
    console.error('Error:', error.message);
    
    logger.finish();
    logger.writeReport();
    
    process.exit(1);  // Failure exit code
  }
}

// Run the pipeline
runETL();