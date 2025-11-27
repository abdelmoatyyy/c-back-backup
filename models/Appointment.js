const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
    appointmentId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'appointment_id'
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
    appointmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'appointment_date'
    },
    appointmentTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'appointment_time'
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'completed', 'cancelled', 'no_show'),
        defaultValue: 'scheduled'
    },
    reasonForVisit: {
        type: DataTypes.TEXT,
        field: 'reason_for_visit'
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
    tableName: 'appointments'
});

module.exports = Appointment;
