'use client'

import { useState, useEffect, useCallback } from 'react'
import { TechnicianListItem, TechnicianWithDetails, TechnicianStats } from '@/lib/types/technician'
import { getTechnicians, getTechnicianById, getTechnicianStats } from '@/app/actions/technician'

interface UseTechniciansDataReturn {
  technicians: TechnicianListItem[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useTechniciansData(hotelId: number): UseTechniciansDataReturn {
  const [technicians, setTechnicians] = useState<TechnicianListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getTechnicians(hotelId)
      setTechnicians(data)
    } catch (error) {
      console.error('Erreur chargement techniciens:', error)
      setError('Erreur lors du chargement des techniciens')
    } finally {
      setIsLoading(false)
    }
  }, [hotelId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const refresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  return {
    technicians,
    isLoading,
    error,
    refresh
  }
}

interface UseTechnicianDetailReturn {
  technician: TechnicianWithDetails | null
  stats: TechnicianStats | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useTechnicianDetail(
  technicianId: number,
  currentUserId: number,
  periodDays: number = 30
): UseTechnicianDetailReturn {
  const [technician, setTechnician] = useState<TechnicianWithDetails | null>(null)
  const [stats, setStats] = useState<TechnicianStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [technicianData, statsData] = await Promise.all([
        getTechnicianById(technicianId, currentUserId),
        getTechnicianStats(technicianId, periodDays)
      ])

      setTechnician(technicianData)
      setStats(statsData)
    } catch (error) {
      console.error('Erreur chargement détail technicien:', error)
      setError('Erreur lors du chargement des détails')
    } finally {
      setIsLoading(false)
    }
  }, [technicianId, currentUserId, periodDays])

  useEffect(() => {
    loadData()
  }, [loadData])

  const refresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  return {
    technician,
    stats,
    isLoading,
    error,
    refresh
  }
}