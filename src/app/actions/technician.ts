'use server'

import { prisma } from '@/lib/prisma'
import { TechnicianWithDetails, TechnicianListItem, TechnicianStats } from '@/lib/types/technician'
import { StatutIntervention } from '@prisma/client'
import { getInterventionCounts, getTechnicianStatus, getTechnicianStatsAction } from '@/app/actions/stats'

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export async function getTechnicians(hotelId: number): Promise<TechnicianListItem[]> {
  try {
    const techniciens = await prisma.user.findMany({
      where: {
        hotelId,
        role: 'TECHNICIEN'
      },
      include: {
        interventionsAssignees: {
          select: {
            id: true,
            statut: true,
            dateCreation: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Utiliser Promise.all pour calculer les statuts en parallèle
    const techniciensWithStats = await Promise.all(
      techniciens.map(async (technicien) => {
        const counts = await getInterventionCounts({
          hotelId,
          technicienId: technicien.id
        })

        const statut = await getTechnicianStatus(technicien.id)

        return {
          id: technicien.id,
          email: technicien.email,
          name: technicien.name,
          specialite: technicien.specialite,
          interventionsEnCours: counts.enCours,
          interventionsTotal: counts.total,
          dernierActivite: technicien.interventionsAssignees[0]?.dateCreation || null,
          statut,
          noteMoyenne: 4.2 // Placeholder
        }
      })
    )

    return techniciensWithStats
  } catch (error) {
    console.error('Erreur récupération techniciens:', error)
    return []
  }
}

export async function getTechnicianById(
  technicienId: number,
  currentUserId: number
): Promise<TechnicianWithDetails | null> {
  try {
    // Vérifier les permissions
    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } })
    if (!currentUser) {
      return null
    }

    const technicien = await prisma.user.findUnique({
      where: {
        id: technicienId,
        role: 'TECHNICIEN',
        hotelId: currentUser.hotelId // Seulement les techniciens du même hôtel
      },
      include: {
        hotel: true,
        interventionsAssignees: {
          include: {
            demandeur: {
              select: { id: true, name: true, email: true, role: true }
            },
            assigne: {
              select: { id: true, name: true, email: true, specialite: true }
            },
            zone: {
              select: { id: true, nom: true, type: true }
            },
            sousZone: {
              select: { id: true, nom: true }
            }
          },
          orderBy: {
            dateCreation: 'desc'
          }
        },
        _count: {
          select: {
            interventionsAssignees: true
          }
        }
      }
    })

    return technicien as TechnicianWithDetails
  } catch (error) {
    console.error('Erreur récupération technicien:', error)
    return null
  }
}

export async function getTechnicianStats(
  technicienId: number,
  periodDays: number = 30
): Promise<TechnicianStats | null> {
  try {
    return await getTechnicianStatsAction(technicienId, periodDays)
  } catch (error) {
    console.error('Erreur récupération statistiques technicien:', error)
    return null
  }
}

export async function getAvailableInterventions(hotelId: number) {
  try {
    const interventions = await prisma.intervention.findMany({
      where: {
        hotelId,
        OR: [
          { statut: StatutIntervention.EN_ATTENTE, assigneId: null },
          { statut: StatutIntervention.EN_COURS, assigneId: null }
        ]
      },
      include: {
        zone: {
          select: { id: true, nom: true, type: true }
        },
        sousZone: {
          select: { id: true, nom: true }
        },
        demandeur: {
          select: { id: true, name: true, email: true, role: true }
        },
        assigne: {
          select: { id: true, name: true, email: true, specialite: true }
        }
      },
      orderBy: [
        { priorite: 'desc' },
        { dateCreation: 'asc' }
      ]
    })

    return interventions
  } catch (error) {
    console.error('Erreur récupération interventions disponibles:', error)
    return []
  }
}

export async function assignInterventionToTechnician(
  interventionId: number,
  technicienId: number,
  assignedBy: number
): Promise<ActionResult> {
  try {
    // Vérifier que l'utilisateur qui assigne est manager
    const manager = await prisma.user.findUnique({ where: { id: assignedBy } })
    if (!manager || manager.role !== 'MANAGER') {
      return { success: false, error: 'Seul un manager peut assigner des interventions' }
    }

    // Vérifier que l'intervention existe et est disponible
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      include: { assigne: true }
    })

    if (!intervention) {
      return { success: false, error: 'Intervention non trouvée' }
    }

    if (intervention.assigneId) {
      return { success: false, error: 'Intervention déjà assignée' }
    }

    // Vérifier que le technicien existe
    const technicien = await prisma.user.findUnique({
      where: {
        id: technicienId,
        role: 'TECHNICIEN',
        hotelId: manager.hotelId
      }
    })

    if (!technicien) {
      return { success: false, error: 'Technicien non trouvé' }
    }

    // Assigner l'intervention
    const updated = await prisma.intervention.update({
      where: { id: interventionId },
      data: {
        assigneId: technicienId,
        statut: StatutIntervention.EN_ATTENTE
      }
    })

    return {
      success: true,
      data: updated,
      message: `Intervention assignée à ${technicien.name || technicien.email}`
    }
  } catch (error) {
    console.error('Erreur assignation intervention au technicien:', error)
    return {
      success: false,
      error: 'Erreur lors de l\'assignation'
    }
  }
}