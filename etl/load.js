/**
 * load.js
 * Loads transformed data into PostgreSQL with transaction management
 */

import pkg from 'pg';
const { Client } = pkg;
import config from './config.js';

/**
 * Main load function - coordinates all database inserts
 */
export async function loadData(entities, logger) {
  const client = new Client({
    connectionString: config.database.connectionString,
    ssl: config.database.ssl
  });

  try {
    // STEP 1: Connect to database
    await client.connect();
    logger.log('LOAD', 'Connected to database');

    // STEP 2: Start transaction
    await client.query('BEGIN');
    logger.log('LOAD', 'Transaction started');

    // STEP 3: Clear existing data (for clean re-runs)
    await client.query('TRUNCATE TABLE enrollment, course, student, department RESTART IDENTITY CASCADE');
    logger.log('LOAD', 'Cleared existing data');

    // STEP 4: Load in dependency order
    const deptMap = await loadDepartments(client, entities.departments, logger);
    const studentMap = await loadStudents(client, entities.students, deptMap, logger);
    const courseMap = await loadCourses(client, entities.courses, deptMap, logger);
    await loadEnrollments(client, entities.enrollments, studentMap, courseMap, logger);

    // STEP 5: Commit transaction
    await client.query('COMMIT');
    logger.log('LOAD', '✅ Transaction committed successfully');

  } catch (error) {
    // STEP 6: Rollback on error
    await client.query('ROLLBACK');
    logger.log('LOAD', '❌ Transaction rolled back due to error');
    throw error;
  } finally {
    // STEP 7: Always close connection
    await client.end();
  }
}

/**
 * Load departments and return ID mapping
 */
async function loadDepartments(client, departments, logger) {
  if (departments.length === 0) return {};

  // Build batch INSERT query
  const values = [];
  const params = [];
  let paramIndex = 1;

  departments.forEach(dept => {
    values.push(`($${paramIndex++}, $${paramIndex++})`);
    params.push(dept.name, dept.head);
  });

  const query = `
    INSERT INTO department (department_name, department_head)
    VALUES ${values.join(', ')}
    RETURNING department_id, department_name
  `;

  const result = await client.query(query, params);

  // Create mapping: name → ID
  const deptMap = {};
  result.rows.forEach(row => {
    deptMap[row.department_name] = row.department_id;
  });

  logger.logLoad('departments', result.rows.length);
  return deptMap;
}

/**
 * Load students and return ID mapping
 */
async function loadStudents(client, students, deptMap, logger) {
  if (students.length === 0) return {};

  // Build batch INSERT query
  const values = [];
  const params = [];
  let paramIndex = 1;

  students.forEach(student => {
values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);    params.push(
      student.first_name,
      student.last_name,
      student.email,
      student.date_of_birth,
      student.year,
      student.phone_number,
      deptMap[student.department]  // ← Use department ID from mapping
    );
  });

  const query = `
    INSERT INTO student (
      student_first_name,
      student_last_name,
      student_email,
      student_date_of_birth,
      student_year,
      student_phone_number,
      department_id
    )
    VALUES ${values.join(', ')}
    RETURNING student_id, student_email
  `;

  const result = await client.query(query, params);

  // Create mapping: email → ID
  const studentMap = {};
  result.rows.forEach(row => {
    studentMap[row.student_email] = row.student_id;
  });

  logger.logLoad('students', result.rows.length);
  return studentMap;
}

/**
 * Load courses and return ID mapping
 */
async function loadCourses(client, courses, deptMap, logger) {
  if (courses.length === 0) return {};

  const values = [];
  const params = [];
  let paramIndex = 1;

  courses.forEach(course => {
values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);    params.push(
      course.name,
      deptMap[course.department],  // ← Use department ID
      course.credits
    );
  });

  const query = `
    INSERT INTO course (course_name, department_id, course_credits)
    VALUES ${values.join(', ')}
    RETURNING course_id, course_name
  `;

  const result = await client.query(query, params);

  // Create mapping: name → ID
  const courseMap = {};
  result.rows.forEach(row => {
    courseMap[row.course_name] = row.course_id;
  });

  logger.logLoad('courses', result.rows.length);
  return courseMap;
}

/**
 * Load enrollments (junction table)
 */
async function loadEnrollments(client, enrollments, studentMap, courseMap, logger) {
  if (enrollments.length === 0) return;

  const values = [];
  const params = [];
  let paramIndex = 1;

  enrollments.forEach(enrollment => {
    const studentId = studentMap[enrollment.student_email];
    const courseId = courseMap[enrollment.course_name];

    // Skip if IDs not found (shouldn't happen after validation)
    if (!studentId || !courseId) {
      logger.log('WARN', `Skipping enrollment: ${enrollment.student_email} → ${enrollment.course_name}`);
      return;
    }

values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
    params.push(studentId, courseId, enrollment.enrollment_date, enrollment.grade);
  });

  if (values.length === 0) return;

  const query = `
    INSERT INTO enrollment (student_id, course_id, enrollment_date, grade)
    VALUES ${values.join(', ')}
  `;

  const result = await client.query(query, params);

  logger.logLoad('enrollments', result.rowCount);
}