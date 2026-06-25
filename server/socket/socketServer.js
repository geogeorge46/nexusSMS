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

export function emitNotificationEvent(event, notification, payload = notification) {
  if (!io) return

  if (notification.recipient.userId) {
    io.to(`user:${notification.recipient.userId}`).emit(event, payload)
    return
  }

  io.to(`role:${notification.recipient.role}`).emit(event, payload)
}

export function emitUserNotificationEvent(event, user, payload) {
  if (!io) return

  io.to(`role:${user.role}`).to(`user:${user.id}`).emit(event, payload)
}
