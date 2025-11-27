const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/stats', adminController.getStats);
router.post('/doctors', adminController.addDoctor);

module.exports = router;
