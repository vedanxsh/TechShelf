const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://127.0.0.1:3000';

function req(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = options.headers || {};
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const request = http.request(url, {
      method: options.method || 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: json || data });
      });
    });

    request.on('error', reject);
    if (options.body) {
      request.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    request.end();
  });
}

async function runTests() {
  console.log('🧪 Starting QuickBite v2.0 Comprehensive Test Suite...\n');

  // 1. Healthcheck
  console.log('1. Testing GET /api/health...');
  const health = await req('/api/health');
  assert.strictEqual(health.status, 200);
  assert.strictEqual(health.body.status, 'healthy');
  console.log('   ✓ Healthcheck passed');

  // 2. Static Assets
  console.log('2. Testing Static Frontend Files...');
  const index = await req('/');
  assert.strictEqual(index.status, 200);
  assert(index.body.includes('QuickBite'));

  const css = await req('/css/main.css');
  assert.strictEqual(css.status, 200);
  assert(css.body.includes('--amber-500'));

  const jsApp = await req('/js/app.js');
  assert.strictEqual(jsApp.status, 200);
  assert(jsApp.body.includes('QuickBite.app'));

  const jsMenuMgr = await req('/js/menuManager.js');
  assert.strictEqual(jsMenuMgr.status, 200);
  assert(jsMenuMgr.body.includes('QuickBite.menuManager'));
  console.log('   ✓ Static assets and menuManager served successfully');

  // 3. Auth Login (Verified Account)
  console.log('3. Testing Student Login (vedansh)...');
  const loginRes = await req('/api/auth/login', {
    method: 'POST',
    body: { id: 'vedansh', password: 'password123', role: 'student' }
  });
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginRes.body.success, true);
  assert.strictEqual(loginRes.body.user.id, 'vedansh');
  assert.strictEqual(loginRes.body.user.isEmailVerified, true);
  const initialBalance = loginRes.body.user.walletBalance;
  console.log(`   ✓ Login successful (Verified Student: ${loginRes.body.user.email}, balance: ₹${initialBalance})`);

  // 4. Registration with Email Verification Flow
  console.log('4. Testing Registration with Email & OTP Verification Flow...');
  
  // 4a. Registration without email should fail
  const badReg = await req('/api/auth/register', {
    method: 'POST',
    body: { id: 'test_user_no_email', password: 'password123', role: 'student' }
  });
  assert.strictEqual(badReg.status, 400);
  console.log('   ✓ Registration without valid email was rejected (HTTP 400)');

  // 4b. Register valid student
  const testStudentId = `stu_${Date.now().toString(36)}`;
  const testEmail = `${testStudentId}@galgotiasuniversity.edu.in`;
  const regRes = await req('/api/auth/register', {
    method: 'POST',
    body: {
      id: testStudentId,
      name: 'Rohan Gupta',
      email: testEmail,
      password: 'mypassword123',
      role: 'student'
    }
  });
  assert.strictEqual(regRes.status, 201);
  assert.strictEqual(regRes.body.requiresVerification, true);
  const otpCode = regRes.body.verificationCode;
  assert(otpCode && otpCode.length === 6);
  console.log(`   ✓ Student "${testStudentId}" registered with email: ${testEmail}`);
  console.log(`   ✓ Verification OTP generated: ${otpCode}`);

  // 4c. Login before verification must be blocked
  const unverifiedLogin = await req('/api/auth/login', {
    method: 'POST',
    body: { id: testStudentId, password: 'mypassword123', role: 'student' }
  });
  assert.strictEqual(unverifiedLogin.status, 403);
  assert.strictEqual(unverifiedLogin.body.requiresVerification, true);
  console.log('   ✓ Login blocked for unverified student (HTTP 403, requiresVerification: true)');

  // 4d. Resend OTP code test
  const resendRes = await req('/api/auth/resend-otp', {
    method: 'POST',
    body: { idOrEmail: testStudentId }
  });
  assert.strictEqual(resendRes.status, 200);
  const freshOtp = resendRes.body.verificationCode;
  assert(freshOtp && freshOtp.length === 6);
  console.log(`   ✓ Resend OTP working. Fresh code: ${freshOtp}`);

  // 4e. Verify email with wrong code should fail
  const wrongVerify = await req('/api/auth/verify-email', {
    method: 'POST',
    body: { idOrEmail: testStudentId, code: '000000' }
  });
  assert.strictEqual(wrongVerify.status, 400);
  console.log('   ✓ Invalid OTP rejected (HTTP 400)');

  // 4f. Verify email with correct fresh OTP code
  const verifyRes = await req('/api/auth/verify-email', {
    method: 'POST',
    body: { idOrEmail: testStudentId, code: freshOtp }
  });
  assert.strictEqual(verifyRes.status, 200);
  assert.strictEqual(verifyRes.body.user.isEmailVerified, true);
  assert.strictEqual(verifyRes.body.user.walletBalance, 500);
  console.log('   ✓ Email verified! Account activated with ₹500 welcome credit');

  // 4g. Now login should succeed cleanly!
  const verifiedLogin = await req('/api/auth/login', {
    method: 'POST',
    body: { id: testStudentId, password: 'mypassword123', role: 'student' }
  });
  assert.strictEqual(verifiedLogin.status, 200);
  assert.strictEqual(verifiedLogin.body.user.isEmailVerified, true);
  console.log('   ✓ Verified account logged in successfully');

  // 5. Menu Catalog & Query Filters
  console.log('5. Testing Menu Catalog & Filters...');
  const menuAll = await req('/api/menu');
  assert.strictEqual(menuAll.status, 200);
  assert(menuAll.body.items.length >= 6);

  const menuFastFood = await req('/api/menu?category=fastfood');
  assert.strictEqual(menuFastFood.status, 200);
  assert(menuFastFood.body.items.every(i => i.category === 'fastfood'));

  const menuVeg = await req('/api/menu?isVeg=true');
  assert.strictEqual(menuVeg.status, 200);
  assert(menuVeg.body.items.every(i => i.isVeg === true));
  console.log('   ✓ Menu queries and filters working correctly');

  // 6. Cafeteria Menu Manipulation (Create, Update, Toggle Stock, Delete)
  console.log('6. Testing Cafeteria Menu Manipulation (CRUD)...');
  
  // 6a. Create new menu item
  const createItemRes = await req('/api/menu', {
    method: 'POST',
    body: {
      name: 'Special Tandoori Pizza',
      desc: 'Thin crust with smoky tandoori sauce and mozzarella',
      price: 150,
      category: 'fastfood',
      isVeg: true,
      prepTime: '8-10 mins',
      icon: '🍕',
      available: true
    }
  });
  assert.strictEqual(createItemRes.status, 201);
  const createdItem = createItemRes.body.item;
  assert(createdItem.id > 0);
  assert.strictEqual(createdItem.name, 'Special Tandoori Pizza');
  console.log(`   ✓ Created new menu item: #${createdItem.id} "${createdItem.name}" at ₹${createdItem.price}`);

  // 6b. Update item price and prepTime
  const updateItemRes = await req(`/api/menu/${createdItem.id}`, {
    method: 'PUT',
    body: {
      price: 165,
      prepTime: '10-12 mins'
    }
  });
  assert.strictEqual(updateItemRes.status, 200);
  assert.strictEqual(updateItemRes.body.item.price, 165);
  assert.strictEqual(updateItemRes.body.item.prepTime, '10-12 mins');
  console.log(`   ✓ Updated item #${createdItem.id} price to ₹165 and prepTime to 10-12 mins`);

  // 6c. Toggle stock availability
  const toggleRes = await req(`/api/menu/${createdItem.id}/toggle`, {
    method: 'PATCH'
  });
  assert.strictEqual(toggleRes.status, 200);
  assert.strictEqual(toggleRes.body.item.available, false);
  console.log(`   ✓ Toggled item #${createdItem.id} stock: now OUT OF STOCK`);

  // 6d. Delete item
  const deleteRes = await req(`/api/menu/${createdItem.id}`, {
    method: 'DELETE'
  });
  assert.strictEqual(deleteRes.status, 200);
  assert.strictEqual(deleteRes.body.item.id, createdItem.id);
  console.log(`   ✓ Removed item #${createdItem.id} from cafeteria menu`);

  // Verify it is no longer returned
  const checkDeleted = await req(`/api/menu/${createdItem.id}`);
  assert.strictEqual(checkDeleted.status, 404);
  console.log('   ✓ Verified deleted item returns 404 Not Found');

  // 7. Payment Coupon Validation
  console.log('7. Testing Payment Coupon Validation (STUDENT10)...');
  const couponRes = await req('/api/payment/coupon', {
    method: 'POST',
    body: { code: 'STUDENT10', subtotal: 100 }
  });
  assert.strictEqual(couponRes.status, 200);
  assert.strictEqual(couponRes.body.success, true);
  assert.strictEqual(couponRes.body.discount, 10);
  console.log('   ✓ Promo code STUDENT10 applied: ₹10 discount');

  // 8. UPI Intent Generation
  console.log('8. Testing UPI Intent Generation...');
  const upiRes = await req('/api/payment/upi/intent', {
    method: 'POST',
    body: { amount: 120, studentId: 'vedansh' }
  });
  assert.strictEqual(upiRes.status, 200);
  assert.strictEqual(upiRes.body.success, true);
  assert(upiRes.body.upiUri.includes('upi://pay'));
  assert(upiRes.body.qrUrl.includes('create-qr-code'));
  console.log('   ✓ UPI Intent & QR Code URL generated');

  // 9. Place Order with Campus Wallet
  console.log('9. Testing Order Placement with Campus Wallet Deduction...');
  const orderAmount = 60;
  const orderRes = await req('/api/orders', {
    method: 'POST',
    body: {
      student: 'vedansh',
      studentName: 'Vedansh Maurya',
      items: [{ id: 1, name: 'Veg Crispy Burger', qty: 1, price: 60 }],
      subtotal: 60,
      discount: 0,
      total: orderAmount,
      payment: {
        method: 'wallet',
        status: 'PAID',
        details: 'Paid via Campus Card'
      }
    }
  });

  assert.strictEqual(orderRes.status, 201);
  assert.strictEqual(orderRes.body.success, true);
  const createdOrder = orderRes.body.order;
  assert(createdOrder.num >= 101);
  assert.strictEqual(createdOrder.payment.status, 'PAID');
  assert.strictEqual(orderRes.body.walletBalance, initialBalance - orderAmount);
  console.log(`   ✓ Order #${createdOrder.num} placed! New wallet balance: ₹${orderRes.body.walletBalance}`);

  // 10. Place Order with Cash on Pickup
  console.log('10. Testing Order Placement with Cash on Pickup...');
  const cashOrderRes = await req('/api/orders', {
    method: 'POST',
    body: {
      student: 'student101',
      studentName: 'Rahul Sharma',
      items: [{ id: 3, name: 'Special Masala Maggi', qty: 1, price: 45 }],
      subtotal: 45,
      total: 45,
      payment: {
        method: 'cash',
        status: 'PENDING',
        details: 'Pending Counter Cash Payment'
      }
    }
  });
  assert.strictEqual(cashOrderRes.status, 201);
  assert.strictEqual(cashOrderRes.body.order.payment.status, 'PENDING');
  const cashOrderNum = cashOrderRes.body.order.num;
  console.log(`   ✓ Order #${cashOrderNum} placed with pending counter cash`);

  // 11. Kitchen Display System - Status Progression
  console.log(`11. Testing KDS Status Progression for Order #${createdOrder.num}...`);
  const prepRes = await req(`/api/orders/${createdOrder.num}/status`, {
    method: 'PATCH',
    body: { status: 'PREPARING' }
  });
  assert.strictEqual(prepRes.status, 200);
  assert.strictEqual(prepRes.body.order.status, 'PREPARING');

  const readyRes = await req(`/api/orders/${createdOrder.num}/status`, {
    method: 'PATCH',
    body: { status: 'READY' }
  });
  assert.strictEqual(readyRes.status, 200);
  assert.strictEqual(readyRes.body.order.status, 'READY');
  console.log(`   ✓ Order #${createdOrder.num} transitioned: NEW -> PREPARING -> READY`);

  // 12. Update Cash Order to Paid
  console.log(`12. Testing Counter Cash Payment Collection for Order #${cashOrderNum}...`);
  const payRes = await req(`/api/orders/${cashOrderNum}/payment`, {
    method: 'PATCH',
    body: { paymentStatus: 'PAID', txnId: 'CASH-COUNTER-001' }
  });
  assert.strictEqual(payRes.status, 200);
  assert.strictEqual(payRes.body.order.payment.status, 'PAID');
  console.log(`   ✓ Order #${cashOrderNum} payment updated from PENDING to PAID`);

  // Reset test wallet balance
  console.log('13. Resetting test wallet balance...');
  await req(`/api/auth/wallet/vedansh/topup`, {
    method: 'POST',
    body: { amount: orderAmount }
  });
  console.log(`   ✓ Restored ₹${orderAmount} back to Vedansh's wallet`);

  console.log('\n🎉 ALL 13 TEST SUITES PASSED CLEANLY!\n');
}

runTests().catch(err => {
  console.error('\n❌ Test Failed:', err);
  process.exit(1);
});
