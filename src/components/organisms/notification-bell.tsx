import { Bell, CheckCheck, ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useNotifications } from '@/providers/notification-provider'
import { cn } from '@/lib/utils'

const notificationTone = {
  info: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  error: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  system: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
}

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isLoading,
    errorMessage,
    actionPending,
    page,
    pages,
    search,
    setSearch,
    setPage,
    markRead,
    markAllRead,
    removeNotification,
  } = useNotifications()

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button aria-label="Notifications" className="relative" size="icon" type="button" variant="glass">
              <Bell />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      <SheetContent className="w-full overflow-y-auto sm:max-w-[440px]">
        <SheetTitle>Notifications</SheetTitle>
        <SheetDescription>
          Real-time alerts for administrators and system operators.
        </SheetDescription>

        <div className="mt-5 flex items-center gap-2">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-2xl border border-border bg-background/75 pl-9 pr-3 text-sm font-medium outline-none ring-ring transition placeholder:text-muted-foreground focus:ring-2"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notifications"
              value={search}
            />
          </label>
          <Button disabled={unreadCount === 0 || actionPending} onClick={markAllRead} type="button" variant="glass">
            <CheckCheck />
            Read
          </Button>
        </div>

        <div className="mt-5 space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => <Skeleton className="h-28" key={index} />)
          ) : errorMessage ? (
            <div className="rounded-[20px] border border-rose-500/30 bg-rose-500/10 p-6 text-center text-sm font-semibold text-rose-700 dark:text-rose-300">
              {errorMessage}
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-border bg-muted/35 p-8 text-center text-sm font-semibold text-muted-foreground">
              No notifications found.
            </div>
          ) : (
            notifications.map((notification) => (
              <article
                className={cn(
                  'rounded-[20px] border border-border/70 bg-background/70 p-4 shadow-soft',
                  !notification.isRead && 'border-primary/30 bg-primary/5',
                )}
                key={notification._id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={notificationTone[notification.type]}>{notification.type}</Badge>
                      {!notification.isRead && <Badge className="bg-primary/10 text-primary">Unread</Badge>}
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-foreground">{notification.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.message}</p>
                    <p className="mt-3 text-xs font-semibold text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()} by {notification.sender.name}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    {!notification.isRead && (
                      <Button
                        aria-label={`Mark ${notification.title} as read`}
                        disabled={actionPending}
                        onClick={() => markRead(notification._id)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <CheckCheck />
                      </Button>
                    )}
                    <Button
                      aria-label={`Delete ${notification.title}`}
                      disabled={actionPending}
                      onClick={() => removeNotification(notification._id)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <Button disabled={page <= 1} onClick={() => setPage(page - 1)} type="button" variant="glass">
            <ChevronLeft />
            Previous
          </Button>
          <p className="text-sm font-semibold text-muted-foreground">
            Page {page} of {pages}
          </p>
          <Button disabled={page >= pages} onClick={() => setPage(page + 1)} type="button" variant="glass">
            Next
            <ChevronRight />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
