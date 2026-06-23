import { useQuery } from '@tanstack/react-query'

import insights from '@/data/insights.json'

export type InsightsData = typeof insights
export type ReportStatus = InsightsData['reports'][number]['status']

const wait = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration))

export function useInsights() {
  return useQuery({
    queryKey: ['insights'],
    queryFn: async (): Promise<InsightsData> => {
      await wait(420)
      return insights
    },
  })
}
