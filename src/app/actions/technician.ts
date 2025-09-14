'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { TechnicianWithDetails, TechnicianListItem, TechnicianStats } from '@/lib/types/technician'
import { StatutIntervention } from '@prisma/client'

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

    return techniciens.map(technicien => {
      const interventionsEnCours = technicien.interventionsAssignees.filter(
        i => i.statut === StatutIntervention.EN_COURS
      ).length
      const interventionsTotal = technicien.interventionsAssignees.length
      const dernierActivite = technicien.interventionsAssignees.length > 0
        ? technicien.interventionsAssignees[0].dateCreation
        : null

      // Déterminer le statut basé sur les interventions en cours
      let statut: 'DISPONIBLE' | 'OCCUPE' | 'HORS_LIGNE' = 'DISPONIBLE'
      if (interventionsEnCours > 0) {
        statut = interventionsEnCours >= 3 ? 'OCCUPE' : 'DISPONIBLE'
      }

      return {
        id: technicien.id,
        email: technicien.email,
        name: technicien.name,
        specialite: technicien.specialite,
        interventionsEnCours,
        interventionsTotal,
        dernierActivite,
        statut,
        noteMoyenne: 4.2 // Placeholder - à implémenter avec un système de notes
      }
    })
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
    const dateDebut = new Date()
    dateDebut.setDate(dateDebut.getDate() - periodDays)

    // Récupérer toutes les interventions de la période
    const interventions = await prisma.intervention.findMany({
      where: {
        assigneId: technicienId,
        dateCreation: {
          gte: dateDebut
        }
      },
      select: {
        type: true,
        statut: true,
        dateCreation: true,
        dateDebut: true,
        dateFin: true
      }
    })

    // Calculer les interventions par jour (10 derniers jours)
    const interventionsParJour = []
    for (let i = 9; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const count = interventions.filter(intervention => {
        const interventionDate = new Date(intervention.dateCreation).toISOString().split('T')[0]
        return interventionDate === dateStr
      }).length

      interventionsParJour.push({
        date: dateStr,
        count
      })
    }

    // Calculer le temps moyen par intervention (pour les terminées)
    const interventionsTerminees = interventions.filter(
      i => i.statut === StatutIntervention.TERMINEE && i.dateDebut && i.dateFin
    )

    let tempsMoyenIntervention = 0
    if (interventionsTerminees.length > 0) {
      const tempsTotal = interventionsTerminees.reduce((total, intervention) => {
        const debut = new Date(intervention.dateDebut!)
        const fin = new Date(intervention.dateFin!)
        return total + (fin.getTime() - debut.getTime())
      }, 0)
      tempsMoyenIntervention = Math.round(tempsTotal / interventionsTerminees.length / (1000 * 60)) // en minutes
    }

    // Calculer le taux de réussite
    const totalInterventions = interventions.length
    const interventionsReussies = interventions.filter(
      i => i.statut === StatutIntervention.TERMINEE
    ).length
    const tauxReussite = totalInterventions > 0
      ? Math.round((interventionsReussies / totalInterventions) * 100)
      : 0

    // Répartition par type
    const typeCount: { [key: string]: number } = {}
    interventions.forEach(intervention => {
      typeCount[intervention.type] = (typeCount[intervention.type] || 0) + 1
    })

    const repartitionParType = Object.entries(typeCount).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / totalInterventions) * 100)
    }))

    // Totaux mensuel
    const totauxMensuel = {
      enCours: interventions.filter(i => i.statut === StatutIntervention.EN_COURS).length,
      terminees: interventions.filter(i => i.statut === StatutIntervention.TERMINEE).length,
      annulees: interventions.filter(i => i.statut === StatutIntervention.ANNULEE).length,
      enAttente: interventions.filter(i => i.statut === StatutIntervention.EN_ATTENTE).length
    }

    return {
      interventionsParJour,
      tempsMoyenIntervention,
      tauxReussite,
      repartitionParType,
      totauxMensuel
    }
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
        statut: StatutIntervention.EN_ATTENTE,
        assigneId: null
      },
      include: {
        zone: {
          select: { nom: true }
        },
        sousZone: {
          select: { nom: true }
        },
        demandeur: {
          select: { name: true, email: true }
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

    revalidatePath('/dashboard/techniciens')
    revalidatePath('/dashboard')

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