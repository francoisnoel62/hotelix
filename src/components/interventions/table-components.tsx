"use client";

import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { ReactNode } from "react";

// Type pour les champs de tri
export type SortField =
  | "titre"
  | "statut"
  | "priorite"
  | "dateCreation"
  | "zone"
  | "assigne";

export type SortDirection = "asc" | "desc";

// Composant pour les en-têtes triables
interface SortableHeaderProps {
  field: SortField;
  label: string;
  currentSort: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  className?: string;
}

export function SortableHeader({
  field,
  label,
  currentSort,
  direction,
  onSort,
  className = ""
}: SortableHeaderProps) {
  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        onClick={() => onSort(field)}
        className="h-auto p-0 font-medium text-gray-500 hover:text-gray-700"
      >
        {label}
        {currentSort === field ? (
          direction === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4" />
        )}
      </Button>
    </TableHead>
  );
}

// Composant pour la barre d'actions en lot
interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: (ids: number[]) => Promise<void>;
  user: { role: string };
  selectedIds: number[];
  children?: ReactNode;
}

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  user,
  selectedIds,
  children
}: BulkActionsToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <span className="text-sm font-medium text-blue-900">
        {selectedCount} intervention{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={onClearSelection}
      >
        Désélectionner
      </Button>
      {user.role === 'MANAGER' && (
        <>
          <Button
            size="sm"
            onClick={() => {
              // TODO: Implémenter l'assignation en lot avec un modal
              console.log('Assignation en lot:', selectedIds);
            }}
          >
            Assigner
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // TODO: Implémenter le changement de statut en lot avec un modal
              console.log('Changement statut en lot:', selectedIds);
            }}
          >
            Changer statut
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (confirm(`Supprimer ${selectedCount} intervention${selectedCount > 1 ? 's' : ''} ?`)) {
                onBulkDelete(selectedIds);
              }
            }}
          >
            Supprimer
          </Button>
        </>
      )}
      {children}
    </div>
  );
}

// Fonction utilitaire pour les classes de badges de priorité
export const getPriorityBadgeClass = (priorite: string) => {
  const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

  switch (priorite) {
    case 'URGENTE': return `${baseClass} bg-red-100 text-red-800`;
    case 'HAUTE': return `${baseClass} bg-orange-100 text-orange-800`;
    case 'NORMALE': return `${baseClass} bg-gray-100 text-gray-800`;
    case 'BASSE': return `${baseClass} bg-gray-100 text-gray-600`;
    default: return `${baseClass} bg-gray-100 text-gray-800`;
  }
};

// Fonction utilitaire pour le formatage des dates
export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};