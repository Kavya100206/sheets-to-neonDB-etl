-- =====================================================
-- optimization.sql
-- Task 5: Query Optimization with Indexes
-- =====================================================

-- =====================================================
-- PART 1: ANALYZE QUERY PERFORMANCE (BEFORE INDEXES)
-- =====================================================

-- Explain Query 1: Find student by email (without index)
EXPLAIN ANALYZE
SELECT * FROM student WHERE student_email = 'john.doe@email.com';
-- Expected: Seq Scan (scans entire table)


-- Explain Query 2: Find enrollments for a student
EXPLAIN ANALYZE
SELECT e.*, c.course_name 
FROM enrollment e
JOIN course c ON e.course_id = c.course_id
WHERE e.student_id = 1;
-- Expected: Seq Scan on enrollment


-- Explain Query 3: Students in a department
EXPLAIN ANALYZE
SELECT * FROM student WHERE department_id = 1;
-- Expected: Seq Scan


-- =====================================================
-- PART 2: CREATE INDEXES
-- =====================================================

-- Index 1: Student email (frequently searched)
CREATE INDEX IF NOT EXISTS idx_student_email 
ON student(student_email);

-- Index 2: Student department (for JOINs and filtering)
CREATE INDEX IF NOT EXISTS idx_student_department 
ON student(department_id);

-- Index 3: Enrollment student_id (for JOINs)
CREATE INDEX IF NOT EXISTS idx_enrollment_student 
ON enrollment(student_id);

-- Index 4: Enrollment course_id (for JOINs)
CREATE INDEX IF NOT EXISTS idx_enrollment_course 
ON enrollment(course_id);

-- Index 5: Course department_id (for JOINs)
CREATE INDEX IF NOT EXISTS idx_course_department 
ON course(department_id);

-- Index 6: Composite index for enrollment lookups
CREATE INDEX IF NOT EXISTS idx_enrollment_student_course 
ON enrollment(student_id, course_id);


-- =====================================================
-- PART 3: ANALYZE QUERY PERFORMANCE (AFTER INDEXES)
-- =====================================================

-- Explain Query 1: Find student by email (WITH index)
EXPLAIN ANALYZE
SELECT * FROM student WHERE student_email = 'john.doe@email.com';
-- Expected: Index Scan using idx_student_email (FASTER!)


-- Explain Query 2: Find enrollments for a student (WITH index)
EXPLAIN ANALYZE
SELECT e.*, c.course_name 
FROM enrollment e
JOIN course c ON e.course_id = c.course_id
WHERE e.student_id = 1;
-- Expected: Index Scan using idx_enrollment_student


-- Explain Query 3: Students in a department (WITH index)
EXPLAIN ANALYZE
SELECT * FROM student WHERE department_id = 1;
-- Expected: Index Scan using idx_student_department


-- =====================================================
-- PART 4: VIEW ALL INDEXES
-- =====================================================

-- List all indexes on our tables
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


-- =====================================================
-- PART 5: INDEX MAINTENANCE
-- =====================================================

-- Analyze tables (updates statistics for query planner)
ANALYZE student;
ANALYZE department;
ANALYZE course;
ANALYZE enrollment;

-- Reindex if needed (rebuilds indexes)
-- REINDEX TABLE student;


-- =====================================================
-- PART 6: DROP INDEXES (if needed)
-- =====================================================

-- Uncomment to drop indexes:
-- DROP INDEX IF EXISTS idx_student_email;
-- DROP INDEX IF EXISTS idx_student_department;
-- DROP INDEX IF EXISTS idx_enrollment_student;
-- DROP INDEX IF EXISTS idx_enrollment_course;
-- DROP INDEX IF EXISTS idx_course_department;
-- DROP INDEX IF EXISTS idx_enrollment_student_course;