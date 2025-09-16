"use client"

import * as React from "react"
import { Clock, Play, CheckCircle, XCircle, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { StatutIntervention } from "@prisma/client"

interface StatusOption {
  value: StatutIntervention
  label: string
  color: string
  icon: React.ReactNode
}

interface StatusComboboxProps {
  value: StatutIntervention
  onValueChange: (status: StatutIntervention) => void
  disabled?: boolean
  canCancel?: boolean
  className?: string
  readOnly?: boolean
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: StatutIntervention.EN_ATTENTE,
    label: "En attente",
    color: "text-gray-700 bg-gray-100",
    icon: <Clock className="h-3.5 w-3.5" />
  },
  {
    value: StatutIntervention.EN_COURS,
    label: "En cours",
    color: "text-blue-700 bg-blue-100",
    icon: <Play className="h-3.5 w-3.5" />
  },
  {
    value: StatutIntervention.TERMINEE,
    label: "Terminée",
    color: "text-green-700 bg-green-100",
    icon: <CheckCircle className="h-3.5 w-3.5" />
  },
  {
    value: StatutIntervention.ANNULEE,
    label: "Annulée",
    color: "text-red-700 bg-red-100",
    icon: <XCircle className="h-3.5 w-3.5" />
  }
]

export function StatusCombobox({
  value,
  onValueChange,
  disabled = false,
  canCancel = false,
  className,
  readOnly = false
}: StatusComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const currentStatus = STATUS_OPTIONS.find(option => option.value === value)
  const availableOptions = STATUS_OPTIONS.filter(option =>
    canCancel || option.value !== StatutIntervention.ANNULEE
  )

  const handleSelect = (selectedValue: StatutIntervention) => {
    if (selectedValue !== value) {
      onValueChange(selectedValue)
    }
    setOpen(false)
  }

  if (readOnly) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full",
        currentStatus?.color,
        className
      )}>
        {currentStatus?.icon}
        {currentStatus?.label}
      </div>
    )
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
            "h-8 px-2 py-1 text-xs font-medium rounded-full border-0",
            currentStatus?.color,
            "hover:opacity-80 transition-opacity",
            "min-w-[90px] justify-between",
            className
          )}
        >
          <div className="flex items-center gap-1">
            {currentStatus?.icon}
            {currentStatus?.label}
          </div>
          <ChevronsUpDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-1" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {availableOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                >
                  <div className={cn(
                    "flex items-center gap-2 px-2 py-1 rounded-md w-full",
                    option.color,
                    value === option.value && "ring-2 ring-gray-300"
                  )}>
                    {option.icon}
                    <span className="text-xs font-medium">{option.label}</span>
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