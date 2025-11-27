const http = require('http');
const { User, Doctor, Patient } = require('./models');

// Configuration
const TEST_ADMIN_EMAIL = 'admin@clinic.com';
const TEST_ADMIN_PASSWORD = 'adminpassword';
const TEST_PATIENT_EMAIL = 'newpatient@clinic.com';
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

async function verifyNewApis() {
    try {
        console.log('🚀 Starting Verification of New APIs...');

        // 1. Setup Admin User (if not exists)
        console.log('\n--- 1. Setting up Admin ---');
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(TEST_ADMIN_PASSWORD, 10);
        
        let adminUser = await User.findOne({ where: { email: TEST_ADMIN_EMAIL } });
        if (!adminUser) {
            adminUser = await User.create({
                fullName: 'Admin User',
                email: TEST_ADMIN_EMAIL,
                passwordHash: hashedPassword,
                role: 'admin'
            });
            console.log('✅ Admin user created.');
        } else {
            console.log('ℹ️ Admin user already exists.');
        }

        // 2. Login as Admin
        console.log('\n--- 2. Logging in as Admin ---');
        const adminLoginRes = await makeRequest({
            hostname: 'localhost',
            port: 8000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: TEST_ADMIN_EMAIL,
            password: TEST_ADMIN_PASSWORD
        });

        if (adminLoginRes.statusCode !== 200) throw new Error('Admin login failed');
        const adminToken = adminLoginRes.body.token;
        console.log('✅ Admin logged in.');

        // 3. Add Doctor
        console.log('\n--- 3. Adding Doctor via API ---');
        const newDoctorEmail = `doc${Date.now()}@clinic.com`;
        const addDocRes = await makeRequest({
            hostname: 'localhost',
            port: 8000,
            path: '/api/admin/doctors',
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            }
        }, {
            fullName: 'Dr. New',
            email: newDoctorEmail,
            password: 'docpassword',
            specialization: 'Neurology',
            consultationFee: 300,
            bio: 'Expert in brains',
            roomNumber: '101'
        });

        console.log('Status:', addDocRes.statusCode);
        console.log('Response:', addDocRes.body);
        if (addDocRes.statusCode !== 201) throw new Error('Add Doctor failed');
        console.log('✅ Doctor added successfully.');

        // 4. Register Patient
        console.log('\n--- 4. Registering Patient ---');
        const registerRes = await makeRequest({
            hostname: 'localhost',
            port: 8000,
            path: '/api/auth/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            fullName: 'New Patient',
            email: TEST_PATIENT_EMAIL,
            password: TEST_PATIENT_PASSWORD,
            role: 'patient'
        });
        
        // If already exists, just login
        if (registerRes.statusCode === 201) {
             console.log('✅ Patient registered.');
        } else {
             console.log('ℹ️ Patient might already exist.');
        }

        // 5. Login as Patient
        console.log('\n--- 5. Logging in as Patient ---');
        const patientLoginRes = await makeRequest({
            hostname: 'localhost',
            port: 8000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: TEST_PATIENT_EMAIL,
            password: TEST_PATIENT_PASSWORD
        });

        if (patientLoginRes.statusCode !== 200) throw new Error('Patient login failed');
        const patientToken = patientLoginRes.body.token;
        console.log('✅ Patient logged in.');

        // 6. Add/Update Patient Profile
        console.log('\n--- 6. Updating Patient Profile via API ---');
        const updateProfileRes = await makeRequest({
            hostname: 'localhost',
            port: 8000,
            path: '/api/patients/profile',
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${patientToken}`
            }
        }, {
            dateOfBirth: '1995-05-05',
            gender: 'Female',
            bloodGroup: 'O+',
            address: 'Alexandria, Egypt'
        });

        console.log('Status:', updateProfileRes.statusCode);
        console.log('Response:', updateProfileRes.body);
        if (updateProfileRes.statusCode !== 200) throw new Error('Update Profile failed');
        console.log('✅ Patient profile updated successfully.');

        console.log('\n✅✅ NEW APIS VERIFICATION PASSED ✅✅');

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error.message);
        process.exit(1);
    }
}

verifyNewApis();
