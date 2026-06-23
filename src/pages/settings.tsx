import { PageHeader } from '@/components/molecules/page-header'
import {
  ToggleSettings,
  ThemeSettings,
  ProfileSettings,
  appearanceIcon,
  notificationIcon,
} from '@/components/organisms/settings-sections'
import { Skeleton } from '@/components/ui/skeleton'
import { useInsights } from '@/hooks/use-insights'

export function SettingsPage() {
  const { data, isLoading } = useInsights()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage profile, theme, notification, and appearance preferences for the Nexus workspace."
      />

      {isLoading ? (
        <div className="grid gap-6">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          <ProfileSettings data={data} />
          <ThemeSettings />
          <section className="grid gap-6 xl:grid-cols-2">
            <ToggleSettings
              description="Control operational alerts and system reminders."
              icon={notificationIcon}
              items={data?.settings.notifications}
              title="Notification Settings"
            />
            <ToggleSettings
              description="Tune visual density, glassmorphism, and accessibility presentation."
              icon={appearanceIcon}
              items={data?.settings.appearance}
              title="Appearance Settings"
            />
          </section>
        </>
      )}
    </div>
  )
}
