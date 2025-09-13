'use server'

import { prisma } from '@/lib/prisma'
import bcryptjs from 'bcryptjs'
import { AuthError, AuthResult, UserSession } from '@/lib/types/auth'
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

export async function updateProfileAction(
  prevState: AuthResult<UserSession> | null,
  formData: FormData
): Promise<AuthResult<UserSession>> {
  try {
    const profileData = {
      id: parseInt(formData.get('id') as string),
      name: formData.get('name') as string || undefined,
      email: formData.get('email') as string,
      role: (formData.get('role') as 'MANAGER' | 'STAFF') || 'STAFF',
      currentPassword: formData.get('currentPassword') as string || undefined,
      newPassword: formData.get('newPassword') as string || undefined,
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: profileData.id },
      include: { hotel: true }
    })

    if (!existingUser) {
      return {
        success: false,
        error: AuthError.InvalidCredentials,
        message: 'Utilisateur non trouvé'
      }
    }

    // Si changement de mot de passe, vérifier le mot de passe actuel
    if (profileData.newPassword && profileData.currentPassword) {
      const isValidPassword = await bcryptjs.compare(profileData.currentPassword, existingUser.password)
      if (!isValidPassword) {
        return {
          success: false,
          error: AuthError.InvalidCredentials,
          message: 'Mot de passe actuel incorrect'
        }
      }
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (profileData.email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: profileData.email,
          id: { not: profileData.id }
        }
      })

      if (emailExists) {
        return {
          success: false,
          error: AuthError.EmailTaken,
          message: 'Un utilisateur avec cet email existe déjà'
        }
      }
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {
      name: profileData.name,
      email: profileData.email,
      role: profileData.role
    }

    // Ajouter le nouveau mot de passe si fourni
    if (profileData.newPassword) {
      updateData.password = await bcryptjs.hash(profileData.newPassword, 12)
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: profileData.id },
      data: updateData,
      include: { hotel: true }
    })

    const userSession: UserSession = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      hotelId: updatedUser.hotelId,
      hotel: updatedUser.hotel
    }

    return {
      success: true,
      data: userSession,
      message: 'Profil mis à jour avec succès'
    }
  } catch (error) {
    console.error('Update profile action error:', error)
    return {
      success: false,
      error: AuthError.DatabaseError,
      message: 'Erreur lors de la mise à jour du profil'
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