const http = require('http');
const { User, Patient } = require('./models');
const jwt = require('jsonwebtoken');

async function setupData() {
    try {
        // 1. Create User
        const user = await User.create({
            fullName: 'Profile Test User',
            email: `profile.test${Date.now()}@example.com`,
            passwordHash: 'hash',
            role: 'patient'
        });

        // 2. Create Patient Profile
        await Patient.create({
            user_id: user.userId,
            dateOfBirth: '1995-05-05',
            gender: 'Female',
            address: '456 Profile St'
        });

        // 3. Generate Token
        const token = jwt.sign(
            { id: user.userId, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return token;
    } catch (error) {
        console.error('❌ Error setting up data:', error);
        process.exit(1);
    }
}

async function verifyProfile() {
    const token = await setupData();

    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/patients/profile',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    const req = http.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => responseBody += chunk);
        res.on('end', () => {
            console.log('Status Code:', res.statusCode);
            console.log('Response Body:', responseBody);

            if (res.statusCode === 200) {
                const response = JSON.parse(responseBody);
                if (response.success && response.data.User) {
                    console.log('✅ Profile verification passed.');
                    process.exit(0);
                } else {
                    console.error('❌ Profile verification failed: Missing user data.');
                    process.exit(1);
                }
            } else {
                console.error('❌ Profile verification failed.');
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

verifyProfile();
