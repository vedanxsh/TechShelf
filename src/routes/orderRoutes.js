const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/', orderController.getOrders);
router.post('/', orderController.createOrder);
router.get('/:num', orderController.getOrderById);
router.patch('/:num/status', orderController.updateStatus);
router.patch('/:num/payment', orderController.updatePaymentStatus);

module.exports = router;
