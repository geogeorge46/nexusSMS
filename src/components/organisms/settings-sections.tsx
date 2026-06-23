import { Bell, Brush, Monitor, Moon, Sun, UserRound } from 'lucide-react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import type { InsightsData } from '@/hooks/use-insights'
import { useTheme } from '@/providers/theme-provider'

type ProfileForm = {
  name: string
  email: string
  role: string
  institution: string
}

export function ProfileSettings({ data }: { data?: InsightsData }) {
  const { register, handleSubmit } = useForm<ProfileForm>({
    values: data?.settings.profile ?? {
      name: '',
      email: '',
      role: '',
      institution: '',
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Workspace identity and administrator profile details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit(() => undefined)}>
          <Field label="Name" registration={register('name')} />
          <Field label="Email" registration={register('email')} type="email" />
          <Field label="Role" registration={register('role')} />
          <Field label="Institution" registration={register('institution')} />
          <div className="md:col-span-2">
            <Button type="submit">
              <UserRound />
              Save Profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Settings</CardTitle>
        <CardDescription>Choose how Nexus adapts across light, dark, and system preferences.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Light', value: 'light', icon: Sun },
          { label: 'Dark', value: 'dark', icon: Moon },
          { label: 'System', value: 'system', icon: Monitor },
        ].map((option) => {
          const Icon = option.icon
          const active = theme === option.value

          return (
            <button
              key={option.value}
              className={`rounded-[20px] border p-4 text-left transition ${
                active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/35 text-foreground'
              }`}
              onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
              type="button"
            >
              <Icon className="size-5" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold">{option.label}</p>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function ToggleSettings({
  title,
  description,
  icon: Icon,
  items,
}: {
  title: string
  description: string
  icon: typeof Bell
  items?: Array<{ label: string; description: string; enabled: boolean }>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items?.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 rounded-[20px] border border-border/70 bg-muted/35 p-4">
            <div className="flex gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{item.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <Switch aria-label={`Toggle ${item.label}`} defaultChecked={item.enabled} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export const notificationIcon = Bell
export const appearanceIcon = Brush

function Field({
  label,
  registration,
  type = 'text',
}: {
  label: string
  registration: UseFormRegisterReturn
  type?: string
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <input
        className="h-12 w-full rounded-[18px] border border-border bg-background/75 px-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-ring"
        type={type}
        {...registration}
      />
    </label>
  )
}
