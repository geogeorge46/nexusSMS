import { useQuery } from '@tanstack/react-query'

const summary = {
  students: '2,846',
  attendance: '94.8%',
  courses: '128',
  alerts: '12',
}

export function useSystemSummary() {
  return useQuery({
    queryKey: ['system-summary'],
    queryFn: async () => summary,
  })
}
