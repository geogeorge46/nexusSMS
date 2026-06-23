import { getAuditContext } from '../middleware/auditMiddleware.js'
import {
  createNotification,
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService.js'
import { createAuditLog } from '../services/auditLogService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await listNotifications({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    isRead: req.query.isRead,
    role: req.user.role,
  })

  res.json(result)
})

export const postNotification = asyncHandler(async (req, res) => {
  const notification = await createNotification({
    title: req.body.title,
    message: req.body.message,
    type: req.body.type,
    recipient: {
      role: req.body.recipientRole,
      userId: req.body.recipientUserId,
    },
    sender: {
      userId: req.user.id,
      name: req.user.name,
      role: req.user.role,
    },
  })

  await createAuditLog({
    ...getAuditContext(req),
    action: 'NOTIFICATION_CREATE',
    module: 'Notifications',
    description: `Created notification: ${notification.title}`,
    metadata: { notificationId: notification._id },
  })

  res.status(201).json(notification)
})

export const patchNotificationRead = asyncHandler(async (req, res) => {
  const notification = await markNotificationRead(req.params.notificationId)
  res.json(notification)
})

export const patchAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await markAllNotificationsRead(req.user.role)
  res.json(result)
})

export const removeNotification = asyncHandler(async (req, res) => {
  const result = await deleteNotification(req.params.notificationId)

  await createAuditLog({
    ...getAuditContext(req),
    action: 'NOTIFICATION_DELETE',
    module: 'Notifications',
    description: `Deleted notification ${req.params.notificationId}`,
    metadata: { notificationId: req.params.notificationId },
  })

  res.json(result)
})
