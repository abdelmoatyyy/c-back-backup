const { User } = require('./models');

async function cleanup() {
    try {
        await User.destroy({ where: { email: 'ahmedabdelmoatyy@gmail.com' } });
        console.log('✅ Cleanup successful');
        process.exit(0);
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }
}

cleanup();
