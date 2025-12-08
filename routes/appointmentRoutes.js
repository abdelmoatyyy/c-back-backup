const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/book', authMiddleware, appointmentController.bookAppointment);
router.get('/availability', appointmentController.checkAvailability);
router.get('/doctor/:doctorId/schedule', appointmentController.getDoctorSchedule);

module.exports = router;
