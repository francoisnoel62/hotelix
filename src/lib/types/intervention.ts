import { StatutIntervention, TypeIntervention, PrioriteIntervention, OrigineIntervention, TypeZone } from '@prisma/client'

export interface InterventionFormData {
  titre: string
  description?: string
  type: TypeIntervention
  priorite: PrioriteIntervention
  origine: OrigineIntervention
  zoneId: number
  sousZoneId?: number
  assigneId?: number
}

export interface InterventionWithRelations {
  id: number
  titre: string
  description?: string
  statut: StatutIntervention
  type: TypeIntervention
  priorite: PrioriteIntervention
  origine: OrigineIntervention
  dateCreation: Date
  dateDebut?: Date
  dateFin?: Date
  demandeur: {
    id: number
    name?: string
    email: string
    role: string
  }
  assigne?: {
    id: number
    name?: string
    email: string
    specialite?: string
  }
  zone: {
    id: number
    nom: string
    type: TypeZone
  }
  sousZone?: {
    id: number
    nom: string
  }
}

export interface ZoneWithSousZones {
  id: number
  nom: string
  type: TypeZone
  sousZones: {
    id: number
    nom: string
  }[]
}

export interface TechnicienOption {
  id: number
  name?: string
  email: string
  specialite?: string
}

export type StatutColor = 'gray' | 'blue' | 'green' | 'red'
export type PrioriteColor = 'gray' | 'yellow' | 'orange' | 'red'

export const STATUT_COLORS: Record<StatutIntervention, StatutColor> = {
  EN_ATTENTE: 'gray',
  EN_COURS: 'blue',
  TERMINEE: 'green',
  ANNULEE: 'red'
}

export const PRIORITE_COLORS: Record<PrioriteIntervention, PrioriteColor> = {
  BASSE: 'gray',
  NORMALE: 'gray',
  HAUTE: 'orange',
  URGENTE: 'red'
}