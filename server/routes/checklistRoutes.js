const express = require('express');
const router = express.Router();
const { createChecklistTemplate, getChecklistTemplates } = require('../controllers/checklistController');
const { protect, superAdmin } = require('../middlewares/authMiddleware');

router.route('/')
      .get(protect, getChecklistTemplates)
      .post(protect, superAdmin, createChecklistTemplate);

module.exports = router;