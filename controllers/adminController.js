const { User, Doctor, Appointment } = require('../models');

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                     totalDoctors:
 *                       type: integer
 *                     totalAppointments:
 *                       type: integer
 *       500:
 *         description: Server error
 */
exports.getStats = async (req, res) => {
    try {
        const [totalUsers, totalDoctors, totalAppointments] = await Promise.all([
            User.count(),
            Doctor.count(),
            Appointment.count()
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalDoctors,
                totalAppointments
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching stats",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/admin/doctors:
 *   post:
 *     summary: Add a new doctor
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *               - specialization
 *               - consultationFee
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               specialization:
 *                 type: string
 *               consultationFee:
 *                 type: number
 *               bio:
 *                 type: string
 *               roomNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *       400:
 *         description: Invalid input or user already exists
 *       500:
 *         description: Server error
 */
exports.addDoctor = async (req, res) => {
    try {
        const { fullName, email, password, specialization, consultationFee, bio, roomNumber } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Create User
        // Note: In a real app, password should be hashed. Assuming User model or hook handles it, 
        // or we need to hash it here. The User model has 'passwordHash' field.
        // The current codebase seems to use 'passwordHash' directly in create calls in test scripts,
        // implying no auto-hashing hook might be present or it expects pre-hashed.
        // However, looking at test_full_flow.js:43, it sends 'hash'.
        // I should check if there is a hook. If not, I should hash it.
        // For now, I will simulate hashing or use plain text if that's what's used (NOT SECURE but consistent with current state if no bcrypt).
        // Wait, package.json has bcryptjs. I should use it.
        
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            fullName,
            email,
            passwordHash: hashedPassword,
            role: 'doctor'
        });

        // Create Doctor
        const newDoctor = await Doctor.create({
            user_id: newUser.userId,
            specialization,
            consultationFee,
            bio,
            roomNumber
        });

        res.status(201).json({
            success: true,
            message: "Doctor created successfully",
            data: {
                doctorId: newDoctor.doctorId,
                userId: newUser.userId,
                fullName: newUser.fullName,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error("Error adding doctor:", error);
        res.status(500).json({
            success: false,
            message: "Error adding doctor",
            error: error.message
        });
    }
};
