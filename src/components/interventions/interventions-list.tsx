'use client'

import { useState, useEffect } from 'react'
import { InterventionWithRelations, PRIORITE_COLORS, TechnicienOption } from '@/lib/types/intervention'
import { UserSession } from '@/lib/types/auth'
import { updateInterventionStatut, assignerIntervention, getTechniciens } from '@/app/actions/intervention'
import { InterventionForm } from './intervention-form'
import { InterventionEditModal } from './intervention-edit-modal'
import { StatusCombobox } from './status-combobox'
import { TechnicianCombobox } from './technician-combobox'
import { QuickActionButtons } from './quick-action-buttons'
import { useToast } from '@/components/ui/toast'
import { StatutIntervention } from '@prisma/client'

interface InterventionsListProps {
  interventions: InterventionWithRelations[]
  user: UserSession
  onRefresh: () => void
}

export function InterventionsList({ interventions, user, onRefresh }: InterventionsListProps) {
  const [filter, setFilter] = useState('')
  const [statutFilter, setStatutFilter] = useState<StatutIntervention | 'ALL'>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingIntervention, setEditingIntervention] = useState<InterventionWithRelations | null>(null)
  const [techniciens, setTechniciens] = useState<TechnicienOption[]>([])
  const [loadingActions, setLoadingActions] = useState<{ [key: number]: 'status' | 'technician' | null }>({})
  const { toast } = useToast()

  useEffect(() => {
    const loadTechniciens = async () => {
      if (user.role === 'MANAGER') {
        const techniciensData = await getTechniciens(user.hotelId)
        setTechniciens(techniciensData)
      }
    }
    loadTechniciens()
  }, [user.hotelId, user.role])

  const filteredInterventions = interventions.filter(intervention => {
    const matchesSearch = intervention.titre.toLowerCase().includes(filter.toLowerCase()) ||
                         intervention.zone.nom.toLowerCase().includes(filter.toLowerCase())
    const matchesStatut = statutFilter === 'ALL' || intervention.statut === statutFilter
    return matchesSearch && matchesStatut
  })

  const handleStatutChange = async (interventionId: number, nouveauStatut: StatutIntervention) => {
    setLoadingActions(prev => ({ ...prev, [interventionId]: 'status' }))
    try {
      const result = await updateInterventionStatut(interventionId, nouveauStatut, user.id)
      if (result.success) {
        toast({
          variant: 'success',
          title: 'Statut mis à jour',
          description: result.message || `Statut changé vers ${nouveauStatut.replace('_', ' ').toLowerCase()}`
        })
        onRefresh()
      } else {
        toast({
          variant: 'error',
          title: 'Erreur',
          description: result.error || 'Erreur lors de la mise à jour'
        })
      }
    } finally {
      setLoadingActions(prev => ({ ...prev, [interventionId]: null }))
    }
  }

  const handleTechnicienChange = async (interventionId: number, technicienId: number | null) => {
    setLoadingActions(prev => ({ ...prev, [interventionId]: 'technician' }))
    try {
      const result = await assignerIntervention(interventionId, technicienId || 0, user.id)
      if (result.success) {
        toast({
          variant: 'success',
          title: 'Assignation mise à jour',
          description: result.message || (technicienId ? 'Technicien assigné' : 'Intervention désassignée')
        })
        onRefresh()
      } else {
        toast({
          variant: 'error',
          title: 'Erreur',
          description: result.error || 'Erreur lors de l\'assignation'
        })
      }
    } finally {
      setLoadingActions(prev => ({ ...prev, [interventionId]: null }))
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

  const canChangeStatut = (intervention: InterventionWithRelations) => {
    return user.role === 'MANAGER' ||
           (user.role === 'TECHNICIEN' && intervention.assigneId === user.id)
  }

  const canEditIntervention = (intervention: InterventionWithRelations) => {
    // Ne peut pas éditer si terminée ou annulée
    if (intervention.statut === StatutIntervention.TERMINEE || intervention.statut === StatutIntervention.ANNULEE) {
      return false
    }

    // MANAGER peut toujours éditer
    if (user.role === 'MANAGER') {
      return true
    }

    // TECHNICIEN peut éditer seulement ses interventions assignées
    if (user.role === 'TECHNICIEN' && intervention.assigneId === user.id) {
      return true
    }

    return false
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {user.role === 'TECHNICIEN' ? 'Mes interventions' : 'Interventions'}
          </h3>
          {(user.role === 'MANAGER' || user.role === 'STAFF') && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Nouvelle intervention
            </button>
          )}
        </div>

        {/* Filtres */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher par titre ou zone..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value as StatutIntervention | 'ALL')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINEE">Terminée</option>
            <option value="ANNULEE">Annulée</option>
          </select>
        </div>
      </div>

      {/* Liste des interventions */}
      <div className="divide-y divide-gray-200">
        {filteredInterventions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucune intervention trouvée.
          </div>
        ) : (
          filteredInterventions.map((intervention) => (
            <div key={intervention.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900 truncate">
                      {intervention.titre}
                    </h4>
                    <StatusCombobox
                      value={intervention.statut}
                      onValueChange={() => {}}
                      readOnly={true}
                    />
                    <span className={getPrioriteBadgeClass(intervention.priorite)}>
                      {intervention.priorite.toLowerCase()}
                    </span>
                  </div>

                  {intervention.description && (
                    <p className="text-sm text-gray-600 mb-2">{intervention.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {intervention.zone.nom}
                      {intervention.sousZone && ` - ${intervention.sousZone.nom}`}
                    </span>

                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(intervention.dateCreation)}
                    </span>

                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Demandeur: {intervention.demandeur.name || intervention.demandeur.email}
                    </span>

                    {/* {intervention.assigne && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Technicien: {intervention.assigne.name || intervention.assigne.email}
                        {intervention.assigne.specialite && ` (${intervention.assigne.specialite})`}
                      </span>
                    )} */}

                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {intervention.type.toLowerCase()}
                    </span>

                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {intervention.origine === 'CLIENT' ? 'Client' : 'Personnel'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="ml-4 flex-shrink-0 space-y-3">
                  
                  <div className="flex items-center gap-2">
                    {/* Bouton d'édition */}
                    {canEditIntervention(intervention) && (
                      <button
                        onClick={() => setEditingIntervention(intervention)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Éditer
                      </button>
                    )}

                    {/* Assignation technicien (MANAGER uniquement) */}
                    {user.role === 'MANAGER' && (
                      <TechnicianCombobox
                        technicians={techniciens}
                        value={intervention.assigneId}
                        onValueChange={(technicianId) => handleTechnicienChange(intervention.id, technicianId)}
                        isLoading={loadingActions[intervention.id] === 'technician'}
                        className="min-w-[180px]"
                      />
                    )}

                    {/* Changement de statut détaillé */}
                    {canChangeStatut(intervention) && (
                      <StatusCombobox
                        value={intervention.statut}
                        onValueChange={(status) => handleStatutChange(intervention.id, status)}
                        canCancel={user.role === 'MANAGER'}
                        isLoading={loadingActions[intervention.id] === 'status'}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Formulaire modal */}
      {showForm && (
        <InterventionForm
          user={user}
          onSuccess={() => {
            setShowForm(false)
            onRefresh()
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Modal d'édition */}
      {editingIntervention && (
        <InterventionEditModal
          intervention={editingIntervention}
          user={user}
          isOpen={!!editingIntervention}
          onOpenChange={(open) => {
            if (!open) {
              setEditingIntervention(null)
            }
          }}
          onSuccess={() => {
            setEditingIntervention(null)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}