const sequelize = require('../config/database');
const User = require('./User');
const Doctor = require('./Doctor');
const Schedule = require('./Schedule');
const Patient = require('./Patient');
const Appointment = require('./Appointment');
const MedicalRecord = require('./MedicalRecord');

// Associations

// User <-> Doctor
User.hasOne(Doctor, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Doctor.belongsTo(User, { foreignKey: 'user_id' });

// User <-> Patient
User.hasOne(Patient, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Patient.belongsTo(User, { foreignKey: 'user_id' });

// Doctor <-> Schedule
Doctor.hasMany(Schedule, { foreignKey: 'doctor_id', onDelete: 'CASCADE' });
Schedule.belongsTo(Doctor, { foreignKey: 'doctor_id' });

// Doctor <-> Appointment
Doctor.hasMany(Appointment, { foreignKey: 'doctor_id', onDelete: 'CASCADE' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id' });

// Patient <-> Appointment
Patient.hasMany(Appointment, { foreignKey: 'patient_id', onDelete: 'CASCADE' });
Appointment.belongsTo(Patient, { foreignKey: 'patient_id' });

// Appointment <-> MedicalRecord
Appointment.hasOne(MedicalRecord, { foreignKey: 'appointment_id', onDelete: 'CASCADE' });
MedicalRecord.belongsTo(Appointment, { foreignKey: 'appointment_id' });

module.exports = {
    sequelize,
    User,
    Doctor,
    Schedule,
    Patient,
    Appointment,
    MedicalRecord
};
