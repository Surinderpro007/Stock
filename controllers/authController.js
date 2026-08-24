const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');
const { sendOtpEmail } = require('../lib/email');

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getRoleForEmail(email) {
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  return email.toLowerCase() === adminEmail ? 'admin' : 'user';
}

async function registerUser({ name, email, password }) {
  await connectDB();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    provider: 'credentials',
    role: getRoleForEmail(email),
    isVerified: false,
    verifyOtp: otp,
    verifyOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
  });

  try {
    await sendOtpEmail(newUser.email, otp, 'verify');
  } catch (err) {
    console.log('[DEV] Email sending failed:', err.message);
  }

  return {
    id: newUser._id,
    name: newUser.name,
    email: newUser.email,
  };
}

async function verifyEmailOtp(email, otp) {
  await connectDB();

  const user = await User.findOne({ email });
  if (!user || !user.verifyOtp) {
    throw new Error('Invalid or expired OTP');
  }

  if (user.verifyOtp !== otp) {
    throw new Error('Invalid or expired OTP');
  }

  if (user.verifyOtpExpiry.getTime() < Date.now()) {
    throw new Error('OTP has expired. Please request a new one');
  }

  user.isVerified = true;
  user.verifyOtp = null;
  user.verifyOtpExpiry = null;
  await user.save();

  return { message: 'Email verified successfully' };
}

async function resendVerificationOtp(email) {
  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  if (user.isVerified) {
    throw new Error('This account is already verified');
  }

  const otp = generateOtp();
  user.verifyOtp = otp;
  user.verifyOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  try {
    await sendOtpEmail(user.email, otp, 'verify');
  } catch (err) {
    console.log('[DEV] Email sending failed:', err.message);
  }

  return { message: 'Verification code sent' };
}

async function loginUser({ email, password }) {
  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Email or password is incorrect');
  }

  // Check if account is currently locked
  if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
    const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    throw new Error(`Too many failed attempts. Try again in ${minutesLeft} minute(s).`);
  }

  if (user.provider === 'google' && !user.password) {
    throw new Error('This account uses Google Sign-In. Please continue with Google.');
  }
  if (user.isSuspended) {
    throw new Error('Your account has been suspended. Contact support for help.');
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.failedLoginAttempts = 0;
      await user.save();
      throw new Error('Too many failed attempts. Your account is locked for 15 minutes.');
    }

    await user.save();
    const attemptsLeft = MAX_ATTEMPTS - user.failedLoginAttempts;
    throw new Error(`Email or password is incorrect. ${attemptsLeft} attempt(s) left.`);
  }

  // Correct password — reset lock state
  user.failedLoginAttempts = 0;
  user.lockUntil = null;

  if (!user.isVerified) {
    await user.save();
    throw new Error('NEEDS_VERIFICATION');
  }

  if (user.twoFAEnabled) {
    const otp = generateOtp();
    user.loginOtp = otp;
    user.loginOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendOtpEmail(user.email, otp, 'login');
    } catch (err) {
      console.log('[DEV] Email sending failed:', err.message);
    }

    return { requiresTwoFA: true, email: user.email };
  }

  user.lastLogin = new Date();
  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function verifyLoginOtp(email, otp) {
  await connectDB();

  const user = await User.findOne({ email });
  if (!user || !user.loginOtp) {
    throw new Error('Invalid or expired code');
  }

  if (user.loginOtp !== otp) {
    throw new Error('Invalid or expired code');
  }

  if (user.loginOtpExpiry.getTime() < Date.now()) {
    throw new Error('Code has expired. Please login again');
  }

  user.loginOtp = null;
  user.loginOtpExpiry = null;
  user.lastLogin = new Date();
  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function loginOrRegisterGoogleUser({ email, name, profileImage }) {
  await connectDB();

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      provider: 'google',
      role: getRoleForEmail(email),
      profileImage: profileImage || '',
      isVerified: true,
      lastLogin: new Date(),
    });
  } else {
    user.lastLogin = new Date();
    await user.save();
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function changePassword(userId, oldPassword, newPassword) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (!user.password) {
    throw new Error('This account uses Google Sign-In and has no password set');
  }

  const isCorrect = await bcrypt.compare(oldPassword, user.password);
  if (!isCorrect) {
    throw new Error('Current password is incorrect');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return { message: 'Password changed successfully' };
}

async function requestPasswordResetOtp(email) {
  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    return { message: 'If this email exists, an OTP has been sent' };
  }

  const otp = generateOtp();
  user.resetOtp = otp;
  user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  try {
    await sendOtpEmail(user.email, otp, 'reset');
  } catch (err) {
    console.log('[DEV] Email sending failed:', err.message);
  }

  return { message: 'If this email exists, an OTP has been sent' };
}

async function resetPasswordWithOtp(email, otp, newPassword) {
  await connectDB();

  const user = await User.findOne({ email });
  if (!user || !user.resetOtp || !user.resetOtpExpiry) {
    throw new Error('Invalid or expired OTP');
  }

  if (user.resetOtp !== otp) {
    throw new Error('Invalid or expired OTP');
  }

  if (user.resetOtpExpiry.getTime() < Date.now()) {
    throw new Error('OTP has expired. Please request a new one');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetOtp = null;
  user.resetOtpExpiry = null;
  await user.save();

  return { message: 'Password reset successful' };
}

async function toggleTwoFA(userId, enable) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.twoFAEnabled = enable;
  await user.save();

  return { message: enable ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled' };
}

async function requestDeleteOtp(userId) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const otp = generateOtp();
  user.deleteOtp = otp;
  user.deleteOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  try {
    await sendOtpEmail(user.email, otp, 'reset');
  } catch (err) {
    console.log('[DEV] Email sending failed:', err.message);
  }

  return { message: 'A verification code has been sent to your email' };
}

async function deleteAccount(userId, { password, otp }) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.provider === 'google' && !user.password) {
    // Google-linked account — verify via email OTP, never via password
    if (!otp) {
      throw new Error('Verification code is required to delete your account');
    }
    if (!user.deleteOtp || user.deleteOtp !== otp) {
      throw new Error('Invalid or expired verification code');
    }
    if (user.deleteOtpExpiry.getTime() < Date.now()) {
      throw new Error('Verification code has expired. Please request a new one');
    }
  } else {
    // Credentials account — verify via password
    if (!password) {
      throw new Error('Password is required to delete your account');
    }
    const isCorrect = await bcrypt.compare(password, user.password);
    if (!isCorrect) {
      throw new Error('Incorrect password');
    }
  }

  await User.findByIdAndDelete(userId);

  return { message: 'Account deleted successfully' };
}

module.exports = {
  registerUser,
  verifyEmailOtp,
  resendVerificationOtp,
  loginUser,
  verifyLoginOtp,
  loginOrRegisterGoogleUser,
  changePassword,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
  toggleTwoFA,
  deleteAccount,
  requestDeleteOtp,
};