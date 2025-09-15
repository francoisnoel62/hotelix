import { describe, it, expect, beforeEach } from 'vitest'
import { testPrisma, resetDatabase, seedTestData } from '@/test/db-utils'
import { StatsService } from '@/lib/services/stats'
import { interventionCache } from '@/lib/cache/interventionCache'

describe('Performance Tests', () => {
  beforeEach(async () => {
    await resetDatabase()
    interventionCache.invalidateAll()
  })

  it('should complete stats calculation under 200ms for moderate data', async () => {
    const { hotel } = await seedTestData()

    // Créer un dataset modéré (100 interventions)
    const technicien = await testPrisma.user.create({
      data: {
        email: 'technicien@hotel.com',
        password: 'hashed',
        role: 'TECHNICIEN',
        hotelId: hotel.id
      }
    })

    const zone = await testPrisma.zone.create({
      data: {
        nom: 'Zone Test',
        type: 'CHAMBRE',
        hotelId: hotel.id
      }
    })

    // Créer 100 interventions pour tester la performance
    const interventions = []
    for (let i = 0; i < 100; i++) {
      interventions.push({
        titre: `Intervention ${i}`,
        statut: i % 3 === 0 ? 'EN_COURS' : i % 3 === 1 ? 'EN_ATTENTE' : 'TERMINEE',
        type: 'PLOMBERIE',
        origine: 'STAFF',
        hotelId: hotel.id,
        demandeurId: technicien.id,
        assigneId: technicien.id,
        zoneId: zone.id
      })
    }

    await testPrisma.intervention.createMany({ data: interventions })

    // Mesurer le temps de calcul
    const startTime = Date.now()
    const stats = await StatsService.getGlobalStats(hotel.id)
    const endTime = Date.now()

    const calculationTime = endTime - startTime

    expect(calculationTime).toBeLessThan(200) // Moins de 200ms
    expect(stats.totalInterventions).toBe(100)
  })

  it('should serve cached results significantly faster', async () => {
    const { hotel } = await seedTestData()

    // Premier appel - calcul initial
    const start1 = Date.now()
    const stats1 = await StatsService.getGlobalStats(hotel.id)
    const time1 = Date.now() - start1

    // Deuxième appel - depuis le cache
    const start2 = Date.now()
    const stats2 = await StatsService.getGlobalStats(hotel.id)
    const time2 = Date.now() - start2

    // Le cache devrait être au moins 5x plus rapide
    expect(time2).toBeLessThan(time1 / 5)
    expect(stats1).toEqual(stats2)
  })
})