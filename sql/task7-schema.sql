-- =====================================================
-- Task 7: Public Dataset Schemas
-- Two datasets for ETL practice and optimization
-- =====================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS task7_sales CASCADE;
DROP TABLE IF EXISTS task7_employees CASCADE;

-- =====================================================
-- Dataset 1: Employees (Clean, Normalized)
-- =====================================================
CREATE TABLE task7_employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    hire_date DATE NOT NULL,
    job_title VARCHAR(100),
    salary DECIMAL(10,2) CHECK (salary > 0),
    department VARCHAR(100) NOT NULL,
    manager_name VARCHAR(200)
);

-- =====================================================
-- Dataset 2: Sales (Messy, needs cleaning)
-- =====================================================
CREATE TABLE task7_sales (
    sale_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(200) NOT NULL,
    customer_email VARCHAR(255),
    product_name VARCHAR(200) NOT NULL,
    quantity INTEGER CHECK (quantity > 0),
    unit_price DECIMAL(10,2) CHECK (unit_price > 0),
    sale_date DATE NOT NULL,
    region VARCHAR(100) NOT NULL,
    sales_rep VARCHAR(200)
);

-- =====================================================
-- Performance indexes (will add AFTER initial load)
-- See task7-optimizations.sql
-- =====================================================
