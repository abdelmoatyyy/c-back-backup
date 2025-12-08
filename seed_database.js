const bcrypt = require('bcryptjs');
const { User, Doctor, Patient, Schedule, Appointment, MedicalRecord, sequelize } = require('./models');

// Medical specializations
const specializations = [
    'Cardiology',
    'Neurology', 
    'Pediatrics',
    'Orthopedics',
    'Dermatology',
    'Ophthalmology',
    'Psychiatry',
    'General Medicine'
];

// Doctor data with Egyptian names
const doctorsData = [
    { 
        name: 'Malak ElGendy', 
        specialization: 'Cardiology', 
        fee: 800, 
        email: 'malak.elgendy@clinic.com',
        phone: '+20 100 234 5678',
        bio: 'Leading cardiologist with over 15 years of experience in cardiovascular diseases and interventional cardiology. Specialized in heart failure management and cardiac imaging.',
        roomNumber: 'C-101'
    },
    { 
        name: 'Ahmed Abdelmoaty', 
        specialization: 'Neurology', 
        fee: 600,
        email: 'ahmed.abdelmoaty@clinic.com',
        phone: '+20 101 345 6789',
        bio: 'Experienced neurologist specializing in stroke management, epilepsy, and movement disorders. Member of the Egyptian Society of Neurology.',
        roomNumber: 'N-201'
    },
    { 
        name: 'Ola Omara', 
        specialization: 'Pediatrics', 
        fee: 450,
        email: 'ola.omara@clinic.com',
        phone: '+20 102 456 7890',
        bio: 'Caring pediatrician with expertise in child development, vaccinations, and pediatric nutrition. Mother of three with a passion for children\'s health.',
        roomNumber: 'P-301'
    },
    { 
        name: 'Omar Nabil', 
        specialization: 'Orthopedics', 
        fee: 550,
        email: 'omar.nabil@clinic.com',
        phone: '+20 103 567 8901',
        bio: 'Orthopedic surgeon specialized in sports medicine, joint replacement, and arthroscopic surgery. Former team physician for national sports teams.',
        roomNumber: 'O-102'
    },
    { 
        name: 'Jana Wael', 
        specialization: 'Dermatology', 
        fee: 500,
        email: 'jana.wael@clinic.com',
        phone: '+20 104 678 9012',
        bio: 'Expert dermatologist focusing on cosmetic dermatology, laser treatments, and skin cancer prevention. Published researcher in dermatological journals.',
        roomNumber: 'D-202'
    },
    { 
        name: 'Seif Amgad', 
        specialization: 'Cardiology', 
        fee: 650,
        email: 'seif.amgad@clinic.com',
        phone: '+20 105 789 0123',
        bio: 'Interventional cardiologist with expertise in angioplasty, stent placement, and preventive cardiology. Trained in leading European cardiac centers.',
        roomNumber: 'C-103'
    },
    { 
        name: 'Sherifa Helmy', 
        specialization: 'Ophthalmology', 
        fee: 480,
        email: 'sherifa.helmy@clinic.com',
        phone: '+20 106 890 1234',
        bio: 'Ophthalmologist specialized in cataract surgery, LASIK, and retinal diseases. Pioneer in advanced eye care techniques in Egypt.',
        roomNumber: 'E-401'
    },
    { 
        name: 'Lobna Khalifa', 
        specialization: 'Psychiatry', 
        fee: 520,
        email: 'lobna.khalifa@clinic.com',
        phone: '+20 107 901 2345',
        bio: 'Compassionate psychiatrist specializing in anxiety disorders, depression, and cognitive behavioral therapy. Advocate for mental health awareness.',
        roomNumber: 'PS-501'
    },
    { 
        name: 'Jowayria Hamdy', 
        specialization: 'Neurology', 
        fee: 580,
        email: 'jowayria.hamdy@clinic.com',
        phone: '+20 108 012 3456',
        bio: 'Neurologist with focus on neurodegenerative diseases, multiple sclerosis, and headache disorders. Active in clinical research and patient education.',
        roomNumber: 'N-203'
    },
    { 
        name: 'Abdelrahman Fayez', 
        specialization: 'Pediatrics', 
        fee: 470,
        email: 'abdelrahman.fayez@clinic.com',
        phone: '+20 109 123 4567',
        bio: 'Dedicated pediatrician with expertise in neonatal care, childhood infections, and asthma management. Known for gentle approach with children.',
        roomNumber: 'P-302'
    }
];

// Patient data
const patientsData = [
    { name: 'Fatma Hassan', dob: '1985-03-15', gender: 'Female', bloodGroup: 'O+', address: '12 Ahmed Orabi St, Mohandessin, Cairo', email: 'fatma.hassan@email.com', phone: '+20 110 111 2222' },
    { name: 'Mohamed Samir', dob: '1992-07-22', gender: 'Male', bloodGroup: 'A+', address: '45 Salah Salem St, Nasr City, Cairo', email: 'mohamed.samir@email.com', phone: '+20 111 222 3333' },
    { name: 'Nour Mahmoud', dob: '1988-11-30', gender: 'Female', bloodGroup: 'B+', address: '78 El-Thawra St, Heliopolis, Cairo', email: 'nour.mahmoud@email.com', phone: '+20 112 333 4444' },
    { name: 'Youssef Ibrahim', dob: '1995-05-18', gender: 'Male', bloodGroup: 'AB+', address: '23 Haram St, Giza', email: 'youssef.ibrahim@email.com', phone: '+20 113 444 5555' },
    { name: 'Salma Ahmed', dob: '1990-09-25', gender: 'Female', bloodGroup: 'O-', address: '56 Port Said St, Alexandria', email: 'salma.ahmed@email.com', phone: '+20 114 555 6666' },
    { name: 'Karim Mostafa', dob: '1987-12-10', gender: 'Male', bloodGroup: 'A-', address: '89 Gamal Abdel Nasser St, Mansoura', email: 'karim.mostafa@email.com', phone: '+20 115 666 7777' },
    { name: 'Heba Ali', dob: '1993-02-14', gender: 'Female', bloodGroup: 'B-', address: '34 El-Nozha St, Cairo', email: 'heba.ali@email.com', phone: '+20 116 777 8888' },
    { name: 'Omar Khaled', dob: '1991-08-08', gender: 'Male', bloodGroup: 'AB-', address: '67 Ramses St, Downtown Cairo', email: 'omar.khaled@email.com', phone: '+20 117 888 9999' },
    { name: 'Laila Sayed', dob: '1989-04-20', gender: 'Female', bloodGroup: 'O+', address: '90 Pyramids Ave, Giza', email: 'laila.sayed@email.com', phone: '+20 118 999 0000' },
    { name: 'Hassan Fouad', dob: '1994-06-12', gender: 'Male', bloodGroup: 'A+', address: '12 Sphinx St, Dokki, Cairo', email: 'hassan.fouad@email.com', phone: '+20 119 000 1111' },
    { name: 'Mona Tamer', dob: '1986-10-05', gender: 'Female', bloodGroup: 'B+', address: '45 Tahrir St, Cairo', email: 'mona.tamer@email.com', phone: '+20 120 111 2222' },
    { name: 'Amr Adel', dob: '1996-01-28', gender: 'Male', bloodGroup: 'O+', address: '78 Zamalek St, Cairo', email: 'amr.adel@email.com', phone: '+20 121 222 3333' },
    { name: 'Rana Yasser', dob: '1992-03-17', gender: 'Female', bloodGroup: 'A-', address: '23 Maadi St, Cairo', email: 'rana.yasser@email.com', phone: '+20 122 333 4444' },
    { name: 'Tarek Gamal', dob: '1984-07-09', gender: 'Male', bloodGroup: 'AB+', address: '56 October St, 6th October City', email: 'tarek.gamal@email.com', phone: '+20 123 444 5555' },
    { name: 'Dina Essam', dob: '1991-11-22', gender: 'Female', bloodGroup: 'O-', address: '89 New Cairo St, Cairo', email: 'dina.essam@email.com', phone: '+20 124 555 6666' }
];

// Schedule templates for different specializations
const scheduleTemplates = {
    morning: [
        { day: 'Sunday', start: '09:00:00', end: '13:00:00' },
        { day: 'Monday', start: '09:00:00', end: '13:00:00' },
        { day: 'Wednesday', start: '09:00:00', end: '13:00:00' },
    ],
    afternoon: [
        { day: 'Sunday', start: '14:00:00', end: '18:00:00' },
        { day: 'Tuesday', start: '14:00:00', end: '18:00:00' },
        { day: 'Thursday', start: '14:00:00', end: '18:00:00' },
    ],
    evening: [
        { day: 'Monday', start: '17:00:00', end: '21:00:00' },
        { day: 'Wednesday', start: '17:00:00', end: '21:00:00' },
        { day: 'Saturday', start: '17:00:00', end: '21:00:00' },
    ],
    fullDay: [
        { day: 'Sunday', start: '10:00:00', end: '16:00:00' },
        { day: 'Tuesday', start: '10:00:00', end: '16:00:00' },
        { day: 'Thursday', start: '10:00:00', end: '16:00:00' },
        { day: 'Saturday', start: '10:00:00', end: '16:00:00' },
    ]
};

// Helper function to get random schedule
function getScheduleForDoctor(index) {
    const templates = ['morning', 'afternoon', 'evening', 'fullDay'];
    const templateKey = templates[index % templates.length];
    return scheduleTemplates[templateKey];
}

// Helper function to get future dates
function getFutureDate(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
}

async function seedDatabase() {
    try {
        console.log('🚀 Starting database seeding...\n');

        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connected successfully\n');

        // Delete all existing data in correct order
        console.log('🗑️  Deleting existing data...');
        await MedicalRecord.destroy({ where: {}, force: true });
        await Appointment.destroy({ where: {}, force: true });
        await Schedule.destroy({ where: {}, force: true });
        await Doctor.destroy({ where: {}, force: true });
        await Patient.destroy({ where: {}, force: true });
        await User.destroy({ where: { role: ['doctor', 'patient'] }, force: true });
        console.log('✅ Existing data deleted\n');

        // Default password for all users
        const defaultPassword = 'password123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const createdDoctors = [];
        const doctorCredentials = [];

        // Create doctors
        console.log('👨‍⚕️ Creating doctors...');
        for (let i = 0; i < doctorsData.length; i++) {
            const doctorData = doctorsData[i];
            
            // Create user
            const user = await User.create({
                fullName: doctorData.name,
                email: doctorData.email,
                passwordHash: hashedPassword,
                role: 'doctor',
                phoneNumber: doctorData.phone
            });

            // Create doctor profile
            const doctor = await Doctor.create({
                userId: user.userId,
                specialization: doctorData.specialization,
                bio: doctorData.bio,
                consultationFee: doctorData.fee,
                roomNumber: doctorData.roomNumber
            });

            createdDoctors.push(doctor);

            // Create schedule
            const scheduleSlots = getScheduleForDoctor(i);
            for (const slot of scheduleSlots) {
                await Schedule.create({
                    doctorId: doctor.doctorId,
                    dayOfWeek: slot.day,
                    startTime: slot.start,
                    endTime: slot.end,
                    isAvailable: true
                });
            }

            doctorCredentials.push({
                name: doctorData.name,
                email: doctorData.email,
                password: defaultPassword,
                specialization: doctorData.specialization,
                fee: doctorData.fee,
                roomNumber: doctorData.roomNumber
            });

            console.log(`   ✓ Created: Dr. ${doctorData.name} (${doctorData.specialization})`);
        }

        console.log(`✅ ${createdDoctors.length} doctors created\n`);

        // Create patients
        console.log('👥 Creating patients...');
        const createdPatients = [];
        const patientCredentials = [];

        for (const patientData of patientsData) {
            const user = await User.create({
                fullName: patientData.name,
                email: patientData.email,
                passwordHash: hashedPassword,
                role: 'patient',
                phoneNumber: patientData.phone
            });

            const patient = await Patient.create({
                userId: user.userId,
                dateOfBirth: patientData.dob,
                gender: patientData.gender,
                bloodGroup: patientData.bloodGroup,
                address: patientData.address
            });

            createdPatients.push(patient);
            patientCredentials.push({
                name: patientData.name,
                email: patientData.email,
                password: defaultPassword
            });

            console.log(`   ✓ Created: ${patientData.name}`);
        }

        console.log(`✅ ${createdPatients.length} patients created\n`);

        // Create appointments
        console.log('📅 Creating appointments...');
        const appointmentReasons = [
            'Regular checkup and consultation',
            'Follow-up visit for previous treatment',
            'Experiencing chest pain and discomfort',
            'Persistent headaches and dizziness',
            'Annual health screening',
            'Vaccination consultation',
            'Pain management consultation',
            'Skin condition evaluation',
            'Vision problems and eye examination',
            'Mental health consultation',
            'Joint pain and mobility issues',
            'Chronic condition monitoring',
            'Medication review and adjustment',
            'Post-surgery follow-up',
            'Preventive care consultation'
        ];

        let appointmentCount = 0;
        for (let i = 0; i < createdDoctors.length; i++) {
            const doctor = createdDoctors[i];
            const numAppointments = 3 + Math.floor(Math.random() * 3); // 3-5 appointments per doctor

            for (let j = 0; j < numAppointments; j++) {
                const patient = createdPatients[Math.floor(Math.random() * createdPatients.length)];
                const daysAhead = Math.floor(Math.random() * 30) + 1; // 1-30 days ahead
                const appointmentDate = getFutureDate(daysAhead);
                
                // Random time slots
                const hours = [9, 10, 11, 14, 15, 16, 17];
                const randomHour = hours[Math.floor(Math.random() * hours.length)];
                const appointmentTime = `${randomHour.toString().padStart(2, '0')}:00:00`;

                const status = Math.random() > 0.8 ? 'completed' : 'scheduled';

                await Appointment.create({
                    patientId: patient.patientId,
                    doctorId: doctor.doctorId,
                    appointmentDate,
                    appointmentTime,
                    status,
                    reasonForVisit: appointmentReasons[Math.floor(Math.random() * appointmentReasons.length)]
                });

                appointmentCount++;
            }
        }

        console.log(`✅ ${appointmentCount} appointments created\n`);

        // Display credentials
        console.log('\n' + '='.repeat(80));
        console.log('🔐 DOCTOR CREDENTIALS');
        console.log('='.repeat(80));
        console.log('\nAll doctors use the same password: password123\n');
        
        doctorCredentials.forEach((cred, index) => {
            console.log(`${(index + 1).toString().padStart(2, '0')}. Dr. ${cred.name}`);
            console.log(`    Email: ${cred.email}`);
            console.log(`    Password: ${cred.password}`);
            console.log(`    Specialization: ${cred.specialization}`);
            console.log(`    Consultation Fee: ${cred.fee} EGP`);
            console.log(`    Room: ${cred.roomNumber}`);
            console.log('');
        });

        console.log('='.repeat(80));
        console.log('👥 PATIENT CREDENTIALS (Sample)');
        console.log('='.repeat(80));
        console.log('\nAll patients use the same password: password123\n');
        
        patientCredentials.slice(0, 5).forEach((cred, index) => {
            console.log(`${(index + 1).toString().padStart(2, '0')}. ${cred.name}`);
            console.log(`    Email: ${cred.email}`);
            console.log(`    Password: ${cred.password}`);
            console.log('');
        });

        console.log('='.repeat(80));
        console.log('\n✨ Database seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`   • ${createdDoctors.length} doctors created`);
        console.log(`   • ${createdPatients.length} patients created`);
        console.log(`   • ${appointmentCount} appointments scheduled`);
        console.log(`   • All schedules configured`);
        console.log('\n💡 You can now login with any of the credentials above!');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        console.error(error.stack);
    } finally {
        await sequelize.close();
        console.log('\n👋 Database connection closed');
    }
}

// Run the seeding
seedDatabase();
