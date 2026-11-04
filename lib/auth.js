const jwt = require('jsonwebtoken');
const { cookies } = require('next/headers');
const connectDB = require('../config/db');
const User = require('../models/User');
const { httpError } = require('./apiError');

function isBlockedAccount(user) {
  return (
    !user ||
    user.isSuspended ||
    user.isDeactivated ||
    (user.pendingDeletion && user.deletedByAdmin)
  );
}

async function getTokenUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return null;
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }

  await connectDB();
  const user = await User.findById(decoded.id).select(
    'name email role isSuspended isDeactivated pendingDeletion deletedByAdmin'
  );

  if (isBlockedAccount(user)) {
    return null;
  }

  return user;
}

async function requireUser() {
  const user = await getTokenUser();

  if (!user) {
    throw httpError('Please log in to get full access', 401);
  }

  return user;
}

async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== 'admin') {
    throw httpError('Forbidden: Admins only', 403);
  }

  return user;
}

module.exports = {
  getTokenUser,
  requireUser,
  requireAdmin,
};
