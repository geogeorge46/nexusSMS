import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error', 'system'],
      default: 'info',
      index: true,
    },
    recipient: {
      userId: { type: String, trim: true, default: '' },
      role: {
        type: String,
        enum: ['Admin', 'Super Admin', 'Teacher', 'Staff', 'Student', 'Parent'],
        required: true,
        index: true,
      },
    },
    sender: {
      userId: { type: String, trim: true, default: 'system' },
      name: { type: String, trim: true, default: 'Nexus System' },
      role: { type: String, trim: true, default: 'System' },
    },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
)

notificationSchema.index({ 'recipient.role': 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ 'recipient.userId': 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ title: 'text', message: 'text' })

export const Notification = mongoose.model('Notification', notificationSchema)
