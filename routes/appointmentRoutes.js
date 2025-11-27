const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/book', authMiddleware, appointmentController.bookAppointment);
router.get('/availability', appointmentController.checkAvailability);

module.exports = router;
