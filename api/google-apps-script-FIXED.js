

// ✅ CONFIGURATION
const API_URL = 'https://seemly-unpositivistic-alise.ngrok-free.dev/api/register-student';
const NOTIFICATION_EMAIL = 'namrathatha1031@gmail.com';

// =====================================================
// MAIN TRIGGER: Runs when any cell is edited
// =====================================================

function onEditHandler(e) {
    if (!e || !e.range) return;

    const sheet = e.source.getActiveSheet();

    // Only process Sheet1
    if (sheet.getName() !== 'Sheet1') return;

    const row = e.range.getRow();

    // Skip header row
    if (row === 1) return;

    // Get the entire row data
    const rowData = sheet.getRange(row, 1, 1, 12).getValues()[0];

    // Check if row has minimum required data (FirstName and Email)
    // StudentID=0, FirstName=1, LastName=2, Email=3
    if (!rowData[1] || !rowData[3]) return;

    Logger.log('🔔 Row edited: ' + row);

    processStudent(rowData, row, sheet);
}

// =====================================================
// PROCESS STUDENT REGISTRATION
// =====================================================

function processStudent(rowData, row, sheet) {
    // Map columns to API format
    const studentData = {
        FirstName: rowData[1],           // Column B
        LastName: rowData[2],            // Column C
        Email: rowData[3],               // Column D
        DateOfBirth: formatDate(rowData[4]),  // Column E
        Department: rowData[5],          // Column F
        Year: rowData[6] ? String(rowData[6]) : null,  // Column G
        PhoneNumber: rowData[11]         // Column L
    };

    // ✅ OPTIONAL: Add course if provided (for enrollment)
    if (rowData[7]) {  // If Course exists
        studentData.Course = rowData[7];              // Column H
        studentData.Credits = rowData[8] ? String(rowData[8]) : null;  // Column I
        studentData.EnrollmentDate = formatDate(rowData[9]);  // Column J
        studentData.Grade = rowData[10] || null;      // Column K
    }

    Logger.log('📤 Sending to API: ' + studentData.Email);
    Logger.log('📋 Data: ' + JSON.stringify(studentData));

    // Validate locally
    const validation = validateStudent(studentData);
    if (!validation.isValid) {
        Logger.log('❌ Validation failed: ' + validation.errors.join(', '));
        markRow(sheet, row, 'red', '❌ Invalid: ' + validation.errors.join('; '));
        sendErrorEmail(studentData, validation.errors.join('; '));
        return;
    }

    // Call API
    try {
        const response = UrlFetchApp.fetch(API_URL, {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(studentData),
            headers: {
                'ngrok-skip-browser-warning': 'true'
            },
            muteHttpExceptions: true
        });

        const statusCode = response.getResponseCode();
        const responseText = response.getContentText();

        Logger.log('📡 API Response Code: ' + statusCode);
        Logger.log('📡 API Response Body: ' + responseText);

        const result = JSON.parse(responseText);

        if (statusCode === 201 || result.success) {
            Logger.log('✅ Registered! Student ID: ' + result.studentId);
            markRow(sheet, row, 'green', '✅ Registered in NeonDB! ID: ' + result.studentId);
            sendSuccessEmail(studentData, result.studentId);
        } else if (statusCode === 409) {
            // Duplicate student
            Logger.log('⚠️ Student already exists: ' + result.message);
            markRow(sheet, row, 'yellow', '⚠️ Already registered: ' + result.message);
        } else {
            // Validation or other error
            Logger.log('❌ API error: ' + result.message);
            const errors = result.errors ? result.errors.join('; ') : result.message;
            markRow(sheet, row, 'red', '❌ Error: ' + errors);
            sendErrorEmail(studentData, errors);
        }

    } catch (error) {
        Logger.log('❌ Network error: ' + error.message);
        markRow(sheet, row, 'red', '❌ Connection failed: ' + error.message);
        sendErrorEmail(studentData, error.message);
    }
}

// =====================================================
// VALIDATION (student-only, course is optional)
// =====================================================

function validateStudent(data) {
    const errors = [];

    // Required fields for student registration
    if (!data.FirstName) errors.push('FirstName required');
    if (!data.LastName) errors.push('LastName required');
    if (!data.Email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.Email)) {
        errors.push('Valid Email required');
    }
    if (!data.DateOfBirth) errors.push('DateOfBirth required');
    if (!data.Year) errors.push('Year required');
    if (!data.Department) errors.push('Department required');

    // ✅ OPTIONAL: Validate course fields only if Course is provided
    if (data.Course) {
        if (!data.EnrollmentDate) errors.push('EnrollmentDate required when Course is provided');
    }

    return { isValid: errors.length === 0, errors };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function formatDate(dateValue) {
    if (!dateValue) return null;

    if (dateValue instanceof Date) {
        const year = dateValue.getFullYear();
        const month = String(dateValue.getMonth() + 1).padStart(2, '0');
        const day = String(dateValue.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    return String(dateValue);
}

function markRow(sheet, row, color, note) {
    const colors = {
        'green': '#d9ead3',
        'red': '#f4cccc',
        'yellow': '#fff2cc'
    };

    sheet.getRange(row, 1, 1, 12).setBackground(colors[color]);
    sheet.getRange(row, 1).setNote(note + '\n' + new Date());
}

function sendSuccessEmail(data, studentId) {
    try {
        MailApp.sendEmail(
            NOTIFICATION_EMAIL,
            '✅ Student Registered in NeonDB',
            `Student successfully registered:\n\n` +
            `Name: ${data.FirstName} ${data.LastName}\n` +
            `Email: ${data.Email}\n` +
            `Department: ${data.Department}\n` +
            `Student ID: ${studentId}\n\n` +
            `Timestamp: ${new Date()}`
        );
    } catch (e) {
        Logger.log('Email failed: ' + e.message);
    }
}

function sendErrorEmail(data, error) {
    try {
        MailApp.sendEmail(
            NOTIFICATION_EMAIL,
            '❌ Student Registration Failed',
            `Failed to register:\n\n` +
            `Name: ${data.FirstName} ${data.LastName}\n` +
            `Email: ${data.Email}\n` +
            `Error: ${error}\n\n` +
            `Timestamp: ${new Date()}`
        );
    } catch (e) {
        Logger.log('Email failed: ' + e.message);
    }
}

// =====================================================
// SETUP TRIGGER (Run this once manually)
// =====================================================

function setupTrigger() {
    const sheet = SpreadsheetApp.getActive();

    // Delete existing triggers to avoid duplicates
    ScriptApp.getProjectTriggers().forEach(trigger => {
        if (trigger.getHandlerFunction() === 'onEditHandler') {
            ScriptApp.deleteTrigger(trigger);
        }
    });

    // Create installable onEdit trigger
    ScriptApp.newTrigger('onEditHandler')
        .forSpreadsheet(sheet)
        .onEdit()
        .create();

    Logger.log('✅ Trigger installed successfully!');
}
