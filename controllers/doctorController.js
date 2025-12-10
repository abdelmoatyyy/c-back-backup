const { Doctor, User, Appointment, Patient, sequelize } = require('../models');
const { Schedule } = require('../models');
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
 *   get:
 *     summary: Get current doctor's profile
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor profile retrieved successfully
 *       403:
 *         description: Access denied (Not a doctor)
 *       404:
 *         description: Doctor profile not found
 *       500:
 *         description: Server error
 */
exports.getProfile = async (req, res) => {
    try {
        // Check if user is a doctor
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can access their profile."
            });
        }

        const userId = req.user.id;
        const doctor = await Doctor.findOne({ 
            where: { user_id: userId },
            include: [{
                model: User,
                attributes: ['userId', 'fullName', 'email', 'phoneNumber', 'role']
            }]
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        res.status(200).json({
            success: true,
            data: doctor
        });

    } catch (error) {
        console.error("Error fetching doctor profile:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching profile",
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
 *           enum: [scheduled, completed, cancelled, no_show]
 *         description: Filter appointments by status
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter appointments by specific date (YYYY-MM-DD)
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: boolean
 *         description: Get all upcoming appointments
 *     responses:
 *       200:
 *         description: List of appointments
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
exports.getAppointments = async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can access their appointments."
            });
        }

        const userId = req.user.id;
        const { status, date, upcoming } = req.query;
        
        const doctor = await Doctor.findOne({ where: { user_id: userId } });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        const doctorId = doctor.doctorId;
        
        // Build where clause
        const whereClause = {
            doctorId: doctorId
        };

        if (status) {
            whereClause.status = status;
        }

        // Handle date filtering
        if (date) {
            // Specific date
            const targetDate = new Date(date);
            const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
            
            whereClause.appointmentDate = {
                [Op.gte]: startOfDay,
                [Op.lt]: endOfDay
            };
        } else if (upcoming === 'false') {
            // Show all appointments (no date filter)
            // Leave whereClause.appointmentDate undefined
        } else {
            // Default: all upcoming appointments (including today)
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            whereClause.appointmentDate = {
                [Op.gte]: startOfToday
            };
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
            order: [
                ['appointmentDate', 'ASC'],
                ['appointmentTime', 'ASC']
            ]
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

/**
 * @swagger
 * /api/doctors/appointments/{appointmentId}/status:
 *   put:
 *     summary: Update appointment status
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [scheduled, completed, cancelled, no_show]
 *     responses:
 *       200:
 *         description: Appointment status updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */
exports.updateAppointmentStatus = async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can update appointment status."
            });
        }

        const userId = req.user.id;
        const { appointmentId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        const validStatuses = ['scheduled', 'completed', 'cancelled', 'no_show'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be one of: scheduled, completed, cancelled, no_show"
            });
        }

        const doctor = await Doctor.findOne({ where: { user_id: userId } });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        const appointment = await Appointment.findOne({
            where: {
                appointmentId: appointmentId,
                doctorId: doctor.doctorId
            },
            include: [{
                model: Patient,
                include: [{
                    model: User,
                    attributes: ['fullName', 'email', 'phoneNumber']
                }]
            }]
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        appointment.status = status;
        await appointment.save();

        res.status(200).json({
            success: true,
            message: "Appointment status updated successfully",
            data: appointment
        });

    } catch (error) {
        console.error("Error updating appointment status:", error);
        res.status(500).json({
            success: false,
            message: "Error updating appointment status",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/doctors/schedule:
 *   get:
 *     summary: Get doctor's schedule
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor's schedule
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
exports.getSchedule = async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can access their schedule."
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

        const schedule = await Schedule.findAll({
            where: { doctorId: doctor.doctorId },
            order: [
                [
                    sequelize.literal(`CASE day_of_week 
                        WHEN 'Monday' THEN 1 
                        WHEN 'Tuesday' THEN 2 
                        WHEN 'Wednesday' THEN 3 
                        WHEN 'Thursday' THEN 4 
                        WHEN 'Friday' THEN 5 
                        WHEN 'Saturday' THEN 6 
                        WHEN 'Sunday' THEN 7 
                    END`),
                ],
                ['start_time', 'ASC']
            ]
        });

        res.status(200).json({
            success: true,
            data: schedule
        });

    } catch (error) {
        console.error("Error fetching schedule:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching schedule",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/doctors/schedule:
 *   post:
 *     summary: Add schedule slot
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dayOfWeek
 *               - startTime
 *               - endTime
 *             properties:
 *               dayOfWeek:
 *                 type: string
 *                 enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *               startTime:
 *                 type: string
 *                 format: time
 *               endTime:
 *                 type: string
 *                 format: time
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Schedule added successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
exports.addSchedule = async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can add schedules."
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

        const { dayOfWeek, startTime, endTime, isAvailable = true } = req.body;

        if (!dayOfWeek || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: "Day of week, start time, and end time are required"
            });
        }

        // Validate time format and logic
        if (startTime >= endTime) {
            return res.status(400).json({
                success: false,
                message: "End time must be after start time"
            });
        }

        // Check for overlapping schedules
        const overlapping = await Schedule.findOne({
            where: {
                doctorId: doctor.doctorId,
                dayOfWeek: dayOfWeek,
                [Op.or]: [
                    {
                        startTime: { [Op.lt]: endTime },
                        endTime: { [Op.gt]: startTime }
                    }
                ]
            }
        });

        if (overlapping) {
            return res.status(400).json({
                success: false,
                message: "Schedule overlaps with existing schedule"
            });
        }

        const schedule = await Schedule.create({
            doctorId: doctor.doctorId,
            dayOfWeek,
            startTime,
            endTime,
            isAvailable
        });

        res.status(201).json({
            success: true,
            message: "Schedule added successfully",
            data: schedule
        });

    } catch (error) {
        console.error("Error adding schedule:", error);
        res.status(500).json({
            success: false,
            message: "Error adding schedule",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/doctors/schedule/{scheduleId}:
 *   put:
 *     summary: Update schedule slot
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dayOfWeek:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Server error
 */
exports.updateSchedule = async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can update schedules."
            });
        }

        const userId = req.user.id;
        const { scheduleId } = req.params;
        const { dayOfWeek, startTime, endTime, isAvailable } = req.body;

        const doctor = await Doctor.findOne({ where: { user_id: userId } });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        const schedule = await Schedule.findOne({
            where: {
                scheduleId: scheduleId,
                doctorId: doctor.doctorId
            }
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Schedule not found"
            });
        }

        // Validate time logic if both times are provided
        const newStartTime = startTime || schedule.startTime;
        const newEndTime = endTime || schedule.endTime;

        if (newStartTime >= newEndTime) {
            return res.status(400).json({
                success: false,
                message: "End time must be after start time"
            });
        }

        // Check for overlapping schedules (excluding current schedule)
        const newDayOfWeek = dayOfWeek || schedule.dayOfWeek;
        const overlapping = await Schedule.findOne({
            where: {
                doctorId: doctor.doctorId,
                scheduleId: { [Op.ne]: scheduleId },
                dayOfWeek: newDayOfWeek,
                [Op.or]: [
                    {
                        startTime: { [Op.lt]: newEndTime },
                        endTime: { [Op.gt]: newStartTime }
                    }
                ]
            }
        });

        if (overlapping) {
            return res.status(400).json({
                success: false,
                message: "Schedule overlaps with existing schedule"
            });
        }

        // Update fields
        if (dayOfWeek) schedule.dayOfWeek = dayOfWeek;
        if (startTime) schedule.startTime = startTime;
        if (endTime) schedule.endTime = endTime;
        if (isAvailable !== undefined) schedule.isAvailable = isAvailable;

        await schedule.save();

        res.status(200).json({
            success: true,
            message: "Schedule updated successfully",
            data: schedule
        });

    } catch (error) {
        console.error("Error updating schedule:", error);
        res.status(500).json({
            success: false,
            message: "Error updating schedule",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/doctors/schedule/{scheduleId}:
 *   delete:
 *     summary: Delete schedule slot
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Server error
 */
exports.deleteSchedule = async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can delete schedules."
            });
        }

        const userId = req.user.id;
        const { scheduleId } = req.params;

        const doctor = await Doctor.findOne({ where: { user_id: userId } });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        const schedule = await Schedule.findOne({
            where: {
                scheduleId: scheduleId,
                doctorId: doctor.doctorId
            }
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Schedule not found"
            });
        }

        await schedule.destroy();

        res.status(200).json({
            success: true,
            message: "Schedule deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting schedule:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting schedule",
            error: error.message
        });
    }
};
