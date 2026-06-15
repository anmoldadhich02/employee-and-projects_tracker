const express = require('express');
const router = express.Router();
const { updateSiteVisit, deleteSiteVisit } = require('../controllers/siteVisitController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/:id')
      .put(protect, admin, updateSiteVisit)
      .delete(protect, admin, deleteSiteVisit);

module.exports = router;