const { MedicalRecord, Appointment, Patient, Doctor, User } = require('../models');
const { Op } = require('sequelize');

/**
 * @swagger
 * /api/medical-records/appointment/{appointmentId}:
 *   post:
 *     summary: Create or update medical record for an appointment
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - diagnosis
 *             properties:
 *               diagnosis:
 *                 type: string
 *               prescription:
 *                 type: string
 *               treatmentPlan:
 *                 type: string
 *     responses:
 *       201:
 *         description: Medical record created/updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */
exports.createOrUpdateRecord = async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can create medical records."
            });
        }

        const userId = req.user.id;
        const { appointmentId } = req.params;
        const { diagnosis, prescription, treatmentPlan } = req.body;

        if (!diagnosis) {
            return res.status(400).json({
                success: false,
                message: "Diagnosis is required"
            });
        }

        // Verify doctor profile
        const doctor = await Doctor.findOne({ where: { user_id: userId } });
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        // Verify appointment belongs to this doctor and get patient_id
        const appointment = await Appointment.findOne({
            where: {
                appointmentId: appointmentId,
                doctorId: doctor.doctorId
            }
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found or you don't have access to it"
            });
        }

        // Check if medical record already exists
        let medicalRecord = await MedicalRecord.findOne({
            where: { appointment_id: appointmentId }
        });

        if (medicalRecord) {
            // Update existing record
            medicalRecord.diagnosis = diagnosis;
            medicalRecord.prescription = prescription || medicalRecord.prescription;
            medicalRecord.treatmentPlan = treatmentPlan || medicalRecord.treatmentPlan;
            await medicalRecord.save();

            return res.status(200).json({
                success: true,
                message: "Medical record updated successfully",
                data: medicalRecord
            });
        } else {
            // Create new record with patient_id and doctor_id from appointment
            medicalRecord = await MedicalRecord.create({
                appointmentId: appointmentId,
                patientId: appointment.patientId,
                doctorId: appointment.doctorId,
                diagnosis,
                prescription,
                treatmentPlan
            });

            return res.status(201).json({
                success: true,
                message: "Medical record created successfully",
                data: medicalRecord
            });
        }

    } catch (error) {
        console.error("Error creating/updating medical record:", error);
        res.status(500).json({
            success: false,
            message: "Error creating/updating medical record",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/medical-records/patient/{patientId}:
 *   get:
 *     summary: Get all medical records for a patient
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patient's medical history
 *       403:
 *         description: Access denied
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
exports.getPatientHistory = async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can view medical records."
            });
        }

        const { patientId } = req.params;

        // Get patient info
        const patient = await Patient.findOne({
            where: { patientId: patientId },
            include: [{
                model: User,
                attributes: ['fullName', 'email', 'phoneNumber']
            }]
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // Get all medical records for this patient
        const medicalRecords = await MedicalRecord.findAll({
            include: [{
                model: Appointment,
                where: { patientId: patientId },
                include: [{
                    model: Doctor,
                    include: [{
                        model: User,
                        attributes: ['fullName']
                    }]
                }]
            }],
            order: [['recordDate', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: {
                patient: patient,
                records: medicalRecords
            }
        });

    } catch (error) {
        console.error("Error fetching patient history:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching patient history",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/medical-records/{recordId}:
 *   get:
 *     summary: Get a specific medical record
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Medical record details
 *       403:
 *         description: Access denied
 *       404:
 *         description: Record not found
 *       500:
 *         description: Server error
 */
exports.getRecordById = async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can view medical records."
            });
        }

        const { recordId } = req.params;

        const medicalRecord = await MedicalRecord.findOne({
            where: { recordId: recordId },
            include: [{
                model: Appointment,
                include: [
                    {
                        model: Patient,
                        include: [{
                            model: User,
                            attributes: ['fullName', 'email', 'phoneNumber']
                        }]
                    },
                    {
                        model: Doctor,
                        include: [{
                            model: User,
                            attributes: ['fullName']
                        }]
                    }
                ]
            }]
        });

        if (!medicalRecord) {
            return res.status(404).json({
                success: false,
                message: "Medical record not found"
            });
        }

        res.status(200).json({
            success: true,
            data: medicalRecord
        });

    } catch (error) {
        console.error("Error fetching medical record:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching medical record",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/medical-records/{recordId}:
 *   put:
 *     summary: Update a medical record
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               diagnosis:
 *                 type: string
 *               prescription:
 *                 type: string
 *               treatmentPlan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Medical record updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Record not found
 *       500:
 *         description: Server error
 */
exports.updateRecord = async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can update medical records."
            });
        }

        const userId = req.user.id;
        const { recordId } = req.params;
        const { diagnosis, prescription, treatmentPlan } = req.body;

        // Verify doctor profile
        const doctor = await Doctor.findOne({ where: { user_id: userId } });
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        // Find the medical record
        const medicalRecord = await MedicalRecord.findOne({
            where: { recordId: recordId },
            include: [{
                model: Appointment,
                where: { doctorId: doctor.doctorId }
            }]
        });

        if (!medicalRecord) {
            return res.status(404).json({
                success: false,
                message: "Medical record not found or you don't have access to it"
            });
        }

        // Update fields
        if (diagnosis) medicalRecord.diagnosis = diagnosis;
        if (prescription !== undefined) medicalRecord.prescription = prescription;
        if (treatmentPlan !== undefined) medicalRecord.treatmentPlan = treatmentPlan;

        await medicalRecord.save();

        res.status(200).json({
            success: true,
            message: "Medical record updated successfully",
            data: medicalRecord
        });

    } catch (error) {
        console.error("Error updating medical record:", error);
        res.status(500).json({
            success: false,
            message: "Error updating medical record",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/medical-records/{recordId}:
 *   delete:
 *     summary: Delete a medical record
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Medical record deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Record not found
 *       500:
 *         description: Server error
 */
exports.deleteRecord = async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can delete medical records."
            });
        }

        const userId = req.user.id;
        const { recordId } = req.params;

        // Verify doctor profile
        const doctor = await Doctor.findOne({ where: { user_id: userId } });
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        // Find the medical record
        const medicalRecord = await MedicalRecord.findOne({
            where: { recordId: recordId },
            include: [{
                model: Appointment,
                where: { doctorId: doctor.doctorId }
            }]
        });

        if (!medicalRecord) {
            return res.status(404).json({
                success: false,
                message: "Medical record not found or you don't have access to it"
            });
        }

        await medicalRecord.destroy();

        res.status(200).json({
            success: true,
            message: "Medical record deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting medical record:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting medical record",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/medical-records/my-patients:
 *   get:
 *     summary: Get all patients with their latest medical records for the logged-in doctor
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of patients
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
exports.getMyPatients = async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only doctors can view their patients."
            });
        }

        const userId = req.user.id;
        const doctor = await Doctor.findOne({ where: { user_id: userId } });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        // Get all appointments for this doctor
        const appointments = await Appointment.findAll({
            where: { doctorId: doctor.doctorId },
            include: [{
                model: Patient,
                include: [{
                    model: User,
                    attributes: ['fullName', 'email', 'phoneNumber']
                }]
            }],
            order: [['appointmentDate', 'DESC']]
        });

        // Get unique patients with their record count and last visit
        const patientMap = new Map();
        for (const appointment of appointments) {
            if (appointment.Patient && !patientMap.has(appointment.patientId)) {
                // Count medical records for this patient
                const recordCount = await MedicalRecord.count({
                    include: [{
                        model: Appointment,
                        where: {
                            patientId: appointment.patientId,
                            doctorId: doctor.doctorId
                        }
                    }]
                });

                patientMap.set(appointment.patientId, {
                    ...appointment.Patient.toJSON(),
                    recordCount,
                    lastVisit: appointment.appointmentDate
                });
            }
        }

        const patients = Array.from(patientMap.values());

        res.status(200).json({
            success: true,
            data: patients
        });

    } catch (error) {
        console.error("Error fetching patients:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching patients",
            error: error.message
        });
    }
};

module.exports = exports;
