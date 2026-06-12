const express = require('express');
const router = express.Router();
const { updateTaskStatus } = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/:id').put(protect, updateTaskStatus);

module.exports = router;