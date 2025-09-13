'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OptimizedLoginForm } from '@/components/auth/optimized-login-form'
import { OptimizedRegisterForm } from '@/components/auth/optimized-register-form'
import { Hotel, UserSession } from '@/lib/types/auth'

interface AuthPageContentProps {
  hotels: Hotel[]
}

export function AuthPageContent({ hotels }: AuthPageContentProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleAuthSuccess = (user: UserSession) => {
    // Sauvegarder l'utilisateur dans localStorage seulement côté client
    if (isClient) {
      localStorage.setItem('user', JSON.stringify(user))
      console.log('Utilisateur connecté:', user)
      // Rediriger vers le dashboard
      router.push('/dashboard')
    }
  }

  const switchToRegister = () => setMode('register')
  const switchToLogin = () => setMode('login')

  // Attendre l'hydratation côté client pour éviter les erreurs
  if (!isClient) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
        <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (mode === 'login') {
    return (
      <OptimizedLoginForm
        hotels={hotels}
        onSuccess={handleAuthSuccess}
        onSwitchToRegister={switchToRegister}
      />
    )
  }

  return (
    <OptimizedRegisterForm
      hotels={hotels}
      onSuccess={handleAuthSuccess}
      onSwitchToLogin={switchToLogin}
    />
  )
}