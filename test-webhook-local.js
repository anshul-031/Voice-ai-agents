const http = require('http');

// Wait a bit for server to be ready
setTimeout(() => {
    const payload = JSON.stringify({ 
        phone_number: '919953969666' 
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/webhook/whatsapp',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    console.log('=== TEST 2: Webhook endpoint with 919953969666 ===');
    console.log('Making request to:', `http://${options.hostname}:${options.port}${options.path}`);

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('\nStatus Code:', res.statusCode);
            try {
                const parsed = JSON.parse(data);
                console.log('Response:', JSON.stringify(parsed, null, 2));
                
                if (res.statusCode === 200) {
                    console.log('\n✅ Webhook test successful!');
                } else {
                    console.log('\n❌ Webhook test failed');
                }
            } catch (e) {
                console.log('Response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('\n❌ Error:', error.message);
        console.log('\nMake sure the dev server is running: npm run dev');
    });

    req.write(payload);
    req.end();
}, 2000);
