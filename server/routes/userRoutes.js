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
    getDashboardStats,
    deleteEmployee,
    uploadProfile
} = require('../controllers/userController');
const { protect, admin, superAdmin } = require('../middlewares/authMiddleware');

router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/dashboard', protect, getDashboardStats);

// Employee management (Protected, SuperAdmin/Admin only)
router.route('/').get(protect, superAdmin, getEmployees).post(protect, superAdmin, uploadProfile.single('profile_image'), createEmployee);

// Employee administration
router.put('/:id/role', protect, admin, updateUserRole);
router.put('/:id/status', protect, superAdmin, updateUserStatus);
router.put('/:id/reset-password', protect, admin, resetUserPassword);
router.delete('/:id', protect, admin, deleteEmployee);

module.exports = router;
