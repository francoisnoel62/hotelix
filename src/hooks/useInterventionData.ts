'use client'

import { useState, useEffect, useCallback } from 'react'
import { InterventionWithRelations } from '@/lib/types/intervention'
import { GlobalStats } from '@/lib/services/stats'
import { getInterventions } from '@/app/actions/intervention'
import { getGlobalStats } from '@/app/actions/stats'
import { StatutIntervention } from '@prisma/client'

interface UseInterventionDataReturn {
  interventions: InterventionWithRelations[]
  stats: GlobalStats | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  updateOptimistic: (interventionId: number, updates: Partial<InterventionWithRelations>) => void
}

export function useInterventionData(
  hotelId: number,
  userId: number,
  userRole: string,
  includeStats: boolean = true
): UseInterventionDataReturn {
  const [interventions, setInterventions] = useState<InterventionWithRelations[]>([])
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Charger les interventions
      const interventionsData = await getInterventions(hotelId, userId, userRole)
      setInterventions(interventionsData)

      // Charger les stats si demandées
      if (includeStats) {
        const statsData = await getGlobalStats(hotelId)
        setStats(statsData)
      }
    } catch (error) {
      console.error('Erreur chargement données interventions:', error)
      setError('Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }, [hotelId, userId, userRole, includeStats])

  // Fonction pour calculer les stats optimistes
  const calculateOptimisticStats = useCallback((currentInterventions: InterventionWithRelations[]): GlobalStats => {
    const total = currentInterventions.length
    const enCours = currentInterventions.filter(i => i.statut === StatutIntervention.EN_COURS).length
    const enAttente = currentInterventions.filter(i => i.statut === StatutIntervention.EN_ATTENTE).length
    const terminees = currentInterventions.filter(i => i.statut === StatutIntervention.TERMINEE).length
    const annulees = currentInterventions.filter(i => i.statut === StatutIntervention.ANNULEE).length
    const tauxReussite = total > 0 ? Math.round((terminees / total) * 100) : 0

    return {
      totalInterventions: total,
      enCours,
      enAttente,
      terminees,
      annulees,
      tauxReussite,
      tempsMoyenResolution: stats?.tempsMoyenResolution || 0
    }
  }, [stats])

  // Fonction pour mise à jour optimiste
  const updateOptimistic = useCallback((interventionId: number, updates: Partial<InterventionWithRelations>) => {
    setInterventions(current => {
      const updated = current.map(intervention =>
        intervention.id === interventionId ? { ...intervention, ...updates } : intervention
      )

      // Recalculer les stats optimistes si nécessaire
      if (includeStats && updates.statut) {
        const optimisticStats = calculateOptimisticStats(updated)
        setStats(optimisticStats)
      }

      return updated
    })
  }, [includeStats, calculateOptimisticStats])

  useEffect(() => {
    if (hotelId > 0 && userId > 0) {
      loadData()
    }
  }, [loadData, hotelId, userId])

  const refresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  return {
    interventions,
    stats,
    isLoading,
    error,
    refresh,
    updateOptimistic
  }
}