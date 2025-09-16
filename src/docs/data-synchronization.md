# Guide de Synchronisation des Données - Hotelix

## Vue d'ensemble

Ce document décrit l'architecture moderne de synchronisation des données entre le dashboard des interventions et la gestion des techniciens, utilisant des **mises à jour optimistes** pour une expérience utilisateur instantanée et fluide.

## Architecture Évoluée

### Service Centralisé de Statistiques

Le `StatsService` (`src/lib/services/stats.ts`) est la source unique de vérité pour tous les calculs de KPI :

- **GlobalStats** : Statistiques globales d'un hôtel
- **TechnicianStats** : Statistiques détaillées d'un technicien
- **InterventionCounts** : Compteurs d'interventions avec filtres

### Mises à Jour Optimistes

L'architecture utilise des **optimistic updates** pour une expérience utilisateur supérieure :

- **Feedback instantané** : L'interface se met à jour immédiatement
- **Récupération sur erreur** : Revert automatique en cas d'échec
- **Pas de loading states** : Élimination des états de chargement frustrants

### Hooks Unifiés de Données

Les hooks personnalisés centralisent la gestion des données :

- **`useInterventionData`** : Gestion des interventions avec mises à jour optimistes
- **`useTechnicianData`** : Gestion spécialisée des données techniciens
- **Synchronisation manuelle** : Refresh explicite pour la cohérence inter-onglets

## Utilisation

### Hooks avec Mises à Jour Optimistes

```typescript
// Pour les données d'interventions avec mises à jour optimistes
const {
  interventions,
  stats,
  refresh,
  updateOptimistic
} = useInterventionData(hotelId, userId, role, true)

// Mise à jour optimiste d'un statut
updateOptimistic(interventionId, { statut: 'EN_COURS' })

// Pour les données des techniciens
const { technicians, refresh } = useTechniciansData(hotelId)

// Pour les détails d'un technicien avec updates optimistes
const { technician, stats, refresh } = useTechnicianDetail(technicianId, currentUserId)
```

### Service de Statistiques (Sans Cache)

```typescript
// Stats globales - calcul direct
const globalStats = await StatsService.getGlobalStats(hotelId, periodDays)

// Stats technicien - calcul direct
const techStats = await StatsService.getTechnicianStats(technicianId, periodDays)

// Compteurs avec filtres - calcul direct
const counts = await StatsService.getInterventionCounts({ hotelId, technicienId })
```

### Composants avec Optimistic Updates

```typescript
// Dans InterventionsList
const handleStatusChange = (interventionId: number, newStatus: StatutIntervention) => {
  // 1. Mise à jour optimiste immédiate
  onOptimisticUpdate(interventionId, { statut: newStatus })

  // 2. Appel serveur en arrière-plan
  updateInterventionStatut(interventionId, newStatus, userId).catch(() => {
    // 3. Revert en cas d'erreur
    onRefresh()
  })
}
```

## Tests des Mises à Jour Optimistes

### Tests Automatisés

Exécuter les nouveaux tests optimistes :

```bash
npm test src/__tests__/optimistic-updates.test.ts
```

**Tests couverts** :
- ✅ Mises à jour de statut d'intervention
- ✅ Assignations de techniciens
- ✅ Gestion des erreurs et rollback
- ✅ Cohérence des données sous charge
- ✅ Validation des permissions

### Scénarios de Test Manuels

1. **Test de mise à jour optimiste** :
   - Ouvrir dashboard ou page technicien
   - Changer le statut d'une intervention
   - **Vérifier** : Changement instantané dans l'UI
   - **Vérifier** : Pas d'état de chargement visible

2. **Test d'assignation optimiste** :
   - Assigner une intervention à un technicien
   - **Vérifier** : Changement instantané dans l'UI
   - **Vérifier** : Compteurs mis à jour immédiatement

3. **Test de récupération d'erreur** :
   - Simuler une erreur réseau (dev tools)
   - Effectuer un changement
   - **Vérifier** : Revert automatique après l'erreur

4. **Test de cohérence inter-pages** :
   - Modifier une intervention dans une page
   - Naviguer vers une autre page
   - **Vérifier** : Données cohérentes (via refresh manuel)

## Dépannage

### Problèmes Courants

**Mises à jour non visibles** :
- Vérifier que `onOptimisticUpdate` est bien appelé
- Contrôler que les actions serveur fonctionnent
- Vérifier les `revalidatePath` dans les actions

**Performance dégradée** :
- Contrôler les requêtes N+1 dans `StatsService`
- Optimiser les calculs de statistiques lourds
- Vérifier les indexes de base de données

**Données incohérentes** :
- Utiliser `refresh()` pour resynchroniser
- Vérifier la logique de rollback en cas d'erreur
- Contrôler les permissions utilisateur

### Debugging

```typescript
// Debug des mises à jour optimistes
const { updateOptimistic } = useInterventionData(...)

// Log des changements
updateOptimistic(interventionId, updates)
console.log('Optimistic update applied:', updates)

// Debugging des erreurs serveur
updateInterventionStatut(id, status, userId).catch(error => {
  console.error('Server action failed:', error)
  // Le rollback se fait automatiquement via refresh()
})
```

## Bonnes Pratiques

1. **Toujours utiliser les mises à jour optimistes** pour les interactions utilisateur
2. **Appeler `updateOptimistic` en premier** pour un feedback instantané
3. **Implémenter la récupération d'erreur** avec `refresh()` ou revert
4. **Utiliser le service centralisé** pour tous les calculs de KPI
5. **Tester les scénarios d'erreur** pour valider le rollback

## Architecture Évolutive

### Évolution de l'Architecture

**Phase 1** (Originale) : Cache complexe + invalidation
```
Actions → Cache Invalidation → Revalidation → UI Update
```

**Phase 2** (Actuelle) : Mises à jour optimistes
```
Actions → Optimistic Update → UI Update instantané → Server Action (background)
```

### Avantages de l'Évolution

1. **UX Supérieure** : Feedback instantané vs états de chargement
2. **Code Plus Simple** : Moins de complexité cache/invalidation
3. **Meilleure Performance** : Pas de gestion de cache
4. **Plus Fiable** : Moins de points de défaillance

### Ajout de Nouvelles Fonctionnalités

1. Ajouter le calcul dans `StatsService`
2. Étendre les hooks avec `updateOptimistic`
3. Implémenter la mise à jour optimiste dans les composants
4. Ajouter les tests d'optimistic updates
5. Documenter la nouvelle fonctionnalité

### Tests de Régression

Exécuter les nouveaux tests avant chaque déploiement :

```bash
npm test src/__tests__/optimistic-updates.test.ts
npm run test:coverage -- --include="**/optimistic-updates.test.ts"
```