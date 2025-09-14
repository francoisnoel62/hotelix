'use client'

import { TechnicianStats } from '@/lib/types/technician'

interface TechnicianStatsModuleProps {
  stats: TechnicianStats | null
}

export function TechnicianStatsModule({ stats }: TechnicianStatsModuleProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune donnée disponible</h3>
          <p className="mt-1 text-sm text-gray-500">Les statistiques apparaîtront une fois que le technicien aura des interventions.</p>
        </div>
      </div>
    )
  }

  const maxInterventionsParJour = Math.max(...stats.interventionsParJour.map(d => d.count), 1)

  return (
    <div className="space-y-6">
      {/* KPIs en haut */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.tempsMoyenIntervention}min</div>
          <div className="text-sm text-gray-500">Temps moyen</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats.tauxReussite}%</div>
          <div className="text-sm text-gray-500">Taux de réussite</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.totauxMensuel.terminees}</div>
          <div className="text-sm text-gray-500">Terminées ce mois</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.totauxMensuel.enCours}</div>
          <div className="text-sm text-gray-500">En cours</div>
        </div>
      </div>

      {/* Graphique interventions par jour */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Interventions des 10 derniers jours</h3>
        <div className="space-y-3">
          {stats.interventionsParJour.map((day) => {
            const width = maxInterventionsParJour > 0 ? (day.count / maxInterventionsParJour) * 100 : 0
            const date = new Date(day.date)
            const formattedDate = date.toLocaleDateString('fr-FR', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit'
            })

            return (
              <div key={day.date} className="flex items-center gap-4">
                <div className="w-20 text-sm text-gray-600">{formattedDate}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${width}%` }}
                  />
                </div>
                <div className="w-8 text-sm font-medium text-gray-900">{day.count}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Répartition par type */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition par type d'intervention</h3>
        <div className="space-y-4">
          {stats.repartitionParType.map((type) => (
            <div key={type.type} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">{type.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${type.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-8">{type.count}</span>
                <span className="text-xs text-gray-500 w-8">({type.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statut des interventions */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Statut des interventions (ce mois)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{stats.totauxMensuel.enCours}</div>
            <div className="text-sm text-blue-600">En cours</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">{stats.totauxMensuel.terminees}</div>
            <div className="text-sm text-green-600">Terminées</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-gray-600">{stats.totauxMensuel.enAttente}</div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-xl font-bold text-red-600">{stats.totauxMensuel.annulees}</div>
            <div className="text-sm text-red-600">Annulées</div>
          </div>
        </div>
      </div>

      {/* Gauge du taux de réussite */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Taux de réussite</h3>
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            {/* Cercle de fond */}
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="transparent"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              {/* Cercle de progression */}
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="transparent"
                stroke={stats.tauxReussite >= 80 ? "#10b981" : stats.tauxReussite >= 60 ? "#f59e0b" : "#ef4444"}
                strokeWidth="8"
                strokeDasharray={`${(stats.tauxReussite / 100) * 351.86} 351.86`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="text-2xl font-bold text-gray-900">{stats.tauxReussite}%</div>
              <div className="text-xs text-gray-500">réussite</div>
            </div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {stats.tauxReussite >= 90 ? "Excellent performance !" :
             stats.tauxReussite >= 80 ? "Très bonne performance" :
             stats.tauxReussite >= 70 ? "Performance correcte" :
             stats.tauxReussite >= 60 ? "Performance à améliorer" :
             "Performance critique - attention requise"}
          </p>
        </div>
      </div>
    </div>
  )
}