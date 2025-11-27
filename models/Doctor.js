const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Doctor = sequelize.define('Doctor', {
    doctorId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'doctor_id'
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        }
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
    timestamps: false,
    underscored: true,
    tableName: 'doctors'
});

module.exports = Doctor;
