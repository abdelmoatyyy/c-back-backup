const http = require('http');

function verifyStats() {
    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/admin/stats',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => responseBody += chunk);
        res.on('end', () => {
            console.log('Status Code:', res.statusCode);
            console.log('Response Body:', responseBody);

            if (res.statusCode === 200) {
                const response = JSON.parse(responseBody);
                if (response.success && response.data.totalUsers >= 0) {
                    console.log('✅ Admin stats verification passed.');
                    process.exit(0);
                } else {
                    console.error('❌ Admin stats verification failed: Invalid data.');
                    process.exit(1);
                }
            } else {
                console.error('❌ Admin stats verification failed.');
                process.exit(1);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request error:', error);
        process.exit(1);
    });

    req.end();
}

verifyStats();
