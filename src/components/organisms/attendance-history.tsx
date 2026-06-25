import { Search, SlidersHorizontal, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getAttendanceErrorMessage,
  useDeleteAttendance,
  useUpdateAttendance,
  type AttendanceData,
  type AttendanceFilters,
  type AttendanceRecord,
  type AttendanceStatus,
} from '@/hooks/use-attendance'

const statuses = ['All', 'Present', 'Late', 'Absent', 'Excused']
const departments = ['All', 'Engineering', 'Science', 'Business', 'Arts', 'Humanities']

export function AttendanceHistory({
  data,
  filters,
  isLoading,
  onFiltersChange,
}: {
  data?: AttendanceData
  filters: AttendanceFilters
  isLoading: boolean
  onFiltersChange: (filters: Partial<AttendanceFilters>) => void
}) {
  const records = data?.history ?? []
  const updateAttendance = useUpdateAttendance()
  const deleteAttendance = useDeleteAttendance()

  async function updateStatus(record: AttendanceRecord, status: string) {
    try {
      await updateAttendance.mutateAsync({
        attendanceId: record.id,
        payload: { status: status as AttendanceStatus },
      })
    } catch (caught) {
      window.alert(getAttendanceErrorMessage(caught))
    }
  }

  async function removeRecord(record: AttendanceRecord) {
    if (!window.confirm(`Delete attendance for ${record.student} on ${record.date}?`)) return

    try {
      await deleteAttendance.mutateAsync(record.id)
    } catch (caught) {
      window.alert(getAttendanceErrorMessage(caught))
    }
  }

  return (
    <Card>
      <CardHeader className="gap-4">
        <div>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Filter attendance records by student, course, grade, and status.</CardDescription>
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px_160px_160px]">
          <label className="relative">
            <span className="sr-only">Search attendance history</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-12 w-full rounded-[18px] border border-border bg-background/75 pl-11 pr-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-ring"
              onChange={(event) => onFiltersChange({ student: event.target.value })}
              placeholder="Search student, course, record..."
              type="search"
              value={filters.student}
            />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by course</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-12 w-full rounded-[18px] border border-border bg-background/75 pl-11 pr-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-ring"
              onChange={(event) => onFiltersChange({ course: event.target.value || 'All' })}
              placeholder="Filter course..."
              type="search"
              value={filters.course === 'All' ? '' : filters.course}
            />
          </label>
          <input
            aria-label="Filter attendance by date"
            className="h-12 w-full rounded-[18px] border border-border bg-background/75 px-4 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-ring"
            onChange={(event) => onFiltersChange({ date: event.target.value })}
            type="date"
            value={filters.date}
          />
          <FilterSelect label="Status" onChange={(status) => onFiltersChange({ status })} options={statuses} value={filters.status} />
          <FilterSelect
            label="Department"
            onChange={(department) => onFiltersChange({ department })}
            options={departments}
            value={filters.department}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[20px] border border-border/70">
            {records.map((record) => (
              <div
                key={record.id}
                className="grid gap-3 border-b border-border/70 p-4 last:border-b-0 lg:grid-cols-[1fr_150px_110px_150px_44px]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{record.student}</p>
                  <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{record.course}</p>
                </div>
                <p className="self-center text-sm font-semibold text-muted-foreground">{record.date}</p>
                <p className="self-center text-sm font-bold text-foreground">{record.checkIn}</p>
                <label className="self-center">
                  <span className="sr-only">Update status for {record.student}</span>
                  <select
                    className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
                    disabled={updateAttendance.isPending}
                    onChange={(event) => void updateStatus(record, event.target.value)}
                    value={record.status}
                  >
                    {statuses.slice(1).map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <Button
                  aria-label={`Delete attendance for ${record.student}`}
                  disabled={deleteAttendance.isPending}
                  onClick={() => void removeRecord(record)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            {records.length === 0 && (
              <div className="p-8 text-center text-sm font-semibold text-muted-foreground">
                No attendance records match the current filters.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <select
        className="h-12 w-full appearance-none rounded-[18px] border border-border bg-background/75 pl-11 pr-4 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-ring"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}
