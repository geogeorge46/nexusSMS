import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, trim: true, index: true },
    role: {
      type: String,
      enum: ['Admin', 'Super Admin'],
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'LOGIN',
        'LOGOUT',
        'STUDENT_CREATE',
        'STUDENT_UPDATE',
        'STUDENT_DELETE',
        'COURSE_CREATE',
        'COURSE_UPDATE',
        'COURSE_DELETE',
        'SETTINGS_CHANGE',
        'REPORT_EXPORT',
        'DOCUMENT_UPLOAD',
        'DOCUMENT_DELETE',
        'NOTIFICATION_CREATE',
        'NOTIFICATION_DELETE',
      ],
      required: true,
      index: true,
    },
    module: {
      type: String,
      enum: ['Auth', 'Students', 'Courses', 'Settings', 'Reports', 'Documents', 'Notifications'],
      required: true,
      index: true,
    },
    description: { type: String, required: true, trim: true },
    ipAddress: { type: String, trim: true, default: '' },
    browser: { type: String, trim: true, default: 'Unknown' },
    device: { type: String, trim: true, default: 'Unknown' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
)

auditLogSchema.index({ user: 'text', description: 'text', action: 'text', module: 'text' })
auditLogSchema.index({ role: 1, module: 1, timestamp: -1 })

export const AuditLog = mongoose.model('AuditLog', auditLogSchema)
