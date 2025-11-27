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
