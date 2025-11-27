const http = require('http');
const { User, Doctor, Patient, Appointment } = require('./models');

// Configuration
const TEST_EMAIL = 'ahmedabdelmoatyy@gmail.com';
const TEST_PASSWORD = 'password123';
const TEST_NAME = 'Ahmed Abdelmoaty';

// Helper for HTTP requests
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ statusCode: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runFullFlow() {
    try {
        console.log('🚀 Starting Full Flow Test...');

        // 0. Setup Doctor (Prerequisite)
        console.log('\n--- Setting up Doctor ---');
        const docUser = await User.create({
            fullName: 'Dr. House',
            email: `house${Date.now()}@clinic.com`,
            passwordHash: 'hash',
            role: 'doctor'
        });
        const doctor = await Doctor.create({
            user_id: docUser.userId,
            specialization: 'Diagnostics',
            consultationFee: 200.00
        });
        console.log(`✅ Doctor created with ID: ${doctor.doctorId}`);

        // 1. Register User
        console.log('\n--- 1. Registering User ---');
        const registerRes = await makeRequest({
            hostname: 'localhost',
            port: 8000,
            path: '/api/auth/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            fullName: TEST_NAME,
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            role: 'patient'
        });
        console.log('Status:', registerRes.statusCode);
        console.log('Response:', registerRes.body);
        if (registerRes.statusCode !== 201) throw new Error('Registration failed');

        // 2. Login
        console.log('\n--- 2. Logging In ---');
        const loginRes = await makeRequest({
            hostname: 'localhost',
            port: 8000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        console.log('Status:', loginRes.statusCode);
        if (loginRes.statusCode !== 200) throw new Error('Login failed');
        const token = loginRes.body.token;
        console.log('✅ Login successful, Token received.');

        // 3. Create Patient Profile (Simulating frontend logic, usually done after login if profile missing)
        // Note: The current API doesn't have a "create profile" endpoint exposed, we usually assume it's created or we need to add one.
        // Wait, the prompt didn't ask for a "create profile" API, but the booking logic checks for it.
        // I'll manually create it in DB for this test script to simulate a complete profile, 
        // OR if I missed a "create profile" task, I should check.
        // Checking task list... "Patient Profile API" was "Get Profile". 
        // "Register" only creates User. 
        // So currently there is NO API to create a patient profile.
        // I will manually create it in the DB for now to unblock the flow, as the user didn't explicitly ask for a "Create Profile API" yet, 
        // but implied it's needed for booking.
        console.log('\n--- 3. Creating Patient Profile (DB Direct) ---');
        const user = await User.findOne({ where: { email: TEST_EMAIL } });
        await Patient.create({
            user_id: user.userId,
            dateOfBirth: '1990-01-01',
            gender: 'Male',
            address: 'Cairo, Egypt'
        });
        console.log('✅ Patient profile created in DB.');

        // 4. Book Appointment
        console.log('\n--- 4. Booking Appointment ---');
        const bookRes = await makeRequest({
            hostname: 'localhost',
            port: 8000,
            path: '/api/appointments/book',
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }, {
            doctorId: doctor.doctorId,
            date: '2025-12-30',
            time: '14:00:00'
        });
        console.log('Status:', bookRes.statusCode);
        console.log('Response:', bookRes.body);
        if (bookRes.statusCode !== 201) throw new Error('Booking failed');

        console.log('\n✅✅ FULL FLOW TEST PASSED ✅✅');
        console.log('Check the server logs above for Ethereal Email Preview Links!');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        process.exit(1);
    }
}

runFullFlow();
