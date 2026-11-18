# ⚡ QuickBite — Modern Campus Cafeteria Pre-Order & Kitchen Management System

> **Version 2.1.0** — Production & Deployment Ready  
> A full-stack, multi-device web application for university cafeterias and quick-service food counters. Features verified email registration, live status tracking, kitchen display system (KDS), cafeteria menu manipulation, and an interactive payment gateway with UPI QR, Campus Student Card, and Cash on Pickup.

---

## 🏛️ System Architecture

QuickBite is built with clean separation of concerns:

```
/home/vedanxsh/Documents/IDT/
├── server.js                  # Application entry point & graceful shutdown
├── package.json               # NPM scripts ("npm start", "npm run dev", "npm test")
├── .env / .env.example        # Environment variable configuration
├── Dockerfile / .dockerignore # Containerized production deployment
├── README.md                  # Complete technical documentation
│
├── src/                       # Backend Application Core (MVC Pattern)
│   ├── app.js                 # Express app initialization, CORS & middlewares
│   ├── config/
│   │   └── index.js           # Central configuration & local IP detection
│   ├── data/
│   │   ├── users.json         # User credentials, verified emails & wallet balances
│   │   ├── menu.json          # Live categorized food catalog (CRUD editable)
│   │   └── orders.json        # Persistent order database
│   ├── models/
│   │   ├── userModel.js       # Credentials, email verification OTP & wallet transactions
│   │   ├── menuModel.js       # Food catalog queries, filtering, CRUD & stock management
│   │   └── orderModel.js      # Order storage, status transitions & payments
│   ├── controllers/
│   │   ├── authController.js  # Login, email registration, OTP verification & wallet
│   │   ├── menuController.js  # Menu retrieval, creation, updates, deletes & stock toggle
│   │   ├── orderController.js # Order creation, status progression & history
│   │   └── paymentController.js # UPI intent, coupon discount & payment verification
│   ├── routes/
│   │   ├── authRoutes.js      # /api/auth/* (includes /verify-email & /resend-otp)
│   │   ├── menuRoutes.js      # /api/menu/* (includes POST, PUT, DELETE, PATCH stock)
│   │   ├── orderRoutes.js     # /api/orders/*
│   │   └── paymentRoutes.js   # /api/payment/*
│   └── middleware/
│       ├── logger.js          # Request logger with status codes and latencies
│       └── errorHandler.js    # Standardized JSON error response handler
│
├── public/                    # Frontend Client (Clean Modular Separation)
│   ├── index.html             # Semantic HTML5 markup & accessible layout
│   ├── css/
│   │   ├── main.css           # Design tokens, reset, typography & variables
│   │   ├── components.css     # Buttons, navbar, badges, steppers, toasts
│   │   ├── views.css          # Student ordering view, KDS board & Menu Manager
│   │   └── payment.css        # Payment selector, UPI QR card & wallet preview
│   └── js/
│       ├── api.js             # Centralized Fetch API client wrapper
│       ├── state.js           # Reactive client state management
│       ├── auth.js            # Login/register modal, email OTP verification flow
│       ├── menu.js            # Menu catalog rendering, search, dietary & stock filters
│       ├── menuManager.js     # Cafeteria Menu Manager (Add, Edit, Delete, Toggle Stock)
│       ├── cart.js            # Tray management, quantity steppers & totals
│       ├── payment.js         # Checkout modal, UPI QR, Campus Card deduction & receipts
│       ├── kitchen.js         # Kitchen Display System (KDS) board & status actions
│       └── app.js             # Main orchestrator, polling sync & active ticket stepper
│
└── tests/
    └── smoke.test.js          # Automated end-to-end test suite (13 test scenarios)
```

---

## 🌟 Key Features

1. **Email Verification on Registration**:
   - Students register with their ID, Full Name, Campus Email, and Password.
   - Generates a secure **6-digit OTP verification code** with a 15-minute expiration.
   - Prevents unverified users from logging in until their email is confirmed.
   - Clean verification modal with countdown timer, resend button, and instant simulation auto-fill for local/Wi-Fi use.
   - Verified accounts immediately receive a **₹500 welcome credit** in their Campus Wallet!
2. **Cafeteria Menu Manipulation (Admin & Staff)**:
   - Cafeteria staff have a dedicated **"Menu Catalog Manager"** tab in their dashboard.
   - **Create New Items**: Add name, description, price, category, veg/non-veg flag, prep time, and emoji icon.
   - **Edit Items**: Update pricing, descriptions, or preparation times.
   - **Toggle Stock Availability**: Instantly mark items as **In Stock** or **Out of Stock** with one click. Out-of-stock items are automatically greyed out on the student screen with ordering disabled.
   - **Delete Items**: Remove items with confirmation and instant synchronization across all devices.
3. **Multi-Option Payment Gateway**:
   - **📱 UPI / QR Code (Google Pay, PhonePe, Paytm, BHIM)**: Live scan-to-pay QR codes and NPCI-compliant intent deep-links.
   - **💳 Campus Student Card / Digital Wallet**: One-tap payment deducted directly from student wallet balance.
   - **💳 Debit / Credit Card**: Form validation with instant simulation.
   - **💵 Pay at Counter (Cash)**: Kitchen queues order immediately; staff marks payment as collected at the counter.
   - **🎟️ Promo Coupons**: Apply `STUDENT10` (10% off) or `WELCOME50` (flat ₹50 off).
4. **Kitchen Display System (KDS)**:
   - 3-column Kanban workflow: *1. New Orders ➔ 2. Cooking ➔ 3. Ready for Pickup*.
   - Live incoming order counters.
   - Payment status badge (`PAID ✓` vs `COLLECT CASH ⚠️`).
5. **Active Order Live Tracker**:
   - 3-stage visual progress stepper on student screens:
     `[1. Order Placed] ➔ [2. In Kitchen Cooking] ➔ [3. Ready at Counter #1]`.
   - Downloadable / printable pickup token receipt.

---

## 👥 Default Test Accounts

| Role | User ID | Password | Email | Campus Wallet |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `vedansh` | `password123` | `vedansh@galgotiasuniversity.edu.in` | **₹850.00** |
| **Student** | `student101` | `student123` | `student101@campus.edu.in` | **₹420.00** |
| **Cafeteria** | `cafe1` | `cafe123` | `cafeteria@campus.edu.in` | Staff Terminal |
| **Cafeteria** | `admin` | `admin123` | `admin@campus.edu.in` | Staff Terminal |

*(Click the **"Fill"** button on the login screen to auto-fill credentials instantly!)*

---

## 🚀 Quick Start (Local Run)

```bash
cd "/home/vedanxsh/Documents/IDT"
npm install
npm start
```
- Open on PC: [http://localhost:3000](http://localhost:3000)
- Open on Phones/Tablets on the same Wi-Fi:  
  Open the network address printed in your terminal (e.g. `http://192.168.0.123:3000/`)

---

## 🧪 Running Tests

Execute the 13-scenario automated test suite:
```bash
cd "/home/vedanxsh/Documents/IDT"
npm test
```

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Health check endpoint for uptime monitors and Docker |
| `/api/auth/register` | `POST` | Register a new student ID with campus email (triggers OTP) |
| `/api/auth/verify-email` | `POST` | Verify 6-digit OTP code to activate account & grant ₹500 credit |
| `/api/auth/resend-otp` | `POST` | Resend fresh 6-digit OTP verification code |
| `/api/auth/login` | `POST` | Authenticate credentials (blocks unverified emails) |
| `/api/auth/profile` | `GET` | Retrieve logged in user's profile and live wallet balance |
| `/api/auth/wallet/:id` | `GET` | Check student's campus card wallet balance |
| `/api/auth/wallet/:id/topup`| `POST` | Top-up student campus card balance |
| `/api/menu` | `GET` | Get food items (filters: `?category=...&search=...&isVeg=...&availableOnly=...`) |
| `/api/menu` | `POST` | **Cafeteria**: Add a new food item to the catalog |
| `/api/menu/:id` | `PUT` | **Cafeteria**: Update food item name, price, description, prep time |
| `/api/menu/:id/toggle` | `PATCH` | **Cafeteria**: Toggle In Stock / Out of Stock availability |
| `/api/menu/:id` | `DELETE` | **Cafeteria**: Remove food item from cafeteria menu |
| `/api/orders` | `GET` | Get all orders or filter by student (`?student=...`) |
| `/api/orders` | `POST` | Place a new order with payment metadata |
| `/api/orders/:num/status` | `PATCH` | Advance order status (`NEW`, `PREPARING`, `READY`, `COMPLETED`) |
| `/api/orders/:num/payment`| `PATCH` | Update payment status (e.g. mark cash received at counter) |
| `/api/payment/config` | `GET` | Get active payment gateway config, UPI VPA & coupons |
| `/api/payment/coupon` | `POST` | Validate and calculate coupon discount (`STUDENT10`, `WELCOME50`) |
| `/api/payment/upi/intent` | `POST` | Generate UPI payment intent & QR code |
| `/api/payment/verify` | `POST` | Simulate gateway transaction verification |

---

## 📄 License
MIT © Vedansh Maurya
