export interface StatsResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
}

export interface CachedStats<T> {
  data: T
  timestamp: Date
  expiresAt: Date
}

export interface StatsPeriod {
  label: string
  days: number
  key: string
}

export const STATS_PERIODS: StatsPeriod[] = [
  { label: '7 derniers jours', days: 7, key: '7d' },
  { label: '30 derniers jours', days: 30, key: '30d' },
  { label: '90 derniers jours', days: 90, key: '90d' },
  { label: 'Toute la période', days: 0, key: 'all' }
]