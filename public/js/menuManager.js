/* QuickBite v2.0 - Cafeteria Menu Management Module */
window.QuickBite = window.QuickBite || {};

QuickBite.menuManager = (function () {
  let activeTab = 'kds'; // 'kds' | 'menu'
  let editingItemId = null;
  let selectedIcon = '🍔';

  function switchTab(tab) {
    activeTab = tab;
    const btnKds = document.getElementById('tabBtnKds');
    const btnMenu = document.getElementById('tabBtnMenuMgr');
    const kdsView = document.getElementById('kdsBoardSection');
    const menuMgrView = document.getElementById('menuMgrSection');

    if (btnKds && btnMenu) {
      btnKds.classList.toggle('active', tab === 'kds');
      btnMenu.classList.toggle('active', tab === 'menu');
    }

    if (kdsView && menuMgrView) {
      kdsView.classList.toggle('hidden', tab !== 'kds');
      menuMgrView.classList.toggle('hidden', tab !== 'menu');
    }

    if (tab === 'menu') {
      render();
    } else {
      QuickBite.kitchen.render();
    }
  }

  function render() {
    const tbody = document.getElementById('menuMgrTableBody');
    if (!tbody) return;

    const items = QuickBite.state.get().menuItems || [];
    const countEl = document.getElementById('menuMgrTotalCount');
    if (countEl) countEl.textContent = `${items.length} items`;

    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:32px; color:var(--ink-400);">
            No menu items found. Click "+ Add New Item" above to get started.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = items.map(item => {
      const isAvailable = item.available !== false;
      const stockBadge = isAvailable
        ? `<span class="stock-toggle-pill in-stock" onclick="QuickBite.menuManager.toggleStock(${item.id})">● In Stock</span>`
        : `<span class="stock-toggle-pill out-of-stock" onclick="QuickBite.menuManager.toggleStock(${item.id})">✕ Out of Stock</span>`;

      const dietClass = item.isVeg ? 'veg' : 'non-veg';
      const dietLabel = item.isVeg ? 'Veg' : 'Non-Veg';

      return `
        <tr id="mgrRow-${item.id}">
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.6rem;">${item.icon || '🍲'}</span>
              <div>
                <div style="font-weight:700; color:var(--ink-900);">${item.name}</div>
                <div style="font-size:0.78rem; color:var(--ink-400); max-width:260px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.desc || ''}</div>
              </div>
            </div>
          </td>
          <td>
            <span style="text-transform:capitalize; background:var(--ink-100); padding:3px 8px; border-radius:4px; font-weight:600; font-size:0.75rem;">
              ${item.category || 'general'}
            </span>
          </td>
          <td>
            <span class="diet-badge ${dietClass}" style="vertical-align:middle; margin-right:4px;"></span>
            <span style="font-size:0.8rem; font-weight:600;">${dietLabel}</span>
          </td>
          <td>
            <span style="font-family:var(--font-display); font-weight:700; font-size:1rem; color:var(--ink-900);">
              ₹${item.price}
            </span>
          </td>
          <td>
            <span style="font-size:0.8rem; color:var(--ink-500);">⏱️ ${item.prepTime || '5-7m'}</span>
          </td>
          <td>
            ${stockBadge}
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-outline btn-sm" onclick="QuickBite.menuManager.openEditModal(${item.id})" title="Edit item">
                ✏️ Edit
              </button>
              <button class="btn btn-danger-outline btn-sm" onclick="QuickBite.menuManager.deleteItem(${item.id})" title="Remove item">
                🗑️ Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function openAddModal() {
    editingItemId = null;
    selectedIcon = '🍔';

    const titleEl = document.getElementById('menuModalTitle');
    const form = document.getElementById('menuItemForm');
    if (titleEl) titleEl.textContent = 'Add New Menu Item';
    if (form) form.reset();

    const inStockCheck = document.getElementById('itemInStockInput');
    if (inStockCheck) inStockCheck.checked = true;

    selectIcon('🍔');

    const modal = document.getElementById('menuItemModal');
    if (modal) modal.classList.remove('hidden');
  }

  function openEditModal(id) {
    const item = QuickBite.state.get().menuItems.find(i => i.id === id);
    if (!item) return;

    editingItemId = id;
    selectedIcon = item.icon || '🍲';

    const titleEl = document.getElementById('menuModalTitle');
    if (titleEl) titleEl.textContent = `Edit: ${item.name}`;

    document.getElementById('itemNameInput').value = item.name || '';
    document.getElementById('itemDescInput').value = item.desc || '';
    document.getElementById('itemPriceInput').value = item.price || '';
    document.getElementById('itemCategoryInput').value = item.category || 'fastfood';
    document.getElementById('itemPrepTimeInput').value = item.prepTime || '5-7 mins';

    const vegRadio = document.getElementById('itemIsVegRadio');
    const nonVegRadio = document.getElementById('itemIsNonVegRadio');
    if (item.isVeg) {
      if (vegRadio) vegRadio.checked = true;
    } else {
      if (nonVegRadio) nonVegRadio.checked = true;
    }

    const inStockCheck = document.getElementById('itemInStockInput');
    if (inStockCheck) inStockCheck.checked = item.available !== false;

    selectIcon(selectedIcon);

    const modal = document.getElementById('menuItemModal');
    if (modal) modal.classList.remove('hidden');
  }

  function closeModal() {
    const modal = document.getElementById('menuItemModal');
    if (modal) modal.classList.add('hidden');
    editingItemId = null;
  }

  function selectIcon(emoji) {
    selectedIcon = emoji;
    const preview = document.getElementById('selectedIconPreview');
    if (preview) preview.textContent = emoji;

    const btns = document.querySelectorAll('.icon-btn-opt');
    btns.forEach(btn => {
      btn.classList.toggle('selected', btn.getAttribute('data-icon') === emoji);
    });
  }

  async function handleSubmit(event) {
    if (event) event.preventDefault();

    const name = (document.getElementById('itemNameInput')?.value || '').trim();
    const desc = (document.getElementById('itemDescInput')?.value || '').trim();
    const price = parseFloat(document.getElementById('itemPriceInput')?.value);
    const category = document.getElementById('itemCategoryInput')?.value || 'fastfood';
    const prepTime = (document.getElementById('itemPrepTimeInput')?.value || '').trim();
    const isVeg = document.getElementById('itemIsVegRadio')?.checked === true;
    const available = document.getElementById('itemInStockInput')?.checked === true;

    if (!name || isNaN(price) || price < 0) {
      QuickBite.app.showToast('Please provide a valid item name and price', 'error');
      return;
    }

    const payload = {
      name,
      desc,
      price,
      category,
      isVeg,
      prepTime: prepTime || '5-7 mins',
      icon: selectedIcon,
      available
    };

    const submitBtn = document.getElementById('btnSaveMenuItem');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
    }

    try {
      if (editingItemId) {
        await QuickBite.api.menu.update(editingItemId, payload);
        QuickBite.app.showToast(`Updated "${name}" successfully`, 'success');
      } else {
        await QuickBite.api.menu.create(payload);
        QuickBite.app.showToast(`Created new item "${name}"!`, 'success');
      }

      closeModal();
      await QuickBite.menu.loadMenu();
      render();
    } catch (err) {
      QuickBite.app.showToast(err.message || 'Failed to save menu item', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Item';
      }
    }
  }

  async function deleteItem(id) {
    const item = QuickBite.state.get().menuItems.find(i => i.id === id);
    const itemName = item ? item.name : `#${id}`;

    if (!confirm(`Are you sure you want to remove "${itemName}" from the cafeteria menu?`)) {
      return;
    }

    try {
      await QuickBite.api.menu.delete(id);
      QuickBite.app.showToast(`Removed "${itemName}" from menu`, 'info');
      await QuickBite.menu.loadMenu();
      render();
    } catch (err) {
      QuickBite.app.showToast(err.message || 'Failed to remove menu item', 'error');
    }
  }

  async function toggleStock(id) {
    try {
      const res = await QuickBite.api.menu.toggleStock(id);
      if (res && res.item) {
        QuickBite.app.showToast(`Item #${id} is now ${res.item.available ? 'IN STOCK' : 'OUT OF STOCK'}`, 'info');
        await QuickBite.menu.loadMenu();
        render();
      }
    } catch (err) {
      QuickBite.app.showToast(err.message || 'Failed to update stock', 'error');
    }
  }

  return {
    switchTab,
    render,
    openAddModal,
    openEditModal,
    closeModal,
    selectIcon,
    handleSubmit,
    deleteItem,
    toggleStock
  };
})();
