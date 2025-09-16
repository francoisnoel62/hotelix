import { describe, test, expect, beforeEach } from 'vitest'
import {
  updateMultipleInterventionStatut,
  assignMultipleInterventions,
  deleteMultipleInterventions
} from '../intervention'
import { StatutIntervention, TypeIntervention, PrioriteIntervention, OrigineIntervention } from '@prisma/client'
import { testPrisma, resetDatabase } from '@/test/db-utils'

describe('Bulk Actions Server Actions', () => {
  let testHotelId: number
  let managerId: number
  let technicienId: number
  let interventionIds: number[] = []

  beforeEach(async () => {
    await resetDatabase()

    // Créer un hôtel de test
    const hotel = await testPrisma.hotel.create({
      data: {
        nom: 'Hotel Test Bulk',
        adresse: '123 Test Street',
        pays: 'France'
      }
    })
    testHotelId = hotel.id

    // Créer un manager
    const manager = await testPrisma.user.create({
      data: {
        email: 'manager-bulk@example.com',
        password: 'hashed_password',
        name: 'Manager Bulk Test',
        role: 'MANAGER',
        hotelId: testHotelId
      }
    })
    managerId = manager.id

    // Créer un technicien
    const technicien = await testPrisma.user.create({
      data: {
        email: 'tech-bulk@example.com',
        password: 'hashed_password',
        name: 'Tech Bulk Test',
        role: 'TECHNICIEN',
        hotelId: testHotelId,
        specialite: 'Plomberie'
      }
    })
    technicienId = technicien.id

    // Créer une zone de test
    const zone = await testPrisma.zone.create({
      data: {
        nom: 'Zone Test Bulk',
        type: 'CHAMBRE',
        hotelId: testHotelId
      }
    })

    // Créer des interventions de test
    const interventions = await Promise.all([
      testPrisma.intervention.create({
        data: {
          titre: 'Intervention Bulk 1',
          description: 'Test bulk 1',
          type: TypeIntervention.PLOMBERIE,
          priorite: PrioriteIntervention.NORMALE,
          origine: OrigineIntervention.STAFF,
          statut: StatutIntervention.EN_ATTENTE,
          hotelId: testHotelId,
          demandeurId: managerId,
          zoneId: zone.id
        }
      }),
      testPrisma.intervention.create({
        data: {
          titre: 'Intervention Bulk 2',
          description: 'Test bulk 2',
          type: TypeIntervention.ELECTRICITE,
          priorite: PrioriteIntervention.HAUTE,
          origine: OrigineIntervention.CLIENT,
          statut: StatutIntervention.EN_ATTENTE,
          hotelId: testHotelId,
          demandeurId: managerId,
          zoneId: zone.id
        }
      }),
      testPrisma.intervention.create({
        data: {
          titre: 'Intervention Bulk 3',
          description: 'Test bulk 3',
          type: TypeIntervention.MENAGE,
          priorite: PrioriteIntervention.BASSE,
          origine: OrigineIntervention.STAFF,
          statut: StatutIntervention.EN_ATTENTE,
          hotelId: testHotelId,
          demandeurId: managerId,
          zoneId: zone.id
        }
      })
    ])

    interventionIds = interventions.map(i => i.id)
  })

  test('updateMultipleInterventionStatut should update status of multiple interventions', async () => {
    const result = await updateMultipleInterventionStatut(
      interventionIds.slice(0, 2), // Prendre 2 interventions
      StatutIntervention.EN_COURS,
      managerId
    )

    console.log('Update result:', result)
    expect(result.success).toBe(true)
    expect(result.message).toContain('2 interventions')

    // Vérifier en base
    const updatedInterventions = await testPrisma.intervention.findMany({
      where: { id: { in: interventionIds.slice(0, 2) } }
    })

    expect(updatedInterventions.every(i => i.statut === StatutIntervention.EN_COURS)).toBe(true)
    expect(updatedInterventions.every(i => i.dateDebut !== null)).toBe(true)
  })

  test('assignMultipleInterventions should assign technician to multiple interventions', async () => {
    const result = await assignMultipleInterventions(
      interventionIds,
      technicienId,
      managerId
    )

    console.log('Assign result:', result)
    expect(result.success).toBe(true)
    expect(result.message).toContain('3 interventions')

    // Vérifier en base
    const assignedInterventions = await testPrisma.intervention.findMany({
      where: { id: { in: interventionIds } }
    })

    expect(assignedInterventions.every(i => i.assigneId === technicienId)).toBe(true)
  })

  test('assignMultipleInterventions should handle unassignment (null technicien)', async () => {
    const result = await assignMultipleInterventions(
      interventionIds.slice(0, 1),
      null,
      managerId
    )

    expect(result.success).toBe(true)
    expect(result.message).toContain('désassignées')

    // Vérifier en base
    const intervention = await testPrisma.intervention.findUnique({
      where: { id: interventionIds[0] }
    })

    expect(intervention?.assigneId).toBeNull()
  })

  test('deleteMultipleInterventions should delete multiple interventions', async () => {
    // Créer une nouvelle intervention pour la supprimer
    const zone = await testPrisma.zone.findFirst({ where: { hotelId: testHotelId } })
    const toDelete = await testPrisma.intervention.create({
      data: {
        titre: 'To Delete',
        description: 'Will be deleted',
        type: TypeIntervention.PLOMBERIE,
        priorite: PrioriteIntervention.NORMALE,
        origine: OrigineIntervention.STAFF,
        statut: StatutIntervention.EN_ATTENTE,
        hotelId: testHotelId,
        demandeurId: managerId,
        zoneId: zone!.id
      }
    })

    const result = await deleteMultipleInterventions([toDelete.id], managerId)

    console.log('Delete result:', result)
    expect(result.success).toBe(true)
    expect(result.message).toContain('1 intervention')

    // Vérifier que l'intervention a été supprimée
    const deleted = await testPrisma.intervention.findUnique({
      where: { id: toDelete.id }
    })

    expect(deleted).toBeNull()
  })

  test('should fail with insufficient permissions (non-manager)', async () => {
    const staff = await testPrisma.user.create({
      data: {
        email: 'staff-bulk@example.com',
        password: 'hashed_password',
        name: 'Staff Bulk Test',
        role: 'STAFF',
        hotelId: testHotelId
      }
    })

    const result = await updateMultipleInterventionStatut(
      interventionIds.slice(0, 1),
      StatutIntervention.EN_COURS,
      staff.id
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('Permission insuffisante')
  })
})