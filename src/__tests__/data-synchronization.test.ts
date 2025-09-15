import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { testPrisma, resetDatabase, seedTestData } from '@/test/db-utils'
import { StatsService } from '@/lib/services/stats'
import { updateInterventionStatut, assignerIntervention } from '@/app/actions/intervention'
import { getTechnicians, getTechnicianStats } from '@/app/actions/technician'
import { StatutIntervention, TypeIntervention } from '@prisma/client'
import { interventionCache } from '@/lib/cache/interventionCache'

describe('Data Synchronization', () => {
  beforeEach(async () => {
    await resetDatabase()
    interventionCache.invalidateAll()
    vi.clearAllMocks()
  })

  afterEach(() => {
    interventionCache.invalidateAll()
  })

  describe('KPI Consistency', () => {
    it('should show same KPI across dashboard and technicians page', async () => {
      const { hotel } = await seedTestData()

      // Créer un technicien
      const technicien = await testPrisma.user.create({
        data: {
          email: 'technicien@hotel.com',
          password: 'hashed',
          role: 'TECHNICIEN',
          hotelId: hotel.id,
          specialite: 'PLOMBERIE'
        }
      })

      // Créer une zone
      const zone = await testPrisma.zone.create({
        data: {
          nom: 'Chambre 101',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      // Créer des interventions avec différents statuts
      const interventions = await Promise.all([
        testPrisma.intervention.create({
          data: {
            titre: 'Intervention 1',
            statut: StatutIntervention.EN_COURS,
            type: TypeIntervention.PLOMBERIE,
            origine: 'STAFF',
            hotelId: hotel.id,
            demandeurId: technicien.id,
            assigneId: technicien.id,
            zoneId: zone.id
          }
        }),
        testPrisma.intervention.create({
          data: {
            titre: 'Intervention 2',
            statut: StatutIntervention.EN_ATTENTE,
            type: TypeIntervention.ELECTRICITE,
            origine: 'STAFF',
            hotelId: hotel.id,
            demandeurId: technicien.id,
            assigneId: technicien.id,
            zoneId: zone.id
          }
        }),
        testPrisma.intervention.create({
          data: {
            titre: 'Intervention 3',
            statut: StatutIntervention.TERMINEE,
            type: TypeIntervention.PLOMBERIE,
            origine: 'STAFF',
            hotelId: hotel.id,
            demandeurId: technicien.id,
            assigneId: technicien.id,
            zoneId: zone.id
          }
        })
      ])

      // Obtenir les stats globales (dashboard)
      const globalStats = await StatsService.getGlobalStats(hotel.id)

      // Obtenir les stats du technicien
      const technicianStats = await StatsService.getTechnicianStats(technicien.id)

      // Obtenir la liste des techniciens
      const technicians = await getTechnicians(hotel.id)
      const technicianInList = technicians.find(t => t.id === technicien.id)

      // Vérifier la cohérence
      expect(globalStats.enCours).toBe(1)
      expect(globalStats.enAttente).toBe(1)
      expect(globalStats.terminees).toBe(1)
      expect(globalStats.totalInterventions).toBe(3)

      expect(technicianStats.totauxMensuel.enCours).toBe(1)
      expect(technicianStats.totauxMensuel.enAttente).toBe(1)
      expect(technicianStats.totauxMensuel.terminees).toBe(1)

      expect(technicianInList?.interventionsEnCours).toBe(1)
      expect(technicianInList?.interventionsTotal).toBe(3)
    })

    it('should update all views when intervention status changes', async () => {
      const { hotel } = await seedTestData()

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
          nom: 'Chambre 101',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      const intervention = await testPrisma.intervention.create({
        data: {
          titre: 'Intervention Test',
          statut: StatutIntervention.EN_ATTENTE,
          type: TypeIntervention.PLOMBERIE,
          origine: 'STAFF',
          hotelId: hotel.id,
          demandeurId: technicien.id,
          assigneId: technicien.id,
          zoneId: zone.id
        }
      })

      // Stats avant changement
      const statsBefore = await StatsService.getGlobalStats(hotel.id)
      expect(statsBefore.enAttente).toBe(1)
      expect(statsBefore.enCours).toBe(0)

      // Changer le statut
      await updateInterventionStatut(intervention.id, StatutIntervention.EN_COURS, technicien.id)

      // Stats après changement (le cache doit être invalidé)
      const statsAfter = await StatsService.getGlobalStats(hotel.id)
      expect(statsAfter.enAttente).toBe(0)
      expect(statsAfter.enCours).toBe(1)

      // Vérifier aussi côté technicien
      const technicianStatsAfter = await StatsService.getTechnicianStats(technicien.id)
      expect(technicianStatsAfter.totauxMensuel.enAttente).toBe(0)
      expect(technicianStatsAfter.totauxMensuel.enCours).toBe(1)
    })

    it('should reflect technician load changes immediately', async () => {
      const { hotel } = await seedTestData()

      // Créer un manager pour pouvoir faire l'assignation
      const manager = await testPrisma.user.create({
        data: {
          email: 'manager@hotel.com',
          password: 'hashed',
          role: 'MANAGER',
          hotelId: hotel.id
        }
      })

      const technicien1 = await testPrisma.user.create({
        data: {
          email: 'technicien1@hotel.com',
          password: 'hashed',
          role: 'TECHNICIEN',
          hotelId: hotel.id
        }
      })

      const technicien2 = await testPrisma.user.create({
        data: {
          email: 'technicien2@hotel.com',
          password: 'hashed',
          role: 'TECHNICIEN',
          hotelId: hotel.id
        }
      })

      const zone = await testPrisma.zone.create({
        data: {
          nom: 'Chambre 101',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      const intervention = await testPrisma.intervention.create({
        data: {
          titre: 'Intervention Test',
          statut: StatutIntervention.EN_ATTENTE,
          type: TypeIntervention.PLOMBERIE,
          origine: 'STAFF',
          hotelId: hotel.id,
          demandeurId: technicien1.id,
          assigneId: technicien1.id,
          zoneId: zone.id
        }
      })

      // Stats initiales
      const technicien1StatsBefore = await StatsService.getInterventionCounts({
        hotelId: hotel.id,
        technicienId: technicien1.id
      })
      const technicien2StatsBefore = await StatsService.getInterventionCounts({
        hotelId: hotel.id,
        technicienId: technicien2.id
      })

      expect(technicien1StatsBefore.total).toBe(1)
      expect(technicien2StatsBefore.total).toBe(0)

      // Réassigner l'intervention avec le manager
      await assignerIntervention(intervention.id, technicien2.id, manager.id)

      // Vérifier la réassignation
      const technicien1StatsAfter = await StatsService.getInterventionCounts({
        hotelId: hotel.id,
        technicienId: technicien1.id
      })
      const technicien2StatsAfter = await StatsService.getInterventionCounts({
        hotelId: hotel.id,
        technicienId: technicien2.id
      })

      expect(technicien1StatsAfter.total).toBe(0)
      expect(technicien2StatsAfter.total).toBe(1)
    })
  })

  describe('Cache Behavior', () => {
    it('should invalidate cache when data changes', async () => {
      const { hotel } = await seedTestData()

      // Premier appel - devrait calculer et mettre en cache
      const stats1 = await StatsService.getGlobalStats(hotel.id)
      expect(stats1.totalInterventions).toBe(0)

      // Créer une intervention
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
          nom: 'Chambre 101',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      await testPrisma.intervention.create({
        data: {
          titre: 'Intervention Test',
          statut: StatutIntervention.EN_ATTENTE,
          type: TypeIntervention.PLOMBERIE,
          origine: 'STAFF',
          hotelId: hotel.id,
          demandeurId: technicien.id,
          zoneId: zone.id
        }
      })

      // Invalider manuellement le cache
      StatsService.invalidateCache(hotel.id)

      // Deuxième appel - devrait recalculer
      const stats2 = await StatsService.getGlobalStats(hotel.id)
      expect(stats2.totalInterventions).toBe(1)
    })
  })

  describe('Concurrent Modifications', () => {
    it('should maintain consistency during concurrent modifications', async () => {
      const { hotel } = await seedTestData()

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
          nom: 'Chambre 101',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      // Créer plusieurs interventions assignées au technicien
      const interventions = await Promise.all([
        testPrisma.intervention.create({
          data: {
            titre: 'Intervention 1',
            statut: StatutIntervention.EN_ATTENTE,
            type: TypeIntervention.PLOMBERIE,
            origine: 'STAFF',
            hotelId: hotel.id,
            demandeurId: technicien.id,
            assigneId: technicien.id,
            zoneId: zone.id
          }
        }),
        testPrisma.intervention.create({
          data: {
            titre: 'Intervention 2',
            statut: StatutIntervention.EN_ATTENTE,
            type: TypeIntervention.ELECTRICITE,
            origine: 'STAFF',
            hotelId: hotel.id,
            demandeurId: technicien.id,
            assigneId: technicien.id,
            zoneId: zone.id
          }
        })
      ])

      // Modifier les statuts en "parallèle" (séquentiellement pour le test)
      await Promise.all([
        updateInterventionStatut(interventions[0].id, StatutIntervention.EN_COURS, technicien.id),
        updateInterventionStatut(interventions[1].id, StatutIntervention.TERMINEE, technicien.id)
      ])

      // Vérifier la cohérence finale
      const finalStats = await StatsService.getGlobalStats(hotel.id)
      expect(finalStats.enCours).toBe(1)
      expect(finalStats.terminees).toBe(1)
      expect(finalStats.enAttente).toBe(0)
      expect(finalStats.totalInterventions).toBe(2)
    })
  })
})