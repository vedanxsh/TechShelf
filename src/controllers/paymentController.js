const config = require('../config');
const UserModel = require('../models/userModel');

exports.getConfig = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      currency: config.currency,
      taxRate: config.taxRate,
      upiVpa: config.payments.upiVpa,
      merchantName: config.payments.merchantName,
      campusWalletEnabled: config.payments.campusWalletEnabled,
      supportedMethods: config.payments.supportedMethods,
      coupons: Object.entries(config.payments.coupons).map(([code, c]) => ({
        code,
        type: c.type,
        value: c.value,
        minOrder: c.minOrder,
        description: c.desc
      }))
    });
  } catch (err) {
    next(err);
  }
};

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const cleanCode = (code || '').trim().toUpperCase();

    const coupon = config.payments.coupons[cleanCode];
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: `Coupon "${cleanCode}" is invalid or expired`
      });
    }

    const orderSubtotal = parseFloat(subtotal) || 0;
    if (orderSubtotal < coupon.minOrder) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${cleanCode}" requires a minimum order of ₹${coupon.minOrder} (current: ₹${orderSubtotal})`
      });
    }

    let discount = 0;
    if (coupon.type === 'percent') {
      discount = Math.round((orderSubtotal * (coupon.value / 100)) * 100) / 100;
    } else if (coupon.type === 'flat') {
      discount = Math.min(coupon.value, orderSubtotal);
    }

    return res.status(200).json({
      success: true,
      code: cleanCode,
      type: coupon.type,
      value: coupon.value,
      discount,
      finalSubtotal: Math.max(0, orderSubtotal - discount),
      message: `Promo code "${cleanCode}" applied! You saved ₹${discount}`
    });
  } catch (err) {
    next(err);
  }
};

exports.createUpiIntent = async (req, res, next) => {
  try {
    const { amount, studentId } = req.body;
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive amount is required' });
    }

    const txnId = `UPI-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const vpa = config.payments.upiVpa;
    const merchant = encodeURIComponent(config.payments.merchantName);
    const note = encodeURIComponent(`QuickBite Order ${studentId || ''}`);

    // Standard NPCI UPI URI Scheme
    const upiUri = `upi://pay?pa=${vpa}&pn=${merchant}&am=${numAmount.toFixed(2)}&cu=INR&tn=${note}&tr=${txnId}`;

    return res.status(200).json({
      success: true,
      txnId,
      amount: numAmount,
      vpa,
      upiUri,
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUri)}`
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { method, txnId, amount, studentId } = req.body;

    // Simulate instant secure verification
    if (!method || !txnId) {
      return res.status(400).json({ success: false, message: 'Payment method and transaction ID are required' });
    }

    return res.status(200).json({
      success: true,
      status: 'VERIFIED',
      txnId,
      method,
      amount,
      verifiedAt: new Date().toISOString(),
      receiptNumber: `REC-${Date.now().toString(36).toUpperCase()}`
    });
  } catch (err) {
    next(err);
  }
};
