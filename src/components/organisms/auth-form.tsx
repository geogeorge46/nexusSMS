import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap, Loader2, LockKeyhole, Mail } from 'lucide-react'

import { BrandMark } from '@/components/atoms/brand-mark'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

export function AuthForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      await login(form)
      const redirectTo = typeof location.state === 'object'
        && location.state !== null
        && 'from' in location.state
        && typeof location.state.from === 'object'
        && location.state.from !== null
        && 'pathname' in location.state.from
        && typeof location.state.from.pathname === 'string'
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
          <div className="grid size-12 place-items-center rounded-[18px] bg-primary/10 text-primary"><GraduationCap className="size-5" /></div>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in to manage students, courses, attendance, and operations.</p>
        <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <Field icon={Mail} label="Email" onChange={(email) => setForm((current) => ({ ...current, email }))} placeholder="admin@nexus.edu" type="email" value={form.email} />
          <Field icon={LockKeyhole} label="Password" onChange={(password) => setForm((current) => ({ ...current, password }))} placeholder="Use your secure password" type="password" value={form.password} />
          {error && <p className="rounded-2xl bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>}
          <Button className="w-full" disabled={pending} type="submit">{pending ? <Loader2 className="animate-spin" /> : <LockKeyhole />}{pending ? 'Please wait' : 'Sign In'}</Button>
        </form>
      </GlassCard>
    </div>
  )
}

function Field({ icon: Icon, label, onChange, placeholder, type, value }: { icon: typeof Mail; label: string; onChange: (value: string) => void; placeholder: string; type: string; value: string }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <span className="relative block"><Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="h-11 w-full rounded-2xl border border-border bg-background/75 pl-10 pr-3 text-sm font-semibold text-foreground outline-none ring-ring focus:ring-2" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value} /></span>
    </label>
  )
}
