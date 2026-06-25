import { Router } from 'express'

import {
  getDashboardActivityController,
  getDashboardChartsController,
  getDashboardSummaryController,
} from '../controllers/dashboardController.js'
import { requireAdmin } from '../middleware/requestContext.js'

export const dashboardRouter = Router()

dashboardRouter.use(requireAdmin)
dashboardRouter.get('/summary', getDashboardSummaryController)
dashboardRouter.get('/charts', getDashboardChartsController)
dashboardRouter.get('/activity', getDashboardActivityController)
