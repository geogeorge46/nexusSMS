import { logger } from '../config/logger.js'

export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`)
  res.status(404)
  next(error)
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode ?? (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500)

  logger.error(error.message || 'Internal server error', {
    statusCode,
    stack: error.stack,
    details: error.details,
  })

  res.status(statusCode).json({
    message: error.message || 'Internal server error',
    details: error.details,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  })
}
