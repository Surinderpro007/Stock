const User = require('../models/User');
const connectDB = require('../config/db');
const { ensureWallet } = require('../services/walletService');
const { roundMoney } = require('../lib/money');
const { httpError } = require('../lib/apiError');
const { isValidPhoneNumber } = require('libphonenumber-js');

async function getProfile(userId) {
  await connectDB();

  const user = await User.findById(userId).select('-password').lean();
  if (!user) {
    throw httpError('User not found', 404);
  }

  const wallet = await ensureWallet(userId);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    countryCode: user.countryCode || '+91',
    mobile: user.mobile,
    profileImage: user.profileImage,
    dob: user.dob,
    balance: roundMoney(wallet.balance),
    createdAt: user.createdAt,
    twoFAEnabled: user.twoFAEnabled,
    role: user.role,
    provider: user.provider,
  };
}

async function updateProfile(userId, { name, mobile, countryCode, profileImage, dob }) {
  await connectDB();

  const updateData = {};

  if (name !== undefined && name.trim()) {
    updateData.name = name.trim();
  }

  if (mobile !== undefined) {
    if (mobile === '') {
      updateData.mobile = '';
    } else {
      const cc = countryCode || '+91';
      const fullNumber = `${cc}${mobile}`;

      if (!isValidPhoneNumber(fullNumber)) {
        throw httpError('Enter a valid mobile number for the selected country', 400);
      }

      updateData.mobile = mobile.trim();
      updateData.countryCode = cc;
    }
  }

  if (profileImage !== undefined) updateData.profileImage = profileImage;
  if (dob !== undefined) updateData.dob = dob === '' ? null : dob;

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
  }).select('-password').lean();

  if (!user) {
    throw httpError('User not found', 404);
  }

  const wallet = await ensureWallet(userId);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    countryCode: user.countryCode || '+91',
    mobile: user.mobile,
    profileImage: user.profileImage,
    dob: user.dob,
    balance: roundMoney(wallet.balance),
    createdAt: user.createdAt,
    twoFAEnabled: user.twoFAEnabled,
    role: user.role,
    provider: user.provider,
  };
}

module.exports = {
  getProfile,
  updateProfile,
};
