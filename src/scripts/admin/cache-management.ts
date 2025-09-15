// Script pour la gestion du cache (utilisation administrative)
import { interventionCache } from '@/lib/cache/interventionCache'
import { StatsService } from '@/lib/services/stats'

export class CacheManager {
  static async warmupCache(hotelId: number): Promise<void> {
    console.log(`Warming up cache for hotel ${hotelId}...`)

    try {
      // Précalculer les stats globales
      await StatsService.getGlobalStats(hotelId)
      await StatsService.getGlobalStats(hotelId, 7)
      await StatsService.getGlobalStats(hotelId, 30)

      console.log('Cache warmup completed successfully')
    } catch (error) {
      console.error('Cache warmup failed:', error)
    }
  }

  static async clearAllCache(): Promise<void> {
    console.log('Clearing all cache...')
    interventionCache.invalidateAll()
    console.log('Cache cleared successfully')
  }

  static async getCacheStats(): Promise<any> {
    // Implémentation pour obtenir les statistiques du cache
    return {
      size: 'À implémenter',
      hitRate: 'À implémenter',
      missRate: 'À implémenter'
    }
  }
}

// CLI usage
if (require.main === module) {
  const command = process.argv[2]
  const hotelId = parseInt(process.argv[3])

  switch (command) {
    case 'warmup':
      if (hotelId) {
        CacheManager.warmupCache(hotelId)
      } else {
        console.error('Hotel ID required for warmup')
      }
      break
    case 'clear':
      CacheManager.clearAllCache()
      break
    case 'stats':
      CacheManager.getCacheStats().then(console.log)
      break
    default:
      console.log('Usage: node cache-management.js [warmup|clear|stats] [hotelId]')
  }
}