-- =====================================================
-- views.sql
-- Task 5: Reusable Views
-- =====================================================

-- View 1: Student Details (combines student + department)
CREATE OR REPLACE VIEW student_details AS
SELECT 
    s.student_id,
    s.student_first_name,
    s.student_last_name,
    s.student_first_name || ' ' || s.student_last_name as full_name,
    s.student_email,
    s.student_date_of_birth,
    s.student_year,
    CASE s.student_year
        WHEN 1 THEN 'Freshman'
        WHEN 2 THEN 'Sophomore'
        WHEN 3 THEN 'Junior'
        WHEN 4 THEN 'Senior'
    END as year_name,
    s.student_phone_number,
    d.department_id,
    d.department_name,
    d.department_head
FROM student s
JOIN department d ON s.department_id = d.department_id;

-- Usage: SELECT * FROM student_details WHERE department_name = 'Computer Science';


-- View 2: Enrollment Summary (student + course + grade)
CREATE OR REPLACE VIEW enrollment_summary AS
SELECT 
    e.enrollment_id,
    s.student_id,
    s.student_first_name || ' ' || s.student_last_name as student_name,
    s.student_email,
    c.course_id,
    c.course_name,
    c.course_credits,
    e.grade,
    e.enrollment_date,
    d.department_name
FROM enrollment e
JOIN student s ON e.student_id = s.student_id
JOIN course c ON e.course_id = c.course_id
JOIN department d ON s.department_id = d.department_id;

-- Usage: SELECT * FROM enrollment_summary WHERE grade IN ('A', 'A-');


-- View 3: Department Statistics
CREATE OR REPLACE VIEW department_stats AS
SELECT 
    d.department_id,
    d.department_name,
    d.department_head,
    COUNT(DISTINCT s.student_id) as total_students,
    COUNT(DISTINCT c.course_id) as total_courses,
    COUNT(e.enrollment_id) as total_enrollments,
    ROUND(AVG(c.course_credits), 2) as avg_course_credits
FROM department d
LEFT JOIN student s ON d.department_id = s.department_id
LEFT JOIN course c ON d.department_id = c.department_id
LEFT JOIN enrollment e ON s.student_id = e.student_id
GROUP BY d.department_id, d.department_name, d.department_head;

-- Usage: SELECT * FROM department_stats ORDER BY total_students DESC;


-- View 4: Course Roster (which students are in each course)
CREATE OR REPLACE VIEW course_roster AS
SELECT 
    c.course_id,
    c.course_name,
    c.course_credits,
    d.department_name,
    COUNT(e.enrollment_id) as enrolled_students,
    STRING_AGG(s.student_first_name || ' ' || s.student_last_name, ', ' 
               ORDER BY s.student_last_name) as student_list
FROM course c
JOIN department d ON c.department_id = d.department_id
LEFT JOIN enrollment e ON c.course_id = e.course_id
LEFT JOIN student s ON e.student_id = s.student_id
GROUP BY c.course_id, c.course_name, c.course_credits, d.department_name;

-- Usage: SELECT * FROM course_roster WHERE enrolled_students > 0;


-- View 5: Student Academic Summary (transcript view)
CREATE OR REPLACE VIEW student_transcript AS
SELECT 
    s.student_id,
    s.student_first_name || ' ' || s.student_last_name as student_name,
    s.student_email,
    d.department_name,
    s.student_year,
    COUNT(e.enrollment_id) as courses_enrolled,
    COALESCE(SUM(c.course_credits), 0) as total_credits,
    COUNT(CASE WHEN e.grade IN ('A', 'A-') THEN 1 END) as a_grades,
    COUNT(CASE WHEN e.grade IN ('B', 'B-') THEN 1 END) as b_grades,
    COUNT(CASE WHEN e.grade IN ('C', 'C-') THEN 1 END) as c_grades,
    COUNT(CASE WHEN e.grade IN ('D', 'F') THEN 1 END) as failing_grades
FROM student s
JOIN department d ON s.department_id = d.department_id
LEFT JOIN enrollment e ON s.student_id = e.student_id
LEFT JOIN course c ON e.course_id = c.course_id
GROUP BY s.student_id, s.student_first_name, s.student_last_name, 
         s.student_email, d.department_name, s.student_year;

-- Usage: SELECT * FROM student_transcript WHERE failing_grades > 0;


-- =====================================================
-- View Testing Queries
-- =====================================================

-- Test all views
SELECT 'student_details' as view_name, COUNT(*) as row_count FROM student_details
UNION ALL
SELECT 'enrollment_summary', COUNT(*) FROM enrollment_summary
UNION ALL
SELECT 'department_stats', COUNT(*) FROM department_stats
UNION ALL
SELECT 'course_roster', COUNT(*) FROM course_roster
UNION ALL
SELECT 'student_transcript', COUNT(*) FROM student_transcript;