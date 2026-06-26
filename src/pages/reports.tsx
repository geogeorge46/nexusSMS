import { Download, FileSpreadsheet, FileText, Send, ShieldCheck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { PageHeader } from '@/components/molecules/page-header'
import { ReportsTable } from '@/components/organisms/reports-table'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  downloadReport,
  fetchReport,
  getReportErrorMessage,
  type ReportFilters,
  type ReportFormat,
  type ReportType,
} from '@/lib/reports-api'
import { useAuth } from '@/hooks/use-auth'
import { canUseAcademicTools, isAdmin } from '@/lib/permissions'

const initialFilters: ReportFilters = {
  dateFrom: '',
  dateTo: '',
  department: 'All',
  course: 'All',
  semester: 'All',
  student: 'All',
  status: 'All',
  page: 1,
}
const metricIcons = [FileText, ShieldCheck, Send, FileSpreadsheet]

export function ReportsPage() {
  const [type, setType] = useState<ReportType>('students')
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)
  const [exporting, setExporting] = useState<ReportFormat | null>(null)
  const [exportError, setExportError] = useState('')
  const { user } = useAuth()
  const allowedTypes: ReportType[] = canUseAcademicTools(user)
    ? ['students', 'attendance', 'grades', 'courses']
    : ['students', 'courses']
  const canExport = isAdmin(user)
  const reportQuery = useQuery({
    queryKey: ['reports', type, filters],
    queryFn: () => fetchReport(type, filters),
    retry: 1,
  })

  function updateFilters(next: Partial<ReportFilters>) {
    setFilters((current) => ({ ...current, ...next, page: next.page ?? 1 }))
  }

  function changeType(nextType: ReportType) {
    setType(allowedTypes.includes(nextType) ? nextType : allowedTypes[0])
    setFilters(initialFilters)
    setExportError('')
  }

  async function runExport(format: ReportFormat) {
    setExporting(format)
    setExportError('')
    try {
      await downloadReport(type, format, filters)
    } catch (error) {
      setExportError(getReportErrorMessage(error))
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Reports Center"
        description="Generate, review, and export student management reports for enrollment, attendance, grades, and course planning."
        actions={canExport ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={Boolean(exporting)} onClick={() => void runExport('pdf')} type="button" variant="glass">
              <FileText />
              {exporting === 'pdf' ? 'Exporting...' : 'PDF Export'}
            </Button>
            <Button disabled={Boolean(exporting)} onClick={() => void runExport('excel')} type="button">
              <FileSpreadsheet />
              {exporting === 'excel' ? 'Exporting...' : 'Excel Export'}
            </Button>
            <Button disabled={Boolean(exporting)} onClick={() => void runExport('csv')} type="button" variant="glass">
              <Download />
              {exporting === 'csv' ? 'Exporting...' : 'CSV'}
            </Button>
          </div>
        ) : undefined}
      />

      {exportError && (
        <p className="rounded-[18px] bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
          {exportError}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reportQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)
        ) : reportQuery.data ? (
          reportQuery.data.metrics.map((metric, index) => (
            <SummaryCard
              icon={metricIcons[index] ?? FileText}
              key={metric.label}
              label={metric.label}
              value={String(metric.value)}
            />
          ))
        ) : (
          ['Records', 'Status', 'Coverage', 'Exports'].map((label, index) => (
            <SummaryCard icon={metricIcons[index] ?? FileText} key={label} label={label} value="--" />
          ))
        )}
      </section>

      <ReportsTable
        data={reportQuery.data}
        errorMessage={reportQuery.isError ? getReportErrorMessage(reportQuery.error) : ''}
        filters={filters}
        isLoading={reportQuery.isLoading}
        onFiltersChange={updateFilters}
        onTypeChange={changeType}
        type={type}
        allowedTypes={allowedTypes}
      />
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) {
  return (
    <GlassCard className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      </div>
      <div className="grid size-12 place-items-center rounded-[18px] bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
    </GlassCard>
  )
}
