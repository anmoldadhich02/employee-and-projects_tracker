// Force synchronous, unbuffered stdout and stderr flushing
const fs = require('fs');
process.stdout.write = (chunk) => {
  fs.writeSync(1, chunk);
  return true;
};
process.stderr.write = (chunk) => {
  fs.writeSync(2, chunk);
  return true;
};

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const initializeDatabase = require('./config/dbInit');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database (Tables & Seed User)
initializeDatabase();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cron jobs
console.log('Loading cron jobs...');
require('./utils/cronJobs');
console.log('Cron jobs loaded.');

// Routes
console.log('Loading userRoutes...');
app.use('/api/users', require('./routes/userRoutes'));
console.log('Loading projectRoutes...');
app.use('/api/projects', require('./routes/projectRoutes'));
console.log('Loading taskRoutes...');
app.use('/api/tasks', require('./routes/taskRoutes'));
console.log('Loading checklistRoutes...');
app.use('/api/checklists', require('./routes/checklistRoutes'));
console.log('Loading timeRoutes...');
app.use('/api/time', require('./routes/timeRoutes'));
console.log('Loading siteVisitRoutes...');
app.use('/api/site-visits', require('./routes/siteVisitRoutes'));
console.log('Loading announcementRoutes...');
app.use('/api/announcements', require('./routes/announcementRoutes'));
console.log('Loading reportRoutes...');
app.use('/api/reports', require('./routes/reportRoutes'));
console.log('All routes loaded successfully.');

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running optimally' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
