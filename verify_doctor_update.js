const http = require('http');
const { User, Doctor } = require('./models');

// Configuration
const TEST_ADMIN_EMAIL = 'admin@clinic.com';
const TEST_ADMIN_PASSWORD = 'adminpassword';

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

async function verifyDoctorUpdate() {
    try {
        console.log('🚀 Starting Verification of Doctor Profile Update...');

        // 1. Login as Admin
        console.log('\n--- 1. Logging in as Admin ---');
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

        // 2. Create a New Doctor
        console.log('\n--- 2. Creating New Doctor ---');
        const docEmail = `updatedoc${Date.now()}@clinic.com`;
        const docPassword = 'docpassword';
        
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
            fullName: 'Dr. Update',
            email: docEmail,
            password: docPassword,
            specialization: 'General',
            consultationFee: 100,
            bio: 'Initial bio',
            roomNumber: '100'
        });

        if (addDocRes.statusCode !== 201) throw new Error('Create Doctor failed');
        console.log('✅ Doctor created.');

        // 3. Login as Doctor
        console.log('\n--- 3. Logging in as Doctor ---');
        const docLoginRes = await makeRequest({
            hostname: 'localhost',
            port: 8000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: docEmail,
            password: docPassword
        });

        if (docLoginRes.statusCode !== 200) throw new Error('Doctor login failed');
        const docToken = docLoginRes.body.token;
        console.log('✅ Doctor logged in.');

        // 4. Update Profile
        console.log('\n--- 4. Updating Doctor Profile ---');
        const updateRes = await makeRequest({
            hostname: 'localhost',
            port: 8000,
            path: '/api/doctors/profile',
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${docToken}`
            }
        }, {
            specialization: 'Cardiology',
            bio: 'Updated bio',
            consultationFee: 500,
            roomNumber: '202'
        });

        console.log('Status:', updateRes.statusCode);
        console.log('Response:', updateRes.body);

        if (updateRes.statusCode !== 200) throw new Error('Update Profile failed');
        if (updateRes.body.data.specialization !== 'Cardiology') throw new Error('Specialization not updated');
        if (updateRes.body.data.consultationFee !== 500) throw new Error('Fee not updated');

        console.log('✅ Doctor profile updated successfully.');

        console.log('\n✅✅ DOCTOR UPDATE VERIFICATION PASSED ✅✅');

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error.message);
        process.exit(1);
    }
}

verifyDoctorUpdate();
