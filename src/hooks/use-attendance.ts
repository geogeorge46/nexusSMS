import { useQuery } from '@tanstack/react-query'

import attendance from '@/data/attendance.json'

export type AttendanceData = typeof attendance
export type AttendanceStatus = AttendanceData['history'][number]['status']

const wait = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration))

export function useAttendance() {
  return useQuery({
    queryKey: ['attendance'],
    queryFn: async (): Promise<AttendanceData> => {
      await wait(460)
      return attendance
    },
  })
}
