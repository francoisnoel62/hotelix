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
}

export interface LoginRequest {
  email: string
  password: string
  hotelId: number
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
  hotelId: number
  role?: 'MANAGER' | 'STAFF'
}

export interface UserSession {
  id: number
  email: string
  name: string | null
  role: 'MANAGER' | 'STAFF'
  hotelId: number
  hotel: {
    id: number
    nom: string
    adresse: string
    pays: string
  }
}