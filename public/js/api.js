/* QuickBite v2.0 - Centralized API Service */
window.QuickBite = window.QuickBite || {};

QuickBite.api = (function () {
  const BASE_URL = ''; // Relative path works automatically for both local & multi-device IP

  async function request(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    };

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || data.error || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err.message);
      throw err;
    }
  }

  return {
    // Auth endpoints
    auth: {
      login: (credentials) => request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
      register: (userData) => request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      }),
      verifyEmail: (idOrEmail, code) => request('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ idOrEmail, code })
      }),
      resendOtp: (idOrEmail) => request('/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ idOrEmail })
      }),
      getProfile: (id) => request(`/api/auth/profile?id=${encodeURIComponent(id)}`),
      getWallet: (id) => request(`/api/auth/wallet/${encodeURIComponent(id)}`),
      topupWallet: (id, amount) => request(`/api/auth/wallet/${encodeURIComponent(id)}/topup`, {
        method: 'POST',
        body: JSON.stringify({ amount })
      })
    },

    // Menu endpoints
    menu: {
      getAll: (params = {}) => {
        const query = new URLSearchParams();
        if (params.category && params.category !== 'all') query.set('category', params.category);
        if (params.search) query.set('search', params.search);
        if (params.isVeg !== undefined) query.set('isVeg', params.isVeg);
        if (params.availableOnly) query.set('availableOnly', params.availableOnly);
        const qs = query.toString() ? `?${query.toString()}` : '';
        return request(`/api/menu${qs}`);
      },
      getCategories: () => request('/api/menu/categories'),
      getById: (id) => request(`/api/menu/${id}`),
      create: (itemData) => request('/api/menu', {
        method: 'POST',
        body: JSON.stringify(itemData)
      }),
      update: (id, itemData) => request(`/api/menu/${id}`, {
        method: 'PUT',
        body: JSON.stringify(itemData)
      }),
      delete: (id) => request(`/api/menu/${id}`, {
        method: 'DELETE'
      }),
      toggleStock: (id) => request(`/api/menu/${id}/toggle`, {
        method: 'PATCH'
      })
    },

    // Order endpoints
    orders: {
      getAll: (params = {}) => {
        const query = new URLSearchParams();
        if (params.student) query.set('student', params.student);
        if (params.status) query.set('status', params.status);
        const qs = query.toString() ? `?${query.toString()}` : '';
        return request(`/api/orders${qs}`);
      },
      create: (orderPayload) => request('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      }),
      updateStatus: (num, status) => request(`/api/orders/${num}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }),
      updatePayment: (num, paymentStatus, txnId) => request(`/api/orders/${num}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus, txnId })
      })
    },

    // Payment endpoints
    payment: {
      getConfig: () => request('/api/payment/config'),
      validateCoupon: (code, subtotal) => request('/api/payment/coupon', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal })
      }),
      createUpiIntent: (amount, studentId) => request('/api/payment/upi/intent', {
        method: 'POST',
        body: JSON.stringify({ amount, studentId })
      }),
      verifyPayment: (payload) => request('/api/payment/verify', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    }
  };
})();
