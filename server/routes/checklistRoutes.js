const express = require('express');
const router = express.Router();
const { createChecklistTemplate, getChecklistTemplates } = require('../controllers/checklistController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
      .get(protect, getChecklistTemplates)
      .post(protect, createChecklistTemplate);

module.exports = router;