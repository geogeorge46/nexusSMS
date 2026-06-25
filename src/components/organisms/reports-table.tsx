import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReportFilters, ReportResponse, ReportType } from '@/lib/reports-api'

const reportTypes: Array<{ value: ReportType; label: string }> = [
  { value: 'students', label: 'Student Reports' },
  { value: 'attendance', label: 'Attendance Reports' },
  { value: 'grades', label: 'Grade Reports' },
  { value: 'courses', label: 'Course Reports' },
]

type ReportsTableProps = {
  data?: ReportResponse
  errorMessage: string
  filters: ReportFilters
  isLoading: boolean
  onFiltersChange: (filters: Partial<ReportFilters>) => void
  onTypeChange: (type: ReportType) => void
  type: ReportType
}

export function ReportsTable({ data, errorMessage, filters, isLoading, onFiltersChange, onTypeChange, type }: ReportsTableProps) {
  const options = data?.filterOptions

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data?.title ?? 'Reports'}</CardTitle>
        <CardDescription>MongoDB-backed operational reports ready for review or export.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ReportSelect label="Report type" onChange={(value) => onTypeChange(value as ReportType)} options={reportTypes} value={type} />
          <ReportSelect label="Department" onChange={(department) => onFiltersChange({ department })} options={selectOptions(options?.departments)} value={filters.department} />
          <ReportSelect label="Course" onChange={(course) => onFiltersChange({ course })} options={options?.courses ?? []} value={filters.course} />
          <ReportSelect label="Semester" onChange={(semester) => onFiltersChange({ semester })} options={selectOptions(options?.semesters)} value={filters.semester} />
          <ReportSelect label="Student" onChange={(student) => onFiltersChange({ student })} options={options?.students ?? []} value={filters.student} />
          <ReportSelect label="Status" onChange={(status) => onFiltersChange({ status })} options={selectOptions(options?.statuses)} value={filters.status} />
          <DateInput label="From date" max={filters.dateTo || undefined} onChange={(dateFrom) => onFiltersChange({ dateFrom })} value={filters.dateFrom} />
          <DateInput label="To date" min={filters.dateFrom || undefined} onChange={(dateTo) => onFiltersChange({ dateTo })} value={filters.dateTo} />
        </div>

        <div className="mt-5 overflow-x-auto rounded-[20px] border border-border/70">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}
            </div>
          ) : errorMessage ? (
            <div className="p-8 text-center text-sm font-semibold text-rose-700 dark:text-rose-300">{errorMessage}</div>
          ) : !data?.rows.length ? (
            <div className="p-8 text-center text-sm font-semibold text-muted-foreground">No report records match the selected filters.</div>
          ) : (
            <div className="min-w-max">
              <div className="grid gap-3 border-b border-border bg-muted/50 px-4 py-3" style={{ gridTemplateColumns: `repeat(${data.columns.length}, minmax(130px, 1fr))` }}>
                {data.columns.map((column) => <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground" key={column.key}>{column.label}</p>)}
              </div>
              {data.rows.map((row) => (
                <div className="grid gap-3 border-b border-border/70 p-4 last:border-b-0" key={String(row.id)} style={{ gridTemplateColumns: `repeat(${data.columns.length}, minmax(130px, 1fr))` }}>
                  {data.columns.map((column, index) => (
                    <div className="flex min-w-0 items-center gap-2" key={column.key}>
                      {index === 0 && <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />}
                      <p className="truncate text-sm font-semibold text-foreground" title={String(row[column.key] ?? '')}>{String(row[column.key] ?? '-')}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <Button disabled={filters.page <= 1 || isLoading} onClick={() => onFiltersChange({ page: filters.page - 1 })} type="button" variant="glass">
            <ChevronLeft /> Previous
          </Button>
          <p className="text-sm font-semibold text-muted-foreground">Page {data?.pagination.page ?? 1} of {data?.pagination.pages ?? 1}</p>
          <Button disabled={isLoading || filters.page >= (data?.pagination.pages ?? 1)} onClick={() => onFiltersChange({ page: filters.page + 1 })} type="button" variant="glass">
            Next <ChevronRight />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ReportSelect({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; value: string }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <select className="h-10 w-full rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold text-foreground outline-none ring-ring focus:ring-2" onChange={(event) => onChange(event.target.value)} value={value}>
        {label !== 'Report type' && <option value="All">All</option>}
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

function DateInput({ label, max, min, onChange, value }: { label: string; max?: string; min?: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <input className="h-10 w-full rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold text-foreground outline-none ring-ring focus:ring-2" max={max} min={min} onChange={(event) => onChange(event.target.value)} type="date" value={value} />
    </label>
  )
}

function selectOptions(values: string[] = []) {
  return values.map((value) => ({ value, label: value }))
}
