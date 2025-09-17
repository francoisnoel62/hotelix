# 🧪 Guide de Tests - Hotelix

Ce document détaille l'infrastructure de tests mise en place pour Hotelix et explique comment l'utiliser efficacement.

## 📊 Vue d'ensemble

### Infrastructure Actuelle
- **Framework** : Vitest v2.1.9 (3-4x plus rapide que Jest)
- **Environnement** : jsdom pour les composants React
- **Base de données** : PostgreSQL isolée avec Docker
- **Couverture** : 50 tests couvrant authentification, logique métier, BDD et actions en lot
- **Outils** : React Testing Library, bcryptjs mocking, Next.js mocking

### Statistiques de Tests
```
✅ 50 tests passing
├── 17 tests d'authentification
├── 16 tests de logique métier (dont 5 actions en lot)
├── 8 tests de base de données
├── 8 tests mises à jour optimistes
└── 1 test validation simple

📁 8 fichiers de tests
├── src/app/actions/__tests__/auth.test.ts
├── src/app/actions/__tests__/intervention.test.ts
├── src/app/actions/__tests__/bulk-actions.test.ts        # ✨ Nouveau
├── src/app/actions/__tests__/bulk-actions-simple.test.ts # ✨ Nouveau
├── src/__tests__/optimistic-updates.test.ts              # ✨ Nouveau
├── src/lib/validations/__tests__/auth.test.ts
├── src/lib/__tests__/prisma.test.ts
└── src/test/__tests__/database-relationships.test.ts
```

## 🚀 Commandes Rapides

```bash
# Tests complets (recommandé pour CI)
npm test -- --run --pool=forks --poolOptions.forks.singleFork=true

# Tests en mode watch (développement)
npm run test:watch

# Tests par type
npm run test:unit              # Tests unitaires seulement
npm run test:integration       # Tests d'intégration seulement

# Interface utilisateur des tests
npm run test:ui

# Rapport de couverture
npm run test:coverage

# Tests spécifiques
npm test src/app/actions/__tests__/auth.test.ts
```

## 🐳 Base de Données de Test

### Configuration Docker
La base de données de test utilise Docker pour une isolation complète :

```yaml
# docker-compose.test.yml
services:
  test-db:
    image: postgres:15
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: hotelix_test
    ports:
      - "5433:5432"
```

### Gestion de la Base de Test

```bash
# Commandes automatisées (recommandé)
npm run test:db:setup          # Démarrer + pousser schéma
npm run test:db:teardown       # Arrêter la base
npm run db:test:push           # Pousser schéma seulement

# Commandes manuelles Docker
docker-compose -f docker-compose.test.yml up -d
DATABASE_URL=postgresql://test:test@localhost:5433/hotelix_test npx prisma db push
docker-compose -f docker-compose.test.yml down
```

### Isolation des Tests
Chaque test bénéficie d'un environnement propre grâce à :
- `resetDatabase()` : Suppression de toutes les données en respectant les contraintes FK
- `seedTestData()` : Création de données de test cohérentes
- Sequences reset : IDs prévisibles pour les assertions

## 🔐 Tests d'Authentification

### Couverture
- ✅ **Registration** : Validation, hachage, duplication d'emails
- ✅ **Login** : Credentials, autorisation, isolation hôtelière
- ✅ **Validation** : Email, mots de passe, contraintes métier
- ✅ **Sécurité** : bcryptjs mocking, FormData handling

### Exemple de Test
```typescript
describe('registerAction', () => {
  it('should successfully register a new user', async () => {
    const { hotel } = await seedTestData()
    mockedBcryptjs.hash.mockResolvedValue('hashed_password')

    const formData = new FormData()
    formData.append('email', 'test@example.com')
    formData.append('password', 'password123')
    formData.append('hotelId', hotel.id.toString())

    const result = await registerAction(null, formData)

    expect(result.success).toBe(true)
    expect(result.data?.email).toBe('test@example.com')
  })
})
```

## 🛠️ Tests de Logique Métier

### Matrice de Permissions Testée

| Rôle | Créer | Modifier Statut | Assigner | Voir |
|------|-------|----------------|----------|------|
| MANAGER | ✅ | ✅ Toutes | ✅ Toutes | ✅ Toutes |
| TECHNICIEN | ✅ | ✅ Assignées | ❌ | ✅ Assignées |
| STAFF | ✅ | ❌ | ❌ | ✅ Toutes |

### Scénarios Testés
- **Création d'interventions** avec isolation hôtelière
- **Gestion des statuts** avec dates automatiques
- **Assignation/désassignation** avec contrôles de rôles
- **Filtrage des données** par rôle et hôtel
- **Gestion d'erreurs** avec messages appropriés

## 🗄️ Tests de Base de Données

### Relations Testées
- **Hotel ↔ User** : Isolation multi-hôtelière
- **Zone ↔ SousZone** : Hiérarchie géographique
- **Intervention ↔ User** : Demandeur et assigné
- **Message ↔ User** : Communication interne

### Contraintes Validées
- ✅ **Clés étrangères** : Intégrité référentielle
- ✅ **Contraintes uniques** : Email global
- ✅ **Énumérations** : Types, statuts, priorités
- ✅ **Champs optionnels** : Null handling correct

### Exemple de Test Relationnel
```typescript
it('should maintain referential integrity for interventions', async () => {
  const intervention = await testPrisma.intervention.create({
    data: {
      titre: 'Test intervention',
      hotelId: hotel.id,
      demandeurId: manager.id,
      assigneId: technicien.id,
      zoneId: zone.id
    },
    include: {
      hotel: true,
      demandeur: true,
      assigne: true,
      zone: true
    }
  })

  expect(intervention.hotel.nom).toBe('Test Hotel')
  expect(intervention.demandeur.role).toBe('MANAGER')
  expect(intervention.assigne.role).toBe('TECHNICIEN')
})
```

## ⚡ Optimisations de Performance

### Stratégies Appliquées
1. **Exécution séquentielle** : Évite les conflits de base de données
2. **Mocking intelligent** : bcryptjs, Next.js router, cache
3. **Reset optimisé** : Suppression dans l'ordre des dépendances
4. **Prisma singleton** : Réutilisation des connexions

### Temps d'Exécution Typiques
```
⚡ Exécution séquentielle: ~3.03s
├── Setup environnement: 154ms
├── Collection des tests: 229ms
├── Exécution des tests: 1.43s
└── Nettoyage: 89ms
```

## 🔧 Configuration & Mocking

### Vitest Configuration (`vitest.config.mts`)
```typescript
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false
  }
})
```

### Mocks Globaux (`src/test/setup.ts`)
```typescript
// Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/'
}))

// Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn()
}))
```

## 📝 Conventions de Tests

### Structure des Fichiers
```
src/
├── app/actions/__tests__/        # Tests des Server Actions
├── lib/validations/__tests__/    # Tests des validations
├── lib/__tests__/               # Tests des utilitaires
└── test/
    ├── setup.ts                 # Configuration globale
    ├── db-utils.ts             # Utilitaires BDD
    └── __tests__/              # Tests d'intégration
```

### Nommage des Tests
```typescript
describe('FeatureName', () => {
  describe('methodName', () => {
    it('should do something when condition', async () => {
      // Arrange
      const data = await setupTestData()

      // Act
      const result = await methodUnderTest(data)

      // Assert
      expect(result.success).toBe(true)
    })
  })
})
```

### Patterns de Tests
1. **AAA Pattern** : Arrange, Act, Assert
2. **beforeEach** : Reset de BDD pour chaque test
3. **Mocking** : Dépendances externes mockées
4. **Assertions spécifiques** : Pas de magic numbers
5. **Noms descriptifs** : Comportement attendu clair

## 🚨 Dépannage

### Problèmes Courants

**Tests qui échouent en parallèle mais passent individuellement**
```bash
# Solution : Exécution séquentielle
npm test -- --run --pool=forks --poolOptions.forks.singleFork=true
```

**Erreurs de contraintes de clés étrangères**
```bash
# Vérifier que la base de test est démarrée
docker-compose -f docker-compose.test.yml ps

# Repousser le schéma si nécessaire
DATABASE_URL=postgresql://test:test@localhost:5433/hotelix_test npx prisma db push
```

**Problèmes de mocking**
```typescript
// S'assurer que les mocks sont clearés
beforeEach(() => {
  vi.clearAllMocks()
})
```

### Debug des Tests
```bash
# Mode verbose pour plus de détails
npm test -- --reporter=verbose

# Tests avec console.log visible
npm test -- --reporter=verbose --no-coverage

# Tests spécifiques en mode watch
npm test -- --watch src/app/actions/__tests__/auth.test.ts
```

## 🔮 Extensions Futures

### Tests E2E (Phase 4)
- Playwright pour les workflows complets
- Tests d'interface utilisateur
- Tests de régression visuelle

### Tests de Performance
- Load testing avec k6
- Tests de stress sur la BDD
- Monitoring des métriques

## 🔄 CI/CD Integration (Phase 4 ✅)

### GitHub Actions
Le workflow automatique est configuré dans `.github/workflows/test.yml` :

```yaml
name: Tests
on:
  push: { branches: [ master, main ] }
  pull_request: { branches: [ master, main ] }

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: hotelix_test
        ports: [ 5433:5432 ]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx prisma db push
      - run: npm run test:coverage
```

### Workflow de Développement
```bash
# 1. Démarrer l'environnement de test
npm run test:db:setup

# 2. Développer avec tests en continu
npm run test:watch

# 3. Vérifier la couverture avant commit
npm run test:coverage -- --run --pool=forks --poolOptions.forks.singleFork=true

# 4. Nettoyer l'environnement
npm run test:db:teardown
```

### Intégration VSCode
Configuration automatique dans `.vscode/settings.json` :
- Extension Vitest activée
- Commandes de test intégrées
- Exclusions de fichiers de couverture

## 📚 Ressources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)

### Fichiers de Configuration
- `vitest.config.mts` : Configuration Vitest
- `docker-compose.test.yml` : Base de données de test
- `src/test/setup.ts` : Environnement de test
- `src/test/db-utils.ts` : Utilitaires BDD

---

**💡 Questions ou améliorations ?**
N'hésitez pas à proposer des améliorations à cette infrastructure de tests !