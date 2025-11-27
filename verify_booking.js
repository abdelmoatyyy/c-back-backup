const http = require('http');
const { User, Doctor, Patient, Appointment } = require('./models');
const jwt = require('jsonwebtoken');

async function setupData() {
    try {
        // 1. Create User
        const user = await User.create({
            fullName: 'Booking Test User',
            email: `book.test${Date.now()}@example.com`,
            passwordHash: 'hash',
            role: 'patient'
        });

        // 2. Create Patient Profile
        const patient = await Patient.create({
            user_id: user.userId,
            dateOfBirth: '1990-01-01',
            gender: 'Male',
            address: '123 Test St'
        });

        // 3. Create Doctor User & Profile
        const docUser = await User.create({
            fullName: 'Dr. Booking',
            email: `dr.book${Date.now()}@example.com`,
            passwordHash: 'hash',
            role: 'doctor'
        });
        
        const doctor = await Doctor.create({
            user_id: docUser.userId,
            specialization: 'General',
            consultationFee: 50.00
        });

        // 4. Generate Token
        const token = jwt.sign(
            { id: user.userId, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return { token, doctorId: doctor.doctorId, patientId: patient.patientId };
    } catch (error) {
        console.error('❌ Error setting up data:', error);
        process.exit(1);
    }
}

async function verifyBooking() {
    const { token, doctorId } = await setupData();

    const postData = JSON.stringify({
        doctorId: doctorId,
        date: '2025-12-25',
        time: '10:00:00'
    });

    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/appointments/book',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length,
            'Authorization': `Bearer ${token}`
        }
    };

    const req = http.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => responseBody += chunk);
        res.on('end', () => {
            console.log('Status Code:', res.statusCode);
            console.log('Response Body:', responseBody);

            if (res.statusCode === 201) {
                console.log('✅ Booking verification passed.');
                process.exit(0);
            } else {
                console.error('❌ Booking verification failed.');
                process.exit(1);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request error:', error);
        process.exit(1);
    });

    req.write(postData);
    req.end();
}

verifyBooking();
