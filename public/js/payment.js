/* QuickBite v2.0 - Payment Gateway & Checkout Module */
window.QuickBite = window.QuickBite || {};

QuickBite.payment = (function () {
  let activeMethod = 'upi';
  let activeUpiIntent = null;

  async function openCheckoutModal() {
    const user = QuickBite.state.get().currentUser;
    if (!user) {
      QuickBite.auth.openModal();
      QuickBite.app.showToast('Please log in with your Student ID first', 'info');
      return;
    }

    const summary = QuickBite.cart.getSummary();
    if (summary.items.length === 0) {
      QuickBite.app.showToast('Your tray is empty!', 'error');
      return;
    }

    renderCheckoutSummary(summary);
    selectMethod(activeMethod);

    const modal = document.getElementById('checkoutModal');
    if (modal) modal.classList.remove('hidden');
  }

  function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.classList.add('hidden');
  }

  function renderCheckoutSummary(summary) {
    const itemsList = document.getElementById('checkoutItemsList');
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const discountLine = document.getElementById('checkoutDiscountLine');
    const discountEl = document.getElementById('checkoutDiscount');
    const totalEl = document.getElementById('checkoutTotalAmount');

    if (itemsList) {
      itemsList.innerHTML = summary.items.map(item => `
        <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding:4px 0;">
          <span>${item.name} <b class="text-muted">× ${item.qty}</b></span>
          <span style="font-weight:600;">₹${item.lineTotal}</span>
        </div>
      `).join('');
    }

    if (subtotalEl) subtotalEl.textContent = `₹${summary.subtotal}`;

    if (discountLine && discountEl) {
      if (summary.discount > 0) {
        discountLine.style.display = 'flex';
        discountEl.textContent = `-₹${summary.discount}`;
      } else {
        discountLine.style.display = 'none';
      }
    }

    if (totalEl) totalEl.textContent = `₹${summary.total}`;

    // Update UPI and Wallet displays
    const upiDisplay = document.getElementById('upiPayAmountDisplay');
    if (upiDisplay) upiDisplay.textContent = `₹${summary.total}`;
  }

  function selectMethod(method) {
    activeMethod = method;
    QuickBite.state.setPaymentMethod(method);

    // Update Tab Styles
    const tabs = document.querySelectorAll('.pay-method-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-method') === method);
    });

    // Update Panels
    const panels = {
      upi: document.getElementById('panelUpi'),
      wallet: document.getElementById('panelWallet'),
      card: document.getElementById('panelCard'),
      cash: document.getElementById('panelCash')
    };

    Object.keys(panels).forEach(key => {
      if (panels[key]) {
        panels[key].classList.toggle('active', key === method);
      }
    });

    const summary = QuickBite.cart.getSummary();
    const user = QuickBite.state.get().currentUser;

    if (method === 'upi') {
      prepareUpiQr(summary.total, user ? user.id : '');
    } else if (method === 'wallet') {
      prepareWalletPanel(summary.total, user);
    }
  }

  async function prepareUpiQr(amount, studentId) {
    const qrImg = document.getElementById('upiQrImage');
    const vpaDisplay = document.getElementById('upiIdDisplay');

    try {
      const res = await QuickBite.api.payment.createUpiIntent(amount, studentId);
      activeUpiIntent = res;
      if (qrImg && res.qrUrl) qrImg.src = res.qrUrl;
      if (vpaDisplay && res.vpa) vpaDisplay.textContent = res.vpa;
    } catch (e) {
      // Fallback local QR display
      const vpa = 'cafeteria@upi';
      const upiUri = `upi://pay?pa=${vpa}&pn=QuickBite%20Cafeteria&am=${amount}&cu=INR`;
      if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;
      if (vpaDisplay) vpaDisplay.textContent = vpa;
    }
  }

  function prepareWalletPanel(amount, user) {
    const cardholder = document.getElementById('walletCardholder');
    const balanceVal = document.getElementById('walletModalBalanceVal');
    const msg = document.getElementById('walletSufficiencyMsg');
    const btn = document.getElementById('btnPayWallet');

    const balance = user?.walletBalance ?? 0;

    if (cardholder) cardholder.textContent = (user?.name || user?.id || 'Student Card').toUpperCase();
    if (balanceVal) balanceVal.textContent = balance;

    if (balance >= amount) {
      if (msg) {
        msg.textContent = `✓ Sufficient balance. ₹${amount} will be deducted from your Campus Card.`;
        msg.className = 'text-emerald';
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = `Confirm & Pay ₹${amount}`;
      }
    } else {
      const diff = Math.round((amount - balance) * 100) / 100;
      if (msg) {
        msg.textContent = `⚠️ Insufficient balance! You need ₹${diff} more in your Campus Card. Select UPI or Cash at counter.`;
        msg.className = 'text-ruby';
      }
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Insufficient Balance';
      }
    }
  }

  function copyUpiId() {
    const vpa = document.getElementById('upiIdDisplay')?.textContent || 'cafeteria@upi';
    navigator.clipboard.writeText(vpa).then(() => {
      QuickBite.app.showToast(`UPI ID "${vpa}" copied to clipboard!`, 'info');
    }).catch(() => {
      QuickBite.app.showToast(`UPI ID: ${vpa}`, 'info');
    });
  }

  async function applyCoupon() {
    const input = document.getElementById('couponInput');
    const msgEl = document.getElementById('couponStatusMessage');
    const code = (input?.value || '').trim().toUpperCase();

    if (!code) {
      if (msgEl) {
        msgEl.innerHTML = `<div class="coupon-alert error">Please enter a promo code (e.g. STUDENT10)</div>`;
      }
      return;
    }

    const summary = QuickBite.cart.getSummary();

    try {
      const res = await QuickBite.api.payment.validateCoupon(code, summary.subtotal);
      if (res.success) {
        QuickBite.state.setActiveCoupon({
          code: res.code,
          type: res.type,
          value: res.value,
          minOrder: res.minOrder || 0,
          discount: res.discount
        });

        const newSummary = QuickBite.cart.getSummary();
        renderCheckoutSummary(newSummary);
        QuickBite.cart.render();

        if (msgEl) {
          msgEl.innerHTML = `<div class="coupon-alert success">🎉 ${res.message}</div>`;
        }
        QuickBite.app.showToast(`Promo "${code}" applied: Saved ₹${res.discount}!`, 'success');
      }
    } catch (err) {
      if (msgEl) {
        msgEl.innerHTML = `<div class="coupon-alert error">❌ ${err.message || 'Invalid coupon'}</div>`;
      }
    }
  }

  async function confirmOrderWithPayment(method) {
    const user = QuickBite.state.get().currentUser;
    if (!user) {
      QuickBite.auth.openModal();
      return;
    }

    const summary = QuickBite.cart.getSummary();
    if (summary.items.length === 0) return;

    let txnId = `TXN-${Date.now().toString(36).toUpperCase()}`;
    let paymentDetails = '';

    if (method === 'upi') {
      txnId = activeUpiIntent?.txnId || `UPI-${Date.now().toString(36).toUpperCase()}`;
      paymentDetails = `Paid via UPI (${activeUpiIntent?.vpa || 'cafeteria@upi'})`;
    } else if (method === 'wallet') {
      if ((user.walletBalance ?? 0) < summary.total) {
        QuickBite.app.showToast('Insufficient campus wallet balance', 'error');
        return;
      }
      txnId = `WALLET-${Date.now().toString(36).toUpperCase()}`;
      paymentDetails = 'Paid via Campus Student Card';
    } else if (method === 'card') {
      const cardNum = document.getElementById('cardNumInput')?.value.trim();
      const cardName = document.getElementById('cardNameInput')?.value.trim();
      if (!cardNum || !cardName) {
        QuickBite.app.showToast('Please fill in card details', 'error');
        return;
      }
      txnId = `CARD-${Date.now().toString(36).toUpperCase()}`;
      paymentDetails = `Paid with Card ending in ${cardNum.slice(-4) || '8892'}`;
    } else if (method === 'cash') {
      paymentDetails = 'Pending Counter Cash Payment';
    }

    const orderPayload = {
      student: user.id,
      studentName: user.name || user.id,
      items: summary.items,
      subtotal: summary.subtotal,
      discount: summary.discount,
      couponCode: summary.coupon?.code || null,
      total: summary.total,
      payment: {
        method,
        status: method === 'cash' ? 'PENDING' : 'PAID',
        txnId,
        details: paymentDetails
      }
    };

    try {
      const res = await QuickBite.api.orders.create(orderPayload);
      if (res.success && res.order) {
        // Update local wallet balance if returned
        if (typeof res.walletBalance === 'number') {
          QuickBite.state.updateWalletBalance(res.walletBalance);
          const walletVal = document.getElementById('walletBalanceVal');
          if (walletVal) walletVal.textContent = res.walletBalance;
        }

        // Close checkout modal, clear cart
        closeCheckoutModal();
        QuickBite.cart.clear();

        // Show receipt modal
        openReceiptModal(res.order);

        // Sync orders
        QuickBite.app.syncOrders();
        QuickBite.app.showToast(`Order #${res.order.num} placed successfully!`, 'success');
      }
    } catch (err) {
      QuickBite.app.showToast(err.message || 'Failed to place order. Try again.', 'error');
    }
  }

  function openReceiptModal(order) {
    const modal = document.getElementById('receiptModal');
    const tokenEl = document.getElementById('receiptTokenNum');
    const badgeEl = document.getElementById('receiptPaymentBadge');
    const txnEl = document.getElementById('receiptTxnId');

    if (tokenEl) tokenEl.textContent = `#${order.num}`;
    if (txnEl) txnEl.textContent = order.payment?.txnId || 'TXN-ONLINE';

    if (badgeEl) {
      if (order.payment?.status === 'PAID') {
        badgeEl.textContent = `PAID ✓ (${order.payment?.method?.toUpperCase() || 'ONLINE'})`;
        badgeEl.className = 'receipt-status-pill pay-badge paid';
      } else {
        badgeEl.textContent = `PAY AT COUNTER (₹${order.total})`;
        badgeEl.className = 'receipt-status-pill pay-badge pending';
      }
    }

    if (modal) modal.classList.remove('hidden');
  }

  function closeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    if (modal) modal.classList.add('hidden');
  }

  return {
    openCheckoutModal,
    closeCheckoutModal,
    selectMethod,
    copyUpiId,
    applyCoupon,
    confirmOrderWithPayment,
    openReceiptModal,
    closeReceiptModal
  };
})();
