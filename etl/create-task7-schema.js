/**
 * create-task7-schema.js
 * Creates schemas for Task 7 datasets in NeonDB
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

async function createSchema() {
    console.log('📐 Creating Task 7 database schemas...\n');

    try {
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        // Read and execute schema
        const schemaSQL = fs.readFileSync(join(__dirname, '../sql/task7-schema.sql'), 'utf-8');
        await client.query(schemaSQL);

        console.log('✅ task7_employees table created');
        console.log('✅ task7_sales table created');

        await client.end();
        console.log('\n🎉 Schemas created successfully!\n');

    } catch (error) {
        console.error('❌ Error creating schemas:', error.message);
        process.exit(1);
    }
}

createSchema();
