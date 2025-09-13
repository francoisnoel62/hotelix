'use client'

import React, { useActionState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { registerAction } from '@/app/actions/auth'
import { RegisterFormData, Hotel, AuthResult, UserSession } from '@/lib/types/auth'
import { validateRegisterForm } from '@/lib/validations/auth'

interface OptimizedRegisterFormProps {
  hotels: Hotel[]
  onSuccess?: (user: UserSession) => void
  onSwitchToLogin?: () => void
}

export function OptimizedRegisterForm({
  hotels,
  onSuccess,
  onSwitchToLogin
}: OptimizedRegisterFormProps) {
  const [state, formAction, isPending] = useActionState<AuthResult<UserSession>, FormData>(
    registerAction,
    { success: false }
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      hotelId: 0,
      role: 'STAFF'
    },
    mode: 'onChange'
  })

  const selectedHotelId = watch('hotelId')

  // Client-side validation with transition
  const onSubmit = handleSubmit((data) => {
    const validationErrors = validateRegisterForm(data)
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
          Créer un compte
        </h1>
        <p className="text-sm text-muted-foreground">
          Remplissez les informations ci-dessous pour créer votre compte
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
          <Label htmlFor="name">Nom (optionnel)</Label>
          <Input
            id="name"
            type="text"
            placeholder="Votre nom"
            {...register('name')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hotelId">Hôtel</Label>
          <Select
            onValueChange={(value) => setValue('hotelId', parseInt(value))}
            value={selectedHotelId?.toString()}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez votre hôtel" />
            </SelectTrigger>
            <SelectContent>
              {hotels.map((hotel) => (
                <SelectItem key={hotel.id} value={hotel.id.toString()}>
                  {hotel.nom} - {hotel.adresse}, {hotel.pays}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(errors.hotelId || state.fieldErrors?.hotelId) && (
            <p className="text-sm text-destructive">
              {errors.hotelId?.message || state.fieldErrors?.hotelId}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rôle</Label>
          <Select
            onValueChange={(value: 'MANAGER' | 'STAFF') => setValue('role', value)}
            defaultValue="STAFF"
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STAFF">Employé</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
            </SelectContent>
          </Select>
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirmez votre mot de passe"
            {...register('confirmPassword', {
              required: 'Confirmation du mot de passe requise',
              validate: (value, formValues) =>
                value === formValues.password || 'Les mots de passe ne correspondent pas'
            })}
            aria-invalid={errors.confirmPassword || state.fieldErrors?.confirmPassword ? 'true' : 'false'}
          />
          {(errors.confirmPassword || state.fieldErrors?.confirmPassword) && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword?.message || state.fieldErrors?.confirmPassword}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Création du compte...' : 'Créer le compte'}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Déjà un compte ?</span>{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-primary hover:underline"
        >
          Se connecter
        </button>
      </div>
    </div>
  )
}