/**
 * task7-etl-sales.js
 * ETL for messy sales dataset (Dataset 2)
 * Demonstrates data cleaning and validation
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import pkg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../credentials/.env') });

// Helper: Parse date from multiple formats
function parseDate(dateStr) {
    if (!dateStr) return null;

    // ISO format: 2024-01-15
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }

    // US format: 01/20/2024
    const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
        const [_, month, day, year] = usMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // European format: 15-03-2024
    const euMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (euMatch) {
        const [_, day, month, year] = euMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return null;
}

// Helper: Validate email
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function runSalesETL() {
    console.log('🚀 Starting Sales Dataset ETL (Messy Data)');
    console.log('═'.repeat(60));

    const startTime = Date.now();
    let stats = {
        extracted: 0,
        duplicates: 0,
        invalid: 0,
        cleaned: 0,
        loaded: 0
    };

    try {
        // EXTRACT
        console.log('\n📥 PHASE 1: EXTRACT');
        const csvPath = join(__dirname, 'data/sales-messy.csv');
        const csvData = fs.readFileSync(csvPath, 'utf-8');
        const records = parse(csvData, { columns: true, skip_empty_lines: true });
        stats.extracted = records.length;
        console.log(`✅ Extracted ${stats.extracted} sales records`);

        // TRANSFORM
        console.log('\n⚙️  PHASE 2: TRANSFORM');
        console.log('Cleaning messy data...');

        const seen = new Map(); // For deduplication
        const cleaned = [];

        for (const record of records) {
            // Clean and validate
            const customerName = record['Customer Name']?.trim();
            const customerEmail = record['Customer Email']?.trim().toLowerCase();
            const productName = record['Product Name']?.trim();
            const quantity = parseInt(record.Quantity);
            const unitPrice = parseFloat(record['Unit Price']);
            const saleDate = parseDate(record['Sale Date']);
            const region = record.Region?.trim().toLowerCase();
            const salesRep = record['Sales Rep']?.trim();

            // Validation checks
            const errors = [];
            if (!customerName) errors.push('Missing customer name');
            if (customerEmail && !isValidEmail(customerEmail)) errors.push('Invalid email');
            if (!productName) errors.push('Missing product');
            if (!quantity || quantity <= 0) errors.push('Invalid quantity');
            if (!unitPrice || unitPrice <= 0) errors.push('Invalid price');
            if (!saleDate) errors.push('Invalid date');
            if (!region) errors.push('Missing region');

            if (errors.length > 0) {
                console.log(`❌ Row skipped: ${errors.join(', ')}`);
                stats.invalid++;
                continue;
            }

            // Check for duplicates (same customer, product, date)
            const key = `${customerName}-${productName}-${saleDate}`;
            if (seen.has(key)) {
                console.log(`🔄 Duplicate found: ${customerName} - ${productName}`);
                stats.duplicates++;
                continue;
            }
            seen.set(key, true);

            // Add to cleaned data
            cleaned.push({
                customer_name: customerName,
                customer_email: customerEmail || null,
                product_name: productName,
                quantity,
                unit_price: unitPrice,
                sale_date: saleDate,
                region: region.charAt(0).toUpperCase() + region.slice(1), // Capitalize
                sales_rep: salesRep || null
            });
        }

        stats.cleaned = cleaned.length;
        console.log(`✅ Cleaned ${stats.cleaned} valid records`);
        console.log(`⚠️  Removed ${stats.duplicates} duplicates`);
        console.log(`❌ Rejected ${stats.invalid} invalid records`);

        // LOAD
        console.log('\n💾 PHASE 3: LOAD');
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        await client.query('BEGIN');

        for (const sale of cleaned) {
            try {
                await client.query(`
          INSERT INTO task7_sales (
            customer_name, customer_email, product_name,
            quantity, unit_price, sale_date, region, sales_rep
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
                    sale.customer_name, sale.customer_email, sale.product_name,
                    sale.quantity, sale.unit_price, sale.sale_date,
                    sale.region, sale.sales_rep
                ]);
                stats.loaded++;
            } catch (err) {
                console.error(`❌ Error loading sale:`, err.message);
            }
        }

        await client.query('COMMIT');
        await client.end();

        console.log(`✅ Loaded ${stats.loaded} sales records`);

        // SUMMARY
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('\n📊 ETL SUMMARY');
        console.log('═'.repeat(60));
        console.log(`Extracted: ${stats.extracted}`);
        console.log(`Duplicates removed: ${stats.duplicates}`);
        console.log(`Invalid records: ${stats.invalid}`);
        console.log(`Cleaned: ${stats.cleaned}`);
        console.log(`Loaded: ${stats.loaded}`);
        console.log(`Duration: ${duration}s`);
        console.log('═'.repeat(60));
        console.log('✅ Sales ETL completed successfully!\n');

    } catch (error) {
        console.error('\n❌ ETL FAILED:', error.message);
        process.exit(1);
    }
}

runSalesETL();
