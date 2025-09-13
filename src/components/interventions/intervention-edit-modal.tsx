'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { InterventionFormData, ZoneWithSousZones, InterventionWithRelations } from '@/lib/types/intervention'
import { UserSession } from '@/lib/types/auth'
import { updateIntervention, getZones } from '@/app/actions/intervention'
import { TypeIntervention, PrioriteIntervention } from '@prisma/client'
import { useToast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface InterventionEditModalProps {
  intervention: InterventionWithRelations
  user: UserSession
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function InterventionEditModal({
  intervention,
  user,
  isOpen,
  onOpenChange,
  onSuccess
}: InterventionEditModalProps) {
  const [zones, setZones] = useState<ZoneWithSousZones[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(intervention.zone.id)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<InterventionFormData>({
    defaultValues: {
      titre: intervention.titre,
      description: intervention.description || '',
      type: intervention.type,
      priorite: intervention.priorite,
      zoneId: intervention.zone.id,
      sousZoneId: intervention.sousZone?.id || undefined,
    }
  })

  const watchedZoneId = watch('zoneId')

  useEffect(() => {
    const loadZones = async () => {
      const zonesData = await getZones(user.hotelId)
      setZones(zonesData)
    }

    if (isOpen) {
      loadZones()
    }
  }, [user.hotelId, isOpen])

  useEffect(() => {
    if (watchedZoneId) {
      setSelectedZoneId(Number(watchedZoneId))
      // Reset sous-zone si la zone change
      if (Number(watchedZoneId) !== intervention.zone.id) {
        setValue('sousZoneId', undefined)
      }
    }
  }, [watchedZoneId, setValue, intervention.zone.id])

  // Reset form when intervention changes or modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        titre: intervention.titre,
        description: intervention.description || '',
        type: intervention.type,
        priorite: intervention.priorite,
        zoneId: intervention.zone.id,
        sousZoneId: intervention.sousZone?.id || undefined,
      })
      setSelectedZoneId(intervention.zone.id)
    }
  }, [intervention, isOpen, reset])

  const selectedZone = zones.find(z => z.id === selectedZoneId)

  const onSubmit = async (data: InterventionFormData) => {
    setIsSubmitting(true)

    try {
      const result = await updateIntervention(intervention.id, {
        titre: data.titre,
        description: data.description,
        type: data.type,
        priorite: data.priorite,
        zoneId: Number(data.zoneId),
        sousZoneId: data.sousZoneId ? Number(data.sousZoneId) : undefined,
      }, user.id)

      if (result.success) {
        toast({
          variant: 'success',
          title: 'Intervention modifiée',
          description: result.message || 'L\'intervention a été mise à jour avec succès'
        })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          variant: 'error',
          title: 'Erreur',
          description: result.error || 'Erreur lors de la modification'
        })
      }
    } catch {
      toast({
        variant: 'error',
        title: 'Erreur',
        description: 'Erreur lors de la modification de l&apos;intervention'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    reset({
      titre: intervention.titre,
      description: intervention.description || '',
      type: intervention.type,
      priorite: intervention.priorite,
      zoneId: intervention.zone.id,
      sousZoneId: intervention.sousZone?.id || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;intervention</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l&apos;intervention. Les champs marqués d&apos;un * sont obligatoires.
          </DialogDescription>
        </DialogHeader>

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

          {/* Informations en lecture seule */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Informations non modifiables</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut actuel
                </label>
                <input
                  type="text"
                  value={intervention.statut.replace('_', ' ').toLowerCase()}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Origine
                </label>
                <input
                  type="text"
                  value={intervention.origine === 'CLIENT' ? 'Client' : 'Personnel'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Modification...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}