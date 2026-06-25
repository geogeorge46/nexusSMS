import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'

import {
  deleteNotification,
  fetchNotifications,
  getNotificationErrorMessage,
  markAllNotificationsRead,
  markNotificationRead,
  type NexusNotification,
} from '@/lib/notifications'
import { disconnectNotificationSocket, setNotificationSocket } from '@/lib/notification-socket'
import { useAuth } from '@/hooks/use-auth'

type Toast = {
  id: string
  title: string
  message: string
  type: NexusNotification['type']
}

type NotificationContextValue = {
  notifications: NexusNotification[]
  unreadCount: number
  page: number
  pages: number
  search: string
  isLoading: boolean
  errorMessage: string
  actionPending: boolean
  toasts: Toast[]
  setPage: (page: number) => void
  setSearch: (search: string) => void
  markRead: (notificationId: string) => void
  markAllRead: () => void
  removeNotification: (notificationId: string) => void
  dismissToast: (toastId: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)
const emptyNotificationData = {
  items: [],
  unreadCount: 0,
  pagination: { page: 1, limit: 8, total: 0, pages: 1 },
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { token, user } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])

  const notificationsQuery = useQuery({
    queryKey: ['notifications', page, search],
    queryFn: () => fetchNotifications({ page, search }),
    enabled: Boolean(token),
    retry: 1,
  })

  const data = notificationsQuery.data ?? emptyNotificationData

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const pushToast = useCallback((notification: NexusNotification) => {
    const id = `${notification._id}-${Date.now()}`
    setToasts((current) => [
      {
        id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
      },
      ...current.slice(0, 2),
    ])

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4500)
  }, [])

  useEffect(() => {
    if (!token) return undefined

    createNotificationSocket(token, queryClient, pushToast)

    return () => {
      disconnectNotificationSocket()
    }
  }, [pushToast, queryClient, token, user?.id, user?.role])

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications: data.items,
      unreadCount: data.unreadCount,
      page,
      pages: data.pagination.pages,
      search,
      isLoading: notificationsQuery.isLoading,
      errorMessage: notificationsQuery.error
        ? getNotificationErrorMessage(notificationsQuery.error)
        : markReadMutation.error || markAllMutation.error || deleteMutation.error
          ? getNotificationErrorMessage(markReadMutation.error ?? markAllMutation.error ?? deleteMutation.error)
          : '',
      actionPending: markReadMutation.isPending || markAllMutation.isPending || deleteMutation.isPending,
      toasts,
      setPage,
      setSearch(value) {
        setSearch(value)
        setPage(1)
      },
      markRead(notificationId) {
        markReadMutation.mutate(notificationId)
      },
      markAllRead() {
        markAllMutation.mutate()
      },
      removeNotification(notificationId) {
        deleteMutation.mutate(notificationId)
      },
      dismissToast(toastId) {
        setToasts((current) => current.filter((toast) => toast.id !== toastId))
      },
    }),
    [
      data.items,
      data.pagination.pages,
      data.unreadCount,
      deleteMutation,
      markAllMutation,
      markReadMutation,
      notificationsQuery.error,
      notificationsQuery.isLoading,
      page,
      search,
      toasts,
    ],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToasts />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }

  return context
}

function createNotificationSocket(
  token: string,
  queryClient: QueryClient,
  onNotification: (notification: NexusNotification) => void,
) {
  disconnectNotificationSocket()

  const socketUrl = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000'
  const socket: Socket = io(socketUrl, {
    autoConnect: true,
    transports: ['websocket'],
    auth: {
      token,
    },
  })

  setNotificationSocket(socket)

  socket.on('notification:new', (notification: NexusNotification) => {
    onNotification(notification)
    void queryClient.invalidateQueries({ queryKey: ['notifications'] })
  })

  for (const event of ['notification:read', 'notification:all-read', 'notification:delete']) {
    socket.on(event, () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    })
  }

  return socket
}

function NotificationToasts() {
  const { toasts, dismissToast } = useNotifications()

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 grid w-[min(360px,calc(100vw-2rem))] gap-3">
      {toasts.map((toast) => (
        <div
          className="pointer-events-auto rounded-[18px] border border-white/45 bg-white/85 p-4 shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/85"
          key={toast.id}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground">{toast.title}</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{toast.message}</p>
            </div>
            <button
              className="rounded-xl px-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => dismissToast(toast.id)}
              type="button"
            >
              x
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
