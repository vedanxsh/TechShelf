/* QuickBite v2.0 - Shopping Cart Module */
window.QuickBite = window.QuickBite || {};

QuickBite.cart = (function () {

  function increment(id) {
    const item = QuickBite.state.get().menuItems.find(m => m.id === id);
    if (item && item.available === false) {
      QuickBite.app.showToast(`"${item.name}" is currently out of stock!`, 'error');
      return;
    }
    const currentQty = QuickBite.state.get().cart[id] || 0;
    QuickBite.state.setCartItem(id, currentQty + 1);
    QuickBite.menu.render();
    render();
  }

  function decrement(id) {
    const currentQty = QuickBite.state.get().cart[id] || 0;
    if (currentQty > 0) {
      QuickBite.state.setCartItem(id, currentQty - 1);
      QuickBite.menu.render();
      render();
    }
  }

  function clear() {
    QuickBite.state.clearCart();
    QuickBite.menu.render();
    render();
    QuickBite.app.showToast('Tray cleared', 'info');
  }

  function getSummary() {
    const state = QuickBite.state.get();
    const cart = state.cart;
    const items = state.menuItems;
    const itemIds = Object.keys(cart);

    let subtotal = 0;
    const breakdown = [];

    itemIds.forEach(id => {
      const numId = parseInt(id, 10);
      const item = items.find(m => m.id === numId);
      const qty = cart[id];
      if (item && qty > 0) {
        const lineTotal = item.price * qty;
        subtotal += lineTotal;
        breakdown.push({
          id: item.id,
          name: item.name,
          price: item.price,
          qty,
          lineTotal
        });
      }
    });

    let discount = 0;
    if (state.activeCoupon) {
      const c = state.activeCoupon;
      if (subtotal >= c.minOrder) {
        if (c.type === 'percent') {
          discount = Math.round((subtotal * (c.value / 100)) * 100) / 100;
        } else if (c.type === 'flat') {
          discount = Math.min(c.value, subtotal);
        }
      }
    }

    const total = Math.max(0, subtotal - discount);

    return {
      items: breakdown,
      itemCount: itemIds.length,
      totalUnits: Object.values(cart).reduce((a, b) => a + b, 0),
      subtotal,
      discount,
      total,
      coupon: state.activeCoupon
    };
  }

  function render() {
    const listEl = document.getElementById('cartItemsList');
    const subtotalEl = document.getElementById('cartSubtotal');
    const totalEl = document.getElementById('cartTotal');
    const btnCheckout = document.getElementById('btnProceedCheckout');
    const btnClear = document.getElementById('btnClearCart');

    if (!listEl) return;

    const summary = getSummary();

    if (summary.items.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 32px 10px; color: var(--ink-400); font-size: 0.88rem;">
          <div style="font-size: 1.8rem; margin-bottom: 6px;">🛒</div>
          Your tray is empty.<br>Select delicious items from today's menu.
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = '₹0';
      if (totalEl) totalEl.textContent = '₹0';
      if (btnCheckout) btnCheckout.disabled = true;
      if (btnClear) btnClear.style.display = 'none';
      return;
    }

    if (btnClear) btnClear.style.display = 'inline-block';

    listEl.innerHTML = summary.items.map(item => `
      <div class="cart-item-row fade-in">
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-unit">₹${item.price} each</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="stepper" style="padding: 2px 4px;">
            <button style="width: 22px; height: 22px; font-size: 12px;" onclick="QuickBite.cart.decrement(${item.id})">−</button>
            <span class="stepper-count" style="font-size: 0.85rem;">${item.qty}</span>
            <button class="btn-plus" style="width: 22px; height: 22px; font-size: 12px;" onclick="QuickBite.cart.increment(${item.id})">+</button>
          </div>
          <span style="font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; min-width: 48px; text-align: right;">
            ₹${item.lineTotal}
          </span>
        </div>
      </div>
    `).join('');

    if (subtotalEl) subtotalEl.textContent = `₹${summary.subtotal}`;
    if (totalEl) totalEl.textContent = `₹${summary.total}`;
    if (btnCheckout) {
      btnCheckout.disabled = false;
      btnCheckout.textContent = `Proceed to Payment (₹${summary.total})`;
    }
  }

  return {
    increment,
    decrement,
    clear,
    getSummary,
    render
  };
})();
