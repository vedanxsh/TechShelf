/* QuickBite v2.0 - Menu Catalog & Filter Module */
window.QuickBite = window.QuickBite || {};

QuickBite.menu = (function () {

  async function loadMenu() {
    try {
      const res = await QuickBite.api.menu.getAll();
      if (res && res.items) {
        QuickBite.state.setMenuItems(res.items);
        render();
        if (QuickBite.menuManager) QuickBite.menuManager.render();
      }
    } catch (err) {
      QuickBite.app.showToast('Unable to load menu. Check server connection.', 'error');
    }
  }

  function getFilteredItems() {
    const state = QuickBite.state.get();
    let items = state.menuItems || [];
    const { category, search, isVegOnly } = state.filters;

    if (category && category !== 'all') {
      items = items.filter(item => item.category.toLowerCase() === category.toLowerCase());
    }

    if (isVegOnly) {
      items = items.filter(item => item.isVeg === true);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      items = items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q)
      );
    }

    return items;
  }

  function render() {
    const container = document.getElementById('menuContainer');
    if (!container) return;

    const items = getFilteredItems();
    const cart = QuickBite.state.get().cart;

    if (items.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 16px; background: var(--card-bg); border-radius: var(--radius-md); border: 1px dashed var(--card-border);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🍽️</div>
          <h3 style="font-size: 1.1rem; margin-bottom: 4px;">No items match your criteria</h3>
          <p class="text-muted" style="font-size: 0.85rem;">Try changing your search term or category filter.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(item => {
      const qtyInCart = cart[item.id] || 0;
      const dietClass = item.isVeg ? 'veg' : 'non-veg';
      const dietTitle = item.isVeg ? 'Vegetarian' : 'Non-Vegetarian';
      const isAvailable = item.available !== false;
      const cardClass = isAvailable ? 'food-card fade-in' : 'food-card fade-in out-of-stock';

      return `
        <div class="${cardClass}" id="foodCard-${item.id}">
          <div class="food-card-top">
            <div class="food-icon-box">${item.icon || '🍲'}</div>
            <div class="food-details">
              <div class="food-header">
                <span class="diet-badge ${dietClass}" title="${dietTitle}"></span>
                <span class="food-title">${item.name}</span>
              </div>
              <div class="food-desc">${item.desc}</div>
              <div class="food-meta">
                <span>⏱️ ${item.prepTime || '5-7 mins'}</span>
                <span>⭐ ${item.rating || '4.8'}</span>
              </div>
            </div>
          </div>

          <div class="food-card-bottom">
            <span class="food-price">₹${item.price}</span>

            ${!isAvailable ? `
              <span style="font-size:0.75rem; font-weight:700; color:var(--ruby-600); background:var(--ruby-100); padding:4px 8px; border-radius:4px;">
                Out of Stock
              </span>
            ` : qtyInCart > 0 ? `
              <div class="stepper">
                <button onclick="QuickBite.cart.decrement(${item.id})">−</button>
                <span class="stepper-count">${qtyInCart}</span>
                <button class="btn-plus" onclick="QuickBite.cart.increment(${item.id})">+</button>
              </div>
            ` : `
              <button class="btn btn-outline btn-sm" onclick="QuickBite.cart.increment(${item.id})">
                + Add
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  function filterCategory(cat) {
    QuickBite.state.setFilter('category', cat);

    // Update active tab styles
    const pills = document.querySelectorAll('.cat-pill');
    pills.forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-cat') === cat);
    });

    render();
  }

  function handleSearch(query) {
    QuickBite.state.setFilter('search', query);
    render();
  }

  function toggleVegFilter() {
    const state = QuickBite.state.get();
    const nextVal = !state.filters.isVegOnly;
    QuickBite.state.setFilter('isVegOnly', nextVal);

    const btn = document.getElementById('vegFilterBtn');
    if (btn) btn.classList.toggle('active', nextVal);

    render();
  }

  return {
    loadMenu,
    render,
    filterCategory,
    handleSearch,
    toggleVegFilter
  };
})();
