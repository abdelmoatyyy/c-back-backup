const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

const authMiddleware = require('../middleware/authMiddleware');

router.get('/', doctorController.getAllDoctors);
router.post('/profile', authMiddleware, doctorController.updateProfile);

module.exports = router;
