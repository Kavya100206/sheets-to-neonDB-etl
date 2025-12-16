/**
 * server.js
 * REST API for auto-registration from Google Sheets to NeonDB
 * REUSES existing ETL logic for consistency
 */

import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import ETL modules (reuse existing logic!)
import { transformData } from '../etl/transform.js';
import { ETLLogger } from '../etl/logger.js';

const { Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../credentials/.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Auto-registration API is running' });
});

/**
 * Auto-registration endpoint
 * Uses existing ETL transform logic for validation
 */
app.post('/api/register-student', async (req, res) => {
    const studentData = req.body;

    console.log('📥 Received registration request:', studentData.Email);

    const logger = new ETLLogger();
    logger.start();

    try {
        // STEP 1: Transform using existing ETL logic
        // This handles all validation, normalization, deduplication
        const rawData = [studentData]; // Wrap in array for transform function
        const entities = transformData(rawData, logger);

        // Check if transformation was successful
        if (entities.students.length === 0) {
            // Validation failed - check logger for errors
            const errors = (logger.stats.validationErrors || []).map(e => e.errors).flat();
            console.log('❌ Validation failed:', errors.length > 0 ? errors : ['Unknown validation error']);

            return res.status(400).json({
                success: false,
                errors: errors,
                message: 'Validation failed'
            });
        }

        // STEP 2: Connect to database
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        try {
            // STEP 3: Check if student already exists
            const student = entities.students[0];
            const existingStudent = await client.query(
                'SELECT student_id FROM student WHERE student_email = $1',
                [student.email]
            );

            if (existingStudent.rows.length > 0) {
                await client.end();
                return res.status(409).json({
                    success: false,
                    message: 'Student already registered with this email',
                    studentId: existingStudent.rows[0].student_id
                });
            }

            // STEP 4: Insert using transaction (like ETL does)
            await client.query('BEGIN');

            // Get or create department
            let deptId;
            const existingDept = await client.query(
                'SELECT department_id FROM department WHERE department_name = $1',
                [student.department]
            );

            if (existingDept.rows.length > 0) {
                deptId = existingDept.rows[0].department_id;
            } else {
                const newDept = await client.query(
                    'INSERT INTO department (department_name) VALUES ($1) RETURNING department_id',
                    [student.department]
                );
                deptId = newDept.rows[0].department_id;
            }

            // Insert student
            const studentResult = await client.query(`
        INSERT INTO student (
          student_first_name, student_last_name, student_email,
          student_date_of_birth, student_year, student_phone_number, department_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING student_id, student_email
      `, [
                student.first_name,
                student.last_name,
                student.email,
                student.date_of_birth,
                student.year,
                student.phone_number,
                deptId
            ]);

            const studentId = studentResult.rows[0].student_id;

            // ✅ CONDITIONAL: Insert course and enrollment ONLY if course data provided
            if (entities.courses.length > 0 && entities.enrollments.length > 0) {
                const course = entities.courses[0];

                // Get or create course
                let courseId;
                const existingCourse = await client.query(
                    'SELECT course_id FROM course WHERE course_name = $1',
                    [course.name]
                );

                if (existingCourse.rows.length > 0) {
                    courseId = existingCourse.rows[0].course_id;
                } else {
                    const newCourse = await client.query(
                        'INSERT INTO course (course_name, department_id, course_credits) VALUES ($1, $2, $3) RETURNING course_id',
                        [course.name, deptId, course.credits]
                    );
                    courseId = newCourse.rows[0].course_id;
                }

                const enrollment = entities.enrollments[0];
                await client.query(`
          INSERT INTO enrollment (student_id, course_id, enrollment_date, grade)
          VALUES ($1, $2, $3, $4)
        `, [studentId, courseId, enrollment.enrollment_date, enrollment.grade]);

                console.log(`✅ Enrolled in course: ${course.name}`);
            } else {
                console.log(`ℹ️  Student-only registration (no course enrollment)`);
            }

            await client.query('COMMIT');
            await client.end();

            logger.finish();
            console.log(`✅ Student registered: ${student.email} (ID: ${studentId})`);

            res.status(201).json({
                success: true,
                message: 'Student registered successfully',
                studentId: studentId,
                email: studentResult.rows[0].student_email
            });

        } catch (dbError) {
            await client.query('ROLLBACK');
            await client.end();
            throw dbError;
        }

    } catch (error) {
        console.error('❌ Registration error:', error);
        logger.finish();

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 Auto-registration API running');
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📍 Registration endpoint: http://localhost:${PORT}/api/register-student`);
});