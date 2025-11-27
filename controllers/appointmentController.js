const { Appointment, Patient, User, Doctor } = require('../models');
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
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 *       404:
 *         description: Patient profile not found
 *       409:
 *         description: Slot already booked
 *       500:
 *         description: Server error
 */
exports.bookAppointment = async (req, res) => {
    try {
        const { doctorId, date, time } = req.body;
        const userId = req.user.id;

        // Find Patient linked to User
        const foundPatient = await Patient.findOne({ 
            where: { user_id: userId },
            include: [{ model: User }] // Include User to get email
        });

        if (!foundPatient) {
            return res.status(404).json({ message: "Patient profile not found for this user" });
        }

        console.log('Creating appointment with:', {
            doctorId,
            patientId: foundPatient.patientId,
            date,
            time
        });

        const newAppt = await Appointment.create({
            doctorId,
            patientId: foundPatient.patientId,
            appointmentDate: date,
            appointmentTime: time
        });

        // Fetch Doctor details to get name
        const doctor = await Doctor.findByPk(doctorId, {
            include: [{ model: User }]
        });
        const doctorName = doctor && doctor.User ? doctor.User.fullName : 'Dr. Unknown';

        // Send Confirmation Email via Mailjet (non-blocking)
        const sendEmailAsync = async () => {
            try {
                const request = mailjet
                    .post("send", { 'version': 'v3.1' })
                    .request({
                        "Messages": [
                            {
                                "From": {
                                    "Email": process.env.MAIL_SENDER, // Sender must be verified in Mailjet
                                    "Name": "Clinic Admin"
                                },
                                "To": [
                                    {
                                        "Email": foundPatient.User.email,
                                        "Name": foundPatient.User.fullName
                                    }
                                ],
                                "Subject": "Appointment Confirmed",
                                "TextPart": `Dear ${foundPatient.User.fullName},\n\nYour appointment has been confirmed with ${doctorName} on ${date} at ${time}.`,
                                "HTMLPart": `<h3>Dear ${foundPatient.User.fullName},</h3><p>Your appointment has been confirmed with <strong>${doctorName}</strong> on <strong>${date}</strong> at <strong>${time}</strong>.</p>`
                            }
                        ]
                    });

                const result = await request;
                console.log('Appointment confirmation email sent to:', foundPatient.User.email);
                console.log('Mailjet response:', result.body);
            } catch (emailError) {
                console.error('Failed to send appointment email:', emailError.statusCode, emailError.message);
                // Email failure is logged but doesn't affect appointment response
            }
        };

        // Fire and forget - don't wait for email to send
        sendEmailAsync();

        // Send Response immediately
        res.status(201).json(newAppt);

    } catch (error) {
        // CATCH THE DUPLICATE ERROR
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: "Slot already booked" });
        }
        res.status(500).json({
            message: "Error booking appointment",
            error: error.message
        });
    }
};
