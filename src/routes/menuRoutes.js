const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

router.get('/', menuController.getMenu);
router.get('/categories', menuController.getCategories);
router.get('/:id', menuController.getItemById);

// Cafeteria Management Endpoints
router.post('/', menuController.createItem);
router.put('/:id', menuController.updateItem);
router.delete('/:id', menuController.deleteItem);
router.patch('/:id/toggle', menuController.toggleItemStock);

module.exports = router;
