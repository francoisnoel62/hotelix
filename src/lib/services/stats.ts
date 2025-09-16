import { prisma } from '@/lib/prisma'
import { StatutIntervention } from '@prisma/client'

export interface GlobalStats {
  totalInterventions: number
  enCours: number
  enAttente: number
  terminees: number
  annulees: number
  tauxReussite: number
  tempsMoyenResolution: number // en minutes
}

export interface TechnicianStats {
  interventionsParJour: {
    date: string
    count: number
  }[]
  tempsMoyenIntervention: number
  tauxReussite: number
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

export interface InterventionCounts {
  enCours: number
  enAttente: number
  terminees: number
  annulees: number
  total: number
}

export interface StatsFilters {
  hotelId: number
  technicienId?: number
  periodDays?: number
  dateDebut?: Date
  dateFin?: Date
}

export class StatsService {
  /**
   * Calcule les statistiques globales d'un hôtel
   */
  static async getGlobalStats(hotelId: number, periodDays?: number): Promise<GlobalStats> {
    const dateDebut = periodDays ? new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000) : undefined

    const interventions = await prisma.intervention.findMany({
      where: {
        hotelId,
        ...(dateDebut && { dateCreation: { gte: dateDebut } })
      },
      select: {
        statut: true,
        dateDebut: true,
        dateFin: true
      }
    })

    const total = interventions.length
    const enCours = interventions.filter(i => i.statut === StatutIntervention.EN_COURS).length
    const enAttente = interventions.filter(i => i.statut === StatutIntervention.EN_ATTENTE).length
    const terminees = interventions.filter(i => i.statut === StatutIntervention.TERMINEE).length
    const annulees = interventions.filter(i => i.statut === StatutIntervention.ANNULEE).length

    // Calcul du taux de réussite
    const tauxReussite = total > 0 ? Math.round((terminees / total) * 100) : 0

    // Calcul du temps moyen de résolution
    const interventionsTerminees = interventions.filter(
      i => i.statut === StatutIntervention.TERMINEE && i.dateDebut && i.dateFin
    )

    let tempsMoyenResolution = 0
    if (interventionsTerminees.length > 0) {
      const tempsTotal = interventionsTerminees.reduce((total, intervention) => {
        const debut = new Date(intervention.dateDebut!)
        const fin = new Date(intervention.dateFin!)
        return total + (fin.getTime() - debut.getTime())
      }, 0)
      tempsMoyenResolution = Math.round(tempsTotal / interventionsTerminees.length / (1000 * 60))
    }

    return {
      totalInterventions: total,
      enCours,
      enAttente,
      terminees,
      annulees,
      tauxReussite,
      tempsMoyenResolution
    }
  }

  /**
   * Calcule les statistiques détaillées d'un technicien
   */
  static async getTechnicianStats(technicienId: number, periodDays: number = 30): Promise<TechnicianStats> {

    const dateDebut = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

    const interventions = await prisma.intervention.findMany({
      where: {
        assigneId: technicienId,
        dateCreation: { gte: dateDebut }
      },
      select: {
        type: true,
        statut: true,
        dateCreation: true,
        dateDebut: true,
        dateFin: true
      }
    })

    // Calcul des interventions par jour (10 derniers jours)
    const interventionsParJour = []
    for (let i = 9; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]

      const count = interventions.filter(intervention => {
        const interventionDate = new Date(intervention.dateCreation).toISOString().split('T')[0]
        return interventionDate === dateStr
      }).length

      interventionsParJour.push({ date: dateStr, count })
    }

    // Calcul du temps moyen par intervention
    const interventionsTerminees = interventions.filter(
      i => i.statut === StatutIntervention.TERMINEE && i.dateDebut && i.dateFin
    )

    let tempsMoyenIntervention = 0
    if (interventionsTerminees.length > 0) {
      const tempsTotal = interventionsTerminees.reduce((total, intervention) => {
        const debut = new Date(intervention.dateDebut!)
        const fin = new Date(intervention.dateFin!)
        return total + (fin.getTime() - debut.getTime())
      }, 0)
      tempsMoyenIntervention = Math.round(tempsTotal / interventionsTerminees.length / (1000 * 60))
    }

    // Calcul du taux de réussite
    const totalInterventions = interventions.length
    const interventionsReussies = interventions.filter(i => i.statut === StatutIntervention.TERMINEE).length
    const tauxReussite = totalInterventions > 0 ? Math.round((interventionsReussies / totalInterventions) * 100) : 0

    // Répartition par type
    const typeCount: { [key: string]: number } = {}
    interventions.forEach(intervention => {
      typeCount[intervention.type] = (typeCount[intervention.type] || 0) + 1
    })

    const repartitionParType = Object.entries(typeCount).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / totalInterventions) * 100)
    }))

    // Totaux mensuel
    const totauxMensuel = {
      enCours: interventions.filter(i => i.statut === StatutIntervention.EN_COURS).length,
      terminees: interventions.filter(i => i.statut === StatutIntervention.TERMINEE).length,
      annulees: interventions.filter(i => i.statut === StatutIntervention.ANNULEE).length,
      enAttente: interventions.filter(i => i.statut === StatutIntervention.EN_ATTENTE).length
    }

    return {
      interventionsParJour,
      tempsMoyenIntervention,
      tauxReussite,
      repartitionParType,
      totauxMensuel
    }
  }

  /**
   * Calcule les compteurs d'interventions avec filtres
   */
  static async getInterventionCounts(filters: StatsFilters): Promise<InterventionCounts> {
    const { hotelId, technicienId, periodDays, dateDebut, dateFin } = filters

    const whereClause: Record<string, unknown> = { hotelId }

    if (technicienId) {
      whereClause.assigneId = technicienId
    }

    if (periodDays) {
      whereClause.dateCreation = { gte: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000) }
    } else if (dateDebut || dateFin) {
      whereClause.dateCreation = {}
      if (dateDebut) whereClause.dateCreation.gte = dateDebut
      if (dateFin) whereClause.dateCreation.lte = dateFin
    }

    const interventions = await prisma.intervention.findMany({
      where: whereClause,
      select: { statut: true }
    })

    const enCours = interventions.filter(i => i.statut === StatutIntervention.EN_COURS).length
    const enAttente = interventions.filter(i => i.statut === StatutIntervention.EN_ATTENTE).length
    const terminees = interventions.filter(i => i.statut === StatutIntervention.TERMINEE).length
    const annulees = interventions.filter(i => i.statut === StatutIntervention.ANNULEE).length

    return {
      enCours,
      enAttente,
      terminees,
      annulees,
      total: interventions.length
    }
  }

  /**
   * Met à jour le statut d'un technicien basé sur sa charge de travail
   */
  static async getTechnicianStatus(technicienId: number): Promise<'DISPONIBLE' | 'OCCUPE' | 'HORS_LIGNE'> {
    const counts = await this.getInterventionCounts({
      hotelId: 0, // Will be filtered by technicienId
      technicienId
    })

    if (counts.enCours === 0) return 'DISPONIBLE'
    if (counts.enCours < 3) return 'DISPONIBLE'
    return 'OCCUPE'
  }

}

// Export par défaut pour compatibilité
export default StatsService