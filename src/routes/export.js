const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/students/excel', exportController.excel);
router.get('/students/pdf', exportController.pdf);

module.exports = router;
