const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const AuditLog = require('../models/AuditLog');
const connectDB = require('../config/db');
const { sendOtpEmail } = require('../lib/email');
const { ensureWallet } = require('../services/walletService');

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const DELETE_GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Records self-service account actions (deactivate/delete/cancel) to the same
// audit log the admin panel already shows, so a permanent record survives
// even if the account itself is later deleted.
async function logSelfAction(user, action, details) {
  try {
    await AuditLog.create({
      adminId: user._id,
      adminName: user.name,
      action,
      targetUserId: user._id,
      targetUserEmail: user.email,
      details,
    });
  } catch (err) {
    console.log('[DEV] Audit log failed:', err.message);
  }
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
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  // Overwrite any earlier incomplete signup attempt for this email
  const pendingUser = await PendingUser.findOneAndUpdate(
    { email },
    { name, email, password: hashedPassword, otp, otpExpiry },
    { upsert: true, new: true }
  );

  try {
    await sendOtpEmail(pendingUser.email, otp, 'verify');
  } catch (err) {
    console.log('[DEV] Email sending failed:', err.message);
  }

  return {
    name: pendingUser.name,
    email: pendingUser.email,
  };
}

async function verifyEmailOtp(email, otp) {
  await connectDB();

  const pendingUser = await PendingUser.findOne({ email });
  if (!pendingUser) {
    throw new Error('Invalid or expired OTP');
  }

  if (pendingUser.otp !== otp) {
    throw new Error('Invalid or expired OTP');
  }

  if (pendingUser.otpExpiry.getTime() < Date.now()) {
    throw new Error('OTP has expired. Please request a new one');
  }

  const createdUser = await User.create({
    name: pendingUser.name,
    email: pendingUser.email,
    password: pendingUser.password,
    provider: 'credentials',
    role: getRoleForEmail(pendingUser.email),
    isVerified: true,
  });

  await ensureWallet(createdUser._id);

  await PendingUser.deleteOne({ email });

  return { message: 'Email verified successfully' };
}

async function resendVerificationOtp(email) {
  await connectDB();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('This account is already verified');
  }

  const pendingUser = await PendingUser.findOne({ email });
  if (!pendingUser) {
    throw new Error('No pending registration found for this email. Please register again.');
  }

  const otp = generateOtp();
  pendingUser.otp = otp;
  pendingUser.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await pendingUser.save();

  try {
    await sendOtpEmail(pendingUser.email, otp, 'verify');
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

  if (user.isDeactivated) {
    throw new Error('Your account has been deactivated. Contact support to reactivate it.');
  }

    if (user.pendingDeletion && user.deletedByAdmin) {
    throw new Error('Your account has been deleted by an administrator. Contact support for help.');
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

   if (user.pendingDeletion && !user.deletedByAdmin) {
    if (user.deletionScheduledAt && user.deletionScheduledAt.getTime() <= Date.now()) {
      // Grace period already passed — finalize the deletion now
      await logSelfAction(user, 'DELETE_FINALIZED', 'Account permanently deleted after the 30-day grace period');
      await User.findByIdAndDelete(user._id);
      throw new Error('This account has been deleted.');
    }

    // Still within the 30-day window — logging back in cancels the deletion
    user.pendingDeletion = false;
    user.deletionScheduledAt = null;
    await logSelfAction(user, 'DELETE_CANCELLED', 'User logged back in before the scheduled deletion date; deletion cancelled');
  }

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
    await ensureWallet(user._id);
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
  throw new Error('No account found with this email address.');
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

async function requestDeleteOtp(userId, password) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Credentials accounts must prove their password before an OTP is even sent
  if (user.provider === 'credentials') {
    if (!password) {
      throw new Error('Password is required');
    }
    const isCorrect = await bcrypt.compare(password, user.password);
    if (!isCorrect) {
      throw new Error('Incorrect password');
    }
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
const EMAIL_CHANGE_VERIFY_WINDOW_MS = 15 * 60 * 1000; // must finish step 2 within 15 min of verifying step 1

// Step 1: send an OTP to the CURRENT email
async function requestCurrentEmailOtp(userId) {
  await connectDB();
  

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const otp = generateOtp();
  user.emailChangeOtp = otp;
  user.emailChangeOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  // starting over — clear any earlier progress
  user.emailChangeVerifiedAt = null;
  user.pendingNewEmail = null;
  user.newEmailOtp = null;
  user.newEmailOtpExpiry = null;
  await user.save();

  try {
    await sendOtpEmail(user.email, otp, await sendOtpEmail(user.email, otp, 'email_change_current'));
  } catch (err) {
    console.log('[DEV] Email sending failed:', err.message);
  }

  return { message: 'A verification code has been sent to your current email' };
}

// Step 2: verify that OTP — unlocks the "enter new email" step
async function verifyCurrentEmailOtp(userId, otp) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (!user.emailChangeOtp || user.emailChangeOtp !== otp) {
    throw new Error('Invalid or expired verification code');
  }

  if (user.emailChangeOtpExpiry.getTime() < Date.now()) {
    throw new Error('Verification code has expired. Please request a new one');
  }

  user.emailChangeOtp = null;
  user.emailChangeOtpExpiry = null;
  user.emailChangeVerifiedAt = new Date();
  await user.save();

  return { message: 'Current email verified' };
}

// Step 3: send an OTP to the NEW email — only allowed once step 1+2 are done
async function requestNewEmailOtp(userId, newEmail) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (
    !user.emailChangeVerifiedAt ||
    Date.now() - user.emailChangeVerifiedAt.getTime() > EMAIL_CHANGE_VERIFY_WINDOW_MS
  ) {
    throw new Error('Please verify your current email again before continuing');
  }

  if (!newEmail) {
    throw new Error('New email is required');
  }

  const normalizedEmail = newEmail.trim().toLowerCase();

  if (normalizedEmail === user.email) {
    throw new Error('This is already your current email');
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error('This email is already in use by another account');
  }

  const otp = generateOtp();
  user.newEmailOtp = otp;
  user.newEmailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  user.pendingNewEmail = normalizedEmail;
  await user.save();

  try {
    await sendOtpEmail(normalizedEmail, otp, 'email_change_new');
  } catch (err) {
    console.log('[DEV] Email sending failed:', err.message);
  }

  return { message: 'A verification code has been sent to your new email' };
}

// Step 4: verify the NEW email OTP and finally apply the change
async function changeEmail(userId, newEmail, otp) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (
    !user.emailChangeVerifiedAt ||
    Date.now() - user.emailChangeVerifiedAt.getTime() > EMAIL_CHANGE_VERIFY_WINDOW_MS
  ) {
    throw new Error('Session expired. Please start the email change again');
  }

  if (!user.newEmailOtp || user.newEmailOtp !== otp) {
    throw new Error('Invalid or expired verification code');
  }

  if (user.newEmailOtpExpiry.getTime() < Date.now()) {
    throw new Error('Verification code has expired. Please request a new one');
  }

  const normalizedEmail = newEmail.trim().toLowerCase();

  // The email submitted here must match the one the second OTP was actually sent to
  if (!user.pendingNewEmail || user.pendingNewEmail !== normalizedEmail) {
    throw new Error('This code was not issued for this email address. Please request a new one');
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error('This email is already in use by another account');
  }

  user.email = normalizedEmail;
  user.emailChangeOtp = null;
  user.emailChangeOtpExpiry = null;
  user.emailChangeVerifiedAt = null;
  user.newEmailOtp = null;
  user.newEmailOtpExpiry = null;
  user.pendingNewEmail = null;
  await user.save();

  return { message: 'Email updated successfully', email: user.email };
}
async function deleteAccount(userId, otp) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Password (for credentials accounts) was already verified in requestDeleteOtp.
  // Both account types now confirm deletion via the emailed OTP.
  if (!otp) {
    throw new Error('Verification code is required to delete your account');
  }
  if (!user.deleteOtp || user.deleteOtp !== otp) {
    throw new Error('Invalid or expired verification code');
  }
  if (user.deleteOtpExpiry.getTime() < Date.now()) {
    throw new Error('Verification code has expired. Please request a new one');
  }

  const scheduledAt = new Date(Date.now() + DELETE_GRACE_PERIOD_MS);

  user.pendingDeletion = true;
  user.deletionScheduledAt = scheduledAt;
  user.deleteOtp = null;
  user.deleteOtpExpiry = null;
  await user.save();

  await logSelfAction(
    user,
    'DELETE_REQUESTED',
    `Account scheduled for deletion on ${scheduledAt.toDateString()}. Logging in before then cancels the deletion.`
  );

  return {
    message: 'Your account is scheduled for deletion in 30 days. Log in again before then to cancel it.',
  };
}

async function deactivateAccount(userId, password) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.provider === 'credentials') {
    if (!password) {
      throw new Error('Password is required to deactivate your account');
    }
    const isCorrect = await bcrypt.compare(password, user.password);
    if (!isCorrect) {
      throw new Error('Incorrect password');
    }
  }

  user.isDeactivated = true;
  await user.save();

  await logSelfAction(user, 'SELF_DEACTIVATE', 'User deactivated their own account');

  return { message: 'Your account has been deactivated' };
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
  verifyCurrentEmailOtp,
  toggleTwoFA,
  deleteAccount,
  requestDeleteOtp,
  requestCurrentEmailOtp,
  changeEmail,
  deactivateAccount,
  requestNewEmailOtp
};