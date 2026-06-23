import { Router } from 'express'

import { exportAuditLogs, getAuditLogs } from '../controllers/auditLogController.js'
import { requireAdmin } from '../middleware/requestContext.js'

export const auditLogRouter = Router()

auditLogRouter.get('/', requireAdmin, getAuditLogs)
auditLogRouter.get('/export', requireAdmin, exportAuditLogs)
