'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OptimizedLoginForm } from '@/components/auth/optimized-login-form'
import { OptimizedRegisterForm } from '@/components/auth/optimized-register-form'
import { Hotel, UserSession } from '@/lib/types/auth'

interface AuthPageContentProps {
  hotels: Hotel[]
}

export function AuthPageContent({ hotels }: AuthPageContentProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const router = useRouter()

  const handleAuthSuccess = (user: UserSession) => {
    // TODO: Gérer la session utilisateur (cookies, context, etc.)
    console.log('Utilisateur connecté:', user)

    // Rediriger vers la page d'accueil
    router.push('/')
  }

  const switchToRegister = () => setMode('register')
  const switchToLogin = () => setMode('login')

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