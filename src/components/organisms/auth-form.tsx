import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap, Loader2, LockKeyhole, Mail, UserRound } from 'lucide-react'

import { BrandMark } from '@/components/atoms/brand-mark'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

type AuthMode = 'login' | 'signup'

export function AuthForm({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, signup } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Admin' as 'Admin' | 'Super Admin',
  })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')

    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password })
      } else {
        await signup(form)
      }

      const redirectTo =
        typeof location.state === 'object' &&
        location.state !== null &&
        'from' in location.state &&
        typeof location.state.from === 'object' &&
        location.state.from !== null &&
        'pathname' in location.state.from &&
        typeof location.state.from.pathname === 'string'
          ? location.state.from.pathname
          : '/'

      navigate(redirectTo, { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Authentication failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4">
      <GlassCard className="w-full max-w-md p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <BrandMark />
          <div className="grid size-12 place-items-center rounded-[18px] bg-primary/10 text-primary">
            <GraduationCap className="size-5" aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground">
          {mode === 'login' ? 'Welcome back' : 'Create admin account'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {mode === 'login'
            ? 'Sign in to manage students, courses, attendance, and operations.'
            : 'Create the first Nexus administrator for this deployment.'}
        </p>

        <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          {mode === 'signup' && (
            <Field
              icon={UserRound}
              label="Name"
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              placeholder="Campus Admin"
              value={form.name}
            />
          )}
          <Field
            icon={Mail}
            label="Email"
            onChange={(value) => setForm((current) => ({ ...current, email: value }))}
            placeholder="admin@nexus.edu"
            type="email"
            value={form.email}
          />
          <Field
            icon={LockKeyhole}
            label="Password"
            onChange={(value) => setForm((current) => ({ ...current, password: value }))}
            placeholder="Use a strong password"
            type="password"
            value={form.password}
          />
          {mode === 'signup' && (
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Role</span>
              <select
                className="h-11 w-full rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold text-foreground outline-none ring-ring focus:ring-2"
                onChange={(event) =>
                  setForm((current) => ({ ...current, role: event.target.value as 'Admin' | 'Super Admin' }))
                }
                value={form.role}
              >
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </label>
          )}

          {error && (
            <p className="rounded-2xl bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
              {error}
            </p>
          )}

          <Button className="w-full" disabled={pending} type="submit">
            {pending ? <Loader2 className="animate-spin" /> : <LockKeyhole />}
            {pending ? 'Please wait' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {mode === 'signup' && (
          <p className="mt-5 text-center text-sm font-medium text-muted-foreground">
            Already have an account?
            {/* TODO: Move account lifecycle actions into a protected Admin Management module. */}
          </p>
        )}
      </GlassCard>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  icon: typeof Mail
  label: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
  value: string
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-11 w-full rounded-2xl border border-border bg-background/75 pl-10 pr-3 text-sm font-semibold text-foreground outline-none ring-ring transition placeholder:text-muted-foreground focus:ring-2"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          value={value}
        />
      </span>
    </label>
  )
}
