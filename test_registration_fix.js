const http = require('http');
const { User, Doctor, Patient, sequelize } = require('./models');

const TEST_DOCTOR_EMAIL = 'testdoc_' + Date.now() + '@clinic.com';
const TEST_DOCTOR_PASSWORD = 'password123';

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

async function testFix() {
    try {
        console.log('🚀 Starting Registration Fix Test...');

        // 1. Register a new Doctor
        console.log('\n--- 1. Registering New Doctor ---');
        const registerRes = await makeRequest({
            hostname: 'localhost',
            port: 8000,
            path: '/api/auth/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            fullName: 'Test Doctor',
            email: TEST_DOCTOR_EMAIL,
            password: TEST_DOCTOR_PASSWORD,
            role: 'doctor'
        });

        console.log('Register Response:', registerRes.body);
        if (registerRes.statusCode !== 201) throw new Error('Registration failed');

        // 2. Verify Doctor Record in DB
        console.log('\n--- 2. Verifying Doctor Record in DB ---');
        const user = await User.findOne({ where: { email: TEST_DOCTOR_EMAIL } });
        if (!user) throw new Error('User not found in DB');
        
        const doctor = await Doctor.findOne({ where: { user_id: user.userId } });
        if (!doctor) {
            throw new Error('❌ Doctor profile was NOT created!');
        }
        console.log('✅ Doctor profile found:', doctor.toJSON());

        // 3. Login to get token
        console.log('\n--- 3. Logging in ---');
        const loginRes = await makeRequest({
            hostname: 'localhost',
            port: 8000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: TEST_DOCTOR_EMAIL,
            password: TEST_DOCTOR_PASSWORD
        });
        
        const token = loginRes.body.token;

        // 4. Call Stats API
        console.log('\n--- 4. Calling Stats API ---');
        const statsRes = await makeRequest({
            hostname: 'localhost',
            port: 8000,
            path: '/api/doctors/dashboard/stats',
            method: 'GET',
            headers: { 
                'Authorization': 'Bearer ' + token
            }
        });

        console.log('Stats Response:', statsRes.body);
        if (statsRes.statusCode === 200 && statsRes.body.success) {
            console.log('✅ Stats API working correctly.');
        } else {
            throw new Error('❌ Stats API failed: ' + JSON.stringify(statsRes.body));
        }

        console.log('\n✅✅ TEST PASSED ✅✅');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
    } finally {
        await sequelize.close();
    }
}

testFix();
