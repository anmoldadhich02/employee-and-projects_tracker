const { Pool } = require('pg');
require('dotenv').config();

console.log(`[DB Config] user=${process.env.DB_USER}, host=${process.env.DB_HOST}, database=${process.env.DB_NAME}, port=${process.env.DB_PORT}`);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  connectionTimeoutMillis: 10000,  // 10 second connection timeout
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;