/**
 * task7-etl-employees.js
 * ETL for clean employee dataset (Dataset 1)
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

async function runEmployeeETL() {
    console.log('🚀 Starting Employee Dataset ETL');
    console.log('═'.repeat(60));

    const startTime = Date.now();
    let stats = { extracted: 0, transformed: 0, loaded: 0, errors: 0 };

    try {
        // EXTRACT
        console.log('\n📥 PHASE 1: EXTRACT');
        const csvPath = join(__dirname, 'data/employees.csv');
        const csvData = fs.readFileSync(csvPath, 'utf-8');
        const records = parse(csvData, { columns: true, skip_empty_lines: true });
        stats.extracted = records.length;
        console.log(`✅ Extracted ${stats.extracted} employee records`);

        // TRANSFORM
        console.log('\n⚙️  PHASE 2: TRANSFORM');
        const transformed = records.map(record => ({
            first_name: record['First Name'].trim(),
            last_name: record['Last Name'].trim(),
            email: record.Email.toLowerCase().trim(),
            phone: record.Phone?.trim() || null,
            hire_date: record['Hire Date'],
            job_title: record['Job Title']?.trim() || null,
            salary: parseFloat(record.Salary),
            department: record.Department.trim(),
            manager_name: record.Manager?.trim() || null
        }));
        stats.transformed = transformed.length;
        console.log(`✅ Transformed ${stats.transformed} records`);

        // LOAD
        console.log('\n💾 PHASE 3: LOAD');
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        await client.query('BEGIN');

        for (const emp of transformed) {
            try {
                await client.query(`
          INSERT INTO task7_employees (
            first_name, last_name, email, phone, hire_date,
            job_title, salary, department, manager_name
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
                    emp.first_name, emp.last_name, emp.email, emp.phone,
                    emp.hire_date, emp.job_title, emp.salary,
                    emp.department, emp.manager_name
                ]);
                stats.loaded++;
            } catch (err) {
                console.error(`❌ Error loading employee ${emp.email}:`, err.message);
                stats.errors++;
            }
        }

        await client.query('COMMIT');
        await client.end();

        console.log(`✅ Loaded ${stats.loaded} employee records`);

        // SUMMARY
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('\n📊 ETL SUMMARY');
        console.log('═'.repeat(60));
        console.log(`Extracted: ${stats.extracted}`);
        console.log(`Transformed: ${stats.transformed}`);
        console.log(`Loaded: ${stats.loaded}`);
        console.log(`Errors: ${stats.errors}`);
        console.log(`Duration: ${duration}s`);
        console.log('═'.repeat(60));
        console.log('✅ Employee ETL completed successfully!\n');

    } catch (error) {
        console.error('\n❌ ETL FAILED:', error.message);
        process.exit(1);
    }
}

runEmployeeETL();
