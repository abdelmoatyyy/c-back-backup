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

        const doctor = await Doctor.findOne({ where: { user_id: userId } });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        // Update fields if provided
        if (specialization) doctor.specialization = specialization;
        if (bio) doctor.bio = bio;
        if (consultationFee) doctor.consultationFee = consultationFee;
        if (roomNumber) doctor.roomNumber = roomNumber;

        await doctor.save();

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
 * /api/doctors/dashboard/stats:
 *   get:
 *     summary: Get doctor dashboard statistics
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
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
 *                     todayAppointments:
 *                       type: integer
 *                     weeklyAppointments:
 *                       type: integer
 *                     monthlyEarnings:
 *                       type: number
 *                     totalPatients:
 *                       type: integer
 *       403:
 *         description: Access denied
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
        
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Count today's appointments
        const todayAppointments = await Appointment.count({
            where: {
                doctorId: doctorId,
                appointmentDate: {
                    [Op.gte]: startOfToday,
                    [Op.lt]: endOfToday
                }
            }
        });

        // Count this week's appointments
        const weeklyAppointments = await Appointment.count({
            where: {
                doctorId: doctorId,
                appointmentDate: {
                    [Op.gte]: startOfWeek
                }
            }
        });

        // Calculate monthly earnings from completed appointments
        const completedAppointments = await Appointment.count({
            where: {
                doctorId: doctorId,
                status: 'completed',
                appointmentDate: {
                    [Op.gte]: startOfMonth
                }
            }
        });

        const monthlyEarnings = completedAppointments * (doctor.consultationFee || 0);

        // Count total unique patients
        const totalPatients = await Appointment.count({
            where: {
                doctorId: doctorId
            },
            distinct: true,
            col: 'patientId'
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled]
 *         description: Filter appointments by status
 *     responses:
 *       200:
 *         description: List of appointments
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
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
exports.getAppointments = async (req, res) => {
    try {
        // Check if user is a doctor
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can access their appointments."
            });
        }

        const userId = req.user.id;
        const { status } = req.query;
        
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

        // Build where clause
        const whereClause = {
            doctorId: doctorId,
            appointmentDate: {
                [Op.gte]: startOfToday,
                [Op.lt]: endOfToday
            }
        };

        if (status) {
            whereClause.status = status;
        }

        const appointments = await Appointment.findAll({
            where: whereClause,
            include: [{
                model: Patient,
                include: [{
                    model: User,
                    attributes: ['fullName', 'email', 'phoneNumber']
                }]
            }],
            order: [['appointmentTime', 'ASC']]
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
