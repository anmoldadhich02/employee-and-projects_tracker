const express = require('express');
const router = express.Router();
const {
    exportProjectsReport,
    exportEmployeesReport,
    exportAttendanceReport,
    exportSiteVisitsReport,
    exportEmployeeActivityReport
} = require('../controllers/reportController');
const { protect, superAdmin } = require('../middlewares/authMiddleware');

router.get('/projects', protect, exportProjectsReport);
router.get('/employees', protect, superAdmin, exportEmployeesReport);
router.get('/attendance', protect, superAdmin, exportAttendanceReport);
router.get('/site-visits', protect, exportSiteVisitsReport);
router.get('/employee-activity', protect, exportEmployeeActivityReport);

module.exports = router;
