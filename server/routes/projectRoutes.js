const express = require('express');
const router = express.Router();
const { createProject, getProjects, updateProject } = require('../controllers/projectController');
const { createTasks, getProjectTasks } = require('../controllers/taskController');
const { createSiteVisit, getProjectSiteVisits } = require('../controllers/siteVisitController');
const { createAnnouncement, getProjectAnnouncements } = require('../controllers/announcementController');
const { protect, superAdmin } = require('../middlewares/authMiddleware');

// Project Routes
router.route('/')
      .get(protect, getProjects)
      .post(protect, createProject);

router.route('/:id')
      .put(protect, superAdmin, updateProject);

// Task Routes within Project
router.route('/:projectId/tasks')
      .get(protect, getProjectTasks)
      .post(protect, createTasks);

// Site Visit Routes within Project
router.route('/:projectId/site-visits')
      .get(protect, getProjectSiteVisits)
      .post(protect, createSiteVisit);

// Announcement Routes within Project
router.route('/:projectId/announcements')
      .get(protect, getProjectAnnouncements)
      .post(protect, superAdmin, createAnnouncement);

module.exports = router;
