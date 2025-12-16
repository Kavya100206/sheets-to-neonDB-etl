/**
 * transform.js
 * Transforms and cleans raw Google Sheets data
 */

import config from './config.js';


/**
 * MAIN TRANSFORM FUNCTION
 * Orchestrates all transformation steps
 */
export function transformData(rawData, logger) {
  logger.log('TRANSFORM', 'Starting transformation...');

  // STEP 1: Remove duplicates
  let data = removeDuplicates(rawData, logger);

  // STEP 2: Transform and validate each record
  const validRecords = [];

  data.forEach(record => {
    try {
      // Parse and normalize fields
      const transformed = {
        _rowIndex: record._rowIndex,
        FirstName: record.FirstName?.trim(),
        LastName: record.LastName?.trim(),
        Email: record.Email?.toLowerCase().trim(),
        DateOfBirth: parseDate(record.DateOfBirth),
        Year: normalizeYear(record.Year),
        PhoneNumber: record.PhoneNumber ? String(record.PhoneNumber).trim() : null,
        Department: normalizeDepartment(record.Department),
        Course: record.Course?.trim(),
        Credits: parseCredits(record.Credits),
        EnrollmentDate: parseDate(record.EnrollmentDate),
        Grade: normalizeGrade(record.Grade)
      };

      // Validate
      const validation = validateRecord(transformed);

      if (validation.isValid) {
        validRecords.push(transformed);
      } else {
        logger.logValidationError(record._rowIndex, validation.errors);
      }

    } catch (error) {
      logger.logValidationError(record._rowIndex, [error.message]);
    }
  });

  logger.logTransformSuccess(validRecords.length);

  // STEP 3: Extract entities
  const entities = extractEntities(validRecords);

  logger.log('TRANSFORM', `Extracted: ${entities.departments.length} depts, ${entities.students.length} students, ${entities.courses.length} courses`);

  return entities;
}

/**
 * Deduplication: Remove duplicate students based on email
 * Strategy: Keep the record with the MOST complete data (fewest NULLs)
 */
function removeDuplicates(records, logger) {
  const seen = new Map();  // email → best record so far

  records.forEach(record => {
    const email = record.Email?.toLowerCase().trim();

    // Skip records with no email (will fail validation later)
    if (!email) return;

    if (seen.has(email)) {
      // Duplicate found! Choose which one to keep
      const existing = seen.get(email);
      const current = record;

      // Count NULL values in each record
      const existingNulls = Object.values(existing).filter(v => !v).length;
      const currentNulls = Object.values(current).filter(v => !v).length;

      // Keep the one with FEWER nulls (more complete data)
      if (currentNulls < existingNulls) {
        seen.set(email, current);
        logger.logDuplicate(email);
      } else {
        logger.logDuplicate(email);
      }
    } else {
      // First time seeing this email
      seen.set(email, record);
    }
  });

  return Array.from(seen.values());
}


/**
 * Parse date from multiple formats
 * Your sheet has: ISO (2024-01-15), US (12/20/1999), European (15-05-1998), Text (Aug 30, 1998)
 * Goal: Convert ALL to ISO format (YYYY-MM-DD) for PostgreSQL
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;

  const str = dateStr.trim();

  // FORMAT 1: ISO format (2024-01-15) - Already correct!
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const [year, month, day] = str.split('-');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // FORMAT 2: US format (12/20/1999) - Month/Day/Year
  const usMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [_, month, day, year] = usMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // FORMAT 3a: US dash format (MM-DD-YYYY)
  const usDashMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (usDashMatch) {
    const [_, month, day, year] = usDashMatch;

    // Month must be 1–12 to be valid US format
    if (parseInt(month) >= 1 && parseInt(month) <= 12) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  // FORMAT 3: European format (15-05-1998) - Day-Month-Year
  const euMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (euMatch) {
    const [_, day, month, year] = euMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // FORMAT 4: Text format (Aug 30, 1998) - Use JavaScript's Date parser
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');  // Months are 0-indexed!
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // If nothing worked, throw error
  throw new Error(`Invalid date format: ${dateStr}`);
}


/**
 * Normalize year to integer (1-4)
 * Your sheet has: "Freshman", "sophomore", "Junior", "4", etc.
 */
function normalizeYear(yearStr) {
  if (!yearStr || yearStr.trim() === '') return null;

  const yearMap = {
    'freshman': 1,
    'sophomore': 2,
    'junior': 3,
    'senior': 4,
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4
  };

  const normalized = yearMap[yearStr.toLowerCase().trim()];

  if (!normalized) {
    throw new Error(`Invalid year: ${yearStr}`);
  }

  return normalized;
}

/**
 * Parse credits (handles "four" → 4)
 */
function parseCredits(creditsStr) {
  if (!creditsStr) return null;

  const textNumbers = { 'one': 1, 'two': 2, 'three': 3, 'four': 4 };
  const str = creditsStr.toLowerCase().trim();

  return textNumbers[str] || parseInt(str);
}

/**
 * Normalize department using the mapping from config
 */
function normalizeDepartment(deptStr) {
  if (!deptStr) return null;

  const normalized = config.departmentMapping[deptStr.toLowerCase().trim()];

  if (!normalized) {
    throw new Error(`Unknown department: ${deptStr}`);
  }

  return normalized;
}

/**
 * Normalize grade to letter format
 * Handles: NULL, letter grades (A, B-), or converts numeric if needed
 */
function normalizeGrade(gradeStr) {
  // Allow NULL (grade not assigned yet)
  if (!gradeStr) return null;

  // Convert to string to handle numeric grades from Google Sheets
  const str = String(gradeStr);
  if (str.trim() === '' || str.toLowerCase() === 'null') {
    return null;
  }

  const grade = str.trim().toUpperCase();

  // Check if already a valid letter grade
  const validGrades = ['A', 'A-', 'B', 'B-', 'C', 'C-', 'D', 'F'];
  if (validGrades.includes(grade)) {
    return grade;  // Already valid, return as-is
  }

  // If numeric, convert to letter grade using standard grading scale
  const numericGrade = parseInt(grade);
  if (!isNaN(numericGrade)) {
    if (numericGrade >= 93) return 'A';    // 93-100 = A
    if (numericGrade >= 90) return 'A-';   // 90-92 = A-
    if (numericGrade >= 87) return 'B';    // 87-89 = B
    if (numericGrade >= 83) return 'B-';   // 83-86 = B-
    if (numericGrade >= 77) return 'C';    // 77-82 = C
    if (numericGrade >= 73) return 'C-';   // 73-76 = C-
    if (numericGrade >= 60) return 'D';    // 60-72 = D
    return 'F';                            // Below 60 = F
  }

  // Invalid grade
  throw new Error(`Invalid grade: ${gradeStr}`);
}



/**
 * Validate email format
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate Indian phone number
 * Must be exactly 10 digits, starting with 6, 7, 8, or 9
 */
function isValidIndianPhone(phone) {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Check: exactly 10 digits AND starts with 6-9
  return /^[6-9]\d{9}$/.test(digits);
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;  // Haven't had birthday yet this year
  }

  return age;
}

/**
 * Validate a single record against business rules
 * Returns: { isValid: true/false, errors: [] }
 */
function validateRecord(record) {
  const errors = [];

  // Required fields for STUDENT (Course is now OPTIONAL)
  if (!record.FirstName) errors.push('Missing first name');
  if (!record.LastName) errors.push('Missing last name');
  if (!record.Email) errors.push('Missing email');
  if (!record.DateOfBirth) errors.push('Missing date of birth');
  if (!record.Year) errors.push('Missing year');
  if (!record.Department) errors.push('Missing department');

  // ✅ COURSE and ENROLLMENT DATE are now OPTIONAL
  // This allows student-only registration via API
  // If Course is provided, then EnrollmentDate is required
  if (record.Course && !record.EnrollmentDate) {
    errors.push('Missing enrollment date (required when course is provided)');
  }

  // Email format
  if (record.Email && !isValidEmail(record.Email)) {
    errors.push(`Invalid email: ${record.Email}`);
  }

  // Phone number validation (Indian format: 10 digits, starts with 6-9)
  if (record.PhoneNumber && !isValidIndianPhone(record.PhoneNumber)) {
    errors.push(`Invalid phone number: ${record.PhoneNumber} (must be 10 digits, starting with 6-9)`);
  }

  // Age must be 16+
  if (record.DateOfBirth) {
    const age = calculateAge(record.DateOfBirth);
    if (age < 16) {
      errors.push(`Student too young: ${age} years old`);
    }
  }

  // Year must be 1-4
  if (record.Year && (record.Year < 1 || record.Year > 4)) {
    errors.push(`Invalid year: ${record.Year}`);
  }

  // Credits must be 1-4 (only validate if provided)
  if (record.Credits && (record.Credits < 1 || record.Credits > 4)) {
    errors.push(`Invalid credits: ${record.Credits}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}




/**
 * Extract unique entities from transformed records
 * One row in sheets = student + course + enrollment
 * We need to separate them for 4 different database tables
 */
function extractEntities(records) {
  // Extract unique departments
  const deptSet = new Set();
  records.forEach(r => {
    if (r.Department) deptSet.add(r.Department);
  });

  const departments = Array.from(deptSet).map(name => ({
    name,
    head: config.departmentHeads[name] || null
  }));

  // Extract unique students (by email)
  const studentMap = new Map();
  records.forEach(r => {
    if (!studentMap.has(r.Email)) {
      studentMap.set(r.Email, {
        first_name: r.FirstName,
        last_name: r.LastName,
        email: r.Email,
        date_of_birth: r.DateOfBirth,
        year: r.Year,
        phone_number: r.PhoneNumber,
        department: r.Department
      });
    }
  });
  const students = Array.from(studentMap.values());

  // Extract unique courses (by name) - ONLY if Course exists
  const courseMap = new Map();
  records.forEach(r => {
    if (r.Course && !courseMap.has(r.Course)) {  // ✅ Check Course exists
      courseMap.set(r.Course, {
        name: r.Course,
        department: r.Department,
        credits: r.Credits
      });
    }
  });
  const courses = Array.from(courseMap.values());

  // Create enrollments (each record is an enrollment) - ONLY if Course exists
  const enrollments = records
    .filter(r => r.Course)  // ✅ Only create enrollment if Course exists
    .map(r => ({
      student_email: r.Email,
      course_name: r.Course,
      enrollment_date: r.EnrollmentDate,
      grade: r.Grade || null
    }));

  return { departments, students, courses, enrollments };
}