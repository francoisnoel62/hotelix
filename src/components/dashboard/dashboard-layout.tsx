'use client'

import { DashboardSidebar } from './dashboard-sidebar'
import { UserSession } from '@/lib/types/auth'

interface DashboardLayoutProps {
  user: UserSession
  children: React.ReactNode
  onLogout: () => void
  onProfileUpdate?: (updatedUser: UserSession) => void
}

export function DashboardLayout({ user, children, onLogout, onProfileUpdate }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <DashboardSidebar user={user} onLogout={onLogout} onProfileUpdate={onProfileUpdate} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center px-6">
          <h1 className="text-xl font-semibold text-gray-800">
            Tableau de bord
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}