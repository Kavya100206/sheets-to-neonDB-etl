/**
 * test-student-only.js
 * Test the auto-registration API with student-only data (NO course)
 */

const testStudentOnly = {
    FirstName: 'GoogleSheet',
    LastName: 'TestUser',
    Email: 'googlesheet.test@example.com',
    DateOfBirth: '2002-05-15',
    Year: '3',  // Junior
    PhoneNumber: '555-9999',
    Department: 'Computer Science'
    // NO Course, Credits, EnrollmentDate, Grade
};

async function testAPI() {
    try {
        console.log('🧪 Testing Student-Only Registration (No Course)...\n');

        const response = await fetch('http://localhost:3000/api/register-student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testStudentOnly)
        });

        const result = await response.json();

        console.log('📊 Response Status:', response.status);
        console.log('📊 Response Data:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('\n✅ TEST PASSED - Student registered successfully!');
            console.log(`   Student ID: ${result.studentId}`);
            console.log(`   Email: ${result.email}`);
        } else {
            console.log('\n❌ TEST FAILED');
            console.log('   Errors:', result.errors || result.message);
        }

    } catch (error) {
        console.error('\n❌ Network Error:', error.message);
        console.log('   Make sure the API server is running on http://localhost:3000');
    }
}

testAPI();
