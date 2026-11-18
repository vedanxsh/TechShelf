const OrderModel = require('../models/orderModel');
const UserModel = require('../models/userModel');

exports.getOrders = async (req, res, next) => {
  try {
    const { student, status } = req.query;
    const orders = OrderModel.getAll({ student, status });
    // Returns array directly to maintain full compatibility with both the frontend & KDS
    return res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { num } = req.params;
    const order = OrderModel.getByNum(num);

    if (!order) {
      return res.status(404).json({ success: false, message: `Order #${num} not found` });
    }

    return res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    // Check if payload is an array (legacy full-sync format)
    if (Array.isArray(req.body)) {
      const updated = OrderModel.setAll(req.body);
      return res.status(200).json({ success: true, count: updated.length });
    }

    const {
      student,
      studentName,
      items,
      subtotal,
      discount,
      couponCode,
      tax,
      total,
      payment
    } = req.body;

    if (!student) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart must contain at least one item' });
    }

    const payableAmount = typeof total === 'number' ? total : items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // If payment method is campus wallet, deduct the balance safely!
    let walletNewBalance = null;
    if (payment && payment.method === 'wallet') {
      try {
        walletNewBalance = UserModel.deductWallet(student, payableAmount);
      } catch (walletErr) {
        return res.status(walletErr.statusCode || 400).json({
          success: false,
          message: walletErr.message
        });
      }
    }

    const createdOrder = OrderModel.create({
      student,
      studentName,
      items,
      subtotal: subtotal ?? payableAmount,
      discount: discount ?? 0,
      couponCode: couponCode || null,
      tax: tax ?? 0,
      total: payableAmount,
      status: 'NEW',
      payment: {
        method: payment?.method || 'cash',
        status: payment?.method === 'cash' ? 'PENDING' : 'PAID',
        txnId: payment?.txnId || `TXN-${Date.now().toString(36).toUpperCase()}`,
        paidAt: payment?.method !== 'cash' ? new Date().toISOString() : null,
        details: payment?.details || (payment?.method === 'wallet' ? 'Paid via Campus Card' : '')
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: createdOrder,
      walletBalance: walletNewBalance
    });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { num } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status field is required' });
    }

    const updated = OrderModel.updateStatus(num, status);

    return res.status(200).json({
      success: true,
      message: `Order #${num} marked as ${status}`,
      order: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { num } = req.params;
    const { paymentStatus, txnId } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({ success: false, message: 'paymentStatus is required (PAID | PENDING)' });
    }

    const updated = OrderModel.updatePaymentStatus(num, paymentStatus, txnId);

    return res.status(200).json({
      success: true,
      message: `Order #${num} payment marked as ${paymentStatus}`,
      order: updated
    });
  } catch (err) {
    next(err);
  }
};
