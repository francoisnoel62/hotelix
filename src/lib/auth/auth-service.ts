import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'
import { AuthError, AuthResult, LoginRequest, RegisterRequest, UserSession } from '@/lib/types/auth'

const prisma = new PrismaClient()

export class AuthService {
  static async register(request: RegisterRequest): Promise<AuthResult<UserSession>> {
    try {
      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: request.email }
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
        where: { id: request.hotelId }
      })

      if (!hotel) {
        return {
          success: false,
          error: AuthError.HotelNotFound,
          message: 'Hôtel non trouvé'
        }
      }

      // Hasher le mot de passe
      const hashedPassword = await bcryptjs.hash(request.password, 12)

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email: request.email,
          password: hashedPassword,
          name: request.name,
          role: request.role || 'STAFF',
          hotelId: request.hotelId
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
      console.error('Register error:', error)
      return {
        success: false,
        error: AuthError.DatabaseError,
        message: 'Erreur lors de la création du compte'
      }
    }
  }

  static async login(request: LoginRequest): Promise<AuthResult<UserSession>> {
    try {
      // Trouver l'utilisateur par email et hotelId
      const user = await prisma.user.findFirst({
        where: {
          email: request.email,
          hotelId: request.hotelId
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
      const isValidPassword = await bcryptjs.compare(request.password, user.password)

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
      console.error('Login error:', error)
      return {
        success: false,
        error: AuthError.DatabaseError,
        message: 'Erreur lors de la connexion'
      }
    }
  }

  static async getHotels(): Promise<AuthResult<Array<{ id: number; nom: string; adresse: string; pays: string }>>> {
    try {
      const hotels = await prisma.hotel.findMany({
        orderBy: { nom: 'asc' }
      })

      return {
        success: true,
        data: hotels
      }
    } catch (error) {
      console.error('Get hotels error:', error)
      return {
        success: false,
        error: AuthError.DatabaseError,
        message: 'Erreur lors de la récupération des hôtels'
      }
    }
  }
}