// Simple endpoint connectivity test for Exotel setup
// - Tests HTTP Passthru (POST) on port 8009
// - Tests WS health (GET) on port 8765 (HTTP endpoint exposed by the WS server)

const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const host = process.env.CHECK_HOST || '34.143.154.188';
  const apiPort = Number(process.env.CHECK_API_PORT || 8009);
  const wsPort = Number(process.env.CHECK_WS_PORT || 8765);

  let pass = true;

  console.log('=== Endpoint Connectivity Check ===');
  console.log('Target Host:', host);
  console.log('API Port   :', apiPort);
  console.log('WS Port    :', wsPort);
  console.log('');

  // 1) HTTP Passthru GET
  try {
    const res = await request({ host, port: apiPort, path: '/api/exotel/passthru', method: 'GET' });
    console.log('[GET /api/exotel/passthru] status:', res.statusCode);
    console.log('[GET /api/exotel/passthru] body  :', res.body);
    if (res.statusCode !== 200) pass = false;
  } catch (e) {
    pass = false;
    console.error('[GET /api/exotel/passthru] ERROR:', e.message);
  }

  // 2) HTTP Passthru POST
  try {
    const payload = JSON.stringify({ CallSid: 'check-public', From: '+1001', To: '+1002' });
    const res = await request({
      host,
      port: apiPort,
      path: '/api/exotel/passthru',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, payload);
    console.log('[POST /api/exotel/passthru] status:', res.statusCode);
    console.log('[POST /api/exotel/passthru] body  :', res.body);
    if (res.statusCode !== 200) pass = false;
  } catch (e) {
    pass = false;
    console.error('[POST /api/exotel/passthru] ERROR:', e.message);
  }

  // 3) WS server health (HTTP GET on /health)
  try {
    const res = await request({ host, port: wsPort, path: '/health', method: 'GET' });
    console.log('[GET /health on WS port] status:', res.statusCode);
    console.log('[GET /health on WS port] body  :', res.body);
    if (res.statusCode !== 200) pass = false;
  } catch (e) {
    pass = false;
    console.error('[GET /health on WS port] ERROR:', e.message);
  }

  console.log('\n=== RESULT ===');
  if (pass) {
    console.log('PASS: All endpoints responded.');
    process.exit(0);
  } else {
    console.log('FAIL: One or more checks failed.');
    process.exit(1);
  }
}

main();
