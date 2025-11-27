const { User, Doctor } = require('./models');

async function debugDoctorIssue() {
    try {
        console.log('🔍 Debugging Doctor Profile Issue...\n');

        // Find all doctor users
        const doctorUsers = await User.findAll({
            where: { role: 'doctor' },
            order: [['userId', 'ASC']]
        });

        console.log(`Found ${doctorUsers.length} doctor users in total\n`);

        // Check each doctor user for corresponding doctor record
        const missingDoctorProfiles = [];
        
        for (const user of doctorUsers) {
            const doctorRecord = await Doctor.findOne({
                where: { userId: user.userId }
            });

            if (!doctorRecord) {
                missingDoctorProfiles.push(user);
                console.log(`❌ MISSING: User ID ${user.userId} (${user.fullName} - ${user.email}) has NO doctor record`);
            } else {
                console.log(`✅ OK: User ID ${user.userId} (${user.fullName}) has doctor record ID ${doctorRecord.doctorId}`);
            }
        }

        console.log(`\n📊 SUMMARY:`);
        console.log(`Total doctor users: ${doctorUsers.length}`);
        console.log(`Missing doctor profiles: ${missingDoctorProfiles.length}`);
        
        if (missingDoctorProfiles.length > 0) {
            console.log(`\n🔧 FIXING MISSING PROFILES...`);
            
            for (const user of missingDoctorProfiles) {
                try {
                    const newDoctor = await Doctor.create({
                        userId: user.userId,
                        specialization: 'General Medicine',
                        consultationFee: 100.00,
                        bio: null,
                        roomNumber: null
                    });
                    console.log(`✅ Created doctor record ID ${newDoctor.doctorId} for user ${user.fullName}`);
                } catch (error) {
                    console.log(`❌ Failed to create doctor record for user ${user.fullName}: ${error.message}`);
                }
            }
        }

        console.log(`\n✅ Doctor profile issue debugging completed!`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during debugging:', error);
        process.exit(1);
    }
}

debugDoctorIssue();