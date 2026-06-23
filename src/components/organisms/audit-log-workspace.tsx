import { ChevronLeft, ChevronRight, Download, FileSpreadsheet, Search, ShieldCheck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  fallbackAuditLogs,
  fetchAuditLogs,
  getAuditExportUrl,
  type AuditFilters,
  type AuditLog,
} from '@/lib/audit-logs'

const roles = ['All', 'Admin', 'Super Admin']
const actions = [
  'All',
  'LOGIN',
  'LOGOUT',
  'STUDENT_CREATE',
  'STUDENT_UPDATE',
  'STUDENT_DELETE',
  'COURSE_CREATE',
  'COURSE_UPDATE',
  'COURSE_DELETE',
  'SETTINGS_CHANGE',
  'REPORT_EXPORT',
  'DOCUMENT_UPLOAD',
  'DOCUMENT_DELETE',
  'NOTIFICATION_CREATE',
  'NOTIFICATION_DELETE',
]
const modules = ['All', 'Auth', 'Students', 'Courses', 'Settings', 'Reports', 'Documents', 'Notifications']

export function AuditLogWorkspace() {
  const [filters, setFilters] = useState<AuditFilters>({
    search: '',
    role: 'All',
    action: 'All',
    module: 'All',
    page: 1,
  })

  const auditQuery = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => fetchAuditLogs(filters),
    retry: 1,
  })

  const data = auditQuery.data ?? fallbackAuditLogs
  const summary = useMemo(
    () => ({
      total: data.pagination.total,
      security: data.items.filter((item) => item.module === 'Auth' || item.module === 'Settings').length,
      exports: data.items.filter((item) => item.action === 'REPORT_EXPORT').length,
      superAdmin: data.items.filter((item) => item.role === 'Super Admin').length,
    }),
    [data.items, data.pagination.total],
  )

  function updateFilters(next: Partial<AuditFilters>) {
    setFilters((current) => ({ ...current, ...next, page: next.page ?? 1 }))
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AuditMetric label="Events" value={String(summary.total)} />
        <AuditMetric label="Security" value={String(summary.security)} />
        <AuditMetric label="Exports" value={String(summary.exports)} />
        <AuditMetric label="Super Admin" value={String(summary.superAdmin)} />
      </section>

      <GlassCard className="p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Audit Trail</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Admin-only timeline for authentication, CRUD, settings, document, notification, and export activity.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant="glass">
              <a href={getAuditExportUrl(filters, 'csv')}>
                <Download />
                CSV
              </a>
            </Button>
            <Button asChild type="button" variant="glass">
              <a href={getAuditExportUrl(filters, 'excel')}>
                <FileSpreadsheet />
                Excel
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_220px_180px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-2xl border border-border bg-background/75 pl-9 pr-3 text-sm font-medium outline-none ring-ring transition placeholder:text-muted-foreground focus:ring-2"
              onChange={(event) => updateFilters({ search: event.target.value })}
              placeholder="Search audit logs"
              value={filters.search}
            />
          </label>
          <FilterSelect
            label="Role"
            onChange={(role) => updateFilters({ role })}
            options={roles}
            value={filters.role}
          />
          <FilterSelect
            label="Action"
            onChange={(action) => updateFilters({ action })}
            options={actions}
            value={filters.action}
          />
          <FilterSelect
            label="Module"
            onChange={(module) => updateFilters({ module })}
            options={modules}
            value={filters.module}
          />
        </div>

        <div className="mt-5 overflow-hidden rounded-[20px] border border-border/70">
          {auditQuery.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton className="h-16" key={index} />
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-muted-foreground">
              No audit logs found.
            </div>
          ) : (
            data.items.map((log) => <AuditLogRow key={log._id} log={log} />)
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <Button
            disabled={filters.page <= 1}
            onClick={() => updateFilters({ page: filters.page - 1 })}
            type="button"
            variant="glass"
          >
            <ChevronLeft />
            Previous
          </Button>
          <p className="text-sm font-semibold text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.pages}
          </p>
          <Button
            disabled={filters.page >= data.pagination.pages}
            onClick={() => updateFilters({ page: filters.page + 1 })}
            type="button"
            variant="glass"
          >
            Next
            <ChevronRight />
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}

function AuditLogRow({ log }: { log: AuditLog }) {
  return (
    <article className="grid gap-3 border-b border-border/70 bg-background/60 p-4 last:border-b-0 xl:grid-cols-[180px_180px_160px_1fr_160px]">
      <div>
        <p className="text-sm font-bold text-foreground">{log.user}</p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">{log.role}</p>
      </div>
      <div className="flex flex-wrap gap-2 xl:block">
        <Badge>{log.action}</Badge>
        <p className="mt-2 text-xs font-semibold text-muted-foreground xl:mt-2">{log.module}</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{log.browser}</p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">{log.device}</p>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{log.description}</p>
      <div className="xl:text-right">
        <p className="text-xs font-bold text-foreground">{new Date(log.timestamp).toLocaleDateString()}</p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">
          {new Date(log.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </article>
  )
}

function AuditMetric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>{label}</CardTitle>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className="grid size-12 place-items-center rounded-[18px] bg-primary/10 text-primary">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Tracked with immutable server-side context.</p>
      </CardContent>
    </Card>
  )
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: string) => void
  options: string[]
  value: string
}) {
  return (
    <label className="sr-only">
      {label}
      <select
        className="not-sr-only h-10 w-full rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold text-foreground outline-none ring-ring focus:ring-2"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
