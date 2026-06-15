const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'erp_system',
  password: 'yourpassword',
  port: 5432
});
console.log('Connecting...');
pool.connect()
  .then(client => {
    console.log('Connected!');
    client.release();
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
    process.exit(1);
  });
