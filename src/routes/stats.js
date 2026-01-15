const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/dashboard', statsController.dashboard);
router.get('/conversion', statsController.conversion);

module.exports = router;
