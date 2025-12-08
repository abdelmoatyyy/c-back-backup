const { Appointment, Patient, User, Doctor, Schedule, sequelize } = require('../models');
const { Op } = require('sequelize');
const mailjet = require('../config/email');

/**
 * @swagger
 * /api/appointments/book:
 *   post:
 *     summary: Book an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - date
 *               - time
 *             properties:
 *               doctorId:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *                 format: time
 *               reasonForVisit:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 *       400:
 *         description: Invalid booking request
 *       404:
 *         description: Patient profile not found
 *       409:
 *         description: Slot already booked
 *       500:
 *         description: Server error
 */
exports.bookAppointment = async (req, res) => {
    try {
        const { doctorId, date, time, reasonForVisit } = req.body;
        const userId = req.user.id;

        // Validate date is not in the past
        const appointmentDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (appointmentDate < today) {
            return res.status(400).json({ 
                success: false,
                message: "Cannot book appointments in the past" 
            });
        }

        // Get day of week from date
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = daysOfWeek[appointmentDate.getDay()];

        // Check if doctor has a schedule for this day
        const doctorSchedule = await Schedule.findOne({
            where: {
                doctor_id: doctorId,
                dayOfWeek: dayOfWeek,
                isAvailable: true
            }
        });

        if (!doctorSchedule) {
            return res.status(400).json({ 
                success: false,
                message: `Doctor is not available on ${dayOfWeek}s` 
            });
        }

        // Validate time is within doctor's schedule
        const requestedTime = time.substring(0, 5); // Get HH:MM format
        const scheduleStart = doctorSchedule.startTime.substring(0, 5);
        const scheduleEnd = doctorSchedule.endTime.substring(0, 5);

        if (requestedTime < scheduleStart || requestedTime >= scheduleEnd) {
            return res.status(400).json({ 
                success: false,
                message: `Doctor is only available from ${scheduleStart} to ${scheduleEnd} on ${dayOfWeek}s` 
            });
        }

        // Check if slot is already booked
        const existingAppointment = await Appointment.findOne({
            where: {
                doctorId: doctorId,
                appointmentDate: date,
                appointmentTime: time,
                status: {
                    [Op.ne]: 'cancelled' // Ignore cancelled appointments
                }
            }
        });

        if (existingAppointment) {
            return res.status(409).json({ 
                success: false,
                message: "This time slot is already booked" 
            });
        }

        // Find Patient linked to User
        const foundPatient = await Patient.findOne({ 
            where: { user_id: userId },
            include: [{ model: User }]
        });

        if (!foundPatient) {
            return res.status(404).json({ 
                success: false,
                message: "Patient profile not found for this user" 
            });
        }

        console.log('Creating appointment with:', {
            doctorId,
            patientId: foundPatient.patientId,
            date,
            time,
            reasonForVisit
        });

        // Create the appointment
        const newAppt = await Appointment.create({
            doctorId,
            patientId: foundPatient.patientId,
            appointmentDate: date,
            appointmentTime: time,
            reasonForVisit: reasonForVisit || 'General Consultation'
        });

        // Send Response immediately
        res.status(201).json({
            success: true,
            message: "Appointment booked successfully",
            data: newAppt
        });

        // Send Confirmation Email via Mailjet (completely async, no blocking)
        setImmediate(async () => {
            try {
                const doctor = await Doctor.findByPk(doctorId, {
                    include: [{ model: User }]
                });
                const doctorName = doctor && doctor.User ? doctor.User.fullName : 'Dr. Unknown';

                const request = mailjet
                    .post("send", { 'version': 'v3.1' })
                    .request({
                        "Messages": [
                            {
                                "From": {
                                    "Email": process.env.MAIL_SENDER,
                                    "Name": "Clinic Admin"
                                },
                                "To": [
                                    {
                                        "Email": foundPatient.User.email,
                                        "Name": foundPatient.User.fullName
                                    }
                                ],
                                "Subject": "Appointment Confirmed",
                                "TextPart": `Dear ${foundPatient.User.fullName},\n\nYour appointment has been confirmed with ${doctorName} on ${date} at ${time}.\n\nReason: ${reasonForVisit || 'General Consultation'}`,
                                "HTMLPart": `<h3>Dear ${foundPatient.User.fullName},</h3><p>Your appointment has been confirmed with <strong>${doctorName}</strong> on <strong>${date}</strong> at <strong>${time}</strong>.</p><p>Reason: ${reasonForVisit || 'General Consultation'}</p>`
                            }
                        ]
                    });

                const result = await request;
                console.log('Appointment confirmation email sent to:', foundPatient.User.email);
            } catch (emailError) {
                console.error('Failed to send appointment email:', emailError.statusCode, emailError.message);
            }
        });

    } catch (error) {
        console.error('Error booking appointment:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ 
                success: false,
                message: "Slot already booked" 
            });
        }
        res.status(500).json({
            success: false,
            message: "Error booking appointment",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/appointments/availability:
 *   get:
 *     summary: Get available time slots for a doctor on a specific date
 *     tags: [Appointments]
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the doctor
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check availability (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Available time slots
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
 *                     availableSlots:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Array of available time slots
 *                     bookedSlots:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Array of booked time slots
 *                     scheduleStart:
 *                       type: string
 *                     scheduleEnd:
 *                       type: string
 *       400:
 *         description: Missing required parameters or doctor not available
 *       500:
 *         description: Server error
 */
exports.checkAvailability = async (req, res) => {
    try {
        const { doctorId, date } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({
                success: false,
                message: "Doctor ID and date are required"
            });
        }

        // Get day of week from date
        const appointmentDate = new Date(date);
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = daysOfWeek[appointmentDate.getDay()];

        // Get doctor's schedule for this day
        const doctorSchedule = await Schedule.findOne({
            where: {
                doctor_id: parseInt(doctorId),
                dayOfWeek: dayOfWeek,
                isAvailable: true
            }
        });

        if (!doctorSchedule) {
            return res.status(400).json({
                success: false,
                message: `Doctor is not available on ${dayOfWeek}s`,
                data: {
                    availableSlots: [],
                    bookedSlots: [],
                    scheduleStart: null,
                    scheduleEnd: null
                }
            });
        }

        // Generate time slots based on schedule (30-minute intervals)
        const timeSlots = [];
        const startTime = doctorSchedule.startTime.substring(0, 5); // HH:MM
        const endTime = doctorSchedule.endTime.substring(0, 5);
        
        let currentTime = startTime;
        while (currentTime < endTime) {
            timeSlots.push(currentTime + ':00'); // Add seconds for consistency
            
            // Add 30 minutes
            const [hours, minutes] = currentTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + 30;
            const newHours = Math.floor(totalMinutes / 60);
            const newMinutes = totalMinutes % 60;
            currentTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
        }

        // Get all booked appointments for this doctor on this date
        const bookedAppointments = await Appointment.findAll({
            where: {
                doctorId: parseInt(doctorId),
                appointmentDate: date,
                status: {
                    [Op.ne]: 'cancelled' // Exclude cancelled appointments
                }
            },
            attributes: ['appointmentTime']
        });

        const bookedSlots = bookedAppointments.map(apt => apt.appointmentTime);
        
        // Filter out booked slots from available slots
        const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));

        res.status(200).json({
            success: true,
            data: {
                availableSlots,
                bookedSlots,
                scheduleStart: startTime,
                scheduleEnd: endTime,
                dayOfWeek
            }
        });

    } catch (error) {
        console.error("Error checking availability:", error);
        res.status(500).json({
            success: false,
            message: "Error checking appointment availability",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/appointments/doctor/{doctorId}/schedule:
 *   get:
 *     summary: Get doctor's weekly schedule
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the doctor
 *     responses:
 *       200:
 *         description: Doctor's weekly schedule
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
exports.getDoctorSchedule = async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Verify doctor exists
        const doctor = await Doctor.findByPk(doctorId, {
            include: [{
                model: User,
                attributes: ['fullName']
            }]
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        // Get doctor's schedule
        const schedule = await Schedule.findAll({
            where: { 
                doctor_id: parseInt(doctorId),
                isAvailable: true
            },
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
            data: {
                doctor: {
                    id: doctor.doctorId,
                    name: doctor.User?.fullName,
                    specialization: doctor.specialization
                },
                schedule
            }
        });

    } catch (error) {
        console.error("Error fetching doctor schedule:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching doctor schedule",
            error: error.message
        });
    }
};

module.exports = exports;
