-- =====================================================
-- Task 7: Database Optimizations & Performance
-- =====================================================

-- =====================================================
-- PART 1: INDEXES (Performance Optimization)
-- =====================================================

-- Employee indexes
CREATE INDEX idx_task7_emp_department ON task7_employees(department);
CREATE INDEX idx_task7_emp_hire_date ON task7_employees(hire_date);
CREATE INDEX idx_task7_emp_salary ON task7_employees(salary);

-- Sales indexes
CREATE INDEX idx_task7_sales_date ON task7_sales(sale_date);
CREATE INDEX idx_task7_sales_region ON task7_sales(region);
CREATE INDEX idx_task7_sales_customer ON task7_sales(customer_name);
CREATE INDEX idx_task7_sales_product ON task7_sales(product_name);

-- =====================================================
-- PART 2: VIEWS (Reusable Queries)
-- =====================================================

-- View 1: Employee Department Summary
CREATE OR REPLACE VIEW task7_employee_summary AS
SELECT 
    department,
    COUNT(*) as employee_count,
    ROUND(AVG(salary), 2) as avg_salary,
    MIN(salary) as min_salary,
    MAX(salary) as max_salary,
    STRING_AGG(first_name || ' ' || last_name, ', ' ORDER BY last_name) as employees
FROM task7_employees
GROUP BY department
ORDER BY employee_count DESC;

-- View 2: Sales by Region
CREATE OR REPLACE VIEW task7_sales_by_region AS
SELECT 
    region,
    COUNT(*) as total_sales,
    SUM(quantity) as total_units,
    ROUND(SUM(quantity * unit_price), 2) as total_revenue,
    ROUND(AVG(quantity * unit_price), 2) as avg_sale_value
FROM task7_sales
GROUP BY region
ORDER BY total_revenue DESC;

-- View 3: Top Products
CREATE OR REPLACE VIEW task7_top_products AS
SELECT 
    product_name,
    COUNT(*) as times_sold,
    SUM(quantity) as total_units,
    ROUND(SUM(quantity * unit_price), 2) as total_revenue
FROM task7_sales
GROUP BY product_name
ORDER BY total_revenue DESC;

-- View 4: Sales Rep Performance
CREATE OR REPLACE VIEW task7_rep_performance AS
SELECT 
    sales_rep,
    COUNT(*) as total_sales,
    SUM(quantity) as units_sold,
    ROUND(SUM(quantity * unit_price), 2) as total_revenue,
    COUNT(DISTINCT customer_name) as unique_customers
FROM task7_sales
WHERE sales_rep IS NOT NULL
GROUP BY sales_rep
ORDER BY total_revenue DESC;

-- =====================================================
-- PART 2B: MATERIALIZED VIEWS (Performance Boost)
-- =====================================================
-- Materialized views store query results physically
-- Faster than regular views, updated via REFRESH

-- Materialized View 1: Monthly Sales Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS task7_monthly_sales AS
SELECT 
    DATE_TRUNC('month', sale_date) as month,
    region,
    COUNT(*) as total_sales,
    SUM(quantity) as total_units,
    ROUND(SUM(quantity * unit_price), 2) as total_revenue
FROM task7_sales
GROUP BY DATE_TRUNC('month', sale_date), region
ORDER BY month DESC, total_revenue DESC;

-- Materialized View 2: Department Performance Cache
CREATE MATERIALIZED VIEW IF NOT EXISTS task7_dept_performance AS
SELECT 
    department,
    COUNT(*) as employee_count,
    ROUND(AVG(salary), 2) as avg_salary,
    SUM(salary) as total_payroll,
    MIN(hire_date) as earliest_hire,
    MAX(hire_date) as latest_hire
FROM task7_employees
GROUP BY department
ORDER BY total_payroll DESC;

-- Refresh materialized views (run periodically or after data changes)
-- REFRESH MATERIALIZED VIEW task7_monthly_sales;
-- REFRESH MATERIALIZED VIEW task7_dept_performance;

-- =====================================================
-- PART 3: STORED PROCEDURES/FUNCTIONS
-- =====================================================

-- Function 1: Get employee details by email
CREATE OR REPLACE FUNCTION task7_get_employee(emp_email VARCHAR)
RETURNS TABLE (
    employee_id INT,
    full_name VARCHAR,
    email VARCHAR,
    job_title VARCHAR,
    salary DECIMAL,
    department VARCHAR,
    years_employed NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.employee_id,
        CAST(e.first_name || ' ' || e.last_name AS VARCHAR) as full_name,
        e.email,
        e.job_title,
        e.salary,
        e.department,
        ROUND(EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date))::numeric, 1)
    FROM task7_employees e
    WHERE e.email = emp_email;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Get sales by date range
CREATE OR REPLACE FUNCTION task7_sales_in_range(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    sale_date DATE,
    customer VARCHAR,
    product VARCHAR,
    quantity INT,
    revenue DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.sale_date,
        s.customer_name,
        s.product_name,
        s.quantity,
        ROUND((s.quantity * s.unit_price)::numeric, 2)
    FROM task7_sales s
    WHERE s.sale_date BETWEEN start_date AND end_date
    ORDER BY s.sale_date;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Department statistics
CREATE OR REPLACE FUNCTION task7_dept_stats(dept_name VARCHAR)
RETURNS TABLE (
    department VARCHAR,
    employee_count BIGINT,
    total_salary DECIMAL,
    avg_salary DECIMAL,
    avg_tenure NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        department,
        COUNT(*)::BIGINT,
        SUM(salary)::DECIMAL,
        ROUND(AVG(salary)::numeric, 2),
        ROUND(AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)))::numeric, 1)
    FROM task7_employees
    WHERE department = dept_name
    GROUP BY department;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 4: BENCHMARKING QUERIES
-- Run these BEFORE and AFTER creating indexes
-- =====================================================

-- Benchmark Query 1: Join with filter
-- Before optimization: Full table scan
-- After optimization: Uses indexes
SELECT 
    e.first_name,
    e.last_name,
    e.department,
    e.salary
FROM task7_employees e
WHERE e.department = 'Engineering'
  AND e.salary > 70000
ORDER BY e.salary DESC;

-- Benchmark Query 2: Date range with aggregation
-- Before optimization: Sequential scan
-- After optimization: Index scan on sale_date
SELECT 
    DATE_TRUNC('month', sale_date) as month,
    region,
    COUNT(*) as sales_count,
    SUM(quantity * unit_price) as revenue
FROM task7_sales
WHERE sale_date BETWEEN '2024-01-01' AND '2024-06-30'
GROUP BY DATE_TRUNC('month', sale_date), region
ORDER BY month, revenue DESC;

-- Benchmark Query 3: Complex aggregation
-- Tests view performance
SELECT * FROM task7_employee_summary
WHERE avg_salary > 70000;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check all indexes created
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename LIKE 'task7_%'
ORDER BY tablename, indexname;

-- Check all views created
SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE table_name LIKE 'task7_%';

-- Check all functions created
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name LIKE 'task7_%';

-- =====================================================
-- Sample Data Queries
-- =====================================================

-- Top 5 highest paid employees
SELECT 
    first_name || ' ' || last_name as name,
    job_title,
    department,
    salary
FROM task7_employees
ORDER BY salary DESC
LIMIT 5;

-- Monthly sales trend
SELECT 
    TO_CHAR(sale_date, 'YYYY-MM') as month,
    COUNT(*) as sales,
    SUM(quantity * unit_price) as revenue
FROM task7_sales
GROUP BY TO_CHAR(sale_date, 'YYYY-MM')
ORDER BY month;
