-- =====================================================
-- seed.sql
-- Project: sheet-to-neonDB-etl
-- Database: PostgreSQL (NeonDB)
-- Purpose: Insert clean sample data for testing
-- =====================================================

-- Clear existing data (optional - use for fresh start)
TRUNCATE TABLE enrollment, course, student, department RESTART IDENTITY CASCADE;

-- =====================================================
-- Insert Departments
-- =====================================================
INSERT INTO department (department_name, department_head) VALUES
  ('Computer Science', 'Dr. Alan Turing'),
  ('Mathematics', 'Dr. Emmy Noether'),
  ('Physics', 'Dr. Marie Curie');

-- =====================================================
-- Insert Students
-- =====================================================-- Sample students with Indian phone numbers
INSERT INTO student (student_first_name, student_last_name, student_email, student_date_of_birth, student_year, student_phone_number, department_id) VALUES
('Raj', 'Kumar', 'raj.kumar@university.edu', '2004-03-15', 2, '9876543210', 1),
('Priya', 'Sharma', 'priya.sharma@university.edu', '2003-07-22', 3, '8765432109', 1),
('Amit', 'Patel', 'amit.patel@university.edu', '2005-01-10', 1, '7654321098', 2),
('Sneha', 'Reddy', 'sneha.reddy@university.edu', '2004-09-05', 2, '9543210987', 3),
('Vikram', 'Singh', 'vikram.singh@university.edu', '2003-11-20', 3, '8432109876', 1),
('Ananya', 'Iyer', 'ananya.iyer@university.edu', '2004-06-12', 2, '7321098765', 4),
('Rohan', 'Gupta', 'rohan.gupta@university.edu', '2005-02-28', 1, '9210987654', 2),
('Kavya', 'Nair', 'kavya.nair@university.edu', '2003-12-08', 3, '8109876543', 5),
('Arjun', 'Mehta', 'arjun.mehta@university.edu', '2004-04-18', 2, '7098765432', 1),
('Diya', 'Shah', 'diya.shah@university.edu', '2005-08-25', 1, '9987654321', 3),
('Karthik', 'Rao', 'karthik.rao@university.edu', '2003-05-30', 3, '8876543219', 2),
('Ishita', 'Verma', 'ishita.verma@university.edu', '2004-10-14', 2, '7765432108', 4);

-- =====================================================
-- Insert Courses
-- =====================================================
INSERT INTO course (course_name, department_id, course_credits) VALUES
  ('Data Structures', 1, 4),
  ('Algorithms', 1, 3),
  ('Database Systems', 1, 4),
  ('Web Development', 1, 3),
  ('Machine Learning', 1, 3),
  ('Operating Systems', 1, 4),
  ('Calculus I', 2, 4),
  ('Linear Algebra', 2, 3),
  ('Statistics', 2, 3),
  ('Calculus II', 2, 4),
  ('Quantum Mechanics', 3, 3),
  ('Classical Mechanics', 3, 4);

-- =====================================================
-- Insert Enrollments
-- =====================================================
INSERT INTO enrollment (student_id, course_id, enrollment_date, grade) VALUES
  -- John Doe (CS Junior)
  (1, 1, '2024-01-15', 'A'),
  (1, 3, '2024-01-15', 'B'),
  
  -- Jane Smith (CS Sophomore)
  (2, 2, '2024-01-20', 'A'),
  (2, 4, '2024-01-20', 'A-'),
  
  -- Michael Johnson (Math Freshman)
  (3, 7, '2024-02-01', 'C'),
  (3, 9, '2024-02-01', 'B'),
  
  -- Emily Davis (Physics Senior)
  (4, 11, '2024-01-20', 'F'),
  
  -- Sarah Wilson (CS Junior)
  (5, 4, '2024-03-15', 'A'),
  (5, 5, '2024-03-15', 'B'),
  
  -- David Brown (CS Freshman)
  (6, 1, '2024-02-10', 'A'),
  
  -- Lisa Anderson (Math Senior)
  (7, 8, '2024-02-10', 'A'),
  (7, 9, '2024-02-10', 'B'),
  
  -- Robert Taylor (Physics Sophomore)
  (8, 12, '2024-01-25', 'A'),
  
  -- Jennifer Martinez (CS Senior)
  (9, 5, '2024-03-01', NULL),  -- Grade not yet assigned
  (9, 6, '2024-03-01', 'A-'),
  
  -- Emma White (CS Junior)
  (10, 2, '2024-01-28', 'A'),
  
  -- James Clark (Physics Sophomore)
  (11, 12, '2024-02-15', 'C'),
  
  -- Sophia Lee (Math Freshman)
  (12, 9, '2024-03-10', 'A'),
  
  -- Oliver Harris (CS Freshman)
  (13, 6, '2024-04-01', 'D'),
  
  -- Ava Lewis (Math Freshman)
  (14, 10, '2024-02-20', 'B');

-- =====================================================
-- Verification Queries
-- =====================================================

-- Count records in each table
SELECT 'Departments' as table_name, COUNT(*) as record_count FROM department
UNION ALL
SELECT 'Students', COUNT(*) FROM student
UNION ALL
SELECT 'Courses', COUNT(*) FROM course
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM enrollment;

-- =====================================================
-- End of seed.sql
-- =====================================================
