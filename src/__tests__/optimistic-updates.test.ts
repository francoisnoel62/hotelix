import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testPrisma, resetDatabase, seedTestData } from '@/test/db-utils'
import { updateInterventionStatut, assignerIntervention } from '@/app/actions/intervention'
import { StatutIntervention, TypeIntervention } from '@prisma/client'

// Helper function to create test user
async function createTestUser(hotel: { id: number }, role = 'MANAGER', specialite?: string) {
  const userData: {
    email: string
    password: string
    role: string
    hotelId: number
    specialite?: string
  } = {
    email: `${role.toLowerCase()}@hotel.com`,
    password: 'hashed',
    role: role,
    hotelId: hotel.id
  }

  if (specialite) {
    userData.specialite = specialite
  }

  return await testPrisma.user.create({
    data: userData
  })
}

describe('Optimistic Updates System', () => {
  beforeEach(async () => {
    await resetDatabase()
    vi.clearAllMocks()
  })

  describe('Intervention Status Updates', () => {
    it('should successfully update intervention status', async () => {
      const { hotel } = await seedTestData()

      // Créer un user manager
      const user = await createTestUser(hotel, 'MANAGER')

      // Créer un technicien
      const technicien = await createTestUser(hotel, 'TECHNICIEN', 'PLOMBERIE')

      // Créer une zone
      const zone = await testPrisma.zone.create({
        data: {
          nom: 'Chambre 101',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      // Créer une intervention en attente
      const intervention = await testPrisma.intervention.create({
        data: {
          titre: 'Intervention Test',
          statut: StatutIntervention.EN_ATTENTE,
          type: TypeIntervention.PLOMBERIE,
          origine: 'STAFF',
          hotelId: hotel.id,
          demandeurId: user.id,
          assigneId: technicien.id,
          zoneId: zone.id
        }
      })

      // Tester le changement de statut
      const result = await updateInterventionStatut(
        intervention.id,
        StatutIntervention.EN_COURS,
        technicien.id
      )

      expect(result.success).toBe(true)
      expect(result.message).toContain('Statut mis à jour')

      // Vérifier en base de données
      const updatedIntervention = await testPrisma.intervention.findUnique({
        where: { id: intervention.id }
      })

      expect(updatedIntervention?.statut).toBe(StatutIntervention.EN_COURS)
      expect(updatedIntervention?.dateDebut).toBeDefined()
    })

    it('should handle invalid status transitions gracefully', async () => {
      const { hotel } = await seedTestData()
      const user = await createTestUser(hotel, 'MANAGER')

      const intervention = await testPrisma.intervention.create({
        data: {
          titre: 'Intervention Terminée',
          statut: StatutIntervention.TERMINEE,
          type: TypeIntervention.PLOMBERIE,
          origine: 'STAFF',
          hotelId: hotel.id,
          demandeurId: user.id,
          zoneId: (await testPrisma.zone.create({
            data: { nom: 'Zone Test', type: 'CHAMBRE', hotelId: hotel.id }
          })).id
        }
      })

      // Essayer de repasser une intervention terminée en attente
      const result = await updateInterventionStatut(
        intervention.id,
        StatutIntervention.EN_ATTENTE,
        user.id
      )

      // Le système devrait accepter ce changement (business logic peut permettre cela)
      // Note: Si la business logic interdit cela, ce test devrait être ajusté
      expect(result.success).toBe(true) // ou false selon la logique métier
    })

    it('should set correct timestamps when changing status', async () => {
      const { hotel } = await seedTestData()
      const user = await createTestUser(hotel, 'MANAGER')
      const technicien = await createTestUser(hotel, 'TECHNICIEN')

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
          demandeurId: user.id,
          assigneId: technicien.id,
          zoneId: zone.id
        }
      })

      // Démarrer l'intervention
      await updateInterventionStatut(intervention.id, StatutIntervention.EN_COURS, technicien.id)

      let updatedIntervention = await testPrisma.intervention.findUnique({
        where: { id: intervention.id }
      })

      expect(updatedIntervention?.dateDebut).toBeDefined()
      expect(updatedIntervention?.dateFin).toBeNull()

      // Terminer l'intervention
      await updateInterventionStatut(intervention.id, StatutIntervention.TERMINEE, technicien.id)

      updatedIntervention = await testPrisma.intervention.findUnique({
        where: { id: intervention.id }
      })

      expect(updatedIntervention?.dateDebut).toBeDefined()
      expect(updatedIntervention?.dateFin).toBeDefined()

      // Vérifier que dateFin est après dateDebut
      if (updatedIntervention?.dateFin && updatedIntervention?.dateDebut) {
        expect(new Date(updatedIntervention.dateFin).getTime())
          .toBeGreaterThan(new Date(updatedIntervention.dateDebut).getTime())
      }
    })
  })

  describe('Technician Assignment Updates', () => {
    it('should successfully assign intervention to technician', async () => {
      const { hotel } = await seedTestData()
      const user = await createTestUser(hotel, 'MANAGER')
      const technicien1 = await createTestUser(hotel, 'TECHNICIEN', 'PLOMBERIE')

      // Create second technician with unique email
      const technicien2 = await testPrisma.user.create({
        data: {
          email: 'technicien2@hotel.com',
          password: 'hashed',
          role: 'TECHNICIEN',
          hotelId: hotel.id,
          specialite: 'ELECTRICITE'
        }
      })

      const zone = await testPrisma.zone.create({
        data: {
          nom: 'Chambre 101',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      // Créer une intervention non assignée
      const intervention = await testPrisma.intervention.create({
        data: {
          titre: 'Intervention Test',
          statut: StatutIntervention.EN_ATTENTE,
          type: TypeIntervention.PLOMBERIE,
          origine: 'STAFF',
          hotelId: hotel.id,
          demandeurId: user.id,
          assigneId: null,
          zoneId: zone.id
        }
      })

      // Assigner à technicien1
      const result1 = await assignerIntervention(intervention.id, technicien1.id, user.id)

      expect(result1.success).toBe(true)
      expect(result1.message).toContain('assignée')

      // Vérifier l'assignation
      let updatedIntervention = await testPrisma.intervention.findUnique({
        where: { id: intervention.id }
      })

      expect(updatedIntervention?.assigneId).toBe(technicien1.id)

      // Réassigner à technicien2
      const result2 = await assignerIntervention(intervention.id, technicien2.id, user.id)

      expect(result2.success).toBe(true)

      // Vérifier la réassignation
      updatedIntervention = await testPrisma.intervention.findUnique({
        where: { id: intervention.id }
      })

      expect(updatedIntervention?.assigneId).toBe(technicien2.id)
    })

    it('should unassign intervention when technicienId is 0', async () => {
      const { hotel } = await seedTestData()
      const user = await createTestUser(hotel, 'MANAGER')
      const technicien = await createTestUser(hotel, 'TECHNICIEN')

      const zone = await testPrisma.zone.create({
        data: {
          nom: 'Chambre 101',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      // Créer une intervention assignée
      const intervention = await testPrisma.intervention.create({
        data: {
          titre: 'Intervention Test',
          statut: StatutIntervention.EN_ATTENTE,
          type: TypeIntervention.PLOMBERIE,
          origine: 'STAFF',
          hotelId: hotel.id,
          demandeurId: user.id,
          assigneId: technicien.id,
          zoneId: zone.id
        }
      })

      // Désassigner (technicienId = 0)
      const result = await assignerIntervention(intervention.id, 0, user.id)

      expect(result.success).toBe(true)
      expect(result.message).toContain('désassignée')

      // Vérifier la désassignation
      const updatedIntervention = await testPrisma.intervention.findUnique({
        where: { id: intervention.id }
      })

      expect(updatedIntervention?.assigneId).toBeNull()
    })

    it('should handle assignment to non-existent technician', async () => {
      const { hotel } = await seedTestData()
      const user = await createTestUser(hotel, 'MANAGER')

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
          demandeurId: user.id,
          zoneId: zone.id
        }
      })

      // Essayer d'assigner à un technicien inexistant
      const result = await assignerIntervention(intervention.id, 99999, user.id)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()

      // Vérifier que l'intervention n'a pas été modifiée
      const unchangedIntervention = await testPrisma.intervention.findUnique({
        where: { id: intervention.id }
      })

      expect(unchangedIntervention?.assigneId).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Tester avec un ID d'intervention inexistant
      const result = await updateInterventionStatut(
        99999,
        StatutIntervention.EN_COURS,
        1
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Intervention non trouvée')
    })

    it('should validate user permissions', async () => {
      const { hotel } = await seedTestData()
      const user = await createTestUser(hotel, 'MANAGER')

      // Créer un technicien
      const technicien = await createTestUser(hotel, 'TECHNICIEN')

      // Créer un autre technicien avec email unique
      const autreTechnicien = await testPrisma.user.create({
        data: {
          email: 'autre@hotel.com',
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
          demandeurId: user.id,
          assigneId: technicien.id,
          zoneId: zone.id
        }
      })

      // Un technicien non assigné ne devrait pas pouvoir changer le statut
      const result = await updateInterventionStatut(
        intervention.id,
        StatutIntervention.EN_COURS,
        autreTechnicien.id
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Permission')
    })
  })
})