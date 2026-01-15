const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', requireRole('admin'), userController.getAll);
router.get('/:id', requireRole('admin', 'manager'), userController.getById);
router.post('/', requireRole('admin'), userController.create);
router.put('/:id', requireRole('admin'), userController.update);
router.delete('/:id', requireRole('admin'), userController.delete);

module.exports = router;
