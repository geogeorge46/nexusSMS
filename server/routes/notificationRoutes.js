import { Router } from 'express'

import {
  getNotifications,
  patchAllNotificationsRead,
  patchNotificationRead,
  postNotification,
  removeNotification,
} from '../controllers/notificationController.js'
import { requireAuthenticated, requireSuperAdmin } from '../middleware/requestContext.js'

export const notificationRouter = Router()

notificationRouter.get('/', requireAuthenticated, getNotifications)
notificationRouter.post('/', requireSuperAdmin, postNotification)
notificationRouter.patch('/read-all', requireAuthenticated, patchAllNotificationsRead)
notificationRouter.patch('/:notificationId/read', requireAuthenticated, patchNotificationRead)
notificationRouter.delete('/:notificationId', requireAuthenticated, removeNotification)
