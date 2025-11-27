const http = require('http');
const { User, Doctor } = require('./models');
const sequelize = require('./config/database');

async function setupTestData() {
    try {
        // Create a user
        const user = await User.create({
            fullName: 'Dr. Test',
            email: `dr.test${Date.now()}@example.com`,
            passwordHash: 'somehash',
            role: 'doctor',
            phoneNumber: '1234567890'
        });

        // Create a doctor profile
        await Doctor.create({
            user_id: user.userId,
            specialization: 'Cardiology',
            bio: 'Expert in hearts',
            consultationFee: 100.00,
            roomNumber: '101'
        });

        console.log('✅ Test data created.');
    } catch (error) {
        console.error('❌ Error creating test data:', error);
        process.exit(1);
    }
}

function verifyApi() {
    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/doctors',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => responseBody += chunk);
        res.on('end', () => {
            console.log('Status Code:', res.statusCode);
            console.log('Response Body:', responseBody);

            if (res.statusCode === 200) {
                const response = JSON.parse(responseBody);
                if (response.success && response.data.length > 0) {
                    // Check if User data is included
                    const doctor = response.data.find(d => d.User && d.User.fullName === 'Dr. Test');
                    if (doctor) {
                        console.log('✅ Doctor API verification passed.');
                        process.exit(0);
                    } else {
                        console.error('❌ Doctor API verification failed: Doctor not found or User data missing.');
                        process.exit(1);
                    }
                } else {
                    console.error('❌ Doctor API verification failed: No data returned.');
                    process.exit(1);
                }
            } else {
                console.error('❌ Doctor API verification failed.');
                process.exit(1);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request error:', error);
        process.exit(1);
    });

    req.end();
}

async function run() {
    await setupTestData();
    verifyApi();
}

run();
