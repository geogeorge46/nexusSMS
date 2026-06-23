import { Notification } from '../models/Notification.js'
import { emitNotification } from '../socket/socketServer.js'

export async function listNotifications(filters = {}) {
  const page = Math.max(Number(filters.page ?? 1), 1)
  const limit = Math.min(Math.max(Number(filters.limit ?? 10), 1), 50)
  const query = {
    'recipient.role': filters.role ?? 'Admin',
  }

  if (filters.search) {
    query.$text = { $search: filters.search }
  }

  if (filters.isRead === 'true') query.isRead = true
  if (filters.isRead === 'false') query.isRead = false

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ 'recipient.role': query['recipient.role'], isRead: false }),
  ])

  return {
    items,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(Math.ceil(total / limit), 1),
    },
  }
}

export async function createNotification(payload) {
  const notification = await Notification.create({
    title: payload.title,
    message: payload.message,
    type: payload.type ?? 'info',
    recipient: {
      userId: payload.recipient?.userId ?? '',
      role: payload.recipient?.role ?? 'Admin',
    },
    sender: {
      userId: payload.sender?.userId ?? 'system',
      name: payload.sender?.name ?? 'Nexus System',
      role: payload.sender?.role ?? 'System',
    },
  })

  const serialized = notification.toObject()
  emitNotification(serialized)
  return serialized
}

export async function markNotificationRead(notificationId) {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true },
    { new: true },
  ).lean()

  if (!notification) {
    const error = new Error('Notification not found')
    error.statusCode = 404
    throw error
  }

  return notification
}

export async function markAllNotificationsRead(role) {
  const result = await Notification.updateMany({ 'recipient.role': role, isRead: false }, { isRead: true })
  return { modifiedCount: result.modifiedCount }
}

export async function deleteNotification(notificationId) {
  const notification = await Notification.findByIdAndDelete(notificationId).lean()

  if (!notification) {
    const error = new Error('Notification not found')
    error.statusCode = 404
    throw error
  }

  return { id: notificationId }
}
