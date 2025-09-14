'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TechnicianListItem, TechnicianFilter } from '@/lib/types/technician'
import { UserSession } from '@/lib/types/auth'

interface TechniciansListProps {
  technicians: TechnicianListItem[]
  user: UserSession
  onRefresh: () => void
}

export function TechniciansList({ technicians, user, onRefresh }: TechniciansListProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<TechnicianFilter>({
    search: '',
    specialite: 'ALL',
    statut: 'ALL'
  })

  const specialites = Array.from(new Set(
    technicians.map(t => t.specialite).filter(Boolean)
  )).sort()

  const filteredTechnicians = technicians.filter(technicien => {
    const matchesSearch = technicien.name?.toLowerCase().includes(filter.search.toLowerCase()) ||
                         technicien.email.toLowerCase().includes(filter.search.toLowerCase()) ||
                         technicien.specialite?.toLowerCase().includes(filter.search.toLowerCase())

    const matchesSpecialite = filter.specialite === 'ALL' || technicien.specialite === filter.specialite
    const matchesStatut = filter.statut === 'ALL' || technicien.statut === filter.statut

    return matchesSearch && matchesSpecialite && matchesStatut
  })

  const getStatutBadgeClass = (statut: string) => {
    const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'

    switch (statut) {
      case 'DISPONIBLE': return `${baseClass} bg-green-100 text-green-800`
      case 'OCCUPE': return `${baseClass} bg-orange-100 text-orange-800`
      case 'HORS_LIGNE': return `${baseClass} bg-gray-100 text-gray-800`
      default: return `${baseClass} bg-gray-100 text-gray-800`
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'Aucune activité'

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const handleTechnicianClick = (technicianId: number) => {
    router.push(`/dashboard/techniciens/${technicianId}`)
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Techniciens ({filteredTechnicians.length})
          </h3>
        </div>

        {/* Filtres - Responsive */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Rechercher par nom, email ou spécialité..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="sm:w-auto">
            <select
              value={filter.specialite}
              onChange={(e) => setFilter(prev => ({ ...prev, specialite: e.target.value }))}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Toutes les spécialités</option>
              {specialites.map(specialite => (
                <option key={specialite} value={specialite}>{specialite}</option>
              ))}
            </select>
          </div>
          <div className="sm:w-auto">
            <select
              value={filter.statut}
              onChange={(e) => setFilter(prev => ({ ...prev, statut: e.target.value as any }))}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="OCCUPE">Occupé</option>
              <option value="HORS_LIGNE">Hors ligne</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des techniciens */}
      <div className="divide-y divide-gray-200">
        {filteredTechnicians.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucun technicien trouvé.
          </div>
        ) : (
          filteredTechnicians.map((technicien) => (
            <div
              key={technicien.id}
              className="p-4 sm:p-6 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleTechnicianClick(technicien.id)}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Nom et badges - Stack sur mobile, ligne sur desktop */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                    <h4 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                      {technicien.name || technicien.email}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={getStatutBadgeClass(technicien.statut)}>
                        {technicien.statut === 'DISPONIBLE' ? 'Disponible' :
                         technicien.statut === 'OCCUPE' ? 'Occupé' : 'Hors ligne'}
                      </span>
                      {technicien.specialite && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {technicien.specialite}
                        </span>
                      )}
                      {technicien.noteMoyenne && (
                        <div className="flex items-center">
                          <svg className="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs text-gray-600">{technicien.noteMoyenne.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Métadonnées - Adaptées selon la taille d'écran */}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    {/* Email - Toujours visible */}
                    <span className="flex items-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{technicien.email}</span>
                    </span>

                    {/* Interventions en cours */}
                    <span className="flex items-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="whitespace-nowrap">
                        {technicien.interventionsEnCours} en cours
                      </span>
                    </span>

                    {/* Total interventions - Masqué sur très petits écrans */}
                    <span className="hidden sm:flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="whitespace-nowrap">
                        {technicien.interventionsTotal} total
                      </span>
                    </span>

                    {/* Dernière activité - Masquée sur mobiles */}
                    <span className="hidden md:flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="truncate">
                        {formatDate(technicien.dernierActivite)}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Actions - Responsive layout */}
                <div className="lg:ml-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <button className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap">
                      <svg className="w-3 h-3 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="hidden sm:inline">Voir détails</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}