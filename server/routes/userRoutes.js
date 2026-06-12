const express = require('express');
const router = express.Router();
const { loginUser, createEmployee, getEmployees, logoutUser } = require('../controllers/userController');
const { protect, superAdmin } = require('../middlewares/authMiddleware');

router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);

// Employee management (Protected, SuperAdmin/Admin only)
router.route('/').get(protect, superAdmin, getEmployees).post(protect, superAdmin, createEmployee);

module.exports = router;
