import { getDashboardActivity, getDashboardCharts, getDashboardSummary } from '../services/dashboardService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const send = (loader) => asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'private, max-age=15, stale-while-revalidate=30')
  res.json(await loader(req.user))
})

export const getDashboardSummaryController = send(getDashboardSummary)
export const getDashboardChartsController = send(getDashboardCharts)
export const getDashboardActivityController = send(getDashboardActivity)
