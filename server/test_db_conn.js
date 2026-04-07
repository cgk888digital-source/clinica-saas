const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

console.log('Loaded environment variables:', process.env);

console.log('DB Config:', {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: false // Explicitly disable SSL
});

async function testConnection() {
  try {
    console.log(`Connecting to host: ${process.env.DB_HOST} as user ${process.env.DB_USER}...`);
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
