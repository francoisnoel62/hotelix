'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { UserSession } from '@/lib/types/auth'
import { TechnicianWithDetails, TechnicianStats } from '@/lib/types/technician'
import { InterventionWithRelations } from '@/lib/types/intervention'
import { logoutAction } from '@/app/actions/auth'
import { getTechnicianById, getTechnicianStats, getAvailableInterventions, assignInterventionToTechnician } from '@/app/actions/technician'
import { InterventionsList } from '@/components/interventions/interventions-list'
import { TechnicianStatsModule } from '@/components/technicians/technician-stats'
import { TechnicianAssignment } from '@/components/technicians/technician-assignment'
import { TechnicianChat } from '@/components/technicians/technician-chat'
import { useToast } from '@/components/ui/toast'

export default function TechnicianDetailPage() {
  const router = useRouter()
  const params = useParams()
  const technicianId = parseInt(params.id as string)
  const { toast } = useToast()

  const [user, setUser] = useState<UserSession | null>(null)
  const [technician, setTechnician] = useState<TechnicianWithDetails | null>(null)
  const [stats, setStats] = useState<TechnicianStats | null>(null)
  const [availableInterventions, setAvailableInterventions] = useState<InterventionWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'interventions' | 'stats' | 'assignment' | 'chat'>('interventions')

  useEffect(() => {
    const loadData = async () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)

        // Seuls les managers peuvent voir les détails des techniciens
        if (parsedUser.role !== 'MANAGER') {
          router.push('/dashboard')
          return
        }

        // Charger les données du technicien
        const technicianData = await getTechnicianById(technicianId, parsedUser.id)
        if (technicianData) {
          setTechnician(technicianData)

          // Charger les statistiques
          const statsData = await getTechnicianStats(technicianId)
          setStats(statsData)

          // Charger les interventions disponibles
          const interventionsData = await getAvailableInterventions(parsedUser.hotelId)
          setAvailableInterventions(interventionsData as InterventionWithRelations[])
        } else {
          toast({
            variant: 'error',
            title: 'Erreur',
            description: 'Technicien non trouvé'
          })
          router.push('/dashboard/techniciens')
        }
      } else {
        router.push('/auth')
      }
      setIsLoading(false)
    }

    loadData()
  }, [technicianId, router, toast])

  const handleLogout = async () => {
    try {
      await logoutAction()
      localStorage.removeItem('user')
      router.push('/auth')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleProfileUpdate = (updatedUser: UserSession) => {
    setUser(updatedUser)
  }

  const refreshTechnician = async () => {
    if (user) {
      const technicianData = await getTechnicianById(technicianId, user.id)
      if (technicianData) {
        setTechnician(technicianData)
        const statsData = await getTechnicianStats(technicianId)
        setStats(statsData)
      }
    }
  }

  const handleOptimisticUpdate = (interventionId: number, updates: Partial<InterventionWithRelations>) => {
    setTechnician(prev => {
      if (!prev) return prev

      // Si l'assigneId change et n'est plus le technicien courant, supprimer l'intervention de sa liste
      if (updates.assigneId !== undefined && updates.assigneId !== technicianId) {
        return {
          ...prev,
          interventionsAssignees: prev.interventionsAssignees.filter(intervention =>
            intervention.id !== interventionId
          ),
          _count: {
            ...prev._count,
            interventionsAssignees: prev._count.interventionsAssignees - 1
          }
        }
      }

      // Sinon, mettre à jour l'intervention normalement
      return {
        ...prev,
        interventionsAssignees: prev.interventionsAssignees.map(intervention =>
          intervention.id === interventionId ? { ...intervention, ...updates } : intervention
        )
      }
    })
  }

  const handleAssignIntervention = async (interventionId: number) => {
    if (!user) return

    const result = await assignInterventionToTechnician(interventionId, technicianId, user.id)
    if (result.success) {
      toast({
        variant: 'success',
        title: 'Intervention assignée',
        description: result.message
      })
      await refreshTechnician()
      // Recharger les interventions disponibles
      const interventionsData = await getAvailableInterventions(user.hotelId)
      setAvailableInterventions(interventionsData as InterventionWithRelations[])
    } else {
      toast({
        variant: 'error',
        title: 'Erreur',
        description: result.error
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user || !technician) {
    return null
  }

  const getStatutColor = (interventionsEnCours: number) => {
    if (interventionsEnCours === 0) return 'text-green-600 bg-green-100'
    if (interventionsEnCours < 3) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatutText = (interventionsEnCours: number) => {
    if (interventionsEnCours === 0) return 'Disponible'
    if (interventionsEnCours < 3) return 'Occupé'
    return 'Surchargé'
  }

  const interventionsEnAttente = technician.interventionsAssignees.filter(i => i.statut === 'EN_ATTENTE')
  const interventionsEnCours = technician.interventionsAssignees.filter(i => i.statut === 'EN_COURS')
  const interventionsPassees = technician.interventionsAssignees.filter(i => i.statut === 'TERMINEE' || i.statut === 'ANNULEE')

  return (
    <DashboardLayout user={user} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate}>
      <div className="space-y-6">
        {/* Header with technician info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {technician.name || technician.email}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutColor(interventionsEnCours.length)}`}>
                    {getStatutText(interventionsEnCours.length)}
                  </span>
                  {technician.specialite && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {technician.specialite}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">{technician.email}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard/techniciens')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Retour à la liste
            </button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{interventionsEnAttente.length}</div>
              <div className="text-sm text-gray-500">En attente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{interventionsEnCours.length}</div>
              <div className="text-sm text-gray-500">En cours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{technician._count.interventionsAssignees}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats?.tauxReussite || 0}%</div>
              <div className="text-sm text-gray-500">Taux réussite</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats?.tempsMoyenIntervention || 0}min</div>
              <div className="text-sm text-gray-500">Temps moyen</div>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white rounded-lg shadow">
          <nav className="flex space-x-8 px-6 py-3 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('interventions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'interventions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Interventions ({technician._count.interventionsAssignees})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Statistiques
            </button>
            <button
              onClick={() => setActiveTab('assignment')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Affectation ({availableInterventions.length})
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'chat'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Messagerie
            </button>
          </nav>

          <div className="p-6">
            {activeTab === 'interventions' && (
              <div className="space-y-6">
                {interventionsEnAttente.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Interventions en attente
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        À démarrer
                      </span>
                    </h3>
                    <InterventionsList
                      interventions={interventionsEnAttente}
                      user={user}
                      onRefresh={refreshTechnician}
                      onOptimisticUpdate={handleOptimisticUpdate}
                    />
                  </div>
                )}

                {interventionsEnCours.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Interventions en cours</h3>
                    <InterventionsList
                      interventions={interventionsEnCours}
                      user={user}
                      onRefresh={refreshTechnician}
                      onOptimisticUpdate={handleOptimisticUpdate}
                    />
                  </div>
                )}

                {interventionsPassees.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Interventions passées</h3>
                    <InterventionsList
                      interventions={interventionsPassees}
                      user={user}
                      onRefresh={refreshTechnician}
                      onOptimisticUpdate={handleOptimisticUpdate}
                    />
                  </div>
                )}

                {technician._count.interventionsAssignees === 0 && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune intervention</h3>
                    <p className="mt-1 text-sm text-gray-500">Ce technicien n'a pas encore d'interventions assignées.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <TechnicianStatsModule stats={stats} />
            )}

            {activeTab === 'assignment' && (
              <TechnicianAssignment
                availableInterventions={availableInterventions}
                onAssign={handleAssignIntervention}
              />
            )}

            {activeTab === 'chat' && (
              <TechnicianChat
                currentUser={user}
                technician={technician}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}