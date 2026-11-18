const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-otp', authController.resendOtp);
router.get('/profile', authController.getProfile);
router.get('/wallet/:id', authController.getWalletBalance);
router.post('/wallet/:id/topup', authController.topupWallet);

module.exports = router;
