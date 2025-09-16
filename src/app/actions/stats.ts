'use server'

import { StatsService, GlobalStats, TechnicianStats, InterventionCounts, StatsFilters } from '@/lib/services/stats'

/**
 * Server Action pour récupérer les statistiques globales d'un hôtel
 */
export async function getGlobalStats(hotelId: number, periodDays?: number): Promise<GlobalStats> {
  try {
    return await StatsService.getGlobalStats(hotelId, periodDays)
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques globales:', error)
    throw new Error('Impossible de récupérer les statistiques globales')
  }
}

/**
 * Server Action pour récupérer les statistiques détaillées d'un technicien
 */
export async function getTechnicianStatsAction(
  technicienId: number, 
  periodDays: number = 30
): Promise<TechnicianStats> {
  try {
    return await StatsService.getTechnicianStats(technicienId, periodDays)
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques du technicien:', error)
    throw new Error('Impossible de récupérer les statistiques du technicien')
  }
}

/**
 * Server Action pour récupérer les compteurs d'interventions avec filtres
 */
export async function getInterventionCounts(filters: StatsFilters): Promise<InterventionCounts> {
  try {
    return await StatsService.getInterventionCounts(filters)
  } catch (error) {
    console.error('Erreur lors de la récupération des compteurs d\'interventions:', error)
    throw new Error('Impossible de récupérer les compteurs d\'interventions')
  }
}

/**
 * Server Action pour récupérer le statut d'un technicien
 */
export async function getTechnicianStatus(technicienId: number): Promise<'DISPONIBLE' | 'OCCUPE' | 'HORS_LIGNE'> {
  try {
    return await StatsService.getTechnicianStatus(technicienId)
  } catch (error) {
    console.error('Erreur lors de la récupération du statut du technicien:', error)
    throw new Error('Impossible de récupérer le statut du technicien')
  }
}

