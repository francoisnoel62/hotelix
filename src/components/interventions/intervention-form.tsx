'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { InterventionFormData, ZoneWithSousZones, TechnicienOption } from '@/lib/types/intervention'
import { UserSession } from '@/lib/types/auth'
import { createIntervention, getZones, getTechniciens } from '@/app/actions/intervention'
import { TypeIntervention, PrioriteIntervention, OrigineIntervention } from '@prisma/client'

interface InterventionFormProps {
  user: UserSession
  onSuccess: () => void
  onCancel: () => void
}

export function InterventionForm({ user, onSuccess, onCancel }: InterventionFormProps) {
  const [zones, setZones] = useState<ZoneWithSousZones[]>([])
  const [techniciens, setTechniciens] = useState<TechnicienOption[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<InterventionFormData>({
    defaultValues: {
      priorite: PrioriteIntervention.NORMALE,
      origine: OrigineIntervention.STAFF
    }
  })

  const watchedZoneId = watch('zoneId')

  useEffect(() => {
    const loadData = async () => {
      const [zonesData, techniciensData] = await Promise.all([
        getZones(user.hotelId),
        getTechniciens(user.hotelId)
      ])

      setZones(zonesData)
      setTechniciens(techniciensData)
    }

    loadData()
  }, [user.hotelId])

  useEffect(() => {
    if (watchedZoneId) {
      setSelectedZoneId(Number(watchedZoneId))
      setValue('sousZoneId', undefined)
    }
  }, [watchedZoneId, setValue])

  const selectedZone = zones.find(z => z.id === selectedZoneId)

  const onSubmit = async (data: InterventionFormData) => {
    setIsSubmitting(true)

    try {
      const result = await createIntervention({
        ...data,
        zoneId: Number(data.zoneId),
        sousZoneId: data.sousZoneId ? Number(data.sousZoneId) : undefined,
        assigneId: data.assigneId ? Number(data.assigneId) : undefined,
        demandeurId: user.id,
        hotelId: user.hotelId
      })

      if (result.success) {
        onSuccess()
      } else {
        alert(result.error || 'Erreur lors de la création')
      }
    } catch (error) {
      alert('Erreur lors de la création de l\'intervention')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Nouvelle intervention
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Titre */}
            <div>
              <label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-2">
                Titre *
              </label>
              <input
                {...register('titre', { required: 'Le titre est requis' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Fuite robinet chambre 101"
              />
              {errors.titre && (
                <p className="mt-1 text-sm text-red-600">{errors.titre.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Décrivez le problème en détail..."
              />
            </div>

            {/* Type et Priorité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Type d&apos;intervention *
                </label>
                <select
                  {...register('type', { required: 'Le type est requis' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionnez un type</option>
                  <option value={TypeIntervention.PLOMBERIE}>Plomberie</option>
                  <option value={TypeIntervention.ELECTRICITE}>Électricité</option>
                  <option value={TypeIntervention.CLIMATISATION}>Climatisation</option>
                  <option value={TypeIntervention.CHAUFFAGE}>Chauffage</option>
                  <option value={TypeIntervention.MENUISERIE}>Menuiserie</option>
                  <option value={TypeIntervention.PEINTURE}>Peinture</option>
                  <option value={TypeIntervention.NETTOYAGE}>Nettoyage</option>
                  <option value={TypeIntervention.AUTRE}>Autre</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="priorite" className="block text-sm font-medium text-gray-700 mb-2">
                  Priorité
                </label>
                <select
                  {...register('priorite')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={PrioriteIntervention.BASSE}>Basse</option>
                  <option value={PrioriteIntervention.NORMALE}>Normale</option>
                  <option value={PrioriteIntervention.HAUTE}>Haute</option>
                  <option value={PrioriteIntervention.URGENTE}>Urgente</option>
                </select>
              </div>
            </div>

            {/* Zone et Sous-zone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="zoneId" className="block text-sm font-medium text-gray-700 mb-2">
                  Zone *
                </label>
                <select
                  {...register('zoneId', { required: 'La zone est requise' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionnez une zone</option>
                  {zones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.nom}
                    </option>
                  ))}
                </select>
                {errors.zoneId && (
                  <p className="mt-1 text-sm text-red-600">{errors.zoneId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="sousZoneId" className="block text-sm font-medium text-gray-700 mb-2">
                  Sous-zone
                </label>
                <select
                  {...register('sousZoneId')}
                  disabled={!selectedZone || selectedZone.sousZones.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Optionnel</option>
                  {selectedZone?.sousZones.map(sousZone => (
                    <option key={sousZone.id} value={sousZone.id}>
                      {sousZone.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Origine et Technicien */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="origine" className="block text-sm font-medium text-gray-700 mb-2">
                  Origine de la demande
                </label>
                <select
                  {...register('origine')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={OrigineIntervention.STAFF}>Personnel</option>
                  <option value={OrigineIntervention.CLIENT}>Client</option>
                </select>
              </div>

              {user.role === 'MANAGER' && (
                <div>
                  <label htmlFor="assigneId" className="block text-sm font-medium text-gray-700 mb-2">
                    Assigner à un technicien
                  </label>
                  <select
                    {...register('assigneId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Non assigné</option>
                    {techniciens.map(technicien => (
                      <option key={technicien.id} value={technicien.id}>
                        {technicien.name || technicien.email}
                        {technicien.specialite && ` (${technicien.specialite})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Boutons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Création...' : 'Créer l\'intervention'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}