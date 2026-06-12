const express = require('express');
const router = express.Router();
const { updateSiteVisit, deleteSiteVisit } = require('../controllers/siteVisitController');
const { protect, superAdmin } = require('../middlewares/authMiddleware');

router.route('/:id')
      .put(protect, superAdmin, updateSiteVisit)
      .delete(protect, superAdmin, deleteSiteVisit);

module.exports = router;