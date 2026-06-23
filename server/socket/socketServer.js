import { Server } from 'socket.io'

import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { verifyAuthToken } from '../services/authTokenService.js'

let io

export function initializeSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.allowedOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token

      if (token) {
        const payload = verifyAuthToken(token)
        const user = await User.findById(payload.sub).select('role status').lean()

        if (user?.status === 'Active') {
          socket.data.user = {
            id: user._id.toString(),
            role: user.role,
          }
          next()
          return
        }
      }

      if (env.allowDemoAuth && !env.isProduction) {
        const role = socket.handshake.auth?.role || socket.handshake.query?.role || 'Admin'
        const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId || 'demo-admin'

        socket.data.user = {
          id: userId,
          role,
        }
        next()
        return
      }

      next(new Error('Authentication required'))
    } catch {
      next(new Error('Authentication required'))
    }
  })

  io.on('connection', (socket) => {
    socket.join(`role:${socket.data.user.role}`)
    socket.join(`user:${socket.data.user.id}`)

    socket.emit('notification:connected', {
      connected: true,
      role: socket.data.user.role,
    })
  })

  return io
}

export function emitNotification(notification) {
  if (!io) return

  io.to(`role:${notification.recipient.role}`).emit('notification:new', notification)

  if (notification.recipient.userId) {
    io.to(`user:${notification.recipient.userId}`).emit('notification:new', notification)
  }
}
