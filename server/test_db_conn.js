const { Client } = require('pg');
require('dotenv').config();

console.log('DB Config:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'PRESENT (hidden)' : 'MISSING'
});

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`Connecting to host: ${url.hostname} on port ${url.port} as user ${url.username}...`);
    await client.connect();
    console.log('Successfully connected to Postgres');
    const res = await client.query('SELECT current_database(), current_user, version();');
    console.log('Query result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error', err.stack);
  }
}

testConnection();
