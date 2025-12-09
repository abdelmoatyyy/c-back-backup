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
            userId: newUser.userId,
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

/**
 * @swagger
 * /api/admin/doctors/{doctorId}:
 *   delete:
 *     summary: Delete a doctor
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the doctor to delete
 *     responses:
 *       200:
 *         description: Doctor deleted successfully
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
exports.deleteDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Find the doctor
        const doctor = await Doctor.findByPk(doctorId, {
            include: [{
                model: User,
                attributes: ['fullName', 'email']
            }]
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        const doctorName = doctor.User?.fullName || "Doctor";
        const userId = doctor.user_id;

        // Delete the doctor (this will cascade delete schedules and appointments due to ON DELETE CASCADE)
        await doctor.destroy();

        // Delete the associated user account
        await User.destroy({ where: { userId: userId } });

        res.status(200).json({
            success: true,
            message: `Doctor ${doctorName} and associated account deleted successfully`
        });

    } catch (error) {
        console.error("Error deleting doctor:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting doctor",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/admin/patients:
 *   get:
 *     summary: Get all patients
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all patients
 *       500:
 *         description: Server error
 */
exports.getAllPatients = async (req, res) => {
    try {
        const { Patient } = require('../models');
        
        const patients = await Patient.findAll({
            include: [{
                model: User,
                attributes: ['userId', 'fullName', 'email', 'phoneNumber']
            }],
            order: [['patientId', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: patients
        });

    } catch (error) {
        console.error("Error fetching patients:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching patients",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/admin/patients/{patientId}:
 *   delete:
 *     summary: Delete a patient
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the patient to delete
 *     responses:
 *       200:
 *         description: Patient deleted successfully
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
exports.deletePatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { Patient } = require('../models');

        // Find the patient
        const patient = await Patient.findByPk(patientId, {
            include: [{
                model: User,
                attributes: ['fullName', 'email']
            }]
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        const patientName = patient.User?.fullName || "Patient";
        const userId = patient.user_id;

        // Delete the patient (this will cascade delete appointments and medical records)
        await patient.destroy();

        // Delete the associated user account
        await User.destroy({ where: { userId: userId } });

        res.status(200).json({
            success: true,
            message: `Patient ${patientName} and associated account deleted successfully`
        });

    } catch (error) {
        console.error("Error deleting patient:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting patient",
            error: error.message
        });
    }
};
