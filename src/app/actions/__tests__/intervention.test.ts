import { describe, it, expect, beforeEach } from 'vitest'
import { testPrisma, resetDatabase, seedTestData } from '@/test/db-utils'
import {
  createIntervention,
  updateInterventionStatut,
  assignerIntervention,
  getInterventions,
  // updateIntervention
} from '../intervention'
import { StatutIntervention, TypeIntervention, PrioriteIntervention, OrigineIntervention } from '@prisma/client'

describe('Intervention Server Actions', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  describe('createIntervention', () => {
    it('should create intervention with proper hotel isolation', async () => {
      const { hotel } = await seedTestData()

      const staff = await testPrisma.user.create({
        data: {
          email: 'staff@hotel.com',
          password: 'hashed',
          role: 'STAFF',
          hotelId: hotel.id
        }
      })

      const zone = await testPrisma.zone.create({
        data: {
          nom: 'Room 101',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      const formData = {
        titre: 'Fuite d\'eau',
        description: 'Fuite dans la salle de bain',
        type: TypeIntervention.PLOMBERIE,
        priorite: PrioriteIntervention.HAUTE,
        origine: OrigineIntervention.CLIENT,
        zoneId: zone.id,
        sousZoneId: null,
        assigneId: null,
        demandeurId: staff.id,
        hotelId: hotel.id
      }

      const result = await createIntervention(formData)

      expect(result.success).toBe(true)
      expect(result.data.titre).toBe('Fuite d\'eau')
      expect(result.data.hotelId).toBe(hotel.id)
      expect(result.data.demandeurId).toBe(staff.id)
    })

    it('should handle database errors gracefully', async () => {
      const formData = {
        titre: 'Test',
        description: 'Test',
        type: TypeIntervention.PLOMBERIE,
        priorite: PrioriteIntervention.NORMALE,
        origine: OrigineIntervention.STAFF,
        zoneId: 99999, // Non-existent zone
        sousZoneId: null,
        assigneId: null,
        demandeurId: 99999, // Non-existent user
        hotelId: 99999 // Non-existent hotel
      }

      const result = await createIntervention(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Erreur lors de la création de l\'intervention')
    })
  })

  describe('updateInterventionStatut', () => {
    it('should allow MANAGER to update any intervention status', async () => {
      const { hotel } = await seedTestData()

      const manager = await testPrisma.user.create({
        data: {
          email: 'manager@hotel.com',
          password: 'hashed',
          role: 'MANAGER',
          hotelId: hotel.id
        }
      })

      const zone = await testPrisma.zone.create({
        data: {
          nom: 'Room 102',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      const intervention = await testPrisma.intervention.create({
        data: {
          titre: 'Test intervention',
          type: TypeIntervention.ELECTRICITE,
          priorite: PrioriteIntervention.NORMALE,
          origine: OrigineIntervention.STAFF,
          statut: StatutIntervention.EN_ATTENTE,
          hotelId: hotel.id,
          demandeurId: manager.id,
          zoneId: zone.id
        }
      })

      const result = await updateInterventionStatut(
        intervention.id,
        StatutIntervention.EN_COURS,
        manager.id
      )

      expect(result.success).toBe(true)
      expect(result.data.statut).toBe(StatutIntervention.EN_COURS)
      expect(result.data.dateDebut).toBeDefined()
    })

    it('should allow TECHNICIEN to update only assigned interventions', async () => {
      const { hotel } = await seedTestData()

      const technicien = await testPrisma.user.create({
        data: {
          email: 'tech@hotel.com',
          password: 'hashed',
          role: 'TECHNICIEN',
          specialite: 'Plomberie',
          hotelId: hotel.id
        }
      })

      const manager = await testPrisma.user.create({
        data: {
          email: 'manager@hotel.com',
          password: 'hashed',
          role: 'MANAGER',
          hotelId: hotel.id
        }
      })

      const zone = await testPrisma.zone.create({
        data: {
          nom: 'Room 103',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      const intervention = await testPrisma.intervention.create({
        data: {
          titre: 'Test intervention',
          type: TypeIntervention.PLOMBERIE,
          priorite: PrioriteIntervention.NORMALE,
          origine: OrigineIntervention.STAFF,
          statut: StatutIntervention.EN_ATTENTE,
          hotelId: hotel.id,
          demandeurId: manager.id,
          assigneId: technicien.id,
          zoneId: zone.id
        }
      })

      const result = await updateInterventionStatut(
        intervention.id,
        StatutIntervention.TERMINEE,
        technicien.id
      )

      expect(result.success).toBe(true)
      expect(result.data.statut).toBe(StatutIntervention.TERMINEE)
      expect(result.data.dateFin).toBeDefined()
    })

    it('should reject STAFF from updating intervention status', async () => {
      const { hotel } = await seedTestData()

      const staff = await testPrisma.user.create({
        data: {
          email: 'staff@hotel.com',
          password: 'hashed',
          role: 'STAFF',
          hotelId: hotel.id
        }
      })

      const zone = await testPrisma.zone.create({
        data: {
          nom: 'Room 104',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      const intervention = await testPrisma.intervention.create({
        data: {
          titre: 'Test intervention',
          type: TypeIntervention.NETTOYAGE,
          priorite: PrioriteIntervention.BASSE,
          origine: OrigineIntervention.STAFF,
          statut: StatutIntervention.EN_ATTENTE,
          hotelId: hotel.id,
          demandeurId: staff.id,
          zoneId: zone.id
        }
      })

      const result = await updateInterventionStatut(
        intervention.id,
        StatutIntervention.EN_COURS,
        staff.id
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission insuffisante pour modifier cette intervention')
    })

    it('should reject TECHNICIEN from updating non-assigned interventions', async () => {
      const { hotel } = await seedTestData()

      const technicien1 = await testPrisma.user.create({
        data: {
          email: 'tech1@hotel.com',
          password: 'hashed',
          role: 'TECHNICIEN',
          hotelId: hotel.id
        }
      })

      const technicien2 = await testPrisma.user.create({
        data: {
          email: 'tech2@hotel.com',
          password: 'hashed',
          role: 'TECHNICIEN',
          hotelId: hotel.id
        }
      })

      const zone = await testPrisma.zone.create({
        data: {
          nom: 'Room 105',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      const intervention = await testPrisma.intervention.create({
        data: {
          titre: 'Test intervention',
          type: TypeIntervention.MENUISERIE,
          priorite: PrioriteIntervention.NORMALE,
          origine: OrigineIntervention.STAFF,
          statut: StatutIntervention.EN_ATTENTE,
          hotelId: hotel.id,
          demandeurId: technicien1.id,
          assigneId: technicien1.id,
          zoneId: zone.id
        }
      })

      const result = await updateInterventionStatut(
        intervention.id,
        StatutIntervention.EN_COURS,
        technicien2.id
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission insuffisante pour modifier cette intervention')
    })
  })

  describe('assignerIntervention', () => {
    it('should allow MANAGER to assign interventions to technicians', async () => {
      const { hotel } = await seedTestData()

      const manager = await testPrisma.user.create({
        data: {
          email: 'manager@hotel.com',
          password: 'hashed',
          role: 'MANAGER',
          hotelId: hotel.id
        }
      })

      const technicien = await testPrisma.user.create({
        data: {
          email: 'tech@hotel.com',
          password: 'hashed',
          role: 'TECHNICIEN',
          specialite: 'Électricité',
          hotelId: hotel.id
        }
      })

      const zone = await testPrisma.zone.create({
        data: {
          nom: 'Room 106',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      const intervention = await testPrisma.intervention.create({
        data: {
          titre: 'Problème électrique',
          type: TypeIntervention.ELECTRICITE,
          priorite: PrioriteIntervention.URGENTE,
          origine: OrigineIntervention.CLIENT,
          statut: StatutIntervention.EN_ATTENTE,
          hotelId: hotel.id,
          demandeurId: manager.id,
          zoneId: zone.id
        }
      })

      const result = await assignerIntervention(
        intervention.id,
        technicien.id,
        manager.id
      )

      expect(result.success).toBe(true)
      expect(result.data.assigneId).toBe(technicien.id)
      expect(result.data.statut).toBe(StatutIntervention.EN_ATTENTE)
    })

    it('should reject non-MANAGER from assigning interventions', async () => {
      const { hotel } = await seedTestData()

      const staff = await testPrisma.user.create({
        data: {
          email: 'staff@hotel.com',
          password: 'hashed',
          role: 'STAFF',
          hotelId: hotel.id
        }
      })

      const technicien = await testPrisma.user.create({
        data: {
          email: 'tech@hotel.com',
          password: 'hashed',
          role: 'TECHNICIEN',
          hotelId: hotel.id
        }
      })

      const zone = await testPrisma.zone.create({
        data: {
          nom: 'Room 107',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      const intervention = await testPrisma.intervention.create({
        data: {
          titre: 'Test intervention',
          type: TypeIntervention.AUTRE,
          priorite: PrioriteIntervention.NORMALE,
          origine: OrigineIntervention.STAFF,
          statut: StatutIntervention.EN_ATTENTE,
          hotelId: hotel.id,
          demandeurId: staff.id,
          zoneId: zone.id
        }
      })

      const result = await assignerIntervention(
        intervention.id,
        technicien.id,
        staff.id
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Seul un manager peut assigner des interventions')
    })

    it('should allow MANAGER to unassign interventions (technicienId = 0)', async () => {
      const { hotel } = await seedTestData()

      const manager = await testPrisma.user.create({
        data: {
          email: 'manager@hotel.com',
          password: 'hashed',
          role: 'MANAGER',
          hotelId: hotel.id
        }
      })

      const technicien = await testPrisma.user.create({
        data: {
          email: 'tech@hotel.com',
          password: 'hashed',
          role: 'TECHNICIEN',
          hotelId: hotel.id
        }
      })

      const zone = await testPrisma.zone.create({
        data: {
          nom: 'Room 108',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      const intervention = await testPrisma.intervention.create({
        data: {
          titre: 'Test intervention',
          type: TypeIntervention.CLIMATISATION,
          priorite: PrioriteIntervention.NORMALE,
          origine: OrigineIntervention.STAFF,
          statut: StatutIntervention.EN_COURS,
          hotelId: hotel.id,
          demandeurId: manager.id,
          assigneId: technicien.id,
          zoneId: zone.id
        }
      })

      const result = await assignerIntervention(
        intervention.id,
        0, // Unassign
        manager.id
      )

      expect(result.success).toBe(true)
      expect(result.data.assigneId).toBeNull()
      expect(result.data.statut).toBe(StatutIntervention.EN_ATTENTE)
      expect(result.message).toBe('Intervention désassignée')
    })
  })

  describe('getInterventions', () => {
    it('should filter interventions by hotel ID', async () => {
      const hotel1 = await testPrisma.hotel.create({
        data: { nom: 'Hotel 1', adresse: 'Address 1', pays: 'France' }
      })

      const hotel2 = await testPrisma.hotel.create({
        data: { nom: 'Hotel 2', adresse: 'Address 2', pays: 'France' }
      })

      const manager1 = await testPrisma.user.create({
        data: {
          email: 'manager1@hotel1.com',
          password: 'hashed',
          role: 'MANAGER',
          hotelId: hotel1.id
        }
      })

      const manager2 = await testPrisma.user.create({
        data: {
          email: 'manager2@hotel2.com',
          password: 'hashed',
          role: 'MANAGER',
          hotelId: hotel2.id
        }
      })

      const zone1 = await testPrisma.zone.create({
        data: {
          nom: 'Zone Hotel 1',
          type: 'RECEPTION',
          hotelId: hotel1.id
        }
      })

      const zone2 = await testPrisma.zone.create({
        data: {
          nom: 'Zone Hotel 2',
          type: 'RECEPTION',
          hotelId: hotel2.id
        }
      })

      // Create interventions for both hotels
      await testPrisma.intervention.create({
        data: {
          titre: 'Intervention Hotel 1',
          type: TypeIntervention.NETTOYAGE,
          priorite: PrioriteIntervention.NORMALE,
          origine: OrigineIntervention.STAFF,
          hotelId: hotel1.id,
          demandeurId: manager1.id,
          zoneId: zone1.id
        }
      })

      await testPrisma.intervention.create({
        data: {
          titre: 'Intervention Hotel 2',
          type: TypeIntervention.NETTOYAGE,
          priorite: PrioriteIntervention.NORMALE,
          origine: OrigineIntervention.STAFF,
          hotelId: hotel2.id,
          demandeurId: manager2.id,
          zoneId: zone2.id
        }
      })

      const interventions1 = await getInterventions(hotel1.id, manager1.id, 'MANAGER')
      const interventions2 = await getInterventions(hotel2.id, manager2.id, 'MANAGER')

      expect(interventions1).toHaveLength(1)
      expect(interventions1[0].titre).toBe('Intervention Hotel 1')
      expect(interventions2).toHaveLength(1)
      expect(interventions2[0].titre).toBe('Intervention Hotel 2')
    })

    it('should filter interventions for TECHNICIEN role to only assigned ones', async () => {
      const { hotel } = await seedTestData()

      const technicien1 = await testPrisma.user.create({
        data: {
          email: 'tech1@hotel.com',
          password: 'hashed',
          role: 'TECHNICIEN',
          hotelId: hotel.id
        }
      })

      const technicien2 = await testPrisma.user.create({
        data: {
          email: 'tech2@hotel.com',
          password: 'hashed',
          role: 'TECHNICIEN',
          hotelId: hotel.id
        }
      })

      const zone = await testPrisma.zone.create({
        data: {
          nom: 'Test Zone',
          type: 'CHAMBRE',
          hotelId: hotel.id
        }
      })

      // Create intervention assigned to technicien1
      await testPrisma.intervention.create({
        data: {
          titre: 'Assigned to Tech1',
          type: TypeIntervention.PLOMBERIE,
          priorite: PrioriteIntervention.NORMALE,
          origine: OrigineIntervention.STAFF,
          hotelId: hotel.id,
          demandeurId: technicien1.id,
          assigneId: technicien1.id,
          zoneId: zone.id
        }
      })

      // Create intervention assigned to technicien2
      await testPrisma.intervention.create({
        data: {
          titre: 'Assigned to Tech2',
          type: TypeIntervention.ELECTRICITE,
          priorite: PrioriteIntervention.NORMALE,
          origine: OrigineIntervention.STAFF,
          hotelId: hotel.id,
          demandeurId: technicien2.id,
          assigneId: technicien2.id,
          zoneId: zone.id
        }
      })

      // Create unassigned intervention
      await testPrisma.intervention.create({
        data: {
          titre: 'Unassigned',
          type: TypeIntervention.AUTRE,
          priorite: PrioriteIntervention.NORMALE,
          origine: OrigineIntervention.STAFF,
          hotelId: hotel.id,
          demandeurId: technicien1.id,
          zoneId: zone.id
        }
      })

      const tech1Interventions = await getInterventions(hotel.id, technicien1.id, 'TECHNICIEN')
      const tech2Interventions = await getInterventions(hotel.id, technicien2.id, 'TECHNICIEN')

      expect(tech1Interventions).toHaveLength(1)
      expect(tech1Interventions[0].titre).toBe('Assigned to Tech1')
      expect(tech2Interventions).toHaveLength(1)
      expect(tech2Interventions[0].titre).toBe('Assigned to Tech2')
    })
  })
})