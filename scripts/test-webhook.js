const https = require('https');

const WHATSAPP_TOKEN = 'EAAN53Rn9vRABPZCnPhZA5hZBZABo6QoUquDAmM3R5GD1thMbve62QqES7Cf2jtl34ZCPihsRoPvFM06SN9GUM1GI5tg7q1Y9otaZBT1hDL68Xt0bepdAjHZBEcXZBHOwJW7urkB8rZANOJWE0rEnMzs1jdMmEPGRcUoEtJPoLs1sdrCNPCa6ZAvuqcd3KZAfyCt4u7a';
const TEST_PHONE_NUMBER = '919953969666';

const payload = JSON.stringify({
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to: TEST_PHONE_NUMBER,
  type: "template",
  template: {
    name: "pl_across_assist_demo_3",
    language: {
      code: "en_US"
    },
    components: [
      {
        type: "body",
        parameters: Array(10).fill({
          type: "text",
          text: "test"
        })
      }
    ]
  }
});

const options = {
  hostname: 'graph.facebook.com',
  port: 443,
  path: '/v18.0/788971100971297/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
    'Content-Length': payload.length
  }
};

console.log('Testing WhatsApp API with phone number:', TEST_PHONE_NUMBER);
console.log('Sending request...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
    
    if (res.statusCode === 200) {
      console.log('\n✅ WhatsApp message sent successfully!');
    } else {
      console.log('\n❌ Failed to send WhatsApp message');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(payload);
req.end();
