import { useQuery } from '@tanstack/react-query'

import dashboardData from '@/data/dashboard.json'

export type DashboardData = typeof dashboardData

const wait = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration))

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard-data'],
    queryFn: async (): Promise<DashboardData> => {
      await wait(650)
      return dashboardData
    },
  })
}
