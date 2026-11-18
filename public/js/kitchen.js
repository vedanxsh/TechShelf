/* QuickBite v2.0 - Kitchen Display System (KDS) Module */
window.QuickBite = window.QuickBite || {};

QuickBite.kitchen = (function () {

  function render() {
    const orders = QuickBite.state.get().orders || [];

    const colNewEl = document.getElementById('kdsColNewList');
    const colPrepEl = document.getElementById('kdsColPrepList');
    const colReadyEl = document.getElementById('kdsColReadyList');

    const countNewEl = document.getElementById('countColNew');
    const countPrepEl = document.getElementById('countColPrep');
    const countReadyEl = document.getElementById('countColReady');

    if (!colNewEl) return;

    const groups = {
      NEW: [],
      PREPARING: [],
      READY: [],
      COMPLETED: []
    };

    orders.forEach(o => {
      if (groups[o.status]) {
        groups[o.status].push(o);
      }
    });

    if (countNewEl) countNewEl.textContent = groups.NEW.length;
    if (countPrepEl) countPrepEl.textContent = groups.PREPARING.length;
    if (countReadyEl) countReadyEl.textContent = groups.READY.length;

    colNewEl.innerHTML = groups.NEW.length
      ? groups.NEW.map(renderOrderCard).join('')
      : '<div style="text-align:center; padding:32px 10px; color:var(--ink-400); font-size:0.85rem;">No new incoming orders</div>';

    colPrepEl.innerHTML = groups.PREPARING.length
      ? groups.PREPARING.map(renderOrderCard).join('')
      : '<div style="text-align:center; padding:32px 10px; color:var(--ink-400); font-size:0.85rem;">Nothing currently cooking</div>';

    colReadyEl.innerHTML = groups.READY.length
      ? groups.READY.slice().reverse().map(renderOrderCard).join('')
      : '<div style="text-align:center; padding:32px 10px; color:var(--ink-400); font-size:0.85rem;">No orders waiting for pickup</div>';
  }

  function renderOrderCard(order) {
    const isPaid = order.payment?.status === 'PAID';
    const payMethod = (order.payment?.method || 'CASH').toUpperCase();
    const payBadgeClass = isPaid ? 'pay-badge paid' : 'pay-badge pending';
    const payBadgeText = isPaid ? `PAID ✓ (${payMethod})` : `COLLECT ₹${order.total} (CASH)`;

    let actionButton = '';
    if (order.status === 'NEW') {
      actionButton = `
        <button class="btn btn-primary btn-sm" onclick="QuickBite.kitchen.changeStatus(${order.num}, 'PREPARING')">
          🔥 Start Cooking
        </button>
      `;
    } else if (order.status === 'PREPARING') {
      actionButton = `
        <button class="btn btn-sm" style="background:var(--emerald-500); color:#FFFFFF;" onclick="QuickBite.kitchen.changeStatus(${order.num}, 'READY')">
          🔔 Mark Ready
        </button>
      `;
    } else if (order.status === 'READY') {
      actionButton = `
        <div style="display:flex; gap:6px;">
          ${!isPaid ? `
            <button class="btn btn-outline btn-sm text-emerald" onclick="QuickBite.kitchen.confirmCashPayment(${order.num})">
              💵 Paid Cash
            </button>
          ` : ''}
          <button class="btn btn-secondary btn-sm" onclick="QuickBite.kitchen.changeStatus(${order.num}, 'COMPLETED')">
            ✓ Picked Up
          </button>
        </div>
      `;
    }

    return `
      <div class="kds-order-card fade-in" id="kdsCard-${order.num}">
        <div class="kds-order-head">
          <span class="kds-token">#${order.num}</span>
          <span class="kds-time">${order.time}</span>
        </div>

        <div class="kds-student-name">
          👤 ${order.studentName || order.student} <span class="text-muted" style="font-weight:400;">(${order.student})</span>
        </div>

        <div class="kds-items-list">
          ${order.items.map(i => `
            <div class="kds-item-line">
              <span><b>${i.qty}×</b> ${i.name}</span>
              <span class="text-muted">₹${i.price * i.qty}</span>
            </div>
          `).join('')}
        </div>

        <div class="kds-order-foot">
          <span class="${payBadgeClass}">${payBadgeText}</span>
          ${actionButton}
        </div>
      </div>
    `;
  }

  async function changeStatus(num, status) {
    try {
      await QuickBite.api.orders.updateStatus(num, status);
      QuickBite.app.showToast(`Order #${num} marked as ${status}`, 'success');
      QuickBite.app.syncOrders();
    } catch (err) {
      QuickBite.app.showToast(err.message || 'Failed to update order status', 'error');
    }
  }

  async function confirmCashPayment(num) {
    try {
      await QuickBite.api.orders.updatePayment(num, 'PAID', `CASH-COUNTER-${Date.now().toString(36).toUpperCase()}`);
      QuickBite.app.showToast(`Cash payment verified for Order #${num}`, 'success');
      QuickBite.app.syncOrders();
    } catch (err) {
      QuickBite.app.showToast(err.message || 'Failed to record cash payment', 'error');
    }
  }

  function refresh() {
    QuickBite.app.syncOrders();
    QuickBite.app.showToast('Kitchen board refreshed', 'info');
  }

  return {
    render,
    changeStatus,
    confirmCashPayment,
    refresh
  };
})();
