const express = require('express');
const router = express.Router();
const { 
    switchProject, 
    stopProjectTimer, 
    getActiveProjectTimer, 
    getTodayShiftSeconds, 
    getMyProjectsToday,
    getProjectTotalHours, 
    getProjectDailyBreakdown, 
    getProjectEmployeeBreakdown, 
    editTimeLog 
} = require('../controllers/timeController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/switch', protect, switchProject);
router.post('/stop-project', protect, stopProjectTimer);
router.get('/active', protect, getActiveProjectTimer);
router.get('/today', protect, getTodayShiftSeconds);
router.get('/my-projects-today', protect, getMyProjectsToday);
router.get('/project/:projectId/total', protect, getProjectTotalHours);
router.get('/project/:projectId/daily', protect, getProjectDailyBreakdown);
router.get('/project/:projectId/employees', protect, getProjectEmployeeBreakdown);
router.put('/logs/:id', protect, admin, editTimeLog);

module.exports = router;