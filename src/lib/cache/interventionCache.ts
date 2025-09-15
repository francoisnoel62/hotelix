import { GlobalStats, TechnicianStats } from '@/lib/services/stats'

interface CacheEntry<T> {
  data: T
  timestamp: Date
  expiresAt: Date
}

interface CacheConfig {
  ttl: number // Time to live en millisecondes
  maxSize: number
}

class InterventionCache {
  private globalStatsCache = new Map<string, CacheEntry<GlobalStats>>()
  private technicianStatsCache = new Map<string, CacheEntry<TechnicianStats>>()
  private config: CacheConfig

  constructor(config: CacheConfig = { ttl: 60000, maxSize: 100 }) {
    this.config = config
  }

  private isExpired<T>(entry: CacheEntry<T>): boolean {
    return new Date() > entry.expiresAt
  }

  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    return `${prefix}:${sortedParams}`
  }

  private cleanup<T>(cache: Map<string, CacheEntry<T>>) {
    if (cache.size > this.config.maxSize) {
      // Supprimer les entrées les plus anciennes
      const entries = Array.from(cache.entries())
        .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime())

      const toDelete = entries.slice(0, entries.length - this.config.maxSize + 10)
      toDelete.forEach(([key]) => cache.delete(key))
    }
  }

  getGlobalStats(hotelId: number, periodDays?: number): GlobalStats | null {
    const key = this.generateKey('global', { hotelId, periodDays })
    const entry = this.globalStatsCache.get(key)

    if (entry && !this.isExpired(entry)) {
      return entry.data
    }

    return null
  }

  setGlobalStats(hotelId: number, periodDays: number | undefined, data: GlobalStats): void {
    const key = this.generateKey('global', { hotelId, periodDays })
    const now = new Date()

    this.globalStatsCache.set(key, {
      data,
      timestamp: now,
      expiresAt: new Date(now.getTime() + this.config.ttl)
    })

    this.cleanup(this.globalStatsCache)
  }

  getTechnicianStats(technicianId: number, periodDays: number): TechnicianStats | null {
    const key = this.generateKey('technician', { technicianId, periodDays })
    const entry = this.technicianStatsCache.get(key)

    if (entry && !this.isExpired(entry)) {
      return entry.data
    }

    return null
  }

  setTechnicianStats(technicianId: number, periodDays: number, data: TechnicianStats): void {
    const key = this.generateKey('technician', { technicianId, periodDays })
    const now = new Date()

    this.technicianStatsCache.set(key, {
      data,
      timestamp: now,
      expiresAt: new Date(now.getTime() + this.config.ttl)
    })

    this.cleanup(this.technicianStatsCache)
  }

  invalidateHotelStats(hotelId: number): void {
    // Invalider tous les stats globaux de cet hôtel
    const keysToDelete: string[] = []

    this.globalStatsCache.forEach((_, key) => {
      if (key.includes(`hotelId:${hotelId}`)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.globalStatsCache.delete(key))
  }

  invalidateTechnicianStats(technicianId: number): void {
    // Invalider tous les stats de ce technicien
    const keysToDelete: string[] = []

    this.technicianStatsCache.forEach((_, key) => {
      if (key.includes(`technicianId:${technicianId}`)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.technicianStatsCache.delete(key))
  }

  invalidateAll(): void {
    this.globalStatsCache.clear()
    this.technicianStatsCache.clear()
  }
}

// Instance singleton
export const interventionCache = new InterventionCache()