const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/stats', adminController.getStats);
router.post('/doctors', adminController.addDoctor);
router.delete('/doctors/:doctorId', adminController.deleteDoctor);
router.get('/patients', adminController.getAllPatients);
router.delete('/patients/:patientId', adminController.deletePatient);

module.exports = router;
