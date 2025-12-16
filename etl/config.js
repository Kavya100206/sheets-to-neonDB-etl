/**
 * config.js
 * Centralized configuration for ETL pipeline
 */

import dotenv from 'dotenv';                    // ← Import library to read .env file
import { fileURLToPath } from 'url';            // ← These 2 lines help us find
import { dirname, join } from 'path';           //   the path to .env file

// Get the directory path where this config.js file lives
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from credentials/.env
dotenv.config({ path: join(__dirname, '../credentials/.env') });

export default {
  // Google Sheets configuration
  googleSheets: {
    spreadsheetId: '1tpwJ0HczqKHwbN4FloN6cgxgH3h0i9vUknGD-8CDlLE',  // ← Your sheet ID
    range: 'Sheet1!A:L',           // ← Sheet name + columns A to L
    keyFile: join(__dirname, '../credentials/JSONKEYFILE.json'),  // ← Service account key
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']  // ← We only need to READ
  },

  // Database configuration
  database: {
    connectionString: process.env.DATABASE_URL,  // ← Read from .env file
    ssl: {
      rejectUnauthorized: false                  // ← Required for NeonDB cloud connection
    }
  },

  // Department name variations → standard name
  departmentMapping: {
    'cs': 'Computer Science',
    'computer science': 'Computer Science',
    'comp sci': 'Computer Science',
    'mathematics': 'Mathematics',
    'math': 'Mathematics',
    'physics': 'Physics'
  },

  // Department heads (hardcoded for this assignment)
  departmentHeads: {
    'Computer Science': 'Dr. Alan Turing',
    'Mathematics': 'Dr. Emmy Noether',
    'Physics': 'Dr. Marie Curie'
  }
};