const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
    patientId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'patient_id'
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'date_of_birth'
    },
    gender: {
        type: DataTypes.ENUM('Male', 'Female', 'Other'),
        allowNull: false
    },
    bloodGroup: {
        type: DataTypes.STRING(5),
        field: 'blood_group'
    },
    address: {
        type: DataTypes.TEXT
    }
}, {
    timestamps: false,
    underscored: true,
    tableName: 'patients'
});

module.exports = Patient;
