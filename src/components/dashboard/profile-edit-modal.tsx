'use client'

import React, { useState, useActionState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { UserPen, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { UserSession, AuthResult } from '@/lib/types/auth'
import { updateProfileAction } from '@/app/actions/auth'

interface ProfileFormData {
  name: string
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

interface ProfileEditModalProps {
  user: UserSession
  onProfileUpdate: (updatedUser: UserSession) => void
}

export function ProfileEditModal({ user, onProfileUpdate }: ProfileEditModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [changePassword, setChangePassword] = useState(false)

  const [state, formAction, isPending] = useActionState<AuthResult<UserSession>, FormData>(
    updateProfileAction,
    { success: false }
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user.name || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const newPassword = watch('newPassword')

  // Synchroniser le formulaire avec les données utilisateur mises à jour
  useEffect(() => {
    reset({
      name: user.name || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }, [user, reset])

  // Gestion du succès de la mise à jour
  useEffect(() => {
    if (state.success && state.data) {
      // Mettre à jour le localStorage
      localStorage.setItem('user', JSON.stringify(state.data))

      // Notifier le parent
      onProfileUpdate(state.data)

      // Fermer le modal et réinitialiser
      setIsOpen(false)
      reset({
        name: state.data.name || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setChangePassword(false)
    }
  }, [state, onProfileUpdate, reset])

  const onSubmit = handleSubmit((data) => {
    // Créer FormData pour la Server Action
    const formData = new FormData()
    formData.append('id', user.id.toString())
    formData.append('name', data.name || '')
    formData.append('email', user.email) // Email non modifiable
    formData.append('role', user.role) // Rôle non modifiable

    // Ajouter les données de mot de passe si changement demandé
    if (changePassword && data.currentPassword && data.newPassword) {
      formData.append('currentPassword', data.currentPassword)
      formData.append('newPassword', data.newPassword)
    }

    // Utiliser startTransition pour éviter l'erreur
    React.startTransition(() => {
      formAction(formData)
    })
  })

  const handleCancel = () => {
    reset({
      name: user.name || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setChangePassword(false)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-10 px-3 mb-2"
          onClick={() => setIsOpen(true)}
        >
          <UserPen className="h-4 w-4" />
          Modifier mon profil
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier mon profil</DialogTitle>
          <DialogDescription>
            Modifiez votre nom et mot de passe. Les autres informations ne peuvent pas être changées.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Affichage des erreurs serveur */}
          {!state.success && state.message && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {state.message}
            </div>
          )}

          {/* Message de succès */}
          {state.success && state.message && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
              {state.message}
            </div>
          )}
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              placeholder="Votre nom"
              {...register('name')}
            />
          </div>

          {/* Email (lecture seule) */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={user.email}
              disabled
              className="bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500">
              Pour changer d'email, contactez votre administrateur.
            </p>
          </div>

          {/* Rôle (lecture seule) */}
          <div className="space-y-2">
            <Label>Rôle</Label>
            <Input
              value={user.role === 'MANAGER' ? 'Manager' : 'Employé'}
              disabled
              className="bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500">
              Pour changer de rôle, contactez votre administrateur.
            </p>
          </div>

          {/* Hôtel (lecture seule) */}
          <div className="space-y-2">
            <Label>Hôtel</Label>
            <Input
              value={`${user.hotel.nom} - ${user.hotel.adresse}, ${user.hotel.pays}`}
              disabled
              className="bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500">
              Pour changer d'hôtel, contactez votre administrateur.
            </p>
          </div>

          {/* Section changement de mot de passe */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="changePassword"
                checked={changePassword}
                onChange={(e) => setChangePassword(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="changePassword" className="text-sm font-medium">
                Changer mon mot de passe
              </Label>
            </div>

            {changePassword && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Votre mot de passe actuel"
                    {...register('currentPassword', {
                      required: changePassword ? 'Mot de passe actuel requis' : false
                    })}
                  />
                  {errors.currentPassword && (
                    <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Nouveau mot de passe"
                    {...register('newPassword', {
                      required: changePassword ? 'Nouveau mot de passe requis' : false,
                      minLength: changePassword ? {
                        value: 6,
                        message: 'Le mot de passe doit contenir au moins 6 caractères'
                      } : undefined
                    })}
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirmez le nouveau mot de passe"
                    {...register('confirmPassword', {
                      required: changePassword ? 'Confirmation requise' : false,
                      validate: changePassword ? (value) =>
                        value === newPassword || 'Les mots de passe ne correspondent pas' : undefined
                    })}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Boutons */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}