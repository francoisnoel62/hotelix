"use client"

import * as React from "react"
import { User, UserX, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { TechnicienOption } from "@/lib/types/intervention"

interface TechnicianComboboxProps {
  technicians: TechnicienOption[]
  value?: number | null
  onValueChange: (technicianId: number | null) => void
  disabled?: boolean
  className?: string
}

const SPECIALITY_COLORS: Record<string, string> = {
  'Plomberie': 'text-blue-600 bg-blue-50',
  'Électricité': 'text-yellow-600 bg-yellow-50',
  'Climatisation': 'text-cyan-600 bg-cyan-50',
  'Chauffage': 'text-orange-600 bg-orange-50',
  'Menuiserie': 'text-amber-600 bg-amber-50',
  'Peinture': 'text-purple-600 bg-purple-50',
  'Nettoyage': 'text-green-600 bg-green-50',
  'Autre': 'text-gray-600 bg-gray-50'
}

function getInitials(name: string | null, email: string): string {
  if (name && name.trim()) {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }
  return email.charAt(0).toUpperCase()
}

function TechnicianAvatar({ technician, size = "sm" }: { technician: TechnicienOption, size?: "sm" | "md" }) {
  const initials = getInitials(technician.name, technician.email)
  const sizeClasses = size === "sm" ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm"

  return (
    <div className={cn(
      "inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-medium",
      sizeClasses
    )}>
      {initials}
    </div>
  )
}

export function TechnicianCombobox({
  technicians,
  value,
  onValueChange,
  disabled = false,
  className
}: TechnicianComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedTechnician = technicians.find(tech => tech.id === value)

  const handleSelect = (technicianId: string) => {
    const selectedId = technicianId === "unassign" ? null : parseInt(technicianId)
    onValueChange(selectedId)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-8 px-2 py-1 text-xs min-w-[160px] justify-between",
            "hover:bg-gray-50 transition-colors",
            className
          )}
        >
          <div className="flex items-center gap-2">
            {selectedTechnician ? (
              <>
                <TechnicianAvatar technician={selectedTechnician} />
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-medium truncate">
                    {selectedTechnician.name || selectedTechnician.email}
                  </span>
                  {selectedTechnician.specialite && (
                    <span className="text-xs text-gray-500 truncate">
                      {selectedTechnician.specialite}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Non assigné</span>
              </>
            )}
          </div>
          <ChevronsUpDown className="h-3 w-3 opacity-50 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-1" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un technicien..." />
          <CommandList>
            <CommandEmpty>Aucun technicien trouvé.</CommandEmpty>
            <CommandGroup>
              {/* Option de désassignation */}
              <CommandItem
                value="unassign"
                onSelect={handleSelect}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <UserX className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Non assigné</span>
                    <span className="text-xs text-gray-500">Retirer l'assignation</span>
                  </div>
                  {value === null && (
                    <div className="ml-auto h-2 w-2 bg-blue-600 rounded-full" />
                  )}
                </div>
              </CommandItem>

              {/* Liste des techniciens */}
              {technicians.map((technician) => (
                <CommandItem
                  key={technician.id}
                  value={technician.id.toString()}
                  onSelect={handleSelect}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full">
                    <TechnicianAvatar technician={technician} size="md" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-medium truncate">
                        {technician.name || technician.email}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 truncate">
                          {technician.email}
                        </span>
                        {technician.specialite && (
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded-md font-medium",
                            SPECIALITY_COLORS[technician.specialite] || SPECIALITY_COLORS['Autre']
                          )}>
                            {technician.specialite}
                          </span>
                        )}
                      </div>
                    </div>
                    {value === technician.id && (
                      <div className="ml-auto h-2 w-2 bg-blue-600 rounded-full" />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}