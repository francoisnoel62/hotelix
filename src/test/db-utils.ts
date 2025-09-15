import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://test:test@localhost:5433/hotelix_test'
    }
  }
})

export async function resetDatabase() {
  try {
    // Use raw SQL to truncate all tables and reset sequences
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Message", "Intervention", "SousZone", "Zone", "User", "Hotel" RESTART IDENTITY CASCADE')
  } catch (error) {
    // Fallback to individual deletes if truncate fails
    console.log('Truncate failed, using individual deletes:', error)

    // Delete in correct order to avoid foreign key constraint violations
    await prisma.message.deleteMany()
    await prisma.intervention.deleteMany()
    await prisma.sousZone.deleteMany()
    await prisma.zone.deleteMany()
    await prisma.user.deleteMany()
    await prisma.hotel.deleteMany()

    // Reset sequences
    await prisma.$executeRawUnsafe('ALTER SEQUENCE "Hotel_id_seq" RESTART WITH 1')
    await prisma.$executeRawUnsafe('ALTER SEQUENCE "User_id_seq" RESTART WITH 1')
    await prisma.$executeRawUnsafe('ALTER SEQUENCE "Zone_id_seq" RESTART WITH 1')
    await prisma.$executeRawUnsafe('ALTER SEQUENCE "SousZone_id_seq" RESTART WITH 1')
    await prisma.$executeRawUnsafe('ALTER SEQUENCE "Intervention_id_seq" RESTART WITH 1')
    await prisma.$executeRawUnsafe('ALTER SEQUENCE "Message_id_seq" RESTART WITH 1')
  }
}

export async function seedTestData() {
  // Create test hotel
  const hotel = await prisma.hotel.create({
    data: {
      nom: 'Test Hotel',
      adresse: '123 Test Street',
      pays: 'France'
    }
  })

  return { hotel }
}

export { prisma as testPrisma }