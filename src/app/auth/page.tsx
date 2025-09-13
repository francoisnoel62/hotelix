'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const router = useRouter()

  const handleAuthSuccess = () => {
    // Rediriger vers la page d'accueil après une authentification réussie
    router.push('/')
  }

  const switchToRegister = () => setMode('register')
  const switchToLogin = () => setMode('login')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md space-y-8">
        <div className="bg-card border rounded-lg shadow-sm p-8">
          {mode === 'login' ? (
            <LoginForm
              onSuccess={handleAuthSuccess}
              onSwitchToRegister={switchToRegister}
            />
          ) : (
            <RegisterForm
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={switchToLogin}
            />
          )}
        </div>
      </div>
    </div>
  )
}