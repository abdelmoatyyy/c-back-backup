const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
    patientId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'patient_id'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'user_id'
        }
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'date_of_birth'
    },
    gender: {
        type: DataTypes.ENUM('Male', 'Female', 'Other'),
        allowNull: true
    },
    bloodGroup: {
        type: DataTypes.STRING(5),
        field: 'blood_group'
    },
    address: {
        type: DataTypes.TEXT
    },
    phoneNumber: {
        type: DataTypes.STRING(20),
        field: 'phone_number'
    },
    emergencyContact: {
        type: DataTypes.STRING(100),
        field: 'emergency_contact'
    }
}, {
    timestamps: false,
    underscored: true,
    tableName: 'patients'
});

module.exports = Patient;
