/**
 * logger.js
 * Tracks ETL statistics and generates reports
 */

import fs from 'fs';
import { join } from 'path';

export class ETLLogger {
  constructor() {
    // Initialize statistics object - this tracks EVERYTHING
    this.stats = {
      startTime: null,              // When did ETL start?
      endTime: null,                // When did it finish?
      extracted: 0,                 // How many rows from Google Sheets?
      duplicatesRemoved: 0,         // How many duplicates found?
      validationErrors: [],         // Array of rows that failed validation
      transformedSuccessfully: 0,   // How many rows passed validation?
      loaded: {                     // How many records loaded per table?
        departments: 0,
        students: 0,
        courses: 0,
        enrollments: 0
      }
    };
  }

  // Mark when ETL starts
  start() {
    this.stats.startTime = new Date();
    console.log(`[ETL] Started at ${this.stats.startTime.toISOString()}`);
  }

  // Generic logging function
  log(level, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  // Called when extraction completes
  logExtraction(count) {
    this.stats.extracted = count;
    this.log('EXTRACT', `Fetched ${count} rows from Google Sheets`);
  }

  // Called when duplicate is found
  logDuplicate(email) {
    this.stats.duplicatesRemoved++;
    this.log('DEDUP', `Removed duplicate: ${email}`);
  }

  // Called when row fails validation
  logValidationError(rowIndex, errors) {
    this.stats.validationErrors.push({ rowIndex, errors });
    this.log('VALIDATION', `Row ${rowIndex} failed: ${errors.join(', ')}`);
  }

  // Called after transformation completes
  logTransformSuccess(count) {
    this.stats.transformedSuccessfully = count;
    this.log('TRANSFORM', `${count} records validated successfully`);
  }

  // Called after loading each entity type
  logLoad(entity, count) {
    this.stats.loaded[entity] = count;
    this.log('LOAD', `Inserted ${count} ${entity}`);
  }

  // Mark when ETL finishes and print summary
  finish() {
    this.stats.endTime = new Date();
    const duration = ((this.stats.endTime - this.stats.startTime) / 1000).toFixed(2);
    
    console.log('\n' + '═'.repeat(60));
    console.log('║         ETL PIPELINE SUMMARY'.padEnd(60) + '║');
    console.log('═'.repeat(60));
    console.log(`║ Duration: ${duration}s`.padEnd(60) + '║');
    console.log(`║ Extracted: ${this.stats.extracted} rows`.padEnd(60) + '║');
    console.log(`║ Duplicates Removed: ${this.stats.duplicatesRemoved}`.padEnd(60) + '║');
    console.log(`║ Validation Errors: ${this.stats.validationErrors.length}`.padEnd(60) + '║');
    console.log(`║ Valid Records: ${this.stats.transformedSuccessfully}`.padEnd(60) + '║');
    console.log('║'.padEnd(60) + '║');
    console.log('║ Loaded to Database:'.padEnd(60) + '║');
    console.log(`║   Departments: ${this.stats.loaded.departments}`.padEnd(60) + '║');
    console.log(`║   Students: ${this.stats.loaded.students}`.padEnd(60) + '║');
    console.log(`║   Courses: ${this.stats.loaded.courses}`.padEnd(60) + '║');
    console.log(`║   Enrollments: ${this.stats.loaded.enrollments}`.padEnd(60) + '║');
    console.log('═'.repeat(60));
    console.log('✅ ETL Pipeline completed!');
  }

  // Write JSON report file
  writeReport() {
    const report = {
      timestamp: this.stats.endTime.toISOString(),
      duration: ((this.stats.endTime - this.stats.startTime) / 1000).toFixed(2),
      summary: {
        extracted: this.stats.extracted,
        duplicatesRemoved: this.stats.duplicatesRemoved,
        validationErrors: this.stats.validationErrors.length,
        transformedSuccessfully: this.stats.transformedSuccessfully,
        loaded: this.stats.loaded
      },
      validationErrors: this.stats.validationErrors
    };

    const reportPath = join('../logs', `etl-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Report saved: ${reportPath}`);
  }
}