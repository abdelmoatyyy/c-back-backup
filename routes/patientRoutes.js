const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/profile', authMiddleware, patientController.getProfile);
router.post('/profile', authMiddleware, patientController.updateProfile);
router.get('/appointments', authMiddleware, patientController.getAppointments);
router.put('/appointments/:appointmentId/cancel', authMiddleware, patientController.cancelAppointment);

module.exports = router;
