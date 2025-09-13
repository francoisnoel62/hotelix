'use client'

import React, { useActionState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import { loginAction } from '@/app/actions/auth'
import { LoginFormData, Hotel, AuthResult, UserSession } from '@/lib/types/auth'
import { validateLoginForm } from '@/lib/validations/auth'

interface OptimizedLoginFormProps {
  hotels: Hotel[]
  onSuccess?: (user: UserSession) => void
  onSwitchToRegister?: () => void
}

export function OptimizedLoginForm({
  hotels,
  onSuccess,
  onSwitchToRegister
}: OptimizedLoginFormProps) {
  const [state, formAction, isPending] = useActionState<AuthResult<UserSession>, FormData>(
    loginAction,
    { success: false }
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      hotelId: 0
    },
    mode: 'onChange'
  })

  const selectedHotelId = watch('hotelId')

  // Client-side validation with transition
  const onSubmit = handleSubmit((data) => {
    const validationErrors = validateLoginForm(data)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    // Créer FormData pour la Server Action
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString())
      }
    })

    // Utiliser startTransition pour éviter l'erreur
    React.startTransition(() => {
      formAction(formData)
    })
  })

  // Gestion du succès
  useEffect(() => {
    if (state.success && state.data) {
      onSuccess?.(state.data)
    }
  }, [state, onSuccess])

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Se connecter
        </h1>
        <p className="text-sm text-muted-foreground">
          Entrez vos informations pour accéder à votre compte
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Affichage des erreurs serveur */}
        {!state.success && state.message && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {state.message}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="votre.email@exemple.com"
            {...register('email', {
              required: 'Email requis',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Format d\'email invalide'
              }
            })}
            aria-invalid={errors.email || state.fieldErrors?.email ? 'true' : 'false'}
          />
          {(errors.email || state.fieldErrors?.email) && (
            <p className="text-sm text-destructive">
              {errors.email?.message || state.fieldErrors?.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hotelId">Hôtel</Label>
          <Combobox
            options={hotels.map((hotel) => ({
              value: hotel.id.toString(),
              label: `${hotel.nom} - ${hotel.adresse}, ${hotel.pays}`
            }))}
            value={selectedHotelId?.toString()}
            onValueChange={(value) => setValue('hotelId', parseInt(value))}
            placeholder="Sélectionnez votre hôtel"
            searchPlaceholder="Rechercher un hôtel..."
            emptyText="Aucun hôtel trouvé."
          />
          {(errors.hotelId || state.fieldErrors?.hotelId) && (
            <p className="text-sm text-destructive">
              {errors.hotelId?.message || state.fieldErrors?.hotelId}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            placeholder="Votre mot de passe"
            {...register('password', {
              required: 'Mot de passe requis',
              minLength: {
                value: 6,
                message: 'Le mot de passe doit contenir au moins 6 caractères'
              }
            })}
            aria-invalid={errors.password || state.fieldErrors?.password ? 'true' : 'false'}
          />
          {(errors.password || state.fieldErrors?.password) && (
            <p className="text-sm text-destructive">
              {errors.password?.message || state.fieldErrors?.password}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Connexion...' : 'Se connecter'}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Pas encore de compte ?</span>{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-primary hover:underline"
        >
          Créer un compte
        </button>
      </div>
    </div>
  )
}