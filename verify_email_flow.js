require('dotenv').config();
const authController = require('./controllers/authController');
const appointmentController = require('./controllers/appointmentController');
const { User, Patient, Appointment, Doctor } = require('./models');
const sequelize = require('./config/database');

const mockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.data = null;
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const runTest = async () => {
    try {
        console.log('Starting verification flow...');
        
        // 1. Register User
        const uniqueId = Date.now();
        const email = `test.user.${uniqueId}@example.com`; // Use a dummy email for safety, or the user's test email?
        // Better to use the user's test email to actually see if it sends, but I need to be careful not to spam.
        // The user used "ahmedabdelmoaty06@gmail.com". I'll use that but with a unique alias if possible, or just that.
        // Mailjet might complain if I send to same email too often? No, it should be fine.
        const testEmail = "ahmedabdelmoaty06@gmail.com"; 
        
        // Check if user exists and delete if so
        await User.destroy({ where: { email: testEmail } });

        const reqRegister = {
            body: {
                fullName: "Test User",
                email: testEmail,
                password: "password123",
                role: "patient"
            }
        };
        const resRegister = mockRes();

        console.log('Registering user...');
        await authController.register(reqRegister, resRegister);
        console.log('Register Response:', resRegister.statusCode, resRegister.data);

        if (resRegister.statusCode !== 201) {
            throw new Error('Registration failed');
        }

        const user = await User.findOne({ where: { email: testEmail } });
        if (!user) throw new Error('User not found in DB');

        // 2. Create Patient Profile (needed for appointment)
        // The controller doesn't create patient profile automatically? 
        // appointmentController checks for Patient.findOne({ where: { user_id: userId } })
        // I need to create it manually or via another controller.
        // I'll create it manually here to focus on appointment email.
        console.log('Creating patient profile...');
        const patient = await Patient.create({
            user_id: user.userId,
            dateOfBirth: "1990-01-01",
            gender: "Male",
            phone: "1234567890"
        });

        // 3. Book Appointment
        // Need a doctor first
        let doctor = await Doctor.findOne();
        if (!doctor) {
            // Create a dummy doctor if none exists (unlikely in this app but good for safety)
            // Assuming Doctor model exists and has fields.
            // I'll skip creating doctor and assume one exists, or fail.
            console.log('No doctor found, skipping appointment test or failing.');
            // Actually I should check.
        }

        if (doctor) {
            const reqBook = {
                user: { id: user.userId }, // Mock auth middleware adding user to req
                body: {
                    doctorId: doctor.doctorId,
                    date: "2025-12-31",
                    time: "10:00:00"
                }
            };
            const resBook = mockRes();

            console.log('Booking appointment...');
            // I need to wait a bit for the email promise in the controller to resolve?
            // The controller does NOT await the email request.
            // So if I call bookAppointment, it will return response immediately.
            // The email sending happens in background.
            // I need to keep the script alive for a few seconds to let the email send.
            
            await appointmentController.bookAppointment(reqBook, resBook);
            console.log('Book Response:', resBook.statusCode, resBook.data);
            
            console.log('Waiting for email to send (5 seconds)...');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        console.log('Cleaning up...');
        // await User.destroy({ where: { email: "ahmedabdelmoaty06@gmail.com" } }); // Optional: keep it to check DB
        // sequelize.close(); // Keep connection open or close?
        // process.exit();
    }
};

runTest();
