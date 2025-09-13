import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const hotels = await prisma.hotel.findMany({
      orderBy: { nom: 'asc' }
    })

    return NextResponse.json(
      {
        success: true,
        data: hotels
      },
      { status: 200 }
    )
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