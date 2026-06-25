import { Notification } from '../models/Notification.js'
import { emitNotificationEvent, emitUserNotificationEvent } from '../socket/socketServer.js'

export async function listNotifications(filters = {}) {
  const page = Math.max(Number(filters.page ?? 1), 1)
  const limit = Math.min(Math.max(Number(filters.limit ?? 10), 1), 50)
  const audienceQuery = buildAudienceQuery(filters.user)
  const query = { ...audienceQuery }

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
    Notification.countDocuments({ ...audienceQuery, isRead: false }),
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
  emitNotificationEvent('notification:new', serialized)
  return serialized
}

export async function markNotificationRead(notificationId, user) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, ...buildAudienceQuery(user) },
    { isRead: true },
    { new: true },
  ).lean()

  if (!notification) {
    const error = new Error('Notification not found')
    error.statusCode = 404
    throw error
  }

  emitNotificationEvent('notification:read', notification)
  return notification
}

export async function markAllNotificationsRead(user) {
  const result = await Notification.updateMany(
    { ...buildAudienceQuery(user), isRead: false },
    { isRead: true },
  )
  const payload = { modifiedCount: result.modifiedCount }
  emitUserNotificationEvent('notification:all-read', user, payload)
  return payload
}

export async function deleteNotification(notificationId, user) {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    ...buildAudienceQuery(user),
  }).lean()

  if (!notification) {
    const error = new Error('Notification not found')
    error.statusCode = 404
    throw error
  }

  const result = { id: notificationId }
  emitNotificationEvent('notification:delete', notification, result)
  return result
}

function buildAudienceQuery(user) {
  return {
    $or: [
      { 'recipient.userId': user.id },
      { 'recipient.userId': '', 'recipient.role': user.role },
    ],
  }
}
