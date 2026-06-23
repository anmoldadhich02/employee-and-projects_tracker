const express = require('express');
const router = express.Router();
const {
    getPersonalTasks,
    createPersonalTask,
    updatePersonalTask,
    deletePersonalTask
} = require('../controllers/personalTaskController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
      .get(protect, getPersonalTasks)
      .post(protect, createPersonalTask);

router.route('/:id')
      .put(protect, updatePersonalTask)
      .delete(protect, deletePersonalTask);

module.exports = router;
