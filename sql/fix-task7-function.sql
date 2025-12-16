-- Fix for task7_get_employee function
-- Run this in NeonDB SQL editor

DROP FUNCTION IF EXISTS task7_get_employee(VARCHAR);

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
