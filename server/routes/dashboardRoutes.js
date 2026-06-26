import { Router } from 'express'

import {
  getDashboardActivityController,
  getDashboardChartsController,
  getDashboardSummaryController,
} from '../controllers/dashboardController.js'
import { requireAuthenticated } from '../middleware/requestContext.js'

export const dashboardRouter = Router()

dashboardRouter.use(requireAuthenticated)
dashboardRouter.get('/summary', getDashboardSummaryController)
dashboardRouter.get('/charts', getDashboardChartsController)
dashboardRouter.get('/activity', getDashboardActivityController)
