const express = require('express');
const router = express.Router();
const { getAdminDashboard } = require('../controllers/dashboardController');
const { protect, superAdmin } = require('../middlewares/authMiddleware');

router.get('/admin', protect, superAdmin, getAdminDashboard);

module.exports = router;
