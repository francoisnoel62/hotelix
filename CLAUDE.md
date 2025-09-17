# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hotelix** is a Next.js 15 hotel management application with TypeScript, Prisma, and Tailwind CSS. The project uses the App Router architecture with PostgreSQL as the database.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database using `prisma/seed.ts`

## Testing Commands

- `npm test` - Run all tests (50 tests: optimistic updates, bulk actions, etc.)
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:ui` - Open Vitest UI interface
- `npm run test:coverage` - Generate test coverage report
- `npm run test:unit` - Run unit tests only (Server Actions and validations)
- `npm run test:integration` - Run integration tests only (database relationships)
- `npm test -- --run --pool=forks --poolOptions.forks.singleFork=true` - Sequential execution (recommended)

## Test Database Commands

- `npm run test:db:setup` - Start test database and push schema
- `npm run test:db:teardown` - Stop test database
- `npm run db:test:push` - Push schema to test database manually
- `docker-compose -f docker-compose.test.yml up -d` - Start test database
- `docker-compose -f docker-compose.test.yml down` - Stop test database

## Architecture & Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **UI Components**: Radix UI primitives with shadcn/ui (New York style) + Table components
- **Icons**: Lucide React
- **Testing**: Vitest v2.1.9 with React Testing Library and Docker PostgreSQL
- **Build Tool**: Turbopack

## Database Schema

The application uses a hotel management domain model with:
- **User** model with role-based access (MANAGER/STAFF)
- **Hotel** model with location information
- Users belong to hotels (many-to-one relationship)

## Architecture Moderne (Clean Code & Best Practices)

### Server Actions vs API Routes
✅ **UTILISE TOUJOURS les Server Actions** pour les opérations serveur (auth, CRUD)
❌ **ÉVITE les API Routes** sauf pour webhooks/intégrations tierces

### Structure Optimisée
```
src/
├── app/
│   ├── actions/          # Server Actions (priorité)
│   ├── auth/            # Pages d'authentification
│   ├── api/             # API Routes (minimal, uniquement si nécessaire)
│   └── layout.tsx
├── components/
│   ├── auth/            # Composants d'authentification
│   ├── interventions/   # Gestion interventions (vue détaillée + table)
│   │   ├── view-switcher.tsx          # Switcher vue détaillée/table
│   │   ├── interventions-table-view.tsx # Vue table avec tri et actions en lot
│   │   └── table-components.tsx       # Composants auxiliaires table
│   └── ui/              # shadcn/ui components (Table, Checkbox, etc.)
├── hooks/
│   ├── useInterventionData.ts         # Hook données avec mises à jour optimistes
│   ├── useViewMode.ts                 # Hook persistance vue table/détaillée
│   └── useTechnicianData.ts           # Hook données techniciens
├── lib/
│   ├── types/           # Types TypeScript
│   ├── validations/     # Validation schemas
│   └── prisma.ts        # Singleton PrismaClient
└── prisma/              # Schéma, migrations, seed
```

### Patterns Implementés

#### 1. **Server Actions avec Progressive Enhancement**
- ✅ `src/app/actions/auth.ts` - Actions serveur pour l'authentification
- ✅ `useActionState` pour l'état des formulaires
- ✅ Validation côté client ET serveur

#### 2. **Architecture des Composants**
- ✅ **Server Components** par défaut (SSR optimisé)
- ✅ **Client Components** uniquement pour l'interactivité
- ✅ **React Hook Form** pour la gestion des formulaires
- ✅ **Suspense** avec fallbacks optimisés

#### 3. **Gestion des Données**
- ✅ **Singleton PrismaClient** (`src/lib/prisma.ts`)
- ✅ **Types unifiés** dans `src/lib/types/auth.ts`
- ✅ **Validation centralisée** avec fonctions réutilisables

#### 4. **Performance & UX**
- ✅ **Chargement des données côté serveur** (HotelsProvider)
- ✅ **Mises à jour optimistes** - Interface instantanément réactive
- ✅ **Gestion d'erreurs typées** (AuthError enum)

#### 5. **Mises à Jour Optimistes (Pattern Principal)**
- ✅ **Hook `useInterventionData`** avec fonction `updateOptimistic`
- ✅ **Feedback instantané** sur changements de statut/assignation
- ✅ **Récupération d'erreur** automatique avec rollback
- ✅ **Pas d'états de chargement** pour les interactions utilisateur

#### 6. **Vue Table avec Actions en Lot**
- ✅ **Composants shadcn-ui** complets (Table, Checkbox)
- ✅ **View Switcher** avec persistance localStorage
- ✅ **Tri des colonnes** (titre, date, statut, priorité, zone, assigné)
- ✅ **Sélection multiple** avec Set optimisé pour performance
- ✅ **Actions en lot** (statut, assignation, suppression multiple)
- ✅ **Mises à jour optimistes** étendues aux actions bulk

## UI Component System

### shadcn/ui Configuration
- **Style**: "new-york" variant
- **Base color**: neutral
- **CSS variables**: enabled
- **Path aliases**: `@/components`, `@/lib`, `@/ui`, `@/hooks`
- **Formulaires**: React Hook Form + Server Actions

## Conventions de Développement

### 🔒 Authentification
- Utilise les Server Actions dans `src/app/actions/auth.ts`
- Types unifiés : `LoginFormData`, `RegisterFormData`, `UserSession`
- Validation double : client (React Hook Form) + serveur (fonctions utilitaires)

### 📊 Base de Données
- Singleton PrismaClient pour éviter les fuites mémoire
- Schema Prisma avec relations appropriées
- Migrations versionnées

### 🎨 Composants
- Server Components par défaut
- Client Components marqués avec 'use client'
- Progressive enhancement avec fallbacks

## Patterns de Mises à Jour Optimistes

### 🚀 Pattern Principal
Toujours utiliser la mise à jour optimiste pour les interactions utilisateur :

```typescript
// Dans un composant
const handleStatusChange = async (interventionId: number, newStatus: StatutIntervention) => {
  // 1. Mise à jour optimiste immédiate
  onOptimisticUpdate(interventionId, { statut: newStatus })

  // 2. Server action en arrière-plan
  try {
    await updateInterventionStatut(interventionId, newStatus, userId)
    toast({ variant: 'success', title: 'Statut mis à jour' })
  } catch {
    // 3. Récupération d'erreur
    onRefresh()
    toast({ variant: 'error', title: 'Erreur' })
  }
}
```

### 📋 Bonnes Pratiques
1. **Toujours appeler `updateOptimistic` EN PREMIER** pour feedback instantané
2. **Implémenter la récupération d'erreur** avec `onRefresh()` ou revert manual
3. **Tester les scénarios d'erreur** pour valider le comportement de rollback
4. **Éviter les états de chargement** pour les interactions directes

### 🧪 Tests des Mises à Jour Optimistes
- Tests dans `src/__tests__/optimistic-updates.test.ts`
- Couvrent les changements de statut, assignations, gestion d'erreurs
- Pattern : Action → Vérifier UI → Vérifier DB → Tester rollback

## Patterns Vue Table et Actions en Lot

### 🎯 Pattern View Switcher
Utiliser le hook de persistance pour sauvegarder les préférences utilisateur :

```typescript
// Hook avec persistance localStorage
const [viewMode, setViewMode] = useViewMode()

// Rendu conditionnel
{viewMode === 'detailed' ? (
  <InterventionsListDetailed />
) : (
  <InterventionsTableView />
)}
```

### 📊 Pattern Table avec Tri
Implémenter le tri côté client avec optimisation performance :

```typescript
// Tri optimisé avec useMemo
const sortedInterventions = useMemo(() => {
  if (!sortConfig.field) return interventions

  return [...interventions].sort((a, b) => {
    // Logique de tri intelligent (dates, chaînes, null)
    return sortConfig.direction === 'asc' ? comparison : -comparison
  })
}, [interventions, sortConfig])
```

### 🔄 Pattern Actions en Lot avec Optimistic Updates
Étendre les mises à jour optimistes aux actions multiples :

```typescript
const handleBulkStatusChange = async (ids: number[], newStatus: StatutIntervention) => {
  // 1. Mise à jour optimiste pour tous les IDs
  ids.forEach(id => onOptimisticUpdate(id, { statut: newStatus }))

  // 2. Server action bulk en arrière-plan
  try {
    await updateMultipleInterventionStatut(ids, newStatus, userId)
    toast({ variant: 'success', title: `${ids.length} interventions mises à jour` })
  } catch {
    // 3. Récupération d'erreur globale
    onRefresh()
    toast({ variant: 'error', title: 'Erreur lors de la mise à jour en lot' })
  }
}
```

### ✅ Pattern Sélection Multiple
Utiliser Set pour performance avec grandes listes :

```typescript
const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

// Sélection optimisée
const handleSelectAll = (checked: boolean) => {
  setSelectedIds(checked ? new Set(interventions.map(i => i.id)) : new Set())
}

const handleSelectOne = (id: number, checked: boolean) => {
  setSelectedIds(prev => {
    const newSet = new Set(prev)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    return newSet
  })
}
```

### 🧪 Tests Actions en Lot
- Tests dans `src/app/actions/__tests__/bulk-actions.test.ts`
- Couvrent les modifications multiples de statut, assignations, suppressions
- Validation des permissions pour actions bulk
- Pattern : Setup → Bulk Action → Vérifier tous les changements → Tester rollback

## Évolution Architecturale

Ce projet a évolué d'une **architecture de cache complexe** vers des **mises à jour optimistes** pour une expérience utilisateur supérieure.

### Avantages de l'Approche Actuelle
- ✅ **UX instantanée** : Pas d'attente pour l'utilisateur
- ✅ **Code plus simple** : Pas de gestion de cache complexe
- ✅ **Plus fiable** : Moins de points de défaillance
- ✅ **Maintenable** : Architecture prévisible et testable