# Google Sheets to NeonDB ETL
---

## 📊 Project Overview

This project demonstrates end-to-end data engineering skills by migrating messy Google Sheets data to a normalized PostgreSQL database with automated ETL pipeline, real-time auto-registration, and comprehensive SQL analytics.

---

## 📁 Project Structure

```
Data-engineering-assignment/
├── database/              # Database schemas and seed data
│   ├── schema.sql        # Normalized schema (3NF) with constraints
│   └── seed.sql          # Clean sample data for testing
├── etl/                   # ETL pipeline (Task 4 & 7)
│   ├── extract.js        # Google Sheets data extraction
│   ├── transform.js      # Data cleaning & validation (380 lines)
│   ├── load.js           # Database insertion with transactions
│   ├── logger.js         # Comprehensive logging system
│   ├── config.js         # Centralized configuration
│   ├── etl.js            # Main ETL orchestrator
│   ├── task7-etl-employees.js      # Public dataset 1 ETL
│   ├── task7-etl-sales.js          # Public dataset 2 ETL (messy data)
│   └── data/             # CSV datasets for Task 7
├── api/                   # REST API for auto-registration (Task 6)
│   ├── server.js         # Express.js API server
│   ├── google-apps-script-FIXED.js  # Apps Script for Google Sheets
│   ├── test-api.js       # API test scripts
│   └── test-student-only.js
├── sql/                   # SQL development (Task 5 & 7)
│   ├── queries.sql       # 17 business queries
│   ├── views.sql         # 5 reusable views
│   ├── procedures.sql    # 3 stored procedures
│   ├── optimization.sql  # Performance indexes
│   ├── task7-schema.sql          # Task 7 dataset schemas
│   └── task7-optimizations.sql   # 7 indexes, 4 views, 2 mat views, 3 functions
├── tests/                 # Test scripts
│   ├── db-test.js        # Database connection test
│   ├── sheets-test.js    # Google Sheets API test
│   ├── test-schema.js    # Schema validation
│   └── verify-etl-data.js  # ETL data verification
├── credentials/           # Environment & credentials (gitignored)
│   ├── .env              # Database connection string
│   ├── JSONKEYFILE.json  # Google service account key
│   ├── package.json
│   └── node_modules/
├── .gitignore
└── README.md
```

---

## ✅ Completed Tasks

### ✅ Task 1: Environment Setup
**Deliverables**:
- NeonDB PostgreSQL cluster created and tested
- Google Cloud Project with Sheets API enabled
- Service account authentication configured
- Node.js development environment set up
- All connections verified

---

### ✅ Task 2: Data Audit & Assessment
**Deliverables**:
- Analyzed 18 rows of messy Google Sheets data
- Identified 8 categories of data quality issues
- Documented 4 entities (Department, Student, Course, Enrollment)
- Created column mapping for transformation
- **Doc**: [`docs/task2-data-audit.md`](file:///e:/SCALER/Projects/Data-engineering-assignment/docs/task2-data-audit.md)

**Data Quality Issues Found**:
- Duplicate emails
- Missing values
- Inconsistent date formats (3 different formats)
- Mixed text/numeric years
- Department abbreviations
- Phone number variations
- Inconsistent capitalization
- Invalid email formats

---

### ✅ Task 3: Database Design & ER Diagram  
**Deliverables**:
- Normalized schema (3NF) with 4 tables
- Entity-Relationship diagram
- Constraints: PK, FK, UNIQUE, CHECK, NOT NULL
- Performance indexes on foreign keys
- Clean seed data with 12 students, 8 courses
- **Files**: [`database/schema.sql`](file:///e:/SCALER/Projects/Data-engineering-assignment/database/schema.sql), [`docs/er-diagram.png`](file:///e:/SCALER/Projects/Data-engineering-assignment/docs/er-diagram.png)

**Schema Highlights**:
- Auto-incrementing primary keys (SERIAL)
- ON DELETE CASCADE for enrollments
- CHECK constraints for data validation
- Unique email addresses
- Letter grade system (A-F)

---

### ✅ Task 4: ETL Pipeline Development
**Deliverables**:
- Modular ETL architecture (Extract, Transform, Load)
- Google Sheets integration
- Comprehensive data cleaning (380 lines)
- Duplicate detection & removal
- Transaction-based database loading
- Detailed logging & error handling
- **Files**: [`etl/`](file:///e:/SCALER/Projects/Data-engineering-assignment/etl) folder (6 modules)

**ETL Features**:
- Handles multiple date formats
- Text-to-number conversion (Freshman → 1)
- Department normalization (CS → Computer Science)
- Email validation with regex
- Age verification (16+)
- Grade conversion (95 → "A")
- Deduplication by email
- ALL-or-nothing transactions

**Results**: 18 input rows → 16 valid records → Database loaded successfully

---

### ✅ Task 5: SQL Development & Optimization
**Deliverables**:
- 17 comprehensive SQL queries (4 categories)
- 5 reusable database views
- 3 stored procedures/functions
- Performance indexes
- **Files**: [`sql/queries.sql`](file:///e:/SCALER/Projects/Data-engineering-assignment/sql/queries.sql), [`sql/views.sql`](file:///e:/SCALER/Projects/Data-engineering-assignment/sql/views.sql), [`sql/procedures.sql`](file:///e:/SCALER/Projects/Data-engineering-assignment/sql/procedures.sql)

**Query Categories**:
1. Basic aggregations (COUNT, SUM, AVG)
2. Multi-table JOINs (2-4 tables)
3. Business reports (department performance, grade distribution, transcripts)
4. Data quality checks (duplicates, missing grades, age validation)

**Advanced SQL Used**:
- Window functions (RANK, ROW_NUMBER)
- CTEs (Common Table Expressions)
- String aggregation (STRING_AGG)
- Complex JOINs (INNER, LEFT, self-joins)
- Subqueries

---

### ✅ Task 6: Google Apps Script Automation
**Deliverables**:
- REST API server (Express.js) with `/api/register-student` endpoint
- Google Apps Script with onEdit trigger
- Real-time auto-registration from Google Sheets
- Email notifications (success/failure)
- Visual feedback (row color highlighting)
- Duplicate detection (409 response)
- **Files**: [`api/server.js`](file:///e:/SCALER/Projects/Data-engineering-assignment/api/server.js), [`api/google-apps-script-FIXED.js`](file:///e:/SCALER/Projects/Data-engineering-assignment/api/google-apps-script-FIXED.js)

**Features**:
- **Smart Validation**: Course fields optional (supports student-only registration)
- **Grade Handling**: Converts numeric (95) to letter grade ("A")
- **Color Coding**: Green (success), Red (error), Yellow (duplicate)
- **Email Alerts**: Sent on registration success/failure
- **Transaction Safety**: All database ops in transactions
- **Error Handling**: 3-layer validation (Apps Script → API → Database)

**API Response Codes**:
- `201` - Student registered
- `400` - Validation error
- `409` - Duplicate email
- `500` - Server error

---

### ✅ Task 7: Public Dataset Practice & Optimizations
**Deliverables**:
- 2 datasets: Employees (clean, 25 records) + Sales (messy, 18 cleaned from 25)
- ETL pipelines for both datasets
- Database optimizations:
  - 7 indexes
  - 4 views
  - 2 materialized views
  - 3 stored procedures
- **Files**: [`etl/task7-etl-employees.js`](file:///e:/SCALER/Projects/Data-engineering-assignment/etl/task7-etl-employees.js), [`etl/task7-etl-sales.js`](file:///e:/SCALER/Projects/Data-engineering-assignment/etl/task7-etl-sales.js), [`sql/task7-optimizations.sql`](file:///e:/SCALER/Projects/Data-engineering-assignment/sql/task7-optimizations.sql)

**Messy Data Handling** (Sales dataset):
- Removed 1 duplicate
- Rejected 6 invalid records
- Parsed 3 date formats (ISO, US, European)
- Validated emails
- Normalized regions (SOUTH → South)
- Cleaned product names

**Optimizations Created**:
- Indexes on department, date, region, customer, product
- Views for department summary, sales by region, top products, rep performance
- Materialized views for monthly sales, department performance
- Functions for employee lookup, date range sales, department stats

---

### ✅ Task 8: Documentation
**Deliverables**:
- Complete Notion documentation for all 8 tasks
- Updated README.md with full project overview
- Screenshot checklists
- Code documentation throughout
- **Files**: [`docs/`](file:///e:/SCALER/Projects/Data-engineering-assignment/docs) folder with 7+ Notion pages

---

## 🗄️ Database Schema Summary

**Tables**: 4 (Department, Student, Course, Enrollment)  
**Normalization**: 3NF  
**Constraints**: 15+ (PK, FK, UNIQUE, CHECK, NOT NULL)  
**Indexes**: 12+ (including Task 7 optimizations)  
**Views**: 9 regular + 2 materialized  
**Procedures**: 6 stored functions

---

## 🚀 Key Technical Achievements

### ETL Pipeline
- **Modular**: 6 independent, reusable modules
- **Robust**: Handles 8+ data quality issues
- **Safe**: Transaction-based, all-or-nothing
- **Transparent**: Detailed logging
- **Reusable**: Used in Tasks 4, 6, and 7

### Auto-Registration API
- **Real-time**: Immediate registration on sheet edit
- **Validated**: Multi-layer validation
- **Flexible**: Supports student-only or student+course
- **User-friendly**: Visual feedback + email notifications
- **Reliable**: 100% success rate on valid data

### SQL Development
- **Comprehensive**: 17 queries covering all requirements
- **Optimized**: Indexes for performance
- **Reusable**: 5 views, 6 procedures
- **Advanced**: Window functions, CTEs, complex JOINs

---

## 🧪 Testing & Verification

### All Components Tested ✅
- Database connection (`tests/db-test.js`)
- Google Sheets API (`tests/sheets-test.js`)
- Schema validation (`tests/test-schema.js`)
- ETL data correctness (`tests/verify-etl-data.js`)
- API endpoints (`api/test-api.js`, `api/test-student-only.js`)
- End-to-end Google Sheets automation (manual testing)

---

## 📊 Statistics

- **Code Files**: 20+ JavaScript modules
- **SQL Files**: 7 files with 100+ queries
- **Documentation**: 8 comprehensive Notion pages
- **Data Processed**: 60+ records across 3 datasets
- **API Endpoints**: 2 (health check + registration)
- **Google Sheets Integration**: Fully automated with triggers

---

## 🔐 Security

- ✅ Credentials gitignored (`.env`, `JSONKEYFILE.json`)
- ✅ SSL/TLS encryption for all database connections
- ✅ Service account with minimal permissions
- ✅ SQL injection prevention (parameterized queries)
- ✅ Transaction-based integrity

---

## 💡 Key Learnings

1. **Data Quality**: Real data is messy - robust validation essential
2. **Modularity**: Reusable ETL components save time
3. **Transactions**: Critical for data integrity  
4. **Logging**: Detailed logs invaluable for debugging
5. **Optimization**: Indexes dramatically improve query performance
6. **Testing**: Comprehensive testing prevents production issues

---

## 📂 Quick Start

### Prerequisites
- Node.js v18+
- NeonDB account
- Google Cloud Project with Sheets API

### Installation
```bash
cd credentials
npm install
```

### Run ETL Pipeline
```bash
cd etl
node etl.js
```

### Start API Server
```bash
cd api
npm start
```

### Run Tests
```bash
cd tests
node db-test.js
node verify-etl-data.js
```

---

## 📧 Contact

For questions about this project, refer to the comprehensive Notion documentation in the `docs/` folder.

---

**Project Status**: ✅ **PRODUCTION READY**  
**All Tasks**: 8/8 Complete  
**Documentation**: Comprehensive  
**Code Quality**: Production-grade with error handling and logging
