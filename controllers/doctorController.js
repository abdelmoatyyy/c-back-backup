const { Doctor, User, Appointment, Patient } = require('../models');
const { Op } = require('sequelize');

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all doctors
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: List of doctors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       doctorId:
 *                         type: integer
 *                       specialization:
 *                         type: string
 *                       bio:
 *                         type: string
 *                       consultationFee:
 *                         type: number
 *                       User:
 *                         type: object
 *                         properties:
 *                           fullName:
 *                             type: string
 *                           email:
 *                             type: string
 *       500:
 *         description: Server error
 */
exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.findAll({
            include: [{
                model: User,
                attributes: ['fullName', 'email', 'phoneNumber'] // Select specific fields from User
            }]
        });

        res.status(200).json({
            success: true,
            data: doctors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching doctors",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/doctors/profile:
 *   post:
 *     summary: Update doctor profile
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specialization:
 *                 type: string
 *               bio:
 *                 type: string
 *               consultationFee:
 *                 type: number
 *               roomNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       403:
 *         description: Access denied (Not a doctor)
 *       404:
 *         description: Doctor profile not found
 *       500:
 *         description: Server error
 */
exports.updateProfile = async (req, res) => {
    try {
        // Check if user is a doctor
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can update their profile."
            });
        }

        const userId = req.user.id;
        const { specialization, bio, consultationFee, roomNumber } = req.body;

        let doctor = await Doctor.findOne({ where: { user_id: userId } });

        if (!doctor) {
            // Create doctor record if it doesn't exist (for existing users)
            doctor = await Doctor.create({
                userId: userId,
                specialization: specialization || 'General Practice',
                consultationFee: consultationFee || 0,
                bio: bio || null,
                roomNumber: roomNumber || null
            });
        } else {
            // Update existing doctor record
            if (specialization) doctor.specialization = specialization;
            if (bio !== undefined) doctor.bio = bio;
            if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
            if (roomNumber !== undefined) doctor.roomNumber = roomNumber;

            await doctor.save();
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: doctor
        });

    } catch (error) {
        console.error("Error updating doctor profile:", error);
        res.status(500).json({
            success: false,
            message: "Error updating profile",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/doctors/dashboard-stats:
 *   get:
 *     summary: Get doctor dashboard statistics
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       403:
 *         description: Access denied (Not a doctor)
 *       500:
 *         description: Server error
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // Check if user is a doctor
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can access dashboard stats."
            });
        }

        const userId = req.user.id;
        
        // Find the doctor record
        const doctor = await Doctor.findOne({ where: { user_id: userId } });
        
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        const doctorId = doctor.doctorId;
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Get today's appointments
        const todayAppointments = await Appointment.count({
            where: {
                doctor_id: doctorId,
                appointment_date: {
                    [Op.between]: [startOfToday, endOfToday]
                }
            }
        });

        // Get weekly appointments
        const weeklyAppointments = await Appointment.count({
            where: {
                doctor_id: doctorId,
                appointment_date: {
                    [Op.between]: [startOfWeek, endOfWeek]
                }
            }
        });

        // Get monthly earnings (completed appointments * consultation fee)
        const monthlyCompletedAppointments = await Appointment.count({
            where: {
                doctor_id: doctorId,
                status: 'completed',
                appointment_date: {
                    [Op.between]: [startOfMonth, endOfMonth]
                }
            }
        });

        const monthlyEarnings = monthlyCompletedAppointments * (doctor.consultationFee || 0);

        // Get total unique patients
        const totalPatients = await Appointment.count({
            where: {
                doctor_id: doctorId
            },
            distinct: true,
            col: 'patient_id'
        });

        res.status(200).json({
            success: true,
            data: {
                todayAppointments,
                weeklyAppointments,
                monthlyEarnings,
                totalPatients
            }
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching dashboard statistics",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/doctors/appointments:
 *   get:
 *     summary: Get doctor's appointments
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter appointments by specific date (YYYY-MM-DD). If not provided, returns today's appointments
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled, no_show]
 *         description: Filter appointments by status
 *     responses:
 *       200:
 *         description: List of appointments
 *       403:
 *         description: Access denied (Not a doctor)
 *       500:
 *         description: Server error
 */
exports.getAppointments = async (req, res) => {
    try {
        // Check if user is a doctor
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can view appointments."
            });
        }

        const userId = req.user.id;
        const { date, status } = req.query;
        
        // Find the doctor record
        const doctor = await Doctor.findOne({ where: { user_id: userId } });
        
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        const doctorId = doctor.doctorId;
        
        // Build query conditions
        const whereConditions = { doctor_id: doctorId };
        
        // Filter by date (default to today if not specified)
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
        
        whereConditions.appointment_date = {
            [Op.between]: [startOfDay, endOfDay]
        };
        
        // Filter by status if provided
        if (status) {
            whereConditions.status = status;
        }

        const appointments = await Appointment.findAll({
            where: whereConditions,
            include: [{
                model: Patient,
                include: [{
                    model: User,
                    attributes: ['fullName', 'email', 'phoneNumber']
                }]
            }],
            order: [['appointment_time', 'ASC']]
        });

        res.status(200).json({
            success: true,
            data: appointments
        });

    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching appointments",
            error: error.message
        });
    }
};
