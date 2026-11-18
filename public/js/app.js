/* QuickBite v2.0 - Application Orchestrator & Live Sync */
window.QuickBite = window.QuickBite || {};

QuickBite.app = (function () {
  let syncInterval = null;
  let currentActiveView = 'student';

  async function init() {
    console.log('⚡ Initializing QuickBite v2.0 Web Application...');

    // 1. Initial UI setup
    QuickBite.auth.applyAuthUI();

    // 2. Load Menu Catalog
    await QuickBite.menu.loadMenu();

    // 3. Load Payment Config
    try {
      const cfg = await QuickBite.api.payment.getConfig();
      if (cfg && cfg.success) {
        QuickBite.state.setPaymentConfig(cfg);
      }
    } catch (e) {
      console.warn('Could not fetch payment config, using defaults');
    }

    // 4. Initial Sync Orders
    await syncOrders();

    // 5. Start live synchronization polling (every 2.5s for seamless multi-device updates)
    clearInterval(syncInterval);
    syncInterval = setInterval(syncOrders, 2500);
    QuickBite.auth.refreshWallet();

    console.log('✓ QuickBite Web Application Ready.');
  }

  async function syncOrders() {
    try {
      const serverOrders = await QuickBite.api.orders.getAll();
      if (Array.isArray(serverOrders)) {
        const localOrders = QuickBite.state.get().orders;
        const hasChanged = JSON.stringify(serverOrders) !== JSON.stringify(localOrders);

        if (hasChanged) {
          QuickBite.state.setOrders(serverOrders);
          QuickBite.kitchen.render();
          renderActiveStudentTicket();
          updateKitchenLoadChip();
        }
      }
    } catch (err) {
      const statusLabel = document.getElementById('networkStatusLabel');
      if (statusLabel) statusLabel.textContent = 'Offline (Retrying...)';
    }
  }

  function renderActiveStudentTicket() {
    const container = document.getElementById('activeTicketContainer');
    if (!container) return;

    const user = QuickBite.state.get().currentUser;
    if (!user || user.role !== 'student') {
      container.innerHTML = '';
      return;
    }

    const orders = QuickBite.state.get().orders || [];
    // Find latest non-completed order for current student
    const activeOrder = orders
      .filter(o => o.student && o.student.toLowerCase() === user.id.toLowerCase() && o.status !== 'COMPLETED')
      .slice(-1)[0];

    if (!activeOrder) {
      container.innerHTML = '';
      return;
    }

    let stepIndex = 1;
    let badgeClass = 'status-new';
    let badgeLabel = 'Order Received';
    let instruction = "Your order is in the kitchen queue. We'll alert this screen as it cooks.";

    if (activeOrder.status === 'PREPARING') {
      stepIndex = 2;
      badgeClass = 'status-preparing';
      badgeLabel = 'Cooking in Kitchen';
      instruction = 'Chef is preparing your meal right now.';
    } else if (activeOrder.status === 'READY') {
      stepIndex = 3;
      badgeClass = 'status-ready';
      badgeLabel = 'Ready for Pickup';
      instruction = '🔔 Food is hot & ready! Show this token at Counter #1 (Express Pickup).';
    }

    const isPaid = activeOrder.payment?.status === 'PAID';
    const payNotice = isPaid
      ? `<span class="pay-badge paid" style="font-size:0.75rem;">PAID ✓ (${(activeOrder.payment?.method || 'ONLINE').toUpperCase()})</span>`
      : `<span class="pay-badge pending" style="font-size:0.75rem;">PAY AT COUNTER (₹${activeOrder.total})</span>`;

    container.innerHTML = `
      <div class="order-ticket fade-in">
        <div class="ticket-header">
          <div>
            <span style="font-size:0.8rem; text-transform:uppercase; color:var(--ink-300); font-weight:700;">Active Lunch Token</span>
            <div class="ticket-token">Token #${activeOrder.num} · <span style="font-size:1rem; font-weight:500; color:#E2E8F0;">${activeOrder.time}</span></div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            ${payNotice}
            <span class="ticket-badge ${badgeClass}">${badgeLabel}</span>
          </div>
        </div>

        <div style="font-size:0.95rem; font-weight:600; color:#FFFFFF;">
          ${activeOrder.items.map(i => `${i.name} <span class="text-amber">×${i.qty}</span>`).join(' &nbsp;·&nbsp; ')}
        </div>

        <!-- 3-Stage Progress Bar -->
        <div class="ticket-stepper">
          <div class="ticket-step ${stepIndex >= 1 ? 'completed' : ''} ${stepIndex === 1 ? 'current' : ''}">
            <div class="step-circle">${stepIndex > 1 ? '✓' : '1'}</div>
            <span class="step-label">Order Placed</span>
          </div>
          <div style="flex:1; height:3px; background:${stepIndex >= 2 ? 'var(--emerald-500)' : 'var(--ink-700)'}; margin:0 4px; transform:translateY(-10px);"></div>
          <div class="ticket-step ${stepIndex >= 2 ? 'completed' : ''} ${stepIndex === 2 ? 'current' : ''}">
            <div class="step-circle">${stepIndex > 2 ? '✓' : '2'}</div>
            <span class="step-label">In Kitchen</span>
          </div>
          <div style="flex:1; height:3px; background:${stepIndex >= 3 ? 'var(--emerald-500)' : 'var(--ink-700)'}; margin:0 4px; transform:translateY(-10px);"></div>
          <div class="ticket-step ${stepIndex >= 3 ? 'completed' : ''} ${stepIndex === 3 ? 'current' : ''}">
            <div class="step-circle">${stepIndex >= 3 ? '✓' : '3'}</div>
            <span class="step-label">Ready at Counter</span>
          </div>
        </div>

        <div style="font-size:0.82rem; color:var(--ink-300); background:rgba(0,0,0,0.25); padding:8px 12px; border-radius:var(--radius-sm); border:1px solid rgba(255,255,255,0.06);">
          ${instruction}
        </div>
      </div>
    `;
  }

  function updateKitchenLoadChip() {
    const orders = QuickBite.state.get().orders || [];
    const activeCount = orders.filter(o => o.status === 'NEW' || o.status === 'PREPARING').length;

    const chipText = document.getElementById('kitchenLoadText');
    if (chipText) {
      if (activeCount === 0) {
        chipText.textContent = 'Kitchen is ready for fast prep!';
      } else {
        chipText.textContent = `${activeCount} order${activeCount === 1 ? '' : 's'} being cooked now`;
      }
    }
  }

  function switchView(viewName) {
    currentActiveView = viewName;
    const studentView = document.getElementById('studentView');
    const cafeView = document.getElementById('cafeView');

    if (studentView && cafeView) {
      studentView.classList.toggle('hidden', viewName !== 'student');
      cafeView.classList.toggle('hidden', viewName !== 'cafe');
    }

    if (viewName === 'cafe') {
      QuickBite.kitchen.render();
      if (QuickBite.menuManager) QuickBite.menuManager.render();
    } else {
      QuickBite.menu.render();
      QuickBite.cart.render();
      renderActiveStudentTicket();
    }
  }

  function toggleView() {
    const nextView = currentActiveView === 'student' ? 'cafe' : 'student';
    switchView(nextView);
    showToast(`Switched to ${nextView === 'cafe' ? 'Kitchen KDS' : 'Student'} View`, 'info');
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  return {
    init,
    syncOrders,
    switchView,
    toggleView,
    showToast
  };
})();

// Auto-run on DOM ready
document.addEventListener('DOMContentLoaded', QuickBite.app.init);
