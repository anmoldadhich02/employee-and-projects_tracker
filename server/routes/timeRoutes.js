const express = require('express');
const router = express.Router();
const { startTimer, stopTimer } = require('../controllers/timeController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/start', protect, startTimer);
router.post('/stop', protect, stopTimer);

module.exports = router;