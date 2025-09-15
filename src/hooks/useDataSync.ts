'use client'

import { useEffect, useCallback, useRef } from 'react'

interface SyncEvent {
  type: 'intervention_update' | 'technician_update' | 'assignment_change'
  timestamp: Date
  data?: any
}

export function useDataSync(
  onSyncRequired: () => Promise<void>,
  enablePolling: boolean = false,
  pollingInterval: number = 30000 // 30 secondes
) {
  const lastSyncRef = useRef<Date>(new Date())
  const pollingIntervalRef = useRef<NodeJS.Timeout>()

  // Synchronisation inter-onglets via localStorage
  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key === 'hotelix_data_sync' && event.newValue) {
      try {
        const syncEvent: SyncEvent = JSON.parse(event.newValue)
        if (syncEvent.timestamp > lastSyncRef.current) {
          lastSyncRef.current = syncEvent.timestamp
          onSyncRequired()
        }
      } catch (error) {
        console.error('Erreur parsing sync event:', error)
      }
    }
  }, [onSyncRequired])

  // Émettre un événement de synchronisation
  const triggerSync = useCallback((type: SyncEvent['type'], data?: any) => {
    const syncEvent: SyncEvent = {
      type,
      timestamp: new Date(),
      data
    }

    localStorage.setItem('hotelix_data_sync', JSON.stringify(syncEvent))

    // Nettoyer après 1 seconde pour éviter l'accumulation
    setTimeout(() => {
      localStorage.removeItem('hotelix_data_sync')
    }, 1000)
  }, [])

  // Polling optionnel pour détecter les changements
  useEffect(() => {
    if (enablePolling) {
      pollingIntervalRef.current = setInterval(async () => {
        await onSyncRequired()
      }, pollingInterval)

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    }
  }, [enablePolling, pollingInterval, onSyncRequired])

  // Écouter les changements localStorage
  useEffect(() => {
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [handleStorageChange])

  // Synchronisation au focus de la fenêtre
  useEffect(() => {
    const handleFocus = () => {
      onSyncRequired()
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [onSyncRequired])

  return { triggerSync }
}