const express = require('express');
const router = express.Router();
const { updateSubtaskStatus, deleteSubtask, deleteCategoryTask, reorderSubtasks } = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/reorder-subtasks')
      .put(protect, reorderSubtasks);

router.route('/subtasks/:id')
      .put(protect, updateSubtaskStatus)
      .delete(protect, deleteSubtask);

router.route('/categories/:id')
      .delete(protect, deleteCategoryTask);

module.exports = router;