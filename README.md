# Google Sheets to NeonDB ETL Pipeline

A production-ready data engineering solution that automates the migration of Google Sheets data to PostgreSQL, featuring real-time synchronization, comprehensive data cleaning, and performance-optimized analytics.

---

## What This Project Does

This ETL pipeline solves a common data engineering challenge: transforming messy, unstructured spreadsheet data into a clean, normalized relational database with automated workflows and real-time capabilities.

**Key Capabilities:**
-  Automated data extraction from Google Sheets
-  Robust data cleaning and validation (handles 8+ data quality issues)
-  Real-time auto-registration with instant feedback
-  Performance-optimized SQL queries and database design
-  Email notifications and visual feedback system
-  RESTful API for programmatic access

---

## Architecture

```
Google Sheets / CSV Data
        ↓
   Extract Layer
   (Google Sheets API)
        ↓
  Transform Layer
  (Data Cleaning & Validation)
        ↓
    Load Layer
   (PostgreSQL Transactions)
        ↓
   NeonDB (PostgreSQL)
        ↓
   Analytics & Reports
```

**Tech Stack:**
- **Database**: PostgreSQL (NeonDB Cloud)
- **Backend**: Node.js + Express.js
- **ETL**: Custom JavaScript modules
- **APIs**: Google Sheets API, REST API
- **Automation**: Google Apps Script

---

## Project Structure

```
Data-engineering-assignment/
├── database/             
│   ├── schema.sql       
│   └── seed.sql          
├── etl/                   
│   ├── extract.js        
│   ├── transform.js     
│   ├── load.js           
│   ├── logger.js
│   ├── config.js         
│   ├── etl.js            
│   ├── task7-etl-employees.js     
│   ├── task7-etl-sales.js         
│   └── data/             # CSV datasets for testing
├── api/                  
│   ├── server.js         
│   ├── google-apps-script-FIXED.js 
│   ├── test-api.js      
│   └── test-student-only.js
├── sql/                   
│   ├── queries.sql      
│   ├── views.sql       
│   ├── procedures.sql   
│   ├── optimization.sql 
│   ├── task7-schema.sql          
│   └── task7-optimizations.sql   
├── tests/               
│   ├── db-test.js        
│   ├── sheets-test.js    
│   ├── test-schema.js    
│   └── verify-etl-data.js 
├── credentials/           
│   ├── .env             
│   ├── JSONKEYFILE.json  
│   ├── package.json
│   └── node_modules/
├── .gitignore
└── README.md
```

---

## Key Features

### 1. Intelligent Data Transformation

The ETL pipeline handles real-world messy data with comprehensive cleaning:

- **Date Normalization**: Parses 3 different date formats (ISO, US, European)
- **Type Conversion**: Handles text-to-number ("Freshman" → 1, numeric grades → letter grades)
- **Deduplication**: Intelligent duplicate detection by email
- **Validation**: Multi-layer validation (email format, age verification, field constraints)
- **Data Normalization**: Department abbreviations, phone formatting, region capitalization

**Example Transformation:**
```
Input:  "Freshman", "95", "CS", "12/20/1999"
Output: 1, "A", "Computer Science", "1999-12-20"
```

### 2. Real-Time Auto-Registration System

Google Sheets integration with instant database synchronization:

- **Trigger-Based**: Automatic execution on sheet edits
- **Visual Feedback**: Row color coding (🟢 Success / 🔴 Error / 🟡 Duplicate)
- **Email Notifications**: Sent on registration success/failure
- **Smart Validation**: Optional course enrollment, flexible data requirements
- **Response Time**: <2 seconds from edit to database

**Workflow:**
```
User edits Google Sheet
  ↓ onEdit trigger
Apps Script validates
  ↓ HTTP POST
REST API validates
  ↓ Transaction
NeonDB updated
  ↓ Response
Visual feedback + Email sent
```

### 3. Production-Grade Database Design

**Normalized Schema (3NF):**
- 4 tables: Department, Student, Course, Enrollment
- 15+ constraints (PK, FK, UNIQUE, CHECK, NOT NULL)
- 12+ performance indexes
- 9 views + 2 materialized views
- 6 stored procedures

**Key Design Decisions:**
- Auto-incrementing primary keys (SERIAL)
- ON DELETE CASCADE for referential integrity
- CHECK constraints for data validation
- Composite unique constraints to prevent duplicates
- Indexed foreign keys for join performance

### 4. Advanced SQL Analytics

**Query Capabilities:**
- Complex multi-table JOINs (up to 4 tables)
- Window functions (RANK, ROW_NUMBER)
- CTEs for readable complex queries
- Aggregations and statistical analysis
- Data quality checks and validation queries

**Performance Optimization:**
- **73% faster queries** with strategic indexing (45ms → 12ms)
- Materialized views for expensive aggregations
- Stored procedures for repeated operations
- EXPLAIN ANALYZE benchmarking

---

## 🔧 Technical Implementation

### ETL Pipeline (Modular Design)

**Extract** (`extract.js`)
- Google Sheets API authentication
- Service account integration
- Batch data retrieval

**Transform** (`transform.js` - 380 lines)
- Deduplication logic
- Date parsing (multiple formats)
- Field normalization
- Validation rules (16+ checks)
- Error tracking with row numbers

**Load** (`load.js`)
- Transaction-based insertion
- Batch loading
- Foreign key resolution
- Error handling and rollback

**Logger** (`logger.js`)
- Detailed operation logs
- Error tracking
- Performance metrics
- ETL report generation

### API Server

**RESTful Endpoints:**
- `GET /health` - Health check
- `POST /api/register-student` - Student registration

**Features:**
- Express.js framework
- Multi-layer validation
- Transaction safety
- Comprehensive error responses
- HTTP status codes (201, 400, 409, 500)

---

## Getting Started

### Prerequisites
```bash
Node.js v18+
PostgreSQL (NeonDB account)
Google Cloud Project with Sheets API enabled
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Kavya100206/sheets-to-neonDB-etl.git
cd sheets-to-neonDB-etl
```

2. **Install dependencies**
```bash
cd credentials && npm install
cd ../api && npm install
cd ../etl && npm install
cd ../tests && npm install
```

3. **Configure environment**
```bash
# Create credentials/.env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Add Google service account JSON
# Place JSONKEYFILE.json in credentials/
```

### Running the ETL Pipeline

```bash
cd etl
node etl.js
```

### Starting the API Server

```bash
cd api
npm start
```

Server runs on `http://localhost:3000`

### Running Tests

```bash
cd tests
node db-test.js           # Test database connection
node sheets-test.js       # Test Google Sheets API
node verify-etl-data.js   # Verify data integrity
```

---

## Use Cases

This project demonstrates real-world data engineering capabilities:

1. **Data Migration**: Moving from spreadsheets to structured databases
2. **Data Cleaning**: Handling messy, inconsistent real-world data
3. **Real-Time Sync**: Keeping databases synchronized with external sources
4. **API Development**: Building REST APIs for data access
5. **Database Optimization**: Performance tuning and query optimization
6. **Automation**: Event-driven workflows with Google Apps Script

---

## Security

- ✅ All credentials gitignored
- ✅ SSL/TLS encrypted database connections
- ✅ Parameterized SQL queries (SQL injection prevention)
- ✅ Service account with minimal permissions
- ✅ Transaction-based data integrity

---

## 🧪 Testing & Verification

**Automated Tests:**
- Database connectivity
- Google Sheets API authentication
- Schema validation
- Data integrity checks
- API endpoint testing

**Manual Verification:**
- End-to-end Google Sheets workflow
- Email notification delivery
- Visual feedback (row colors)
- Query performance benchmarks

---


