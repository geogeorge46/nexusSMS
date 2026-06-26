import { api } from '@/lib/api'
import axios from 'axios'

export type UserRole = 'Admin' | 'Super Admin' | 'Teacher' | 'Staff' | 'Student'
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
  })

  return response.data
}

export async function markNotificationRead(notificationId: string) {
  const response = await api.patch<NexusNotification>(`/notifications/${notificationId}/read`, {})

  return response.data
}

export async function markAllNotificationsRead() {
  const response = await api.patch<{ modifiedCount: number }>('/notifications/read-all', {})

  return response.data
}

export async function deleteNotification(notificationId: string) {
  await api.delete(`/notifications/${notificationId}`)
}

export function getNotificationErrorMessage(caught: unknown) {
  if (axios.isAxiosError<{ message?: string }>(caught)) {
    return caught.response?.data?.message ?? 'Notification request failed'
  }

  return caught instanceof Error ? caught.message : 'Notification request failed'
}
