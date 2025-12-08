const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const { specs, swaggerUi } = require('./config/swagger');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());              // Allow frontend to talk to backend
app.use(express.json());      // Parse JSON bodies

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/medical-records', require('./routes/medicalRecordRoutes'));

// Test DB Connection
sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connected successfully to Aiven!');
    })
    .catch(err => {
        console.error('❌ Database connection error:', err);
    });

// Simple Route to check if server is alive
app.get('/', (req, res) => {
    res.send('Clinic API is running...');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});