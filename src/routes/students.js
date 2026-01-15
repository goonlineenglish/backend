const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const historyController = require('../controllers/historyController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Student CRUD
router.get('/', studentController.getAll);
router.get('/:id', studentController.getById);
router.post('/', studentController.create);
router.put('/:id', studentController.update);
router.delete('/:id', studentController.delete);

// Contact history
router.get('/:studentId/history', historyController.getByStudent);
router.post('/:studentId/history', historyController.create);
router.delete('/history/:id', historyController.delete);

module.exports = router;
