export enum AuthError {
  InvalidCredentials = 'INVALID_CREDENTIALS',
  EmailTaken = 'EMAIL_TAKEN',
  UserNotFound = 'USER_NOT_FOUND',
  HotelNotFound = 'HOTEL_NOT_FOUND',
  ValidationError = 'VALIDATION_ERROR',
  DatabaseError = 'DATABASE_ERROR',
}

export interface AuthResult<T = null> {
  success: boolean
  data?: T
  error?: AuthError
  message?: string
  fieldErrors?: Record<string, string>
}

// Types unifiés pour l'authentification
export interface AuthFormData {
  email: string
  password: string
  hotelId: number
}

export interface RegisterFormData extends AuthFormData {
  confirmPassword: string
  name?: string
  role?: 'MANAGER' | 'STAFF' | 'TECHNICIEN'
  specialite?: string
}

export interface LoginFormData extends AuthFormData {
  // This interface extends AuthFormData without additional properties
}

// Types pour les Server Actions (sans confirmPassword)
export interface RegisterRequest {
  email: string
  password: string
  name?: string
  hotelId: number
  role?: 'MANAGER' | 'STAFF' | 'TECHNICIEN'
  specialite?: string
}

export interface LoginRequest extends AuthFormData {
  // This interface extends AuthFormData without additional properties
}

export interface UserSession {
  id: number
  email: string
  name: string | null
  role: 'MANAGER' | 'STAFF' | 'TECHNICIEN'
  specialite?: string | null
  hotelId: number
  hotel: {
    id: number
    nom: string
    adresse: string
    pays: string
  }
}

export interface Hotel {
  id: number
  nom: string
  adresse: string
  pays: string
}