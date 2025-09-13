'use client'

import { useState, useEffect, FormEvent } from 'react'
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
import { LoginFormData, validateLoginForm } from '@/lib/validations/auth'
import { AuthError } from '@/lib/types/auth'

interface Hotel {
  id: number
  nom: string
  adresse: string
  pays: string
}

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [error, setError] = useState<string>('')
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    hotelId: 0
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Charger la liste des hôtels
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await fetch('/api/hotels')
        const data = await response.json()

        if (data.success && data.data) {
          setHotels(data.data)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des hôtels:', error)
      }
    }

    fetchHotels()
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setFieldErrors({})

    // Validation
    const validationErrors = validateLoginForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        onSuccess?.()
      } else {
        switch (result.error) {
          case AuthError.InvalidCredentials:
            setError('Email, mot de passe ou hôtel incorrect')
            break
          case AuthError.ValidationError:
            setError('Données invalides')
            break
          default:
            setError(result.message || 'Une erreur est survenue')
        }
      }
    } catch (error) {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

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

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="votre.email@exemple.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            aria-invalid={fieldErrors.email ? 'true' : 'false'}
          />
          {fieldErrors.email && (
            <p className="text-sm text-destructive">{fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hotelId">Hôtel</Label>
          <Select
            onValueChange={(value) => setFormData({ ...formData, hotelId: parseInt(value) })}
            value={formData.hotelId.toString()}
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
          {fieldErrors.hotelId && (
            <p className="text-sm text-destructive">{fieldErrors.hotelId}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            placeholder="Votre mot de passe"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            aria-invalid={fieldErrors.password ? 'true' : 'false'}
          />
          {fieldErrors.password && (
            <p className="text-sm text-destructive">{fieldErrors.password}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Connexion...' : 'Se connecter'}
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