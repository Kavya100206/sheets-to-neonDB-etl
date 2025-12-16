/**
 * clear-task7-data.js
 * Clears Task 7 tables to allow fresh ETL run
 */

import pkg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../credentials/.env') });

async function clearData() {
    console.log('🗑️  Clearing Task 7 data...\n');

    try {
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        // Clear in correct order (due to foreign keys)
        await client.query('TRUNCATE TABLE task7_sales RESTART IDENTITY CASCADE');
        await client.query('TRUNCATE TABLE task7_employees RESTART IDENTITY CASCADE');

        console.log('✅ task7_sales cleared');
        console.log('✅ task7_employees cleared');

        await client.end();
        console.log('\n🎉 Tables cleared! You can now re-run ETL scripts.\n');

    } catch (error) {
        console.error('❌ Error clearing data:', error.message);
        process.exit(1);
    }
}

clearData();
