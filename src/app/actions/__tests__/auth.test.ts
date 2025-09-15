import { describe, it, expect, beforeEach, vi } from 'vitest'
import { registerAction, loginAction, getHotelsAction } from '../auth'
import { testPrisma, resetDatabase, seedTestData } from '@/test/db-utils'
import bcryptjs from 'bcryptjs'

// Mock bcryptjs for unit tests
vi.mock('bcryptjs')
const mockedBcryptjs = vi.mocked(bcryptjs)

describe('Authentication Server Actions', () => {
  beforeEach(async () => {
    await resetDatabase()
    vi.clearAllMocks()
  })

  describe('registerAction', () => {
    it('should successfully register a new user', async () => {
      const { hotel } = await seedTestData()
      mockedBcryptjs.hash.mockResolvedValue('hashed_password')

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('confirmPassword', 'password123')
      formData.append('name', 'Test User')
      formData.append('hotelId', hotel.id.toString())
      formData.append('role', 'STAFF')

      const result = await registerAction(null, formData)

      expect(result.success).toBe(true)
      expect(result.data?.email).toBe('test@example.com')
      expect(mockedBcryptjs.hash).toHaveBeenCalledWith('password123', 12)
    })

    it('should reject duplicate email addresses', async () => {
      const { hotel } = await seedTestData()

      // Create existing user
      await testPrisma.user.create({
        data: {
          email: 'existing@example.com',
          password: 'hashed',
          hotelId: hotel.id,
          role: 'STAFF'
        }
      })

      const formData = new FormData()
      formData.append('email', 'existing@example.com')
      formData.append('password', 'password123')
      formData.append('confirmPassword', 'password123')
      formData.append('hotelId', hotel.id.toString())

      const result = await registerAction(null, formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('EMAIL_TAKEN')
    })

    it('should validate password confirmation', async () => {
      const { hotel } = await seedTestData()

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('confirmPassword', 'different_password')
      formData.append('hotelId', hotel.id.toString())

      const result = await registerAction(null, formData)

      expect(result.success).toBe(false)
      expect(result.fieldErrors?.confirmPassword).toBe('Les mots de passe ne correspondent pas')
    })
  })

  describe('loginAction', () => {
    it('should successfully login with valid credentials', async () => {
      const { hotel } = await seedTestData()
      const hashedPassword = await bcryptjs.hash('password123', 12)

      await testPrisma.user.create({
        data: {
          email: 'user@example.com',
          password: hashedPassword,
          hotelId: hotel.id,
          role: 'STAFF'
        }
      })

      mockedBcryptjs.compare.mockResolvedValue(true)

      const formData = new FormData()
      formData.append('email', 'user@example.com')
      formData.append('password', 'password123')
      formData.append('hotelId', hotel.id.toString())

      const result = await loginAction(null, formData)

      expect(result.success).toBe(true)
      expect(result.data?.email).toBe('user@example.com')
    })

    it('should reject invalid credentials', async () => {
      const { hotel } = await seedTestData()

      const formData = new FormData()
      formData.append('email', 'nonexistent@example.com')
      formData.append('password', 'wrongpassword')
      formData.append('hotelId', hotel.id.toString())

      const result = await loginAction(null, formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('INVALID_CREDENTIALS')
    })
  })
})