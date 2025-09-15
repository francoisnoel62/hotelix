'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { UserSession } from '@/lib/types/auth'
import { logoutAction } from '@/app/actions/auth'
import { TechniciansList } from '@/components/technicians/technicians-list'
import { useTechniciansData } from '@/hooks/useTechnicianData'

export default function TechniciensPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(null)

  const {
    technicians,
    isLoading,
    error,
    refresh
  } = useTechniciansData(user?.hotelId || 0)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Seuls les managers peuvent voir tous les techniciens
      if (parsedUser.role !== 'MANAGER') {
        // Les autres rôles ne peuvent pas accéder à cette page
        router.push('/dashboard')
        return
      }
    } else {
      router.push('/auth')
      return
    }
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

  if (user.role !== 'MANAGER') {
    return (
      <DashboardLayout user={user} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès restreint</h2>
            <p className="text-gray-600">Seuls les managers peuvent accéder à cette page.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const getStats = () => {
    const disponibles = technicians.filter(t => t.statut === 'DISPONIBLE').length
    const occupes = technicians.filter(t => t.statut === 'OCCUPE').length
    const total = technicians.length

    return {
      stats: [
        { label: 'Disponibles', value: disponibles, color: 'green' },
        { label: 'Occupés', value: occupes, color: 'orange' },
        { label: 'Total', value: total, color: 'blue' }
      ]
    }
  }

  const stats = getStats()

  return (
    <DashboardLayout user={user} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate}>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Gestion des Techniciens
              </h2>
              <p className="text-gray-600">
                Gérez les techniciens de l&apos;hôtel <span className="font-semibold">{user.hotel.nom}</span>
                et assignez leurs interventions.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-2 bg-${stat.color}-100 rounded-lg`}>
                  <svg className={`w-6 h-6 text-${stat.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

        {/* Technicians List */}
        <TechniciansList
          technicians={technicians}
          user={user}
          onRefresh={refresh}
        />
      </div>
    </DashboardLayout>
  )
}