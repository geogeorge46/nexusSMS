import cors from 'cors'
import compression from 'compression'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'

import { env } from './config/env.js'
import { getDatabaseHealth } from './config/db.js'
import { requestLogStream } from './config/logger.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { attachRequestContext } from './middleware/requestContext.js'
import { auditLogRouter } from './routes/auditLogRoutes.js'
import { adminRouter } from './routes/adminRoutes.js'
import { attendanceRouter } from './routes/attendanceRoutes.js'
import { authRouter } from './routes/authRoutes.js'
import { catalogRouter } from './routes/catalogRoutes.js'
import { courseRouter } from './routes/courseRoutes.js'
import { dashboardRouter } from './routes/dashboardRoutes.js'
import { gradeRouter } from './routes/gradeRoutes.js'
import { feeRouter } from './routes/feeRoutes.js'
import { examRouter } from './routes/examRoutes.js'
import { lmsRouter } from './routes/lmsRoutes.js'
import { notificationRouter } from './routes/notificationRoutes.js'
import { parentPortalRouter } from './routes/parentPortalRoutes.js'
import { reportRouter } from './routes/reportRoutes.js'
import { studentDocumentRouter } from './routes/studentDocumentRoutes.js'
import { studentImportRouter } from './routes/studentImportRoutes.js'
import { studentPortalRouter } from './routes/studentPortalRoutes.js'
import { studentRouter } from './routes/studentRoutes.js'
import { timetableRouter } from './routes/timetableRoutes.js'

export const app = express()

if (env.trustProxy) {
  app.set('trust proxy', 1)
}

app.disable('x-powered-by')
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: env.isProduction
      ? {
          useDefaults: true,
          directives: {
            'connect-src': ["'self'", ...env.allowedOrigins],
            'img-src': ["'self'", 'data:', 'https://res.cloudinary.com'],
          },
        }
      : false,
  }),
)
app.use(compression())
app.use(morgan(env.isProduction ? 'combined' : 'dev', { stream: requestLogStream }))
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Origin not allowed by CORS'))
    },
    credentials: true,
  }),
)
app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(attachRequestContext)

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/ready', (_req, res) => {
  const database = getDatabaseHealth()
  const ready = database.status === 'connected'

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not-ready',
    database,
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/auth', authRouter)
app.use('/api/admins', adminRouter)
app.use('/api/catalog', catalogRouter)
app.use('/api/student-portal', studentPortalRouter)
app.use('/api/portal', studentPortalRouter)
app.use('/api/parent-portal', parentPortalRouter)
app.use('/api/students/import', studentImportRouter)
app.use('/api/students', studentRouter)
app.use('/api/courses', courseRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/attendance', attendanceRouter)
app.use('/api/grades', gradeRouter)
app.use('/api/fees', feeRouter)
app.use('/api/exams', examRouter)
app.use('/api/lms', lmsRouter)
app.use('/api/timetable', timetableRouter)
app.use('/api/documents', studentDocumentRouter)
app.use('/api/notifications', notificationRouter)
app.use('/api/reports', reportRouter)
app.use('/api/audit-logs', auditLogRouter)

app.use(notFound)
app.use(errorHandler)
