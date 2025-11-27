const { Doctor, User } = require('../models');

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
