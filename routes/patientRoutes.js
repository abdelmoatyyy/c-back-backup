const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/profile', authMiddleware, patientController.getProfile);

module.exports = router;
