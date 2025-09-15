'use client'

import { useState, useEffect, useCallback } from 'react'
import { InterventionWithRelations } from '@/lib/types/intervention'
import { GlobalStats } from '@/lib/services/stats'
import { getInterventions } from '@/app/actions/intervention'
import { getGlobalStats } from '@/app/actions/stats'

interface UseInterventionDataReturn {
  interventions: InterventionWithRelations[]
  stats: GlobalStats | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
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

  useEffect(() => {
    loadData()
  }, [loadData])

  const refresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  return {
    interventions,
    stats,
    isLoading,
    error,
    refresh
  }
}