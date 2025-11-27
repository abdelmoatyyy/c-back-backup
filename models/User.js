const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'user_id'
    },
    fullName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'full_name'
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash'
    },
    role: {
        type: DataTypes.ENUM('admin', 'doctor', 'patient'),
        allowNull: false,
        defaultValue: 'patient'
    },
    phoneNumber: {
        type: DataTypes.STRING(20),
        field: 'phone_number'
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
    tableName: 'users'
});

module.exports = User;
