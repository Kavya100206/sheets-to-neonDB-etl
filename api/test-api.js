/**
 * test-api.js
 * Test the auto-registration API endpoint
 */

const testStudent = {
    FirstName: 'TestAPI',
    LastName: 'Student',
    Email: 'testapi@example.com',
    DateOfBirth: '2000-01-15',
    Year: 'Sophomore',
    PhoneNumber: '555-0123',
    Department: 'Computer Science',
    Course: 'Web Development',
    Credits: '3',
    EnrollmentDate: '2025-01-15',
    Grade: null
};

async function testAPI() {
    try {
        console.log('🧪 Testing Auto-Registration API...\n');

        const response = await fetch('http://localhost:3000/api/register-student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testStudent)
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
