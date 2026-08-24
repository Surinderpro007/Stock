// models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
      minlength: 6,
    },
    provider: {
      type: String,
      enum: ['credentials', 'google'],
      default: 'credentials',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
        countryCode: {
      type: String,
      default: '+91',
    },
    mobile: {
      type: String,
      default: '',
    },
    profileImage: {
      type: String,
      default: '',
    },
    dob: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    resetOtp: {
      type: String,
      default: null,
    },
    resetOtpExpiry: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifyOtp: {
      type: String,
      default: null,
    },
    verifyOtpExpiry: {
      type: Date,
      default: null,
    },
    twoFAEnabled: {
      type: Boolean,
      default: false,
    },
    loginOtp: {
      type: String,
      default: null,
    },
    loginOtpExpiry: {
      type: Date,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    deleteOtp: {
      type: String,
      default: null,
    },
    deleteOtpExpiry: {
      type: Date,
      default: null,
    },
    
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;