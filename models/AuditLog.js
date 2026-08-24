const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adminName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g. 'ROLE_CHANGE', 'SUSPEND', 'UNSUSPEND', 'DELETE_USER'
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    targetUserEmail: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;