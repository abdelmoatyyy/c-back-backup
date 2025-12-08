const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MedicalRecord = sequelize.define('MedicalRecord', {
    recordId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'record_id'
    },
    patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'patient_id'
    },
    doctorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'doctor_id'
    },
    appointmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'appointment_id'
    },
    diagnosis: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    prescription: {
        type: DataTypes.TEXT
    },
    treatmentPlan: {
        type: DataTypes.TEXT,
        field: 'treatment_plan'
    },
    recordDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'record_date'
    }
}, {
    timestamps: false,
    underscored: true,
    tableName: 'medical_records'
});

module.exports = MedicalRecord;
