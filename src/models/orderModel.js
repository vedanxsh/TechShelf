const fs = require('fs');
const config = require('../config');

class OrderModel {
  static _read() {
    try {
      if (!fs.existsSync(config.paths.ordersFile)) {
        return [];
      }
      const data = fs.readFileSync(config.paths.ordersFile, 'utf8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error('[OrderModel._read] Error reading orders file:', err.message);
      return [];
    }
  }

  static _write(orders) {
    try {
      fs.writeFileSync(config.paths.ordersFile, JSON.stringify(orders, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[OrderModel._write] Error writing orders file:', err.message);
      throw new Error('Failed to persist order data');
    }
  }

  static getAll(filters = {}) {
    let orders = this._read();

    if (filters.student) {
      orders = orders.filter(o => o.student && o.student.toLowerCase() === filters.student.toLowerCase());
    }

    if (filters.status) {
      orders = orders.filter(o => o.status === filters.status);
    }

    return orders;
  }

  static getByNum(num) {
    const numInt = parseInt(num, 10);
    const orders = this._read();
    return orders.find(o => o.num === numInt) || null;
  }

  static create(orderPayload) {
    const orders = this._read();

    const nextNum = orders.length ? Math.max(...orders.map(o => o.num || 100)) + 1 : 101;
    const now = new Date();

    const formattedTime = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    const newOrder = {
      num: nextNum,
      student: orderPayload.student,
      studentName: orderPayload.studentName || orderPayload.student,
      items: orderPayload.items || [],
      subtotal: orderPayload.subtotal || orderPayload.total,
      discount: orderPayload.discount || 0,
      couponCode: orderPayload.couponCode || null,
      tax: orderPayload.tax || 0,
      total: orderPayload.total,
      status: orderPayload.status || 'NEW',
      payment: {
        method: orderPayload.payment?.method || 'cash',
        status: orderPayload.payment?.status || (orderPayload.payment?.method === 'cash' ? 'PENDING' : 'PAID'),
        txnId: orderPayload.payment?.txnId || `TXN-${Date.now().toString(36).toUpperCase()}`,
        paidAt: orderPayload.payment?.paidAt || (orderPayload.payment?.status === 'PAID' ? now.toISOString() : null),
        details: orderPayload.payment?.details || ''
      },
      time: formattedTime,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    orders.push(newOrder);
    this._write(orders);
    return newOrder;
  }

  static updateStatus(num, newStatus) {
    const numInt = parseInt(num, 10);
    const orders = this._read();
    const order = orders.find(o => o.num === numInt);

    if (!order) {
      const err = new Error(`Order #${num} not found`);
      err.statusCode = 404;
      throw err;
    }

    const validStatuses = ['NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(newStatus)) {
      const err = new Error(`Invalid status "${newStatus}". Must be one of: ${validStatuses.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();

    // If marked ready or completed and cash was pending, staff can mark payment paid
    this._write(orders);
    return order;
  }

  static updatePaymentStatus(num, paymentStatus, txnId) {
    const numInt = parseInt(num, 10);
    const orders = this._read();
    const order = orders.find(o => o.num === numInt);

    if (!order) {
      const err = new Error(`Order #${num} not found`);
      err.statusCode = 404;
      throw err;
    }

    order.payment = order.payment || {};
    order.payment.status = paymentStatus;
    if (txnId) order.payment.txnId = txnId;
    if (paymentStatus === 'PAID') {
      order.payment.paidAt = new Date().toISOString();
    }
    order.updatedAt = new Date().toISOString();

    this._write(orders);
    return order;
  }

  static setAll(newOrders) {
    if (!Array.isArray(newOrders)) {
      throw new Error('Orders must be an array');
    }
    this._write(newOrders);
    return newOrders;
  }
}

module.exports = OrderModel;
