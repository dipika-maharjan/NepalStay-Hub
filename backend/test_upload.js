const http = require('http');
const FormData = require('form-data');

const form = new FormData();
form.append('name', 'Test User');
form.append('phone', '1234567890');
form.append('bio', 'Hello world');

const options = {
  hostname: 'localhost',
  port: 5051,
  path: '/api/profile',
  method: 'PUT',
  headers: form.getHeaders(),
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

form.pipe(req);
