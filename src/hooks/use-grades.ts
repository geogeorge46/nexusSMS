import { useQuery } from '@tanstack/react-query'

import grades from '@/data/grades.json'

export type GradeData = typeof grades
export type GradeStatus = GradeData['grades'][number]['status']

const wait = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration))

export function useGrades() {
  return useQuery({
    queryKey: ['grades'],
    queryFn: async (): Promise<GradeData> => {
      await wait(440)
      return grades
    },
  })
}
