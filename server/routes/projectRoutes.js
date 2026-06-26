const express = require('express');
const router = express.Router();
const { createProject, getProjects, updateProject } = require('../controllers/projectController');
const { createTasks, getProjectTasks, createSubtask, applyChecklistTemplate } = require('../controllers/taskController');
const { createSiteVisit, getProjectSiteVisits, upload } = require('../controllers/siteVisitController');
const { createAnnouncement, getProjectAnnouncements } = require('../controllers/announcementController');
const { protect, superAdmin } = require('../middlewares/authMiddleware');

// Project Routes
router.route('/')
      .get(protect, getProjects)
      .post(protect, createProject);

router.route('/:id')
      .put(protect, updateProject);

// Task Routes within Project
router.route('/:projectId/tasks')
      .get(protect, getProjectTasks)
      .post(protect, createTasks);

router.route('/:projectId/subtasks')
      .post(protect, createSubtask);

router.route('/:projectId/tasks/apply-template')
      .post(protect, applyChecklistTemplate);

// Site Visit Routes within Project
router.route('/:projectId/site-visits')
      .get(protect, getProjectSiteVisits)
      .post(protect, upload.array('photos', 10), createSiteVisit);

// Announcement Routes within Project
router.route('/:projectId/announcements')
      .get(protect, getProjectAnnouncements)
      .post(protect, createAnnouncement);

module.exports = router;
