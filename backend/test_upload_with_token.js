require('dotenv').config();
const http = require('http');
const FormData = require('form-data');
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/nepalstayhub');
  
  // Find any user
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({});
  if (!user) {
    console.log("No user found");
    process.exit(1);
  }
  
  // Generate token manually
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ userId: user._id.toString(), role: user.role, uuid: user.uuid }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
  
  console.log("Generated token for user:", user.email);
  
  const form = new FormData();
  form.append('name', 'Test User Updated');
  form.append('phone', '1234567890');
  form.append('bio', 'Hello world');

  const options = {
    hostname: 'localhost',
    port: 5051,
    path: '/api/profile',
    method: 'PUT',
    headers: {
      ...form.getHeaders(),
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Response: ${data}`);
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    process.exit(1);
  });

  form.pipe(req);
}

run();
