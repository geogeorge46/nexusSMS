import { api } from '@/lib/api'
import { getAuthHeaders } from '@/lib/auth-api'

export type UserRole = 'Admin' | 'Super Admin'
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system'

export type NexusNotification = {
  _id: string
  title: string
  message: string
  type: NotificationType
  recipient: {
    userId: string
    role: UserRole
  }
  sender: {
    userId: string
    name: string
    role: string
  }
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export type NotificationListResponse = {
  items: NexusNotification[]
  unreadCount: number
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export async function fetchNotifications(params: {
  page: number
  search: string
  isRead?: boolean
}) {
  const response = await api.get<NotificationListResponse>('/notifications', {
    params: {
      page: params.page,
      limit: 8,
      search: params.search || undefined,
      isRead: params.isRead,
    },
    headers: adminHeaders(),
  })

  return response.data
}

export async function markNotificationRead(notificationId: string) {
  const response = await api.patch<NexusNotification>(
    `/notifications/${notificationId}/read`,
    {},
    { headers: adminHeaders() },
  )

  return response.data
}

export async function markAllNotificationsRead() {
  const response = await api.patch<{ modifiedCount: number }>(
    '/notifications/read-all',
    {},
    { headers: adminHeaders() },
  )

  return response.data
}

export async function deleteNotification(notificationId: string) {
  await api.delete(`/notifications/${notificationId}`, { headers: adminHeaders() })
}

export function adminHeaders() {
  const authHeaders = getAuthHeaders()

  return Object.keys(authHeaders).length > 0
    ? authHeaders
    : {
        'x-user-id': 'demo-admin',
        'x-user-name': 'Campus Admin',
        'x-user-role': 'Super Admin',
      }
}

export const fallbackNotifications: NotificationListResponse = {
  unreadCount: 3,
  pagination: { page: 1, limit: 8, total: 4, pages: 1 },
  items: [
    {
      _id: 'demo-notification-1',
      title: 'Report export completed',
      message: 'The attendance summary export is ready for review.',
      type: 'success',
      recipient: { userId: '', role: 'Admin' },
      sender: { userId: 'system', name: 'Nexus System', role: 'System' },
      isRead: false,
      createdAt: '2026-06-23T09:40:00.000Z',
      updatedAt: '2026-06-23T09:40:00.000Z',
    },
    {
      _id: 'demo-notification-2',
      title: 'Settings changed',
      message: 'Security notification preferences were updated by Super Admin.',
      type: 'warning',
      recipient: { userId: '', role: 'Super Admin' },
      sender: { userId: 'demo-admin', name: 'Campus Admin', role: 'Super Admin' },
      isRead: false,
      createdAt: '2026-06-23T08:30:00.000Z',
      updatedAt: '2026-06-23T08:30:00.000Z',
    },
    {
      _id: 'demo-notification-3',
      title: 'New student record',
      message: 'A student profile was created and is awaiting document verification.',
      type: 'info',
      recipient: { userId: '', role: 'Admin' },
      sender: { userId: 'registrar', name: 'Registrar Office', role: 'Admin' },
      isRead: false,
      createdAt: '2026-06-22T16:05:00.000Z',
      updatedAt: '2026-06-22T16:05:00.000Z',
    },
    {
      _id: 'demo-notification-4',
      title: 'Course capacity alert',
      message: 'Data Structures has reached 92% enrollment capacity.',
      type: 'system',
      recipient: { userId: '', role: 'Admin' },
      sender: { userId: 'system', name: 'Nexus System', role: 'System' },
      isRead: true,
      createdAt: '2026-06-21T12:15:00.000Z',
      updatedAt: '2026-06-21T12:15:00.000Z',
    },
  ],
}
