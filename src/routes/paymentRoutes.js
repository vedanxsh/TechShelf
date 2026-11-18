const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/config', paymentController.getConfig);
router.post('/coupon', paymentController.validateCoupon);
router.post('/upi/intent', paymentController.createUpiIntent);
router.post('/verify', paymentController.verifyPayment);

module.exports = router;
