import { Search, SlidersHorizontal } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'

import { AttendanceStatusChip } from '@/components/molecules/attendance-status-chip'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { AttendanceData } from '@/hooks/use-attendance'

const statuses = ['All', 'Present', 'Late', 'Absent', 'Excused']
const grades = ['All', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']

export function AttendanceHistory({
  data,
  isLoading,
}: {
  data?: AttendanceData
  isLoading: boolean
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [grade, setGrade] = useState('All')
  const deferredQuery = useDeferredValue(query)

  const records = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase()

    return (data?.history ?? []).filter((record) => {
      const matchesQuery = [record.student, record.course, record.id].join(' ').toLowerCase().includes(normalized)
      const matchesStatus = status === 'All' || record.status === status
      const matchesGrade = grade === 'All' || record.grade === grade

      return matchesQuery && matchesStatus && matchesGrade
    })
  }, [data?.history, deferredQuery, grade, status])

  return (
    <Card>
      <CardHeader className="gap-4">
        <div>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Filter attendance records by student, course, grade, and status.</CardDescription>
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_160px]">
          <label className="relative">
            <span className="sr-only">Search attendance history</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-12 w-full rounded-[18px] border border-border bg-background/75 pl-11 pr-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-ring"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search student, course, record..."
              type="search"
              value={query}
            />
          </label>
          <FilterSelect label="Status" onChange={setStatus} options={statuses} value={status} />
          <FilterSelect label="Grade" onChange={setGrade} options={grades} value={grade} />
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
                className="grid gap-3 border-b border-border/70 p-4 last:border-b-0 lg:grid-cols-[1fr_180px_120px_120px]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{record.student}</p>
                  <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{record.course}</p>
                </div>
                <p className="self-center text-sm font-semibold text-muted-foreground">{record.date}</p>
                <p className="self-center text-sm font-bold text-foreground">{record.checkIn}</p>
                <div className="self-center">
                  <AttendanceStatusChip status={record.status} />
                </div>
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
