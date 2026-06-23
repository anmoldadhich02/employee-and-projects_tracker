const express = require('express');
const router = express.Router();
const { updateSiteVisit, deleteSiteVisit, upload } = require('../controllers/siteVisitController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/:id')
      .put(protect, upload.array('photos', 10), updateSiteVisit)
      .delete(protect, deleteSiteVisit);

module.exports = router;