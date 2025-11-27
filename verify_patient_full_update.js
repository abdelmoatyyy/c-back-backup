const http = require('http');
const { User, Patient } = require('./models');

// Configuration
const TEST_PATIENT_EMAIL = 'patient_update_test@clinic.com';
const TEST_PATIENT_PASSWORD = 'password123';

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

async function verifyPatientUpdate() {
    try {
        console.log('🚀 Starting Verification of Patient Info Update...');

        // 1. Register Patient
        console.log('\n--- 1. Registering Patient ---');
        await makeRequest({
            hostname: 'localhost',
            port: 8000,
            path: '/api/auth/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            fullName: 'Patient Update Test',
            email: TEST_PATIENT_EMAIL,
            password: TEST_PATIENT_PASSWORD,
            role: 'patient'
        });

        // 2. Login
        console.log('\n--- 2. Logging in ---');
        const loginRes = await makeRequest({
            hostname: 'localhost',
            port: 8000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: TEST_PATIENT_EMAIL,
            password: TEST_PATIENT_PASSWORD
        });

        if (loginRes.statusCode !== 200) throw new Error('Login failed');
        const token = loginRes.body.token;
        console.log('✅ Logged in.');

        // 3. Update Profile (Add Info)
        console.log('\n--- 3. Adding Patient Info ---');
        const updateRes = await makeRequest({
            hostname: 'localhost',
            port: 8000,
            path: '/api/patients/profile',
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }, {
            dateOfBirth: '1990-01-01',
            gender: 'Male',
            bloodGroup: 'A+',
            address: '123 Test St, Cairo'
        });

        console.log('Status:', updateRes.statusCode);
        console.log('Response:', updateRes.body);

        if (updateRes.statusCode !== 200) throw new Error('Update failed');
        
        const data = updateRes.body.data;
        if (data.dateOfBirth !== '1990-01-01') throw new Error('Date of Birth mismatch');
        if (data.gender !== 'Male') throw new Error('Gender mismatch');
        if (data.bloodGroup !== 'A+') throw new Error('Blood Group mismatch');
        if (data.address !== '123 Test St, Cairo') throw new Error('Address mismatch');

        console.log('✅ Patient info added/updated successfully.');
        console.log('\n✅✅ PATIENT UPDATE VERIFICATION PASSED ✅✅');

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error.message);
        process.exit(1);
    }
}

verifyPatientUpdate();
