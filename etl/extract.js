/**
 * extract.js
 * Extracts data from Google Sheets and converts to objects
 */

import { google } from 'googleapis';  // Google's official API library
import config from './config.js';     // Our configuration file

/**
 * Main extraction function
 * @param {ETLLogger} logger - Logger instance to track progress
 * @returns {Array} Array of objects with sheet data
 */
export async function extractData(logger) {
  try {
    logger.log('EXTRACT', 'Connecting to Google Sheets API...');

    // STEP 1: Authenticate using service account
    const auth = new google.auth.GoogleAuth({
      keyFile: config.googleSheets.keyFile,      // Path to JSONKEYFILE.json
      scopes: config.googleSheets.scopes         // What permissions we need (readonly)
    });

    // STEP 2: Create Google Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });

    // STEP 3: Fetch data from the spreadsheet
    logger.log('EXTRACT', `Fetching from sheet: ${config.googleSheets.spreadsheetId}`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.googleSheets.spreadsheetId,  // Your sheet ID
      range: config.googleSheets.range                   // 'sheets-to-neonDB-etl!A:L'
    });

    // STEP 4: Validate we got data
    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      throw new Error('No data found in Google Sheet');
    }
    
    if (rows.length < 2) {
      throw new Error('Sheet has headers but no data rows');
    }

    // STEP 5: Convert 2D array to array of objects
    const data = convertToObjects(rows);
    
    // STEP 6: Log success
    logger.logExtraction(data.length);
    
    return data;

  } catch (error) {
    // Enhanced error messages for common issues
    if (error.code === 403) {
      throw new Error(`Permission denied - Add service account to sheet viewers: ${error.message}`);
    }
    if (error.code === 404) {
      throw new Error(`Sheet not found - Check spreadsheet ID in config.js: ${error.message}`);
    }
    if (error.message.includes('ENOENT')) {
      throw new Error(`Key file not found: ${config.googleSheets.keyFile}`);
    }
    
    // Re-throw original error if not handled above
    throw error;
  }
}

/**
 * Convert Google Sheets 2D array to array of objects
 * @param {Array<Array>} rows - Raw data from API
 * @returns {Array<Object>} Converted data
 */
function convertToObjects(rows) {
  // Destructuring: First row is headers, rest are data
  const [headers, ...dataRows] = rows;
  
  // Map each data row to an object
  return dataRows.map((row, index) => {
    const obj = {
      _rowIndex: index + 2  // Track original row number (2 = first data row)
    };
    
    // Loop through headers and match with row values
    headers.forEach((header, colIndex) => {
      obj[header] = row[colIndex] || null;  // Use null if cell is empty
    });
    
    return obj;
  });
}