import { describe, it, expect, beforeEach } from 'vitest'
import { testPrisma, resetDatabase } from '@/test/db-utils'
import { StatutIntervention, TypeIntervention, PrioriteIntervention, OrigineIntervention, TypeZone } from '@prisma/client'

describe('Database Relationships', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('should enforce hotel isolation for users', async () => {
    const hotel1 = await testPrisma.hotel.create({
      data: { nom: 'Hotel 1', adresse: 'Address 1', pays: 'France' }
    })

    const hotel2 = await testPrisma.hotel.create({
      data: { nom: 'Hotel 2', adresse: 'Address 2', pays: 'France' }
    })

    const user1 = await testPrisma.user.create({
      data: {
        email: 'user1@hotel1.com',
        password: 'hashed',
        hotelId: hotel1.id,
        role: 'STAFF'
      }
    })

    await testPrisma.user.create({
      data: {
        email: 'user2@hotel2.com',
        password: 'hashed',
        hotelId: hotel2.id,
        role: 'STAFF'
      }
    })

    // Verify users are isolated by hotel
    const hotel1Users = await testPrisma.user.findMany({
      where: { hotelId: hotel1.id }
    })

    expect(hotel1Users).toHaveLength(1)
    expect(hotel1Users[0].id).toBe(user1.id)
  })

  it('should enforce foreign key constraints', async () => {
    const hotel = await testPrisma.hotel.create({
      data: { nom: 'Test Hotel', adresse: 'Test Address', pays: 'France' }
    })

    const zone = await testPrisma.zone.create({
      data: {
        nom: 'Test Zone',
        type: 'CHAMBRE',
        hotelId: hotel.id
      }
    })

    const sousZone = await testPrisma.sousZone.create({
      data: {
        nom: 'Test Sous Zone',
        zoneId: zone.id
      }
    })

    // Trying to delete zone with existing sous-zones should fail
    await expect(
      testPrisma.zone.delete({ where: { id: zone.id } })
    ).rejects.toThrow()

    // Proper cleanup: delete sous-zone first, then zone
    await testPrisma.sousZone.delete({ where: { id: sousZone.id } })
    await testPrisma.zone.delete({ where: { id: zone.id } })

    const remainingSousZones = await testPrisma.sousZone.findMany({
      where: { zoneId: zone.id }
    })

    expect(remainingSousZones).toHaveLength(0)
  })

  it('should maintain referential integrity for interventions', async () => {
    const hotel = await testPrisma.hotel.create({
      data: { nom: 'Test Hotel', adresse: 'Test Address', pays: 'France' }
    })

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
        specialite: 'Plomberie',
        hotelId: hotel.id
      }
    })

    const zone = await testPrisma.zone.create({
      data: {
        nom: 'Bathroom',
        type: 'CHAMBRE',
        hotelId: hotel.id
      }
    })

    const sousZone = await testPrisma.sousZone.create({
      data: {
        nom: 'Shower',
        zoneId: zone.id
      }
    })

    const intervention = await testPrisma.intervention.create({
      data: {
        titre: 'Fuite robinet',
        description: 'Le robinet de la douche fuit',
        type: TypeIntervention.PLOMBERIE,
        priorite: PrioriteIntervention.HAUTE,
        origine: OrigineIntervention.CLIENT,
        statut: StatutIntervention.EN_ATTENTE,
        hotelId: hotel.id,
        demandeurId: manager.id,
        assigneId: technicien.id,
        zoneId: zone.id,
        sousZoneId: sousZone.id
      }
    })

    // Verify relationships are maintained
    const retrievedIntervention = await testPrisma.intervention.findUnique({
      where: { id: intervention.id },
      include: {
        hotel: true,
        demandeur: true,
        assigne: true,
        zone: true,
        sousZone: true
      }
    })

    expect(retrievedIntervention).toBeDefined()
    expect(retrievedIntervention!.hotel.nom).toBe('Test Hotel')
    expect(retrievedIntervention!.demandeur.email).toBe('manager@hotel.com')
    expect(retrievedIntervention!.assigne!.email).toBe('tech@hotel.com')
    expect(retrievedIntervention!.zone.nom).toBe('Bathroom')
    expect(retrievedIntervention!.sousZone!.nom).toBe('Shower')
  })

  it('should enforce unique email constraint across all hotels', async () => {
    const hotel1 = await testPrisma.hotel.create({
      data: { nom: 'Hotel 1', adresse: 'Address 1', pays: 'France' }
    })

    const hotel2 = await testPrisma.hotel.create({
      data: { nom: 'Hotel 2', adresse: 'Address 2', pays: 'France' }
    })

    // Create user in hotel1
    await testPrisma.user.create({
      data: {
        email: 'duplicate@test.com',
        password: 'hashed',
        role: 'STAFF',
        hotelId: hotel1.id
      }
    })

    // Attempt to create user with same email in hotel2 should fail
    await expect(
      testPrisma.user.create({
        data: {
          email: 'duplicate@test.com',
          password: 'hashed',
          role: 'STAFF',
          hotelId: hotel2.id
        }
      })
    ).rejects.toThrow()
  })

  it('should properly handle message relationships', async () => {
    const hotel = await testPrisma.hotel.create({
      data: { nom: 'Test Hotel', adresse: 'Test Address', pays: 'France' }
    })

    const expediteur = await testPrisma.user.create({
      data: {
        email: 'sender@hotel.com',
        password: 'hashed',
        role: 'MANAGER',
        hotelId: hotel.id
      }
    })

    const destinataire = await testPrisma.user.create({
      data: {
        email: 'receiver@hotel.com',
        password: 'hashed',
        role: 'TECHNICIEN',
        hotelId: hotel.id
      }
    })

    const message = await testPrisma.message.create({
      data: {
        contenu: 'Pouvez-vous vérifier l\'intervention en cours?',
        expediteurId: expediteur.id,
        destinataireId: destinataire.id,
        hotelId: hotel.id
      }
    })

    // Verify message relationships
    const retrievedMessage = await testPrisma.message.findUnique({
      where: { id: message.id },
      include: {
        expediteur: true,
        destinataire: true,
        hotel: true
      }
    })

    expect(retrievedMessage).toBeDefined()
    expect(retrievedMessage!.expediteur.email).toBe('sender@hotel.com')
    expect(retrievedMessage!.destinataire.email).toBe('receiver@hotel.com')
    expect(retrievedMessage!.hotel.nom).toBe('Test Hotel')
    expect(retrievedMessage!.lu).toBe(false) // Default value
  })

  it('should enforce enum constraints', async () => {
    const hotel = await testPrisma.hotel.create({
      data: { nom: 'Test Hotel', adresse: 'Test Address', pays: 'France' }
    })

    const user = await testPrisma.user.create({
      data: {
        email: 'user@hotel.com',
        password: 'hashed',
        role: 'STAFF',
        hotelId: hotel.id
      }
    })

    const zone = await testPrisma.zone.create({
      data: {
        nom: 'Test Zone',
        type: TypeZone.CHAMBRE,
        hotelId: hotel.id
      }
    })

    // Test valid enum values
    const intervention = await testPrisma.intervention.create({
      data: {
        titre: 'Test intervention',
        type: TypeIntervention.PLOMBERIE,
        priorite: PrioriteIntervention.URGENTE,
        origine: OrigineIntervention.CLIENT,
        statut: StatutIntervention.EN_ATTENTE,
        hotelId: hotel.id,
        demandeurId: user.id,
        zoneId: zone.id
      }
    })

    expect(intervention.type).toBe('PLOMBERIE')
    expect(intervention.priorite).toBe('URGENTE')
    expect(intervention.origine).toBe('CLIENT')
    expect(intervention.statut).toBe('EN_ATTENTE')
  })

  it('should handle optional relationships correctly', async () => {
    const hotel = await testPrisma.hotel.create({
      data: { nom: 'Test Hotel', adresse: 'Test Address', pays: 'France' }
    })

    const user = await testPrisma.user.create({
      data: {
        email: 'user@hotel.com',
        password: 'hashed',
        role: 'STAFF',
        hotelId: hotel.id
      }
    })

    const zone = await testPrisma.zone.create({
      data: {
        nom: 'Test Zone',
        type: TypeZone.RECEPTION,
        hotelId: hotel.id
      }
    })

    // Create intervention without optional fields
    const intervention = await testPrisma.intervention.create({
      data: {
        titre: 'Test intervention',
        type: TypeIntervention.AUTRE,
        priorite: PrioriteIntervention.NORMALE,
        origine: OrigineIntervention.STAFF,
        hotelId: hotel.id,
        demandeurId: user.id,
        zoneId: zone.id
        // assigneId and sousZoneId are optional
      }
    })

    expect(intervention.assigneId).toBeNull()
    expect(intervention.sousZoneId).toBeNull()
    expect(intervention.description).toBeNull()
    expect(intervention.dateDebut).toBeNull()
    expect(intervention.dateFin).toBeNull()
  })

  it('should maintain data consistency across complex operations', async () => {
    const hotel = await testPrisma.hotel.create({
      data: { nom: 'Complex Hotel', adresse: 'Complex Address', pays: 'France' }
    })

    // Create multiple users with different roles
    const manager = await testPrisma.user.create({
      data: {
        email: 'manager@complex.com',
        password: 'hashed',
        role: 'MANAGER',
        hotelId: hotel.id
      }
    })

    const staff = await testPrisma.user.create({
      data: {
        email: 'staff@complex.com',
        password: 'hashed',
        role: 'STAFF',
        hotelId: hotel.id
      }
    })

    const technicien = await testPrisma.user.create({
      data: {
        email: 'tech@complex.com',
        password: 'hashed',
        role: 'TECHNICIEN',
        specialite: 'Généraliste',
        hotelId: hotel.id
      }
    })

    // Create zone with sub-zones
    const zone = await testPrisma.zone.create({
      data: {
        nom: 'Restaurant',
        type: TypeZone.RESTAURANT,
        hotelId: hotel.id
      }
    })

    const sousZone1 = await testPrisma.sousZone.create({
      data: {
        nom: 'Kitchen',
        zoneId: zone.id
      }
    })

    const sousZone2 = await testPrisma.sousZone.create({
      data: {
        nom: 'Dining Area',
        zoneId: zone.id
      }
    })

    // Create multiple interventions
    await testPrisma.intervention.create({
      data: {
        titre: 'Kitchen equipment issue',
        type: TypeIntervention.ELECTRICITE,
        priorite: PrioriteIntervention.HAUTE,
        origine: OrigineIntervention.STAFF,
        hotelId: hotel.id,
        demandeurId: staff.id,
        assigneId: technicien.id,
        zoneId: zone.id,
        sousZoneId: sousZone1.id
      }
    })

    await testPrisma.intervention.create({
      data: {
        titre: 'Table cleaning',
        type: TypeIntervention.NETTOYAGE,
        priorite: PrioriteIntervention.NORMALE,
        origine: OrigineIntervention.STAFF,
        hotelId: hotel.id,
        demandeurId: manager.id,
        zoneId: zone.id,
        sousZoneId: sousZone2.id
      }
    })

    // Create messages between users
    await testPrisma.message.create({
      data: {
        contenu: 'Please check the kitchen equipment urgently',
        expediteurId: staff.id,
        destinataireId: technicien.id,
        hotelId: hotel.id
      }
    })

    // Verify complete data integrity
    const allUsers = await testPrisma.user.findMany({
      where: { hotelId: hotel.id }
    })

    const allZones = await testPrisma.zone.findMany({
      where: { hotelId: hotel.id },
      include: { sousZones: true }
    })

    const allInterventions = await testPrisma.intervention.findMany({
      where: { hotelId: hotel.id },
      include: {
        demandeur: true,
        assigne: true,
        zone: true,
        sousZone: true
      }
    })

    const allMessages = await testPrisma.message.findMany({
      where: { hotelId: hotel.id }
    })

    expect(allUsers).toHaveLength(3)
    expect(allZones).toHaveLength(1)
    expect(allZones[0].sousZones).toHaveLength(2)
    expect(allInterventions).toHaveLength(2)
    expect(allMessages).toHaveLength(1)

    // Verify relationships are correct
    expect(allInterventions[0].demandeur.role).toBe('STAFF')
    expect(allInterventions[0].assigne!.role).toBe('TECHNICIEN')
    expect(allInterventions[1].demandeur.role).toBe('MANAGER')
  })
})