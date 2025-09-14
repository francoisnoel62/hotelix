'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { UserSession } from '@/lib/types/auth'
import { InterventionWithRelations } from '@/lib/types/intervention'
import { logoutAction } from '@/app/actions/auth'
import { getInterventions } from '@/app/actions/intervention'
import { InterventionsList } from '@/components/interventions/interventions-list'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(null)
  const [interventions, setInterventions] = useState<InterventionWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInterventionForm, setShowInterventionForm] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)

        const interventionsData = await getInterventions(
          parsedUser.hotelId,
          parsedUser.id,
          parsedUser.role
        )
        setInterventions(interventionsData)
      } else {
        router.push('/auth')
      }
      setIsLoading(false)
    }

    loadData()
  }, [router])

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

  const refreshInterventions = async () => {
    if (user) {
      const interventionsData = await getInterventions(
        user.hotelId,
        user.id,
        user.role
      )
      setInterventions(interventionsData)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'Manager'
      case 'STAFF': return 'Personnel'
      case 'TECHNICIEN': return 'Technicien'
      default: return 'Utilisateur'
    }
  }

  const getStatsForRole = (role: string, interventions: InterventionWithRelations[]) => {
    const enCours = interventions.filter(i => i.statut === 'EN_COURS').length
    const enAttente = interventions.filter(i => i.statut === 'EN_ATTENTE').length
    const terminees = interventions.filter(i => i.statut === 'TERMINEE').length

    if (role === 'TECHNICIEN') {
      return {
        title: 'Mes interventions',
        stats: [
          { label: 'En cours', value: enCours, color: 'blue' },
          { label: 'En attente', value: enAttente, color: 'orange' },
          { label: 'Terminées', value: terminees, color: 'green' }
        ]
      }
    }

    return {
      title: 'Interventions',
      stats: [
        { label: 'En cours', value: enCours, color: 'blue' },
        { label: 'En attente', value: enAttente, color: 'orange' },
        { label: 'Total', value: interventions.length, color: 'purple' }
      ]
    }
  }

  const stats = getStatsForRole(user.role, interventions)

  return (
    <DashboardLayout user={user} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bienvenue, {user.name || user.email} !
              </h2>
              <p className="text-gray-600">
                Vous êtes connecté en tant que {getRoleDisplayName(user.role)}
                {user.role === 'TECHNICIEN' && user.specialite && (
                  <span> - Spécialité: {user.specialite}</span>
                )}
                {' '}de l&apos;hôtel <span className="font-semibold">{user.hotel.nom}</span>.
              </p>
            </div>
            {(user.role === 'MANAGER' || user.role === 'STAFF') && (
              <div className="flex-shrink-0">
                <button
                  onClick={() => setShowInterventionForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  + Nouvelle intervention
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-2 bg-${stat.color}-100 rounded-lg`}>
                  <svg className={`w-6 h-6 text-${stat.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Interventions List */}
        <InterventionsList
          interventions={interventions}
          user={user}
          onRefresh={refreshInterventions}
          showForm={showInterventionForm}
          onShowFormChange={setShowInterventionForm}
        />
      </div>
    </DashboardLayout>
  )
}