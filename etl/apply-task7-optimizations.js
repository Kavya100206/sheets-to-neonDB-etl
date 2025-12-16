/**
 * apply-task7-optimizations.js
 * Apply all optimizations to Task 7 tables
 */

import fs from 'fs';
import pkg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../credentials/.env') });

async function applyOptimizations() {
    console.log('⚡ Applying Task 7 Database Optimizations...\n');

    try {
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        // Read optimization SQL
        const optimSQL = fs.readFileSync(join(__dirname, '../sql/task7-optimizations.sql'), 'utf-8');

        // Execute (this will create indexes, views, and functions)
        await client.query(optimSQL);

        console.log('✅ Indexes created');
        console.log('✅ Views created');
        console.log('✅ Stored procedures created');

        await client.end();
        console.log('\n🎉 All optimizations applied successfully!\n');

    } catch (error) {
        console.error('❌ Error applying optimizations:', error.message);
        process.exit(1);
    }
}

applyOptimizations();
