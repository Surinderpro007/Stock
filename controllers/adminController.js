const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const connectDB = require('../config/db');

async function getAllUsers({ search = '', page = 1, limit = 15, sortBy = 'joined' }) {
  await connectDB();

  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const skip = (page - 1) * limit;

  const matchStage = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  // roleRank: Super Admin = 0, Admin = 1, User = 2 — always applied first
  const addRankStage = {
    $addFields: {
      roleRank: {
        $switch: {
          branches: [
            { case: { $eq: [{ $toLower: '$email' }, adminEmail] }, then: 0 },
            { case: { $eq: ['$role', 'admin'] }, then: 1 },
          ],
          default: 2,
        },
      },
      statusRank: {
        $switch: {
          branches: [
            { case: { $eq: ['$isSuspended', true] }, then: 2 },
            { case: { $eq: ['$isVerified', false] }, then: 1 },
          ],
          default: 0, // Active
        },
      },
    },
  };

    let sortStage = { roleRank: 1, createdAt: -1 };
  if (sortBy === 'name') {
    sortStage = { roleRank: 1, name: 1 };
  } else if (sortBy === 'status') {
    sortStage = { roleRank: 1, statusRank: 1, createdAt: -1 };
  } else if (sortBy === 'joined') {
    sortStage = { roleRank: 1, createdAt: -1 };
  }

  const pipeline = [
    { $match: matchStage },
    addRankStage,
    { $sort: sortStage },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              password: 0,
              verifyOtp: 0,
              resetOtp: 0,
              loginOtp: 0,
              deleteOtp: 0,
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
  ];

  const result = await User.aggregate(pipeline);
  const users = result[0].data;
  const total = result[0].totalCount[0]?.count || 0;

  return { users, total, page, totalPages: Math.ceil(total / limit) };
}

async function getUserById(userId) {
  await connectDB();

  const user = await User.findById(userId).select('-password -verifyOtp -resetOtp -loginOtp');
  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

async function logAction({ adminId, adminName, action, targetUserId, targetUserEmail, details }) {
  await AuditLog.create({ adminId, adminName, action, targetUserId, targetUserEmail, details });
}

function isSuperAdmin(user) {
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  return user.email.toLowerCase() === adminEmail;
}

async function updateUserRole(admin, targetUserId, newRole) {
  await connectDB();

  if (String(admin._id) === targetUserId) {
    throw new Error('You cannot change your own role');
  }

  if (!['user', 'admin'].includes(newRole)) {
    throw new Error('Invalid role');
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw new Error('User not found');
  }

  if (isSuperAdmin(user)) {
    throw new Error('This account is the Super Admin and cannot be modified');
  }

  const oldRole = user.role;
  user.role = newRole;
  await user.save();

  await logAction({
    adminId: admin._id,
    adminName: admin.name,
    action: 'ROLE_CHANGE',
    targetUserId: user._id,
    targetUserEmail: user.email,
    details: `Role changed from ${oldRole} to ${newRole}`,
  });

  return { message: `Role updated to ${newRole}` };
}

async function toggleSuspendUser(admin, targetUserId, suspend) {
  await connectDB();

  if (String(admin._id) === targetUserId) {
    throw new Error('You cannot suspend your own account');
  }

    const user = await User.findById(targetUserId);
  if (!user) {
    throw new Error('User not found');
  }

  if (isSuperAdmin(user)) {
    throw new Error('This account is the Super Admin and cannot be modified');
  }

  user.isSuspended = suspend;
  await user.save();

  await logAction({
    adminId: admin._id,
    adminName: admin.name,
    action: suspend ? 'SUSPEND' : 'UNSUSPEND',
    targetUserId: user._id,
    targetUserEmail: user.email,
    details: suspend ? 'User account suspended' : 'User account unsuspended',
  });

  return { message: suspend ? 'User suspended' : 'User unsuspended' };
}

async function deleteUserByAdmin(admin, targetUserId) {
  await connectDB();

  if (String(admin._id) === targetUserId) {
    throw new Error('You cannot delete your own account from here');
  }

    const user = await User.findById(targetUserId);
  if (!user) {
    throw new Error('User not found');
  }

  if (isSuperAdmin(user)) {
    throw new Error('This account is the Super Admin and cannot be deleted');
  }

  const targetEmail = user.email;
  await User.findByIdAndDelete(targetUserId);

  await logAction({
    adminId: admin._id,
    adminName: admin.name,
    action: 'DELETE_USER',
    targetUserId,
    targetUserEmail: targetEmail,
    details: 'User account permanently deleted',
  });

  return { message: 'User deleted successfully' };
}

async function getAuditLogs({ page = 1, limit = 20 }) {
  await connectDB();

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(),
  ]);

  return { logs, total, page, totalPages: Math.ceil(total / limit) };
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleSuspendUser,
  deleteUserByAdmin,
  getAuditLogs,
};