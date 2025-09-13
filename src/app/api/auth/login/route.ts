import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth/auth-service'
import { validateLoginForm } from '@/lib/validations/auth'
import { AuthError } from '@/lib/types/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation
    const validationErrors = validateLoginForm(body)
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: AuthError.ValidationError,
          message: 'Données invalides',
          details: validationErrors
        },
        { status: 400 }
      )
    }

    const result = await AuthService.login(body)

    if (!result.success) {
      const statusCode = result.error === AuthError.InvalidCredentials ? 401 : 400
      return NextResponse.json(result, { status: statusCode })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: AuthError.DatabaseError,
        message: 'Erreur interne du serveur'
      },
      { status: 500 }
    )
  }
}