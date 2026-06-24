const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('./db');

const initializeDatabase = async () => {
  try {
    console.log('Initializing database tables...');
    
    // Test connection first
    console.log(`Connecting to DB at ${process.env.DB_HOST}:${process.env.DB_PORT}...`);
    const client = await pool.connect();
    console.log('DB connection established successfully.');
    client.release();
    
    const schemaPath = path.join(__dirname, '../models/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Run the schema.sql script to build tables
    console.log('Running schema SQL...');
    await pool.query(schemaSql);
    console.log('Database tables verified/created successfully.');

    // Add is_deleted column migration to users table if not exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='is_deleted';
    `;
    const columnRes = await pool.query(checkColumnQuery);
    if (columnRes.rows.length === 0) {
      console.log('Migrating users table: adding is_deleted column...');
      await pool.query('ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;');
      console.log('Column is_deleted added successfully.');
    }

    // Seed default administrator if not present
    const adminEmail = 'admin@archfirm.com';
    const checkAdmin = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);

    if (checkAdmin.rows.length === 0) {
      console.log('No Admin user found. Seeding default Admin...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await pool.query(
        `INSERT INTO users (name, email, phone_number, designation, password, role, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['Owner Admin', adminEmail, '1234567890', 'Owner', hashedPassword, 'Admin', 'Working']
      );
      console.log('Default Admin user seeded successfully.');
      console.log('Email: admin@archfirm.com | Password: admin123');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (error) {
    console.error('Error during database initialization:', error.message);
  }
};

module.exports = initializeDatabase;
