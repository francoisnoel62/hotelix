"use client";

import { useState, useMemo } from "react";
import {
  InterventionWithRelations,
  TechnicienOption,
} from "@/lib/types/intervention";
import { UserSession } from "@/lib/types/auth";
import { StatutIntervention } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, Edit } from "lucide-react";
import { StatusCombobox } from "./status-combobox";
import { TechnicianCombobox } from "./technician-combobox";

// Composant pour les actions en lot
interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkStatusChange: (ids: number[], status: StatutIntervention) => Promise<void>;
  onBulkAssign: (ids: number[], technicianId: number | null) => Promise<void>;
  onBulkDelete: (ids: number[]) => Promise<void>;
  user: UserSession;
  techniciens: TechnicienOption[];
  selectedIds: number[];
  onCompleted: () => void;
}

function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkStatusChange,
  onBulkAssign,
  onBulkDelete,
  user,
  techniciens,
  selectedIds,
  onCompleted
}: BulkActionsBarProps) {
  const handleStatusChange = async (status: StatutIntervention) => {
    await onBulkStatusChange(selectedIds, status);
    onCompleted();
  };

  const handleAssignChange = async (technicianId: number | null) => {
    await onBulkAssign(selectedIds, technicianId);
    onCompleted();
  };

  const handleDelete = async () => {
    if (confirm(`Supprimer ${selectedCount} intervention${selectedCount > 1 ? 's' : ''} ?`)) {
      await onBulkDelete(selectedIds);
      onCompleted();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
      {/* Badge de sélection */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
          {selectedCount}
        </div>
        <span className="text-sm font-medium text-blue-900">
          intervention{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
        </span>
      </div>

      {/* Séparateur */}
      <div className="h-6 w-px bg-blue-300"></div>

      {/* Bouton désélectionner */}
      <Button
        size="sm"
        variant="outline"
        onClick={onClearSelection}
        className="text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400"
      >
        Tout désélectionner
      </Button>

      {user.role === 'MANAGER' && (
        <>
          {/* Actions rapides avec design cohérent */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Actions:</span>

            {/* Changement de statut avec design amélioré */}
            <select
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              onChange={(e) => {
                if (e.target.value) {
                  handleStatusChange(e.target.value as StatutIntervention);
                  e.target.value = ''; // Reset selection
                }
              }}
              defaultValue=""
            >
              <option value="">Changer le statut</option>
              <option value="EN_ATTENTE">→ En attente</option>
              <option value="EN_COURS">→ En cours</option>
              <option value="TERMINEE">→ Terminée</option>
              <option value="ANNULEE">→ Annulée</option>
            </select>

            {/* Assignation avec design amélioré */}
            <select
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[140px] transition-colors"
              onChange={(e) => {
                const value = e.target.value;
                if (value !== '') {
                  const technicianId = value === 'null' ? null : parseInt(value);
                  handleAssignChange(technicianId);
                  e.target.value = ''; // Reset selection
                }
              }}
              defaultValue=""
            >
              <option value="">Assigner à</option>
              <option value="null">→ Désassigner</option>
              {techniciens.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  → {tech.name || tech.email}
                </option>
              ))}
            </select>
          </div>

          {/* Séparateur */}
          <div className="h-6 w-px bg-gray-300"></div>

          {/* Action de suppression */}
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Supprimer
          </Button>
        </>
      )}
    </div>
  );
}

type SortField =
  | "titre"
  | "statut"
  | "priorite"
  | "dateCreation"
  | "zone"
  | "assigne";
type SortDirection = "asc" | "desc";

interface InterventionsTableViewProps {
  interventions: InterventionWithRelations[];
  user: UserSession;
  techniciens: TechnicienOption[];
  onStatutChange: (
    interventionId: number,
    statut: StatutIntervention
  ) => Promise<void>;
  onTechnicienChange: (
    interventionId: number,
    technicienId: number | null
  ) => Promise<void>;
  onEdit: (intervention: InterventionWithRelations) => void;
  onBulkActions: {
    updateStatut: (ids: number[], statut: StatutIntervention) => Promise<void>;
    assignTechnician: (
      ids: number[],
      technicienId: number | null
    ) => Promise<void>;
    delete: (ids: number[]) => Promise<void>;
  };
}

export function InterventionsTableView({
  interventions,
  user,
  techniciens,
  onStatutChange,
  onTechnicienChange,
  onEdit,
  onBulkActions,
}: InterventionsTableViewProps) {
  const [sortField, setSortField] = useState<SortField>("dateCreation");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Logique de tri
  const sortedInterventions = useMemo(() => {
    return [...interventions].sort((a, b) => {
      let aValue: string | Date | number, bValue: string | Date | number;

      switch (sortField) {
        case "titre":
          aValue = a.titre.toLowerCase();
          bValue = b.titre.toLowerCase();
          break;
        case "dateCreation":
          aValue = new Date(a.dateCreation);
          bValue = new Date(b.dateCreation);
          break;
        case "zone":
          aValue = a.zone.nom.toLowerCase();
          bValue = b.zone.nom.toLowerCase();
          break;
        case "assigne":
          aValue = a.assigne?.name?.toLowerCase() || "zzz"; // Non assignés en fin
          bValue = b.assigne?.name?.toLowerCase() || "zzz";
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [interventions, sortField, sortDirection]);

  // Gestion du tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Gestion de la sélection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(interventions.map((i) => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (interventionId: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(interventionId);
    } else {
      newSelected.delete(interventionId);
    }
    setSelectedIds(newSelected);
  };

  // Formatage des dates
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // Classe pour les badges de priorité
  const getPrioriteBadgeClass = (priorite: string) => {
    const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    switch (priorite) {
      case 'URGENTE': return `${baseClass} bg-red-100 text-red-800`;
      case 'HAUTE': return `${baseClass} bg-orange-100 text-orange-800`;
      case 'NORMALE': return `${baseClass} bg-gray-100 text-gray-800`;
      case 'BASSE': return `${baseClass} bg-gray-100 text-gray-600`;
      default: return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  // Vérifications de permissions
  const canChangeStatut = (intervention: InterventionWithRelations) => {
    return user.role === 'MANAGER' ||
           (user.role === 'TECHNICIEN' && intervention.assigneId === user.id);
  };

  const canEditIntervention = (intervention: InterventionWithRelations) => {
    if (intervention.statut === StatutIntervention.TERMINEE || intervention.statut === StatutIntervention.ANNULEE) {
      return false;
    }
    if (user.role === 'MANAGER') {
      return true;
    }
    if (user.role === 'TECHNICIEN' && intervention.assigneId === user.id) {
      return true;
    }
    return false;
  };

  const SortableHeader = ({ field, label, className = "" }: { field: SortField; label: string; className?: string }) => (
    <TableHead className={className}>
      <Button
        variant="ghost"
        onClick={() => handleSort(field)}
        className="h-auto p-0 font-medium text-gray-500 hover:text-gray-700"
      >
        {label}
        {sortField === field ? (
          sortDirection === "asc" ? (
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

  return (
    <div className="space-y-4">
      {/* Actions en lot */}
      {selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          onBulkStatusChange={onBulkActions.updateStatut}
          onBulkAssign={onBulkActions.assignTechnician}
          onBulkDelete={onBulkActions.delete}
          user={user}
          techniciens={techniciens}
          selectedIds={Array.from(selectedIds)}
          onCompleted={() => setSelectedIds(new Set())}
        />
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.size === interventions.length && interventions.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <SortableHeader field="statut" label="Statut" className="w-32" />
            <SortableHeader field="titre" label="Titre" />
            <SortableHeader field="priorite" label="Priorité" className="w-24" />
            <SortableHeader field="zone" label="Zone" className="w-40" />
            <SortableHeader field="dateCreation" label="Date création" className="w-40" />
            <SortableHeader field="assigne" label="Assigné à" className="w-40" />
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInterventions.map((intervention) => (
            <TableRow
              key={intervention.id}
              data-state={selectedIds.has(intervention.id) ? "selected" : undefined}
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(intervention.id)}
                  onCheckedChange={(checked) =>
                    handleSelectRow(intervention.id, checked as boolean)
                  }
                />
              </TableCell>
              <TableCell>
                {canChangeStatut(intervention) ? (
                  <StatusCombobox
                    value={intervention.statut}
                    onValueChange={(status) => onStatutChange(intervention.id, status)}
                    canCancel={user.role === 'MANAGER'}
                  />
                ) : (
                  <StatusCombobox
                    value={intervention.statut}
                    onValueChange={() => {}}
                    readOnly={true}
                  />
                )}
              </TableCell>
              <TableCell>
                <div className="max-w-xs">
                  <div className="font-medium truncate">{intervention.titre}</div>
                  {intervention.description && (
                    <div className="text-sm text-gray-500 truncate mt-1">
                      {intervention.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className={getPrioriteBadgeClass(intervention.priorite)}>
                  {intervention.priorite.toLowerCase()}
                </span>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">{intervention.zone.nom}</div>
                  {intervention.sousZone && (
                    <div className="text-gray-500">{intervention.sousZone.nom}</div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDate(intervention.dateCreation)}
              </TableCell>
              <TableCell>
                {user.role === 'MANAGER' ? (
                  <TechnicianCombobox
                    technicians={techniciens}
                    value={intervention.assigneId}
                    onValueChange={(technicianId) =>
                      onTechnicienChange(intervention.id, technicianId)
                    }
                    className="min-w-[140px]"
                  />
                ) : (
                  <div className="text-sm">
                    {intervention.assigne ? (
                      <div>
                        <div className="font-medium">{intervention.assigne.name || intervention.assigne.email}</div>
                        {intervention.assigne.specialite && (
                          <div className="text-gray-500">{intervention.assigne.specialite}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Non assigné</span>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {canEditIntervention(intervention) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(intervention)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {interventions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucune intervention trouvée.
        </div>
      )}
    </div>
  );
}