const { Patient, User } = require('../models');

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
