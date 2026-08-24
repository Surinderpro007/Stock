const User = require('../models/User');
const connectDB = require('../config/db');
const { isValidPhoneNumber } = require('libphonenumber-js');

async function getProfile(userId) {
  await connectDB();

  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new Error('User nahi mila');
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    countryCode: user.countryCode || '+91',
    mobile: user.mobile,
    profileImage: user.profileImage,
    dob: user.dob,
    createdAt: user.createdAt,
    twoFAEnabled: user.twoFAEnabled,
    role: user.role,
    provider: user.provider,
  };
}

async function updateProfile(userId, { mobile, countryCode, profileImage, dob }) {
  await connectDB();

  const updateData = {};

  if (mobile !== undefined) {
    if (mobile === '') {
      updateData.mobile = '';
    } else {
      const cc = countryCode || '+91';
      const fullNumber = `${cc}${mobile}`;

      if (!isValidPhoneNumber(fullNumber)) {
        throw new Error('Enter a valid mobile number for the selected country');
      }

      updateData.mobile = mobile.trim();
      updateData.countryCode = cc;
    }
  }

  if (profileImage !== undefined) updateData.profileImage = profileImage;
  if (dob !== undefined) updateData.dob = dob === '' ? null : dob;

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
  }).select('-password');

  if (!user) {
    throw new Error('User nahi mila');
  }


   return {
    id: user._id,
    name: user.name,
    email: user.email,
    countryCode: user.countryCode || '+91',
    mobile: user.mobile,
    profileImage: user.profileImage,
    dob: user.dob,
    createdAt: user.createdAt,
    twoFAEnabled: user.twoFAEnabled,
    role: user.role,
    provider: user.provider,
  };
}

module.exports = { getProfile, updateProfile };