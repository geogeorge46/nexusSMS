import { logger } from '../config/logger.js'

export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`)
  res.status(404)
  next(error)
}

export function errorHandler(error, _req, res, _next) {
  const uploadStatusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : error.name === 'MulterError' ? 400 : undefined
  const duplicateStatusCode = error.code === 11000 ? 409 : undefined
  const statusCode = error.statusCode ?? uploadStatusCode ?? duplicateStatusCode ?? (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500)
  const duplicateFields = error.code === 11000 ? Object.keys(error.keyPattern ?? error.keyValue ?? {}) : undefined
  const message = error.code === 11000
    ? `Duplicate record${duplicateFields?.length ? ` for ${duplicateFields.join(', ')}` : ''}`
    : error.message || 'Internal server error'

  logger.error(message, {
    statusCode,
    stack: error.stack,
    details: error.details ?? duplicateFields,
  })

  res.status(statusCode).json({
    message,
    details: error.details ?? duplicateFields,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  })
}
