const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Schedule = sequelize.define('DoctorSchedule', {
    scheduleId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'schedule_id'
    },
    dayOfWeek: {
        type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
        allowNull: false,
        field: 'day_of_week'
    },
    startTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'start_time'
    },
    endTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'end_time'
    },
    isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_available'
    }
}, {
    timestamps: false,
    underscored: true,
    tableName: 'doctor_schedules'
});

module.exports = Schedule;
