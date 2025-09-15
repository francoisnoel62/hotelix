import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validateHotelId,
  validateRegisterForm,
  validateLoginForm
} from '../auth'

describe('Auth Validation Functions', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBeNull()
      expect(validateEmail('test.email+tag@domain.co.uk')).toBeNull()
    })

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe('Format d\'email invalide')
      expect(validateEmail('user@')).toBe('Format d\'email invalide')
      expect(validateEmail('@domain.com')).toBe('Format d\'email invalide')
    })

    it('should reject empty email', () => {
      expect(validateEmail('')).toBe('Email requis')
    })
  })

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      expect(validatePassword('password123')).toBeNull()
      expect(validatePassword('secureP@ssw0rd!')).toBeNull()
    })

    it('should reject short passwords', () => {
      expect(validatePassword('12345')).toBe('Le mot de passe doit contenir au moins 6 caractères')
    })

    it('should reject empty password', () => {
      expect(validatePassword('')).toBe('Mot de passe requis')
    })
  })

  describe('validateHotelId', () => {
    it('should accept valid hotel IDs', () => {
      expect(validateHotelId(1)).toBeNull()
      expect(validateHotelId(999)).toBeNull()
    })

    it('should reject invalid hotel IDs', () => {
      expect(validateHotelId(0)).toBe('Hôtel requis')
      expect(validateHotelId(-1)).toBe('Hôtel requis')
    })
  })

  describe('validateRegisterForm', () => {
    it('should validate complete registration form', () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        hotelId: 1
      }

      expect(validateRegisterForm(validData)).toEqual({})
    })

    it('should return multiple validation errors', () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
        confirmPassword: 'different',
        hotelId: 0
      }

      const errors = validateRegisterForm(invalidData)

      expect(errors.email).toBe('Format d\'email invalide')
      expect(errors.password).toBe('Le mot de passe doit contenir au moins 6 caractères')
      expect(errors.confirmPassword).toBe('Les mots de passe ne correspondent pas')
      expect(errors.hotelId).toBe('Hôtel requis')
    })
  })
})