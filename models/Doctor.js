const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Doctor = sequelize.define('Doctor', {
    doctorId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'doctor_id'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id'
    },
    specialization: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    bio: {
        type: DataTypes.TEXT
    },
    consultationFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'consultation_fee'
    },
    roomNumber: {
        type: DataTypes.STRING(20),
        field: 'room_number'
    }
}, {
    timestamps: false, // Table doesn't have created_at/updated_at based on schema provided in prompt? 
    // Wait, the prompt schema for doctors DOES NOT show created_at. 
    // users has created_at. patients has nothing. doctors has nothing. 
    // doctor_schedules has nothing. appointments has created_at. medical_records has record_date.
    // So timestamps: false for Doctor.
    underscored: true,
    tableName: 'doctors'
});

module.exports = Doctor;
