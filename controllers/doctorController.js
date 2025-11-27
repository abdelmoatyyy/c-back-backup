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
