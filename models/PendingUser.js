// models/PendingUser.js
// Temporary holding place for signups that have NOT completed OTP verification yet.
// A real User document is only created once the OTP is verified (see authController.js).
// If the OTP is never verified, the document auto-deletes when otpExpiry passes (TTL index).

const mongoose = require('mongoose');

const pendingUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    otpExpiry: {
      type: Date,
      required: true,
      expires: 0, // TTL index: MongoDB auto-deletes this doc once otpExpiry time is reached
    },
  },
  { timestamps: true }
);

const PendingUser = mongoose.models.PendingUser || mongoose.model('PendingUser', pendingUserSchema);

module.exports = PendingUser;