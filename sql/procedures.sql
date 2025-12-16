-- =====================================================
-- procedures.sql
-- Task 5: Stored Procedures
-- =====================================================

-- Procedure 1: Get student information by email
CREATE OR REPLACE PROCEDURE get_student_by_email(
    p_email VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Return student details with enrollments
    SELECT 
        s.student_first_name || ' ' || s.student_last_name as student_name,
        s.student_email,
        d.department_name,
        s.student_year,
        COUNT(e.enrollment_id) as total_enrollments
    FROM student s
    JOIN department d ON s.department_id = d.department_id
    LEFT JOIN enrollment e ON s.student_id = e.student_id
    WHERE s.student_email = p_email
    GROUP BY s.student_id, s.student_first_name, s.student_last_name, 
             s.student_email, d.department_name, s.student_year;
END;
$$;

-- Usage: CALL get_student_by_email('john.doe@email.com');


-- Procedure 2: Get department statistics
CREATE OR REPLACE FUNCTION get_department_stats(p_department_name VARCHAR)
RETURNS TABLE (
    department_name VARCHAR,
    total_students BIGINT,
    total_courses BIGINT,
    total_enrollments BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.department_name,
        COUNT(DISTINCT s.student_id) as total_students,
        COUNT(DISTINCT c.course_id) as total_courses,
        COUNT(e.enrollment_id) as total_enrollments
    FROM department d
    LEFT JOIN student s ON d.department_id = s.department_id
    LEFT JOIN course c ON d.department_id = c.department_id
    LEFT JOIN enrollment e ON s.student_id = e.student_id
    WHERE d.department_name = p_department_name
    GROUP BY d.department_name;
END;
$$;

-- Usage: SELECT * FROM get_department_stats('Computer Science');


-- Procedure 3: Get course enrollment summary
CREATE OR REPLACE FUNCTION get_course_summary(p_course_name VARCHAR)
RETURNS TABLE (
    course_name VARCHAR,
    enrolled_students BIGINT,
    avg_grade VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.course_name,
        COUNT(e.enrollment_id) as enrolled_students,
        MODE() WITHIN GROUP (ORDER BY e.grade) as avg_grade
    FROM course c
    LEFT JOIN enrollment e ON c.course_id = e.course_id
    WHERE c.course_name = p_course_name
    GROUP BY c.course_name;
END;
$$;

-- Usage: SELECT * FROM get_course_summary('Data Structures');