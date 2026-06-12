const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cron jobs
require('./utils/cronJobs');

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/checklists', require('./routes/checklistRoutes'));
app.use('/api/time', require('./routes/timeRoutes'));
app.use('/api/site-visits', require('./routes/siteVisitRoutes'));
app.use('/api/announcements', require('./routes/announcementsRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
// Basic route
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running optimally' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
