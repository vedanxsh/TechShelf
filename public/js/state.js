/* QuickBite v2.0 - Central Reactive Client State */
window.QuickBite = window.QuickBite || {};

QuickBite.state = (function () {
  const listeners = {};

  // Load persisted session if available
  let currentUser = null;
  try {
    currentUser = JSON.parse(sessionStorage.getItem('qb_user') || 'null');
  } catch (e) {
    currentUser = null;
  }

  let currentRole = sessionStorage.getItem('qb_role') || 'student';

  const state = {
    currentUser,
    currentRole,
    menuItems: [],
    categories: ['all'],
    cart: {}, // { [itemId]: quantity }
    orders: [],
    activeCoupon: null,
    filters: {
      category: 'all',
      search: '',
      isVegOnly: false
    },
    paymentMethod: 'upi',
    paymentConfig: null
  };

  function emit(event, data) {
    if (listeners[event]) {
      listeners[event].forEach(fn => fn(data));
    }
  }

  return {
    get: () => state,

    on: (event, callback) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(callback);
    },

    setUser: (user, role) => {
      state.currentUser = user;
      state.currentRole = role || (user ? user.role : 'student');
      if (user) {
        sessionStorage.setItem('qb_user', JSON.stringify(user));
        sessionStorage.setItem('qb_role', state.currentRole);
      } else {
        sessionStorage.removeItem('qb_user');
        sessionStorage.removeItem('qb_role');
      }
      emit('user:change', { user: state.currentUser, role: state.currentRole });
    },

    updateWalletBalance: (newBalance) => {
      if (state.currentUser) {
        state.currentUser.walletBalance = newBalance;
        sessionStorage.setItem('qb_user', JSON.stringify(state.currentUser));
        emit('user:change', { user: state.currentUser, role: state.currentRole });
      }
    },

    setMenuItems: (items) => {
      state.menuItems = items;
      emit('menu:change', items);
    },

    setOrders: (orders) => {
      state.orders = orders;
      emit('orders:change', orders);
    },

    setCartItem: (id, qty) => {
      if (qty <= 0) {
        delete state.cart[id];
      } else {
        state.cart[id] = qty;
      }
      emit('cart:change', state.cart);
    },

    clearCart: () => {
      state.cart = {};
      state.activeCoupon = null;
      emit('cart:change', state.cart);
    },

    setActiveCoupon: (coupon) => {
      state.activeCoupon = coupon;
      emit('cart:change', state.cart);
    },

    setFilter: (key, value) => {
      state.filters[key] = value;
      emit('filter:change', state.filters);
    },

    setPaymentMethod: (method) => {
      state.paymentMethod = method;
      emit('payment:methodChange', method);
    },

    setPaymentConfig: (cfg) => {
      state.paymentConfig = cfg;
    }
  };
})();
