const { Patient, User, Appointment, Doctor } = require('../models');

/**
 * @swagger
 * /api/patients/profile:
 *   get:
 *     summary: Get current patient profile
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient profile data
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
 *                     patientId:
 *                       type: integer
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                     gender:
 *                       type: string
 *                     User:
 *                       type: object
 *                       properties:
 *                         fullName:
 *                           type: string
 *                         email:
 *                           type: string
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const profile = await Patient.findOne({
            where: { user_id: userId },
            include: [{
                model: User,
                attributes: ['fullName', 'email', 'phoneNumber']
            }]
        });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Patient profile not found"
            });
        }

        res.status(200).json({
            success: true,
            data: profile
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching profile",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/patients/profile:
 *   post:
 *     summary: Create or update patient profile
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dateOfBirth
 *               - gender
 *             properties:
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               bloodGroup:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       500:
 *         description: Server error
 */
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id; // From authMiddleware
        const { dateOfBirth, gender, bloodGroup, address } = req.body;

        // Check if profile exists
        let patient = await Patient.findOne({ where: { userId } });

        if (patient) {
            // Update
            patient.dateOfBirth = dateOfBirth;
            patient.gender = gender;
            patient.bloodGroup = bloodGroup;
            patient.address = address;
            await patient.save();
        } else {
            // Create
            patient = await Patient.create({
                userId,
                dateOfBirth,
                gender,
                bloodGroup,
                address
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: patient
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({
            success: false,
            message: "Error updating profile",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/patients/appointments:
 *   get:
 *     summary: Get patient's appointments
 *     tags: [Patients]
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
 *         description: Patient appointments retrieved successfully
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
 *                       appointmentId:
 *                         type: integer
 *                       appointmentDate:
 *                         type: string
 *                         format: date
 *                       appointmentTime:
 *                         type: string
 *                       status:
 *                         type: string
 *                       Doctor:
 *                         type: object
 *                         properties:
 *                           specialization:
 *                             type: string
 *                           User:
 *                             type: object
 *                             properties:
 *                               fullName:
 *                                 type: string
 *       404:
 *         description: Patient profile not found
 *       500:
 *         description: Server error
 */
exports.getAppointments = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        // Find the patient first
        const patient = await Patient.findOne({
            where: { user_id: userId }
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient profile not found"
            });
        }

        // Build where clause for appointments
        const whereClause = { patientId: patient.patientId };
        if (status) {
            whereClause.status = status;
        }

        // Get appointments with doctor information
        const appointments = await Appointment.findAll({
            where: whereClause,
            include: [{
                model: Doctor,
                include: [{
                    model: User,
                    attributes: ['fullName', 'email']
                }],
                attributes: ['specialization', 'consultationFee', 'roomNumber', 'bio']
            }],
            order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: appointments,
            count: appointments.length
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
 * /api/patients/appointments/{appointmentId}/cancel:
 *   put:
 *     summary: Cancel a patient's appointment
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the appointment to cancel
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *       403:
 *         description: Not authorized to cancel this appointment
 *       404:
 *         description: Appointment not found
 *       400:
 *         description: Appointment already cancelled or completed
 *       500:
 *         description: Server error
 */
exports.cancelAppointment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { appointmentId } = req.params;

        // Find the patient
        const patient = await Patient.findOne({
            where: { user_id: userId }
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient profile not found"
            });
        }

        // Find the appointment
        const appointment = await Appointment.findOne({
            where: { 
                appointmentId: appointmentId,
                patientId: patient.patientId
            },
            include: [{
                model: Doctor,
                include: [{
                    model: User,
                    attributes: ['fullName', 'email']
                }]
            }]
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        // Check if appointment can be cancelled
        if (appointment.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: "Appointment is already cancelled"
            });
        }

        if (appointment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: "Cannot cancel a completed appointment"
            });
        }

        // Update appointment status to cancelled
        appointment.status = 'cancelled';
        await appointment.save();

        res.status(200).json({
            success: true,
            message: "Appointment cancelled successfully",
            data: appointment
        });

    } catch (error) {
        console.error("Error cancelling appointment:", error);
        res.status(500).json({
            success: false,
            message: "Error cancelling appointment",
            error: error.message
        });
    }
};
