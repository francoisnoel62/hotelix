'use server'

import { prisma } from '@/lib/prisma'
import bcryptjs from 'bcryptjs'
import { AuthError, AuthResult, LoginRequest, RegisterRequest, UserSession } from '@/lib/types/auth'
import { validateLoginForm, validateRegisterForm } from '@/lib/validations/auth'

export async function registerAction(prevState: AuthResult<UserSession> | null, formData: FormData): Promise<AuthResult<UserSession>> {
  try {
    // Extraire les données du FormData
    const registerData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
      name: formData.get('name') as string || undefined,
      hotelId: parseInt(formData.get('hotelId') as string),
      role: (formData.get('role') as 'MANAGER' | 'STAFF') || 'STAFF'
    }

    // Validation
    const validationErrors = validateRegisterForm(registerData)
    if (Object.keys(validationErrors).length > 0) {
      return {
        success: false,
        error: AuthError.ValidationError,
        message: 'Données invalides',
        fieldErrors: validationErrors
      }
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: registerData.email }
    })

    if (existingUser) {
      return {
        success: false,
        error: AuthError.EmailTaken,
        message: 'Un utilisateur avec cet email existe déjà'
      }
    }

    // Vérifier si l'hôtel existe
    const hotel = await prisma.hotel.findUnique({
      where: { id: registerData.hotelId }
    })

    if (!hotel) {
      return {
        success: false,
        error: AuthError.HotelNotFound,
        message: 'Hôtel non trouvé'
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcryptjs.hash(registerData.password, 12)

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: registerData.email,
        password: hashedPassword,
        name: registerData.name,
        role: registerData.role,
        hotelId: registerData.hotelId
      },
      include: {
        hotel: true
      }
    })

    const userSession: UserSession = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hotelId: user.hotelId,
      hotel: user.hotel
    }

    return {
      success: true,
      data: userSession,
      message: 'Compte créé avec succès'
    }
  } catch (error) {
    console.error('Register action error:', error)
    return {
      success: false,
      error: AuthError.DatabaseError,
      message: 'Erreur lors de la création du compte'
    }
  }
}

export async function loginAction(prevState: AuthResult<UserSession> | null, formData: FormData): Promise<AuthResult<UserSession>> {
  try {
    // Extraire les données du FormData
    const loginData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      hotelId: parseInt(formData.get('hotelId') as string)
    }

    // Validation
    const validationErrors = validateLoginForm(loginData)
    if (Object.keys(validationErrors).length > 0) {
      return {
        success: false,
        error: AuthError.ValidationError,
        message: 'Données invalides',
        fieldErrors: validationErrors
      }
    }

    // Trouver l'utilisateur par email et hotelId
    const user = await prisma.user.findFirst({
      where: {
        email: loginData.email,
        hotelId: loginData.hotelId
      },
      include: {
        hotel: true
      }
    })

    if (!user) {
      return {
        success: false,
        error: AuthError.InvalidCredentials,
        message: 'Email, mot de passe ou hôtel incorrect'
      }
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcryptjs.compare(loginData.password, user.password)

    if (!isValidPassword) {
      return {
        success: false,
        error: AuthError.InvalidCredentials,
        message: 'Email, mot de passe ou hôtel incorrect'
      }
    }

    const userSession: UserSession = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hotelId: user.hotelId,
      hotel: user.hotel
    }

    return {
      success: true,
      data: userSession,
      message: 'Connexion réussie'
    }
  } catch (error) {
    console.error('Login action error:', error)
    return {
      success: false,
      error: AuthError.DatabaseError,
      message: 'Erreur lors de la connexion'
    }
  }
}

export async function logoutAction() {
  return {
    success: true,
    message: 'Déconnexion réussie'
  }
}

export async function getHotelsAction() {
  try {
    const hotels = await prisma.hotel.findMany({
      orderBy: { nom: 'asc' }
    })

    return {
      success: true,
      data: hotels
    }
  } catch (error) {
    console.error('Get hotels action error:', error)
    return {
      success: false,
      error: AuthError.DatabaseError,
      message: 'Erreur lors de la récupération des hôtels'
    }
  }
}