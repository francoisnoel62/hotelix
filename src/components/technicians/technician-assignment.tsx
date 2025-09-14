'use client'

import { useState } from 'react'
import { InterventionWithRelations } from '@/lib/types/intervention'

interface TechnicianAssignmentProps {
  availableInterventions: InterventionWithRelations[]
  onAssign: (interventionId: number) => Promise<void>
}

export function TechnicianAssignment({ availableInterventions, onAssign }: TechnicianAssignmentProps) {
  const [assigningId, setAssigningId] = useState<number | null>(null)
  const [filter, setFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')

  const filteredInterventions = availableInterventions.filter(intervention => {
    const matchesSearch = intervention.titre.toLowerCase().includes(filter.toLowerCase()) ||
                         intervention.zone.nom.toLowerCase().includes(filter.toLowerCase())
    const matchesPriority = priorityFilter === 'ALL' || intervention.priorite === priorityFilter

    return matchesSearch && matchesPriority
  })

  const handleAssign = async (interventionId: number) => {
    setAssigningId(interventionId)
    try {
      await onAssign(interventionId)
    } finally {
      setAssigningId(null)
    }
  }

  const getPrioriteBadgeClass = (priorite: string) => {
    const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'

    switch (priorite) {
      case 'URGENTE': return `${baseClass} bg-red-100 text-red-800`
      case 'HAUTE': return `${baseClass} bg-orange-100 text-orange-800`
      case 'NORMALE': return `${baseClass} bg-gray-100 text-gray-800`
      case 'BASSE': return `${baseClass} bg-gray-100 text-gray-600`
      default: return `${baseClass} bg-gray-100 text-gray-800`
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  if (availableInterventions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune intervention disponible</h3>
        <p className="mt-1 text-sm text-gray-500">Toutes les interventions en attente sont déjà assignées.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Interventions disponibles pour affectation ({filteredInterventions.length})
        </h3>
        <p className="text-sm text-gray-600">
          Sélectionnez une intervention à assigner à ce technicien. Seules les interventions en attente et non assignées sont affichées.
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher par titre ou zone..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="sm:w-auto">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">Toutes les priorités</option>
            <option value="URGENTE">Urgente</option>
            <option value="HAUTE">Haute</option>
            <option value="NORMALE">Normale</option>
            <option value="BASSE">Basse</option>
          </select>
        </div>
      </div>

      {/* Liste des interventions */}
      <div className="bg-white border rounded-lg divide-y divide-gray-200">
        {filteredInterventions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucune intervention ne correspond aux critères de recherche.
          </div>
        ) : (
          filteredInterventions.map((intervention) => (
            <div key={intervention.id} className="p-4 sm:p-6 hover:bg-gray-50">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Titre et badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                    <h4 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                      {intervention.titre}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={getPrioriteBadgeClass(intervention.priorite)}>
                        {intervention.priorite.toLowerCase()}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {intervention.type.toLowerCase()}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {intervention.origine === 'CLIENT' ? 'Client' : 'Staff'}
                      </span>
                    </div>
                  </div>

                  {intervention.description && (
                    <p className="text-sm text-gray-600 mb-2">{intervention.description}</p>
                  )}

                  {/* Métadonnées */}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    {/* Zone */}
                    <span className="flex items-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">
                        {intervention.zone.nom}
                        {intervention.sousZone && ` - ${intervention.sousZone.nom}`}
                      </span>
                    </span>

                    {/* Date de création */}
                    <span className="flex items-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="whitespace-nowrap">
                        {formatDate(intervention.dateCreation)}
                      </span>
                    </span>

                    {/* Demandeur */}
                    <span className="flex items-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="truncate">
                        {intervention.demandeur.name || intervention.demandeur.email}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Bouton d'assignation */}
                <div className="lg:ml-4 flex-shrink-0">
                  <button
                    onClick={() => handleAssign(intervention.id)}
                    disabled={assigningId === intervention.id}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assigningId === intervention.id ? (
                      <>
                        <div className="animate-spin -ml-1 mr-2 h-3 w-3 border border-white border-t-transparent rounded-full"></div>
                        Assignation...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Assigner
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}