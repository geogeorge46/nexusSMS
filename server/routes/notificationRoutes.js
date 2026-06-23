import { Router } from 'express'

import {
  getNotifications,
  patchAllNotificationsRead,
  patchNotificationRead,
  postNotification,
  removeNotification,
} from '../controllers/notificationController.js'
import { requireAdmin, requireSuperAdmin } from '../middleware/requestContext.js'

export const notificationRouter = Router()

notificationRouter.get('/', requireAdmin, getNotifications)
notificationRouter.post('/', requireSuperAdmin, postNotification)
notificationRouter.patch('/read-all', requireAdmin, patchAllNotificationsRead)
notificationRouter.patch('/:notificationId/read', requireAdmin, patchNotificationRead)
notificationRouter.delete('/:notificationId', requireAdmin, removeNotification)
