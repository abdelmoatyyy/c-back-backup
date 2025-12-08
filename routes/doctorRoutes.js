const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

const authMiddleware = require('../middleware/authMiddleware');

router.get('/', doctorController.getAllDoctors);

// Doctor profile routes
router.get('/profile', authMiddleware, doctorController.getProfile);
router.post('/profile', authMiddleware, doctorController.updateProfile);

router.get('/dashboard/stats', authMiddleware, doctorController.getDashboardStats);
router.get('/appointments', authMiddleware, doctorController.getAppointments);
router.put('/appointments/:appointmentId/status', authMiddleware, doctorController.updateAppointmentStatus);

// Schedule routes
router.get('/schedule', authMiddleware, doctorController.getSchedule);
router.post('/schedule', authMiddleware, doctorController.addSchedule);
router.put('/schedule/:scheduleId', authMiddleware, doctorController.updateSchedule);
router.delete('/schedule/:scheduleId', authMiddleware, doctorController.deleteSchedule);

module.exports = router;
