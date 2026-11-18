const UserModel = require('../models/userModel');

exports.login = async (req, res, next) => {
  try {
    const { id, password, role } = req.body;

    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message: 'Both ID and password are required'
      });
    }

    const targetRole = role || 'student';
    const result = UserModel.verifyPassword(id, password, targetRole);

    if (!result.ok) {
      if (result.reason === 'NOT_FOUND') {
        return res.status(401).json({
          success: false,
          message: `No ${targetRole === 'cafe' ? 'Cafeteria' : 'Student'} account found with ID "${id}"`
        });
      }

      if (result.reason === 'EMAIL_NOT_VERIFIED') {
        return res.status(403).json({
          success: false,
          requiresVerification: true,
          message: 'Your email address is not verified yet. Please enter the verification code sent to your email.',
          user: result.user
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: result.user
    });
  } catch (err) {
    next(err);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { id, name, email, password, role } = req.body;

    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message: 'ID and password are required'
      });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required for account registration & verification'
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters long'
      });
    }

    const newUser = UserModel.create({
      id,
      name,
      email,
      password,
      role: role || 'student',
      walletBalance: 500 // Welcome credit of ₹500 awarded upon registration
    });

    return res.status(201).json({
      success: true,
      requiresVerification: !newUser.isEmailVerified,
      message: newUser.isEmailVerified 
        ? 'Account created successfully!' 
        : `Verification code sent to ${newUser.email}. Please verify to activate your account.`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified
      },
      // Included for immediate testing/offline environment convenience
      verificationCode: newUser.verificationCode
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { idOrEmail, code } = req.body;

    if (!idOrEmail || !code) {
      return res.status(400).json({
        success: false,
        message: 'User ID or Email and 6-digit verification code are required'
      });
    }

    const result = UserModel.verifyEmail(idOrEmail, code);

    return res.status(200).json({
      success: true,
      message: result.alreadyVerified 
        ? 'Email is already verified!' 
        : 'Email verified successfully! Welcome to QuickBite with ₹500 campus credit.',
      user: result.user
    });
  } catch (err) {
    next(err);
  }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const { idOrEmail } = req.body;

    if (!idOrEmail) {
      return res.status(400).json({
        success: false,
        message: 'User ID or Email is required to resend verification code'
      });
    }

    const result = UserModel.resendVerificationCode(idOrEmail);

    return res.status(200).json({
      success: true,
      message: `A fresh verification code has been sent to ${result.email}`,
      email: result.email,
      verificationCode: result.verificationCode
    });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const user = UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance ?? 0,
        isEmailVerified: user.isEmailVerified ?? true
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getWalletBalance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const balance = UserModel.getWalletBalance(id);

    if (balance === null) {
      return res.status(404).json({ success: false, message: 'Student account not found' });
    }

    return res.status(200).json({
      success: true,
      id,
      walletBalance: balance
    });
  } catch (err) {
    next(err);
  }
};

exports.topupWallet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive topup amount is required' });
    }

    const newBalance = UserModel.topupWallet(id, numAmount);

    return res.status(200).json({
      success: true,
      message: `Successfully added ₹${numAmount} to Campus Card wallet!`,
      walletBalance: newBalance
    });
  } catch (err) {
    next(err);
  }
};
