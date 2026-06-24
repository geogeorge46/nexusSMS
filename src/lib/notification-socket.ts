import type { Socket } from 'socket.io-client'

let activeNotificationSocket: Socket | null = null

export function setNotificationSocket(socket: Socket) {
  activeNotificationSocket = socket
}

export function disconnectNotificationSocket() {
  activeNotificationSocket?.disconnect()
  activeNotificationSocket = null
}
