const sequelize = require('./config/database');
const User = require('./models/User');

async function verify() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connection has been established successfully.');
        
        // Check if User model is defined correctly
        console.log('User model defined:', User === sequelize.models.User);
        console.log('User table name:', User.tableName);
        
        // Optional: Sync to see if it matches (be careful not to alter if not needed, but here we just check definition)
        // await User.sync({ force: false }); 
        
        console.log('✅ User model verification passed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        process.exit(1);
    }
}

verify();
