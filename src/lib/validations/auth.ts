export interface LoginFormData {
  email: string
  password: string
  hotelId: number
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  name?: string
  hotelId: number
  role?: 'MANAGER' | 'STAFF'
}

export function validateEmail(email: string): string | null {
  if (!email) return 'Email requis'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Format d\'email invalide'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Mot de passe requis'
  if (password.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères'
  return null
}

export function validateHotelId(hotelId: number): string | null {
  if (!hotelId || hotelId < 1) return 'Hôtel requis'
  return null
}

export function validateRegisterForm(data: RegisterFormData): Record<string, string> {
  const errors: Record<string, string> = {}

  const emailError = validateEmail(data.email)
  if (emailError) errors.email = emailError

  const passwordError = validatePassword(data.password)
  if (passwordError) errors.password = passwordError

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Confirmation du mot de passe requise'
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Les mots de passe ne correspondent pas'
  }

  const hotelError = validateHotelId(data.hotelId)
  if (hotelError) errors.hotelId = hotelError

  return errors
}

export function validateLoginForm(data: LoginFormData): Record<string, string> {
  const errors: Record<string, string> = {}

  const emailError = validateEmail(data.email)
  if (emailError) errors.email = emailError

  const passwordError = validatePassword(data.password)
  if (passwordError) errors.password = passwordError

  const hotelError = validateHotelId(data.hotelId)
  if (hotelError) errors.hotelId = hotelError

  return errors
}