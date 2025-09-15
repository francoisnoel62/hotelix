import { describe, it, expect } from 'vitest'
import { prisma } from '../prisma'

describe('Prisma Database Operations', () => {
  it('should have a valid Prisma client instance', () => {
    expect(prisma).toBeDefined()
    expect(typeof prisma.$connect).toBe('function')
  })

  it('should connect to database successfully', async () => {
    await expect(prisma.$queryRaw`SELECT 1`).resolves.toBeDefined()
  })
})