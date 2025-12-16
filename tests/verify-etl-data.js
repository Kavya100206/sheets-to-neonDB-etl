/**
 * verify-etl-data.js
 * Verify data integrity after ETL load
 */

import pkg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: "../credentials/.env" });

const { Client } = pkg;

async function verifyData() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✓ Connected to database\n');

        console.log('🔍 Data Verification Tests');
        console.log('─'.repeat(60));

        // Test 1: Table counts
        console.log('\n📊 Record Counts:');
        const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM department) as departments,
        (SELECT COUNT(*) FROM student) as students,
        (SELECT COUNT(*) FROM course) as courses,
        (SELECT COUNT(*) FROM enrollment) as enrollments
    `);

        const { departments, students, courses, enrollments } = counts.rows[0];
        console.log(`  Departments: ${departments}`);
        console.log(`  Students: ${students}`);
        console.log(`  Courses: ${courses}`);
        console.log(`  Enrollments: ${enrollments}`);

        // Test 2: Sample data
        console.log('\n📋 Sample Students:');
        const sampleStudents = await client.query(`
      SELECT s.student_first_name, s.student_last_name, s.student_email, d.department_name
      FROM student s
      JOIN department d ON s.department_id = d.department_id
      LIMIT 5
    `);

        sampleStudents.rows.forEach(row => {
            console.log(`  ${row.student_first_name} ${row.student_last_name} (${row.student_email}) - ${row.department_name}`);
        });

        // Test 3: Department breakdown
        console.log('\n🏫 Students per Department:');
        const deptBreakdown = await client.query(`
      SELECT d.department_name, COUNT(s.student_id) as student_count
      FROM department d
      LEFT JOIN student s ON d.department_id = s.department_id
      GROUP BY d.department_name
      ORDER BY student_count DESC
    `);

        deptBreakdown.rows.forEach(row => {
            console.log(`  ${row.department_name}: ${row.student_count} students`);
        });

        // Test 4: Sample enrollments with grades
        console.log('\n📚 Sample Enrollments:');
        const sampleEnrollments = await client.query(`
      SELECT 
        s.student_first_name || ' ' || s.student_last_name as student,
        c.course_name,
        e.grade
      FROM enrollment e
      JOIN student s ON e.student_id = s.student_id
      JOIN course c ON e.course_id = c.course_id
      LIMIT 5
    `);

        sampleEnrollments.rows.forEach(row => {
            console.log(`  ${row.student}: ${row.course_name} (Grade: ${row.grade || 'Not assigned'})`);
        });

        console.log('\n' + '─'.repeat(60));
        console.log('✅ Data verification complete!');

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

verifyData();
