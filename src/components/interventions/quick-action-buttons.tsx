"use client"

import * as React from "react"
import { Play, CheckCircle, Clock, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StatutIntervention } from "@prisma/client"

interface QuickActionButtonsProps {
  currentStatus: StatutIntervention
  onStatusChange: (status: StatutIntervention) => void
  canCancel?: boolean
  isLoading?: boolean
  className?: string
}

interface QuickAction {
  status: StatutIntervention
  label: string
  icon: React.ReactNode
  color: string
  hoverColor: string
  show: (current: StatutIntervention) => boolean
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    status: StatutIntervention.EN_COURS,
    label: "Démarrer",
    icon: <Play className="h-3.5 w-3.5" />,
    color: "text-blue-700 bg-blue-100 hover:bg-blue-200",
    hoverColor: "hover:bg-blue-200",
    show: (current) => current === StatutIntervention.EN_ATTENTE
  },
  {
    status: StatutIntervention.TERMINEE,
    label: "Terminer",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    color: "text-green-700 bg-green-100 hover:bg-green-200",
    hoverColor: "hover:bg-green-200",
    show: (current) => current === StatutIntervention.EN_COURS
  },
  {
    status: StatutIntervention.EN_ATTENTE,
    label: "Remettre en attente",
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "text-gray-700 bg-gray-100 hover:bg-gray-200",
    hoverColor: "hover:bg-gray-200",
    show: (current) => current === StatutIntervention.EN_COURS
  },
  {
    status: StatutIntervention.EN_ATTENTE,
    label: "Réactiver",
    icon: <RotateCcw className="h-3.5 w-3.5" />,
    color: "text-blue-700 bg-blue-100 hover:bg-blue-200",
    hoverColor: "hover:bg-blue-200",
    show: (current) => current === StatutIntervention.TERMINEE || current === StatutIntervention.ANNULEE
  }
]

export function QuickActionButtons({
  currentStatus,
  onStatusChange,
  canCancel = false,
  isLoading = false,
  className
}: QuickActionButtonsProps) {
  const visibleActions = QUICK_ACTIONS.filter(action => action.show(currentStatus))

  if (visibleActions.length === 0) {
    return null
  }

  const handleAction = (status: StatutIntervention) => {
    if (!isLoading) {
      onStatusChange(status)
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {visibleActions.map((action) => (
        <Button
          key={`${action.status}-${action.label}`}
          variant="outline"
          size="sm"
          onClick={() => handleAction(action.status)}
          disabled={isLoading}
          className={cn(
            "h-7 px-2 text-xs font-medium rounded-md border-0 transition-all duration-200",
            "transform hover:scale-105 active:scale-95",
            action.color,
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-1">
            {isLoading ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              action.icon
            )}
            <span className="hidden sm:inline">{action.label}</span>
          </div>
        </Button>
      ))}
    </div>
  )
}