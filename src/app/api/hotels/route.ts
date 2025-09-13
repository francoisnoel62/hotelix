import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth/auth-service'

export async function GET() {
  try {
    const result = await AuthService.getHotels()

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Hotels API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Erreur interne du serveur'
      },
      { status: 500 }
    )
  }
}