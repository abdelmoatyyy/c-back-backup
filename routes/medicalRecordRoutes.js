const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecordController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.post('/appointment/:appointmentId', authMiddleware, medicalRecordController.createOrUpdateRecord);
router.get('/patient/:patientId', authMiddleware, medicalRecordController.getPatientHistory);
router.get('/my-patients', authMiddleware, medicalRecordController.getMyPatients);
router.get('/:recordId', authMiddleware, medicalRecordController.getRecordById);
router.put('/:recordId', authMiddleware, medicalRecordController.updateRecord);
router.delete('/:recordId', authMiddleware, medicalRecordController.deleteRecord);

module.exports = router;
