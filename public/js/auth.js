/* QuickBite v2.0 - Authentication & User Session Module */
window.QuickBite = window.QuickBite || {};

QuickBite.auth = (function () {
  let activeRole = 'student';
  let activeMode = 'signin';
  let pendingVerifyUser = null; // { id, email, code }
  let resendTimer = null;
  let countdownSeconds = 0;

  function setRole(role) {
    activeRole = role;
    const isStudent = role === 'student';

    const btnStudent = document.getElementById('btnRoleStudent');
    const btnCafe = document.getElementById('btnRoleCafe');
    if (btnStudent && btnCafe) {
      btnStudent.className = isStudent ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline';
      btnCafe.className = !isStudent ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline';
    }

    const idLabel = document.getElementById('authIdLabel');
    const idInput = document.getElementById('authIdInput');
    if (idLabel && idInput) {
      idLabel.textContent = isStudent ? 'Student ID / Roll No' : 'Cafeteria Staff ID';
      idInput.placeholder = isStudent ? 'e.g. vedansh' : 'e.g. cafe1';
    }

    const authTabs = document.getElementById('authModeTabs');
    if (authTabs) {
      authTabs.style.display = isStudent ? 'flex' : 'none';
      if (!isStudent && activeMode === 'register') {
        setMode('signin');
      }
    }

    clearError();
  }

  function setMode(mode) {
    activeMode = mode;
    const isSignIn = mode === 'signin';

    const tabSignIn = document.getElementById('tabSignIn');
    const tabRegister = document.getElementById('tabRegister');
    const regGroup = document.getElementById('regNameGroup');
    const emailGroup = document.getElementById('regEmailGroup');
    const submitBtn = document.getElementById('btnAuthSubmit');

    if (tabSignIn && tabRegister) {
      tabSignIn.style.color = isSignIn ? 'var(--amber-600)' : 'var(--ink-400)';
      tabSignIn.style.borderBottom = isSignIn ? '2px solid var(--amber-500)' : 'none';
      tabRegister.style.color = !isSignIn ? 'var(--amber-600)' : 'var(--ink-400)';
      tabRegister.style.borderBottom = !isSignIn ? '2px solid var(--amber-500)' : 'none';
    }

    if (regGroup) regGroup.classList.toggle('hidden', isSignIn);
    if (emailGroup) emailGroup.classList.toggle('hidden', isSignIn);
    if (submitBtn) submitBtn.textContent = isSignIn ? 'Sign In' : 'Create & Verify Account';

    clearError();
  }

  function showError(msg) {
    const errBox = document.getElementById('authErrorMsg');
    if (errBox) {
      errBox.textContent = msg;
      errBox.classList.remove('hidden');
    }
  }

  function clearError() {
    const errBox = document.getElementById('authErrorMsg');
    if (errBox) {
      errBox.textContent = '';
      errBox.classList.add('hidden');
    }
  }

  function quickFill(role, id, pass) {
    setRole(role);
    setMode('signin');
    const idInput = document.getElementById('authIdInput');
    const passInput = document.getElementById('authPasswordInput');
    if (idInput) idInput.value = id;
    if (passInput) passInput.value = pass;
    clearError();
  }

  async function handleSubmit(event) {
    if (event) event.preventDefault();
    clearError();

    const id = (document.getElementById('authIdInput')?.value || '').trim();
    const password = document.getElementById('authPasswordInput')?.value || '';
    const name = (document.getElementById('regNameInput')?.value || '').trim();
    const email = (document.getElementById('regEmailInput')?.value || '').trim();

    if (!id || !password) {
      showError('Please enter both ID and password');
      return;
    }

    if (activeMode === 'register' && (!email || !email.includes('@'))) {
      showError('Please enter a valid campus email address');
      return;
    }

    const submitBtn = document.getElementById('btnAuthSubmit');
    const origText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    try {
      if (activeMode === 'register') {
        const res = await QuickBite.api.auth.register({
          id,
          name,
          email,
          password,
          role: activeRole
        });

        if (res.requiresVerification) {
          // Open OTP Verification Modal
          pendingVerifyUser = {
            id: res.user.id,
            email: res.user.email,
            code: res.verificationCode
          };
          closeModal();
          openVerifyModal(pendingVerifyUser);
          QuickBite.app.showToast('Verification code sent to your email!', 'info');
          return;
        }

        QuickBite.app.showToast('Account created! Welcome to QuickBite', 'success');
        if (res.user) {
          QuickBite.state.setUser(res.user, res.user.role);
          applyAuthUI();
          closeModal();
          QuickBite.app.syncOrders();
        }
      } else {
        const res = await QuickBite.api.auth.login({
          id,
          password,
          role: activeRole
        });

        QuickBite.app.showToast(`Logged in as ${res.user.name || res.user.id}`, 'success');
        if (res.user) {
          QuickBite.state.setUser(res.user, res.user.role);
          applyAuthUI();
          closeModal();
          QuickBite.app.syncOrders();
        }
      }
    } catch (err) {
      if (err.data && err.data.requiresVerification) {
        pendingVerifyUser = {
          id: err.data.user.id,
          email: err.data.user.email
        };
        closeModal();
        openVerifyModal(pendingVerifyUser);
        QuickBite.app.showToast('Please verify your email address to log in', 'info');
        return;
      }
      showError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      submitBtn.textContent = origText;
      submitBtn.disabled = false;
    }
  }

  // ==========================================
  // EMAIL OTP VERIFICATION FLOW
  // ==========================================
  function openVerifyModal(user) {
    const modal = document.getElementById('emailVerifyModal');
    const emailTarget = document.getElementById('verifyTargetEmail');
    const previewBox = document.getElementById('otpPreviewBox');
    const codeInput = document.getElementById('otpCodeInput');
    const errBox = document.getElementById('verifyErrorMsg');

    if (emailTarget) emailTarget.textContent = user.email || user.id;
    if (codeInput) {
      codeInput.value = '';
      codeInput.focus();
    }
    if (errBox) {
      errBox.textContent = '';
      errBox.classList.add('hidden');
    }

    if (previewBox) {
      if (user.code) {
        previewBox.innerHTML = `
          <span>Simulation Preview: Code is <b>${user.code}</b></span>
          <button type="button" class="btn-copy-upi" onclick="QuickBite.auth.fillOtp('${user.code}')">Auto-Fill</button>
        `;
        previewBox.classList.remove('hidden');
      } else {
        previewBox.classList.add('hidden');
      }
    }

    startResendCountdown(30);
    if (modal) modal.classList.remove('hidden');
  }

  function closeVerifyModal() {
    const modal = document.getElementById('emailVerifyModal');
    if (modal) modal.classList.add('hidden');
    clearInterval(resendTimer);
  }

  function fillOtp(code) {
    const input = document.getElementById('otpCodeInput');
    if (input) input.value = code;
  }

  async function handleVerifySubmit(e) {
    if (e) e.preventDefault();
    if (!pendingVerifyUser) return;

    const code = (document.getElementById('otpCodeInput')?.value || '').trim();
    const errBox = document.getElementById('verifyErrorMsg');
    const submitBtn = document.getElementById('btnSubmitOtp');

    if (!code || code.length < 6) {
      if (errBox) {
        errBox.textContent = 'Please enter the 6-digit verification code';
        errBox.classList.remove('hidden');
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying Code...';
    }

    try {
      const res = await QuickBite.api.auth.verifyEmail(pendingVerifyUser.id, code);
      if (res.success && res.user) {
        closeVerifyModal();
        QuickBite.state.setUser(res.user, res.user.role);
        applyAuthUI();
        QuickBite.app.syncOrders();
        QuickBite.app.showToast('Email verified! Account activated with ₹500 welcome credit!', 'success');
      }
    } catch (err) {
      if (errBox) {
        errBox.textContent = err.message || 'Verification failed. Code may be invalid or expired.';
        errBox.classList.remove('hidden');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Verify & Activate Account';
      }
    }
  }

  async function resendCode() {
    if (!pendingVerifyUser) return;
    const btnResend = document.getElementById('btnResendOtp');
    const previewBox = document.getElementById('otpPreviewBox');

    try {
      const res = await QuickBite.api.auth.resendOtp(pendingVerifyUser.id);
      if (res.success) {
        pendingVerifyUser.code = res.verificationCode;
        if (previewBox) {
          previewBox.innerHTML = `
            <span>Simulation Preview: Fresh code is <b>${res.verificationCode}</b></span>
            <button type="button" class="btn-copy-upi" onclick="QuickBite.auth.fillOtp('${res.verificationCode}')">Auto-Fill</button>
          `;
          previewBox.classList.remove('hidden');
        }
        QuickBite.app.showToast('Fresh verification code sent!', 'info');
        startResendCountdown(30);
      }
    } catch (err) {
      QuickBite.app.showToast(err.message || 'Could not resend code', 'error');
    }
  }

  function startResendCountdown(seconds) {
    clearInterval(resendTimer);
    countdownSeconds = seconds;
    const btnResend = document.getElementById('btnResendOtp');

    function update() {
      if (countdownSeconds <= 0) {
        clearInterval(resendTimer);
        if (btnResend) {
          btnResend.disabled = false;
          btnResend.textContent = 'Resend Code';
        }
      } else {
        if (btnResend) {
          btnResend.disabled = true;
          btnResend.textContent = `Resend in ${countdownSeconds}s`;
        }
        countdownSeconds--;
      }
    }

    update();
    resendTimer = setInterval(update, 1000);
  }

  function applyAuthUI() {
    const state = QuickBite.state.get();
    const user = state.currentUser;
    const authModal = document.getElementById('authModal');
    const userBadge = document.getElementById('userBadge');
    const staffSwitch = document.getElementById('staffSwitchWrap');

    if (!user) {
      if (authModal) authModal.classList.remove('hidden');
      if (userBadge) userBadge.classList.add('hidden');
      if (staffSwitch) staffSwitch.classList.add('hidden');
      return;
    }

    // Hide login modal, show user badge
    if (authModal) authModal.classList.add('hidden');
    if (userBadge) userBadge.classList.remove('hidden');

    const nameEl = document.getElementById('userNameDisplay');
    const roleEl = document.getElementById('userRoleDisplay');
    const walletPill = document.getElementById('walletPill');
    const walletVal = document.getElementById('walletBalanceVal');

    if (nameEl) nameEl.textContent = user.name || user.id;
    if (roleEl) roleEl.textContent = user.role === 'cafe' ? 'Cafeteria Staff' : 'Student';

    if (user.role === 'student') {
      if (walletPill) walletPill.classList.remove('hidden');
      if (walletVal) walletVal.textContent = user.walletBalance ?? 0;
      QuickBite.app.switchView('student');
    } else {
      if (walletPill) walletPill.classList.add('hidden');
      QuickBite.app.switchView('cafe');
    }

    if (staffSwitch) {
      staffSwitch.classList.toggle('hidden', user.role !== 'cafe');
    }
  }

  function openModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.remove('hidden');
  }

  function closeModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.add('hidden');
  }

  function logout() {
    QuickBite.state.setUser(null);
    QuickBite.state.clearCart();
    QuickBite.app.showToast('You have been logged out', 'info');
    applyAuthUI();
  }

  async function refreshWallet() {
    const state = QuickBite.state.get();
    if (state.currentUser && state.currentUser.role === 'student') {
      try {
        const res = await QuickBite.api.auth.getWallet(state.currentUser.id);
        if (res && typeof res.walletBalance === 'number') {
          QuickBite.state.updateWalletBalance(res.walletBalance);
          const walletVal = document.getElementById('walletBalanceVal');
          if (walletVal) walletVal.textContent = res.walletBalance;
        }
      } catch (e) {
        // Silently skip if network blips
      }
    }
  }

  return {
    setRole,
    setMode,
    quickFill,
    handleSubmit,
    openVerifyModal,
    closeVerifyModal,
    handleVerifySubmit,
    resendCode,
    fillOtp,
    applyAuthUI,
    openModal,
    closeModal,
    logout,
    refreshWallet
  };
})();
