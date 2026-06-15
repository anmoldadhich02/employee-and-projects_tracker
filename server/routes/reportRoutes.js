const express = require('express');
const router = express.Router();
const {
    exportProjectsReport,
    exportEmployeesReport,
    exportAttendanceReport,
    exportSiteVisitsReport
} = require('../controllers/reportController');
const { protect, superAdmin } = require('../middlewares/authMiddleware');

router.get('/projects', protect, superAdmin, exportProjectsReport);
router.get('/employees', protect, superAdmin, exportEmployeesReport);
router.get('/attendance', protect, superAdmin, exportAttendanceReport);
router.get('/site-visits', protect, superAdmin, exportSiteVisitsReport);

module.exports = router;
