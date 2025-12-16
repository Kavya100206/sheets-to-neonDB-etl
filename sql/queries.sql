-- =====================================================
-- queries.sql
-- Task 5: SQL Development & Optimization
-- =====================================================

-- =====================================================
-- PART 1: BASIC QUERIES
-- =====================================================

-- Query 1: Count records in each table
SELECT 'Students' as table_name, COUNT(*) as count FROM student
UNION ALL
SELECT 'Departments', COUNT(*) FROM department
UNION ALL
SELECT 'Courses', COUNT(*) FROM course
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM enrollment;
-- Purpose: Quick overview of database size


-- Query 2: Students by department (with GROUP BY)
SELECT 
    d.department_name,
    COUNT(s.student_id) as student_count
FROM department d
LEFT JOIN student s ON d.department_id = s.department_id
GROUP BY d.department_id, d.department_name
ORDER BY student_count DESC;
-- Purpose: See which department is most popular


-- Query 3: Students by year
SELECT 
    student_year,
    CASE student_year
        WHEN 1 THEN 'Freshman'
        WHEN 2 THEN 'Sophomore'
        WHEN 3 THEN 'Junior'
        WHEN 4 THEN 'Senior'
    END as year_name,
    COUNT(*) as student_count
FROM student
GROUP BY student_year
ORDER BY student_year;
-- Purpose: Understand year distribution


-- Query 4: Find Computer Science students
SELECT 
    student_first_name, 
    student_last_name, 
    student_email
FROM student s
JOIN department d ON s.department_id = d.department_id
WHERE d.department_name = 'Computer Science';
-- Purpose: Filter by department name


-- Query 5: Courses with 4 credits
SELECT course_name, department_id
FROM course
WHERE course_credits = 4
ORDER BY course_name;
-- Purpose: Filter courses by credit hours

-- =====================================================
-- PART 2: JOIN QUERIES
-- =====================================================

-- Query 6: Students with their department names (INNER JOIN)
SELECT 
    s.student_first_name || ' ' || s.student_last_name as full_name,
    s.student_email,
    d.department_name,
    s.student_year
FROM student s
INNER JOIN department d ON s.department_id = d.department_id
ORDER BY d.department_name, s.student_last_name;
-- Purpose: See student roster with department information


-- Query 7: Complete enrollment details (3-table JOIN)
SELECT 
    s.student_first_name || ' ' || s.student_last_name as student_name,
    c.course_name,
    c.course_credits,
    e.grade,
    e.enrollment_date,
    d.department_name
FROM enrollment e
JOIN student s ON e.student_id = s.student_id
JOIN course c ON e.course_id = c.course_id
JOIN department d ON s.department_id = d.department_id
ORDER BY s.student_last_name, c.course_name;
-- Purpose: Full enrollment report with all details


-- Query 8: Students with NO enrollments (LEFT JOIN)
SELECT 
    s.student_first_name || ' ' || s.student_last_name as student_name,
    s.student_email,
    d.department_name
FROM student s
JOIN department d ON s.department_id = d.department_id
LEFT JOIN enrollment e ON s.student_id = e.student_id
WHERE e.enrollment_id IS NULL;
-- Purpose: Find students who haven't enrolled in any courses


-- Query 9: Courses with NO enrollments
SELECT 
    c.course_name,
    c.course_credits,
    d.department_name
FROM course c
JOIN department d ON c.department_id = d.department_id
LEFT JOIN enrollment e ON c.course_id = e.course_id
WHERE e.enrollment_id IS NULL;
-- Purpose: Find courses with no students enrolled


-- Query 10: Student enrollment count
SELECT 
    s.student_first_name || ' ' || s.student_last_name as student_name,
    d.department_name,
    COUNT(e.enrollment_id) as course_count
FROM student s
JOIN department d ON s.department_id = d.department_id
LEFT JOIN enrollment e ON s.student_id = e.student_id
GROUP BY s.student_id, s.student_first_name, s.student_last_name, d.department_name
ORDER BY course_count DESC, student_name;
-- Purpose: How many courses each student is taking



-- =====================================================
-- PART 3: BUSINESS REPORTS
-- =====================================================

-- Query 11: Department Performance Dashboard
SELECT 
    d.department_name,
    d.department_head,
    COUNT(DISTINCT s.student_id) as total_students,
    COUNT(DISTINCT c.course_id) as courses_offered,
    COUNT(e.enrollment_id) as total_enrollments,
    ROUND(AVG(c.course_credits), 2) as avg_course_credits
FROM department d
LEFT JOIN student s ON d.department_id = s.department_id
LEFT JOIN course c ON d.department_id = c.department_id
LEFT JOIN enrollment e ON c.course_id = e.course_id
GROUP BY d.department_id, d.department_name, d.department_head
ORDER BY total_students DESC;
-- Purpose: Executive summary of each department


-- Query 12: Grade Distribution Report
SELECT 
    c.course_name,
    COUNT(e.enrollment_id) as total_enrolled,
    COUNT(CASE WHEN e.grade IN ('A', 'A-') THEN 1 END) as a_grades,
    COUNT(CASE WHEN e.grade IN ('B', 'B-') THEN 1 END) as b_grades,
    COUNT(CASE WHEN e.grade IN ('C', 'C-') THEN 1 END) as c_grades,
    COUNT(CASE WHEN e.grade IN ('D', 'F') THEN 1 END) as d_f_grades,
    ROUND(COUNT(CASE WHEN e.grade IN ('A', 'A-') THEN 1 END)::decimal / 
          NULLIF(COUNT(e.enrollment_id), 0) * 100, 2) as percent_a
FROM course c
LEFT JOIN enrollment e ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_name
HAVING COUNT(e.enrollment_id) > 0
ORDER BY total_enrolled DESC;
-- Purpose: See grade distribution per course


-- Query 13: Student Transcript (like a report card)
SELECT 
    s.student_first_name || ' ' || s.student_last_name as student_name,
    s.student_email,
    d.department_name,
    s.student_year,
    STRING_AGG(c.course_name || ' (' || COALESCE(e.grade, 'In Progress') || ')', ', ' 
               ORDER BY c.course_name) as courses_and_grades,
    COUNT(e.enrollment_id) as total_courses,
    SUM(c.course_credits) as total_credits
FROM student s
JOIN department d ON s.department_id = d.department_id
LEFT JOIN enrollment e ON s.student_id = e.student_id
LEFT JOIN course c ON e.course_id = c.course_id
GROUP BY s.student_id, s.student_first_name, s.student_last_name, 
         s.student_email, d.department_name, s.student_year
ORDER BY s.student_last_name;
-- Purpose: Complete academic record per student


-- Query 14: Most Popular Courses
SELECT 
    c.course_name,
    d.department_name,
    c.course_credits,
    COUNT(e.enrollment_id) as enrollment_count,
    RANK() OVER (ORDER BY COUNT(e.enrollment_id) DESC) as popularity_rank
FROM course c
JOIN department d ON c.department_id = d.department_id
LEFT JOIN enrollment e ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_name, d.department_name, c.course_credits
ORDER BY enrollment_count DESC;
-- Purpose: Find most and least popular courses


-- =====================================================
-- PART 4: DUPLICATE DETECTION & DATA QUALITY
-- =====================================================

-- Query 15: Detect duplicate emails (if any exist)
SELECT 
    student_email, 
    COUNT(*) as duplicate_count
FROM student
GROUP BY student_email
HAVING COUNT(*) > 1;
-- Purpose: Find any duplicate email addresses in database


-- Query 16: Find students under 16 years old (validation check)
SELECT 
    student_first_name || ' ' || student_last_name as student_name,
    student_email,
    student_date_of_birth,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, student_date_of_birth)) as age
FROM student
WHERE student_date_of_birth > CURRENT_DATE - INTERVAL '16 years';
-- Purpose: Data quality check - students should be 16+


-- Query 17: Enrollments with missing grades
SELECT 
    s.student_first_name || ' ' || s.student_last_name as student_name,
    c.course_name,
    e.enrollment_date,
    e.grade
FROM enrollment e
JOIN student s ON e.student_id = s.student_id
JOIN course c ON e.course_id = c.course_id
WHERE e.grade IS NULL;
-- Purpose: Find courses where grades haven't been assigned yet