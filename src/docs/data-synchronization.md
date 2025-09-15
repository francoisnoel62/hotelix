# Guide de Synchronisation des Données - Hotelix

## Vue d'ensemble

Ce document décrit l'architecture de synchronisation des données entre le dashboard des interventions et la gestion des techniciens, garantissant la cohérence temps réel de tous les KPI et statistiques.

## Architecture

### Service Centralisé de Statistiques

Le `StatsService` (`src/lib/services/stats.ts`) est la source unique de vérité pour tous les calculs de KPI :

- **GlobalStats** : Statistiques globales d'un hôtel
- **TechnicianStats** : Statistiques détaillées d'un technicien
- **InterventionCounts** : Compteurs d'interventions avec filtres

### Cache Intelligent

Le système de cache (`src/lib/cache/interventionCache.ts`) optimise les performances :

- **TTL configuré** : 1 minute par défaut
- **Invalidation automatique** : Après chaque modification
- **Nettoyage automatique** : Évite l'accumulation mémoire

### Synchronisation Inter-Onglets

Le hook `useDataSync` (`src/hooks/useDataSync.ts`) assure la synchronisation :

- **Événements localStorage** : Communication entre onglets
- **Focus window** : Refresh automatique au focus
- **Polling optionnel** : Détection des changements externes

## Utilisation

### Hooks Unifiés

```typescript
// Pour les données d'interventions avec stats
const { interventions, stats, refresh } = useInterventionData(hotelId, userId, role, true)

// Pour les données des techniciens
const { technicians, refresh } = useTechniciansData(hotelId)

// Pour les détails d'un technicien
const { technician, stats, refresh } = useTechnicianDetail(technicianId, currentUserId)
```

### Service de Statistiques

```typescript
// Stats globales
const globalStats = await StatsService.getGlobalStats(hotelId, periodDays)

// Stats technicien
const techStats = await StatsService.getTechnicianStats(technicianId, periodDays)

// Compteurs avec filtres
const counts = await StatsService.getInterventionCounts({ hotelId, technicienId })
```

## Tests de Cohérence

### Tests Automatisés

Exécuter les tests de synchronisation :

```bash
npm test src/__tests__/data-synchronization.test.ts
npm test src/__tests__/performance.test.ts
```

### Scénarios de Test Manuels

1. **Test de cohérence KPI** :
   - Ouvrir dashboard et page techniciens
   - Vérifier que les mêmes valeurs sont affichées
   - Modifier une intervention
   - Vérifier la mise à jour instantanée

2. **Test de synchronisation inter-onglets** :
   - Ouvrir deux onglets sur des pages différentes
   - Modifier une intervention dans un onglet
   - Vérifier la synchronisation dans l'autre

3. **Test de performance** :
   - Mesurer le temps de chargement initial
   - Vérifier que le cache accélère les requêtes suivantes

## Dépannage

### Problèmes Courants

**KPI incohérents** :
- Vérifier que toutes les actions utilisent `StatsService`
- Contrôler l'invalidation du cache
- Vérifier la revalidation des chemins

**Performance dégradée** :
- Vérifier la configuration du cache (TTL, taille)
- Contrôler les requêtes N+1
- Optimiser les calculs lourds

**Synchronisation défaillante** :
- Vérifier les événements localStorage
- Contrôler la revalidation Next.js
- Vérifier les hooks de synchronisation

### Debugging

```typescript
// Activer le debug du cache
localStorage.setItem('hotelix_cache_debug', 'true')

// Forcer l'invalidation du cache
import { interventionCache } from '@/lib/cache/interventionCache'
interventionCache.invalidateAll()

// Vérifier la revalidation
console.log('Revalidating paths...')
```

## Bonnes Pratiques

1. **Toujours utiliser le service centralisé** pour les calculs de KPI
2. **Invalider le cache** après chaque modification de données
3. **Revalider tous les chemins** concernés par une modification
4. **Tester la synchronisation** lors de nouveaux développements
5. **Monitorer les performances** des requêtes statistiques

## Migration et Maintenance

### Ajout de Nouveaux KPI

1. Ajouter le calcul dans `StatsService`
2. Mettre à jour les types TypeScript
3. Ajouter les tests de cohérence
4. Documenter la nouvelle métrique

### Optimisation des Performances

1. Analyser les requêtes lentes
2. Optimiser les calculs SQL
3. Ajuster la configuration du cache
4. Implémenter des indexes si nécessaire

### Tests de Régression

Exécuter la suite complète avant chaque déploiement :

```bash
npm run test:coverage -- src/__tests__/data-synchronization.test.ts
npm run test:coverage -- src/__tests__/performance.test.ts
```