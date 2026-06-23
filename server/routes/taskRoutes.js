const express = require('express');
const router = express.Router();
const { updateSubtaskStatus, deleteSubtask, deleteCategoryTask } = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/subtasks/:id')
      .put(protect, updateSubtaskStatus)
      .delete(protect, deleteSubtask);

router.route('/categories/:id')
      .delete(protect, deleteCategoryTask);

module.exports = router;