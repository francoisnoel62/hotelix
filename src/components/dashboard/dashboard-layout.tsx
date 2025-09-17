'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { DashboardSidebar } from './dashboard-sidebar'
import { UserSession } from '@/lib/types/auth'

interface DashboardLayoutProps {
  user: UserSession
  children: React.ReactNode
  onLogout: () => void
  onProfileUpdate?: (updatedUser: UserSession) => void
}

export function DashboardLayout({ user, children, onLogout, onProfileUpdate }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar - Hidden on mobile (< 715px) */}
      <div className="hidden min-[715px]:block">
        <DashboardSidebar user={user} onLogout={onLogout} onProfileUpdate={onProfileUpdate} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="min-[715px]:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <DashboardSidebar
              user={user}
              onLogout={onLogout}
              onProfileUpdate={onProfileUpdate}
              mobile={true}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center px-4 sm:px-6">
          {/* Mobile menu button */}
          <button
            type="button"
            className="min-[715px]:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Ouvrir le menu</span>
            <Menu className="h-6 w-6" />
          </button>

          <h1 className="ml-2 min-[715px]:ml-0 text-lg sm:text-xl font-semibold text-gray-800">
            Tableau de bord
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}