const fs = require('fs');
const config = require('../config');

class UserModel {
  static _read() {
    try {
      if (!fs.existsSync(config.paths.usersFile)) {
        return [];
      }
      const data = fs.readFileSync(config.paths.usersFile, 'utf8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error('[UserModel._read] Error reading users file:', err.message);
      return [];
    }
  }

  static _write(users) {
    try {
      fs.writeFileSync(config.paths.usersFile, JSON.stringify(users, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[UserModel._write] Error writing users file:', err.message);
      throw new Error('Failed to persist user data');
    }
  }

  static getAll() {
    return this._read().map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      walletBalance: u.walletBalance ?? 0,
      isEmailVerified: u.isEmailVerified ?? false,
      createdAt: u.createdAt
    }));
  }

  static findById(id) {
    if (!id) return null;
    const users = this._read();
    return users.find(u => u.id.toLowerCase() === id.trim().toLowerCase()) || null;
  }

  static findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const users = this._read();
    return users.find(u => u.email && u.email.toLowerCase() === cleanEmail) || null;
  }

  static findByIdAndRole(id, role) {
    if (!id) return null;
    const users = this._read();
    return users.find(u => 
      u.id.toLowerCase() === id.trim().toLowerCase() && 
      u.role === role
    ) || null;
  }

  static generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static create(userData) {
    const users = this._read();
    const cleanId = userData.id.trim();
    const cleanEmail = (userData.email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      const error = new Error('A valid email address is required for registration');
      error.statusCode = 400;
      throw error;
    }

    if (users.some(u => u.id.toLowerCase() === cleanId.toLowerCase())) {
      const error = new Error(`Account with ID "${cleanId}" already exists`);
      error.statusCode = 409;
      throw error;
    }

    if (users.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
      const error = new Error(`Email "${cleanEmail}" is already registered. Please log in or use a different email.`);
      error.statusCode = 409;
      throw error;
    }

    const verificationCode = this.generateOtp();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

    const isDirectVerified = userData.isEmailVerified === true || userData.role === 'cafe';

    const newUser = {
      id: cleanId,
      name: (userData.name && userData.name.trim()) || cleanId,
      email: cleanEmail,
      password: userData.password.trim(),
      role: userData.role || 'student',
      walletBalance: userData.role === 'student' ? (typeof userData.walletBalance === 'number' ? userData.walletBalance : 500) : 0,
      isEmailVerified: isDirectVerified,
      verificationCode: isDirectVerified ? null : verificationCode,
      verificationExpires: isDirectVerified ? null : verificationExpires,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this._write(users);

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      walletBalance: newUser.walletBalance,
      isEmailVerified: newUser.isEmailVerified,
      // Provide verificationCode for simulated/preview email delivery in testing/local mode
      verificationCode: isDirectVerified ? null : verificationCode
    };
  }

  static verifyEmail(idOrEmail, code) {
    if (!idOrEmail || !code) {
      const err = new Error('User identifier and verification code are required');
      err.statusCode = 400;
      throw err;
    }

    const users = this._read();
    const target = idOrEmail.trim().toLowerCase();
    const user = users.find(u => 
      u.id.toLowerCase() === target || 
      (u.email && u.email.toLowerCase() === target)
    );

    if (!user) {
      const err = new Error(`User "${idOrEmail}" not found`);
      err.statusCode = 404;
      throw err;
    }

    if (user.isEmailVerified) {
      return {
        alreadyVerified: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          walletBalance: user.walletBalance ?? 0,
          isEmailVerified: true
        }
      };
    }

    if (!user.verificationCode || user.verificationCode !== code.trim()) {
      const err = new Error('Invalid verification code. Please check and try again.');
      err.statusCode = 400;
      throw err;
    }

    if (user.verificationExpires && new Date(user.verificationExpires) < new Date()) {
      const err = new Error('Verification code has expired. Please request a new code.');
      err.statusCode = 400;
      throw err;
    }

    user.isEmailVerified = true;
    user.verificationCode = null;
    user.verificationExpires = null;
    this._write(users);

    return {
      alreadyVerified: false,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance ?? 0,
        isEmailVerified: true
      }
    };
  }

  static resendVerificationCode(idOrEmail) {
    if (!idOrEmail) {
      const err = new Error('User ID or Email is required');
      err.statusCode = 400;
      throw err;
    }

    const users = this._read();
    const target = idOrEmail.trim().toLowerCase();
    const user = users.find(u => 
      u.id.toLowerCase() === target || 
      (u.email && u.email.toLowerCase() === target)
    );

    if (!user) {
      const err = new Error(`User "${idOrEmail}" not found`);
      err.statusCode = 404;
      throw err;
    }

    if (user.isEmailVerified) {
      const err = new Error('Email is already verified. You can log in directly.');
      err.statusCode = 400;
      throw err;
    }

    const newCode = this.generateOtp();
    user.verificationCode = newCode;
    user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    this._write(users);

    return {
      id: user.id,
      email: user.email,
      verificationCode: newCode
    };
  }

  static verifyPassword(id, password, role) {
    const user = this.findByIdAndRole(id, role);
    if (!user) return { ok: false, reason: 'NOT_FOUND' };
    if (user.password !== password) return { ok: false, reason: 'INVALID_PASSWORD' };

    // Check if email is verified for students
    if (user.role === 'student' && user.isEmailVerified === false) {
      return {
        ok: false,
        reason: 'EMAIL_NOT_VERIFIED',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      };
    }

    return {
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance ?? 0,
        isEmailVerified: user.isEmailVerified ?? true
      }
    };
  }

  static getWalletBalance(id) {
    const user = this.findById(id);
    if (!user) return null;
    return user.walletBalance ?? 0;
  }

  static deductWallet(id, amount) {
    if (amount <= 0) throw new Error('Invalid deduction amount');
    const users = this._read();
    const user = users.find(u => u.id.toLowerCase() === id.trim().toLowerCase());
    if (!user) {
      const err = new Error(`Student ${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    const currentBalance = user.walletBalance ?? 0;
    if (currentBalance < amount) {
      const err = new Error(`Insufficient wallet balance: current ₹${currentBalance}, required ₹${amount}`);
      err.statusCode = 400;
      throw err;
    }

    user.walletBalance = Math.round((currentBalance - amount) * 100) / 100;
    this._write(users);
    return user.walletBalance;
  }

  static topupWallet(id, amount) {
    if (amount <= 0) throw new Error('Invalid topup amount');
    const users = this._read();
    const user = users.find(u => u.id.toLowerCase() === id.trim().toLowerCase());
    if (!user) {
      const err = new Error(`Student ${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    const currentBalance = user.walletBalance ?? 0;
    user.walletBalance = Math.round((currentBalance + amount) * 100) / 100;
    this._write(users);
    return user.walletBalance;
  }
}

module.exports = UserModel;
