'use client'

import { LogOut, Hotel, Users, Calendar, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserSession } from '@/lib/types/auth'
import { ProfileEditModal } from './profile-edit-modal'

interface DashboardSidebarProps {
  user: UserSession
  onLogout: () => void
  onProfileUpdate?: (updatedUser: UserSession) => void
}

export function DashboardSidebar({ user, onLogout, onProfileUpdate }: DashboardSidebarProps) {
  const menuItems = [
    { icon: Hotel, label: 'Accueil', href: '/dashboard' },
    { icon: Users, label: 'Utilisateurs', href: '/dashboard/users' },
    { icon: Calendar, label: 'Réservations', href: '/dashboard/bookings' },
    { icon: Settings, label: 'Paramètres', href: '/dashboard/settings' },
  ]

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50 border-r">
      {/* Header */}
      <div className="flex h-16 items-center justify-center border-b bg-white">
        <div className="flex items-center gap-2">
          <Hotel className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Hotelix</span>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name || user.email}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.role === 'MANAGER' ? 'Manager' : 'Employé'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user.hotel.nom}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-10 px-3"
                  asChild
                >
                  <a href={item.href}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </a>
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Profile Edit & Logout Buttons */}
      <div className="p-4 border-t bg-white">
        <ProfileEditModal
          user={user}
          onProfileUpdate={onProfileUpdate || (() => {})}
        />
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-10 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </Button>
      </div>
    </div>
  )
}