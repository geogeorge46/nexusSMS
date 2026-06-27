import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getStudentPortalErrorMessage, useMarkStudentPortalNotificationRead, useStudentPortalNotifications } from '@/hooks/use-student-portal'

export function NotificationsPage() {
  const notificationsQuery = useStudentPortalNotifications()
  const markRead = useMarkStudentPortalNotificationRead()
  const notifications = notificationsQuery.data?.items ?? []
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0
  const errorMessage = notificationsQuery.error || markRead.error
    ? getStudentPortalErrorMessage(notificationsQuery.error ?? markRead.error)
    : ''

  return (
    <div className="space-y-5">
      <GlassCard className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">Notifications</Badge>
            <h1 className="text-3xl font-bold tracking-normal text-foreground">{unreadCount} unread</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Messages and alerts sent to your account.</p>
          </div>
        </div>
      </GlassCard>

      {errorMessage && (
        <div className="rounded-[18px] border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-3">
        {notificationsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton className="h-28" key={index} />)
        ) : notifications.length ? (
          notifications.map((notification) => (
            <GlassCard className="p-5" key={notification._id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{notification.type}</Badge>
                    {!notification.isRead && <Badge className="bg-primary/10 text-primary">Unread</Badge>}
                  </div>
                  <h2 className="mt-3 text-base font-bold text-foreground">{notification.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.message}</p>
                  <p className="mt-3 text-xs font-medium text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
                  <div className="flex gap-2">
                    {!notification.isRead && (
                    <Button disabled={markRead.isPending} onClick={() => markRead.mutate(notification._id)} size="sm" type="button" variant="glass">
                      Read
                    </Button>
                  )}
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <GlassCard className="p-8 text-center">
            <p className="text-lg font-bold text-foreground">No notifications</p>
            <p className="mt-2 text-sm text-muted-foreground">New messages will appear here.</p>
          </GlassCard>
        )}
      </div>
    </div>
  )
}
