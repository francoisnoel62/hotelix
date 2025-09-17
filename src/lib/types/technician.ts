import { Role } from '@prisma/client'
import { InterventionWithRelations } from './intervention'

export interface TechnicianWithDetails {
  id: number
  email: string
  name: string | null
  role: Role
  specialite: string | null
  createdAt: Date
  hotel: {
    id: number
    nom: string
    adresse: string
    pays: string
  }
  interventionsAssignees: InterventionWithRelations[]
  _count: {
    interventionsAssignees: number
  }
}

export interface TechnicianListItem {
  id: number
  email: string
  name: string | null
  specialite: string | null
  interventionsEnCours: number
  interventionsTotal: number
  dernierActivite: Date | null
  statut: 'DISPONIBLE' | 'OCCUPE' | 'HORS_LIGNE'
  noteMoyenne?: number
}

export interface TechnicianStats {
  interventionsParJour: {
    date: string
    count: number
  }[]
  tempsMoyenIntervention: number // en minutes
  tauxReussite: number // pourcentage
  repartitionParType: {
    type: string
    count: number
    percentage: number
  }[]
  totauxMensuel: {
    enCours: number
    terminees: number
    annulees: number
    enAttente: number
  }
}

export interface TechnicianFilter {
  search: string
  specialite: string | 'ALL'
  statut: 'ALL' | 'DISPONIBLE' | 'OCCUPE' | 'HORS_LIGNE'
}

export interface AssignmentPayload {
  interventionId: number
  technicienId: number
  assignedBy: number
}