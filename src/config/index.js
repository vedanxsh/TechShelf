const path = require('path');
const os = require('os');
require('dotenv').config();

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',
  localIp: getLocalIp(),

  appName: process.env.APP_NAME || 'QuickBite Cafeteria',
  currency: process.env.CURRENCY_SYMBOL || '₹',
  taxRate: parseFloat(process.env.TAX_RATE || '0'), // 0% cafeteria tax

  // File Storage Paths
  paths: {
    root: path.resolve(__dirname, '../../'),
    dataDir: path.resolve(__dirname, '../data'),
    usersFile: path.resolve(__dirname, '../data/users.json'),
    ordersFile: path.resolve(__dirname, '../data/orders.json'),
    menuFile: path.resolve(__dirname, '../data/menu.json'),
    publicDir: path.resolve(__dirname, '../../public')
  },

  // Payment Configuration
  payments: {
    upiVpa: process.env.UPI_VPA || 'cafeteria@upi',
    merchantName: process.env.MERCHANT_NAME || 'Campus QuickBite Cafeteria',
    campusWalletEnabled: process.env.CAMPUS_WALLET_ENABLED !== 'false',
    supportedMethods: ['upi', 'wallet', 'card', 'cash'],
    coupons: {
      'STUDENT10': { type: 'percent', value: 10, minOrder: 50, desc: '10% off for verified students' },
      'WELCOME50': { type: 'flat', value: 50, minOrder: 150, desc: 'Flat ₹50 off on orders above ₹150' },
      'SNACK20':   { type: 'percent', value: 20, minOrder: 80, desc: '20% off on snacks & drinks' }
    }
  }
};

module.exports = config;
