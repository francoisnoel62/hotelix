'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { InterventionFormData } from '@/lib/types/intervention'
import { StatutIntervention } from '@prisma/client'
import { StatsService } from '@/lib/services/stats'

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export async function createIntervention(
  formData: InterventionFormData & { demandeurId: number; hotelId: number }
): Promise<ActionResult> {
  try {
    const intervention = await prisma.intervention.create({
      data: {
        titre: formData.titre,
        description: formData.description,
        type: formData.type,
        priorite: formData.priorite,
        origine: formData.origine,
        hotelId: formData.hotelId,
        demandeurId: formData.demandeurId,
        zoneId: formData.zoneId,
        sousZoneId: formData.sousZoneId,
        assigneId: formData.assigneId,
      },
    })

    revalidatePath('/dashboard')

    return {
      success: true,
      data: intervention,
      message: 'Intervention créée avec succès'
    }
  } catch (error) {
    console.error('Erreur création intervention:', error)
    return {
      success: false,
      error: 'Erreur lors de la création de l\'intervention'
    }
  }
}

export async function updateInterventionStatut(
  interventionId: number,
  nouveauStatut: StatutIntervention,
  userId: number
): Promise<ActionResult> {
  try {
    // Vérifier que l'utilisateur peut modifier cette intervention
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      include: { assigne: true, demandeur: true }
    })

    if (!intervention) {
      return { success: false, error: 'Intervention non trouvée' }
    }

    // Vérifier les permissions
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { success: false, error: 'Utilisateur non trouvé' }
    }

    // MANAGER peut tout modifier
    // TECHNICIEN ne peut modifier que ses interventions assignées
    // STAFF ne peut pas modifier le statut
    const peutModifier =
      user.role === 'MANAGER' ||
      (user.role === 'TECHNICIEN' && intervention.assigneId === userId)

    if (!peutModifier) {
      return { success: false, error: 'Permission insuffisante pour modifier cette intervention' }
    }

    const updated = await prisma.intervention.update({
      where: { id: interventionId },
      data: {
        statut: nouveauStatut,
        dateDebut: nouveauStatut === StatutIntervention.EN_COURS && !intervention.dateDebut ? new Date() : intervention.dateDebut,
        dateFin: nouveauStatut === StatutIntervention.TERMINEE ? new Date() : null
      }
    })

    // Invalider le cache avant la revalidation
    StatsService.invalidateCache(intervention.hotelId, intervention.assigneId || undefined)

    // Revalidation complète pour synchronisation
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/techniciens')
    revalidatePath(`/dashboard/techniciens/[id]`, 'page')

    return {
      success: true,
      data: updated,
      message: `Statut mis à jour: ${nouveauStatut}`
    }
  } catch (error) {
    console.error('Erreur mise à jour statut:', error)
    return {
      success: false,
      error: 'Erreur lors de la mise à jour du statut'
    }
  }
}

export async function assignerIntervention(
  interventionId: number,
  technicienId: number,
  managerId: number
): Promise<ActionResult> {
  try {
    // Vérifier que l'utilisateur est manager
    const manager = await prisma.user.findUnique({ where: { id: managerId } })
    if (!manager || manager.role !== 'MANAGER') {
      return { success: false, error: 'Seul un manager peut assigner des interventions' }
    }

    // Si technicienId est 0, on désassigne
    if (technicienId === 0) {
      const intervention = await prisma.intervention.findUnique({ where: { id: interventionId } })
      if (!intervention) {
        return { success: false, error: 'Intervention non trouvée' }
      }

      const updated = await prisma.intervention.update({
        where: { id: interventionId },
        data: {
          assigneId: null,
          statut: StatutIntervention.EN_ATTENTE
        }
      })

      // Invalider le cache pour l'hôtel et l'ancien technicien
      const oldTechnicienId = intervention.assigneId
      StatsService.invalidateCache(intervention.hotelId, oldTechnicienId || undefined)

      // Revalidation complète pour synchronisation
      revalidatePath('/dashboard')
      revalidatePath('/dashboard/techniciens')
      revalidatePath(`/dashboard/techniciens/[id]`, 'page')

      return {
        success: true,
        data: updated,
        message: 'Intervention désassignée'
      }
    }

    // Vérifier que le technicien existe et est bien technicien
    const technicien = await prisma.user.findUnique({ where: { id: technicienId } })
    if (!technicien || technicien.role !== 'TECHNICIEN') {
      return { success: false, error: 'Technicien non trouvé ou rôle invalide' }
    }

    // Récupérer l'intervention pour obtenir l'ancien technicien
    const intervention = await prisma.intervention.findUnique({ where: { id: interventionId } })
    if (!intervention) {
      return { success: false, error: 'Intervention non trouvée' }
    }

    const updated = await prisma.intervention.update({
      where: { id: interventionId },
      data: {
        assigneId: technicienId,
        statut: StatutIntervention.EN_ATTENTE
      }
    })

    // Invalider le cache pour l'hôtel et les deux techniciens (ancien et nouveau)
    const oldTechnicienId = intervention.assigneId
    StatsService.invalidateCache(intervention.hotelId, oldTechnicienId || undefined)
    if (technicienId !== oldTechnicienId) {
      StatsService.invalidateCache(intervention.hotelId, technicienId)
    }

    // Revalidation complète pour synchronisation
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/techniciens')
    revalidatePath(`/dashboard/techniciens/[id]`, 'page')

    return {
      success: true,
      data: updated,
      message: `Intervention assignée à ${technicien.name || technicien.email}`
    }
  } catch (error) {
    console.error('Erreur assignation:', error)
    return {
      success: false,
      error: 'Erreur lors de l\'assignation'
    }
  }
}

export async function getInterventions(
  hotelId: number,
  userId: number,
  userRole: string,
  includeStats: boolean = false
) {
  try {
    const whereClause: Record<string, unknown> = { hotelId }

    // Filtrer selon le rôle
    if (userRole === 'TECHNICIEN') {
      whereClause.assigneId = userId
    }
    // MANAGER et STAFF voient toutes les interventions de l'hôtel

    const interventions = await prisma.intervention.findMany({
      where: whereClause,
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
    })

    // Si les stats sont demandées, les ajouter à la réponse
    if (includeStats) {
      const stats = await StatsService.getGlobalStats(hotelId)
      // Ajouter les stats au contexte de retour (pattern à définir)
    }

    return interventions
  } catch (error) {
    console.error('Erreur récupération interventions:', error)
    return []
  }
}

export async function getZones(hotelId: number) {
  try {
    const zones = await prisma.zone.findMany({
      where: { hotelId },
      include: {
        sousZones: {
          select: { id: true, nom: true }
        }
      }
    })

    return zones
  } catch (error) {
    console.error('Erreur récupération zones:', error)
    return []
  }
}

export async function updateIntervention(
  interventionId: number,
  formData: Partial<InterventionFormData>,
  userId: number
): Promise<ActionResult> {
  try {
    // Vérifier que l'intervention existe
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      include: { assigne: true, demandeur: true }
    })

    if (!intervention) {
      return { success: false, error: 'Intervention non trouvée' }
    }

    // Vérifier les permissions
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { success: false, error: 'Utilisateur non trouvé' }
    }

    // MANAGER peut tout modifier
    // TECHNICIEN ne peut modifier que ses interventions assignées
    // STAFF ne peut pas modifier les interventions
    const peutModifier =
      user.role === 'MANAGER' ||
      (user.role === 'TECHNICIEN' && intervention.assigneId === userId)

    if (!peutModifier) {
      return { success: false, error: 'Permission insuffisante pour modifier cette intervention' }
    }

    // Empêcher la modification si l'intervention est terminée ou annulée
    if (intervention.statut === StatutIntervention.TERMINEE || intervention.statut === StatutIntervention.ANNULEE) {
      return { success: false, error: 'Impossible de modifier une intervention terminée ou annulée' }
    }

    const updated = await prisma.intervention.update({
      where: { id: interventionId },
      data: {
        titre: formData.titre,
        description: formData.description,
        type: formData.type,
        priorite: formData.priorite,
        zoneId: formData.zoneId,
        sousZoneId: formData.sousZoneId,
        // On ne permet pas de changer l'assigné ici (utilisé ailleurs)
        // On ne change pas l'origine non plus
      }
    })

    revalidatePath('/dashboard')

    return {
      success: true,
      data: updated,
      message: 'Intervention mise à jour avec succès'
    }
  } catch (error) {
    console.error('Erreur mise à jour intervention:', error)
    return {
      success: false,
      error: 'Erreur lors de la mise à jour de l\'intervention'
    }
  }
}

export async function getTechniciens(hotelId: number) {
  try {
    const techniciens = await prisma.user.findMany({
      where: {
        hotelId,
        role: 'TECHNICIEN'
      },
      select: {
        id: true,
        name: true,
        email: true,
        specialite: true
      }
    })

    return techniciens
  } catch (error) {
    console.error('Erreur récupération techniciens:', error)
    return []
  }
}