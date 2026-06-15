const express = require('express');
const router = express.Router();
const { 
    loginUser, 
    createEmployee, 
    getEmployees, 
    logoutUser,
    updateUserRole,
    updateUserStatus,
    resetUserPassword,
    getDashboardStats
} = require('../controllers/userController');
const { protect, admin, superAdmin } = require('../middlewares/authMiddleware');

router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/dashboard', protect, superAdmin, getDashboardStats);

// Employee management (Protected, SuperAdmin/Admin only)
router.route('/').get(protect, superAdmin, getEmployees).post(protect, superAdmin, createEmployee);

// Employee administration
router.put('/:id/role', protect, admin, updateUserRole);
router.put('/:id/status', protect, superAdmin, updateUserStatus);
router.put('/:id/reset-password', protect, admin, resetUserPassword);

module.exports = router;
