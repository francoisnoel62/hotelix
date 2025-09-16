# 🏨 Hotelix

> Système de gestion hôtelière moderne et intuitif pour optimiser les opérations de maintenance et d'intervention

## 📌 Description du Projet

**Hotelix** est une application web complète de gestion hôtelière développée avec Next.js 15, TypeScript et PostgreSQL. Elle permet aux hôtels de gérer efficacement leurs interventions techniques, de coordonner leurs équipes (managers, staff, techniciens) et de suivre en temps réel l'état de toutes les opérations de maintenance.

Le système propose une interface intuitive pour la création, l'assignation et le suivi d'interventions dans toutes les zones de l'hôtel, avec un système de messagerie intégré et une gestion complète des utilisateurs selon leurs rôles.

## 🚀 Fonctionnalités Principales

### 👥 Gestion Multi-Rôles
- **MANAGER** : Accès complet, assignation des interventions, gestion des équipes
- **STAFF** : Création d'interventions, suivi des demandes
- **TECHNICIEN** : Visualisation et gestion de ses interventions assignées

### 🛠️ Système d'Interventions
- Création et modification d'interventions techniques
- Types variés : Plomberie, Électricité, Climatisation, Chauffage, etc.
- Niveaux de priorité : Basse, Normale, Haute, Urgente
- Statuts de suivi : En attente, En cours, Terminée, Annulée
- Assignation automatique aux techniciens spécialisés

### 🏨 Gestion des Zones
- Organisation hiérarchique : Zones → Sous-zones
- Types de zones : Chambres, Restaurant, Réception, Piscine, etc.
- Localisation précise des interventions

### 💬 Système de Messagerie
- Communication intégrée entre utilisateurs
- Messages contextualisés par hôtel
- Notifications en temps réel

### 📊 Tableaux de Bord
- Vue d'ensemble des interventions en cours
- Statistiques et rapports de performance
- Interface adaptative selon le rôle utilisateur

### ⚡ Interface Ultra-Réactive
- **Mises à jour optimistes** : Feedback instantané sur toutes les actions
- **Pas d'états de chargement** : Interface fluide sans attente
- **Récupération d'erreur** : Revert automatique en cas de problème
- **Synchronisation temps réel** : Données cohérentes entre les pages

## 🛠 Technologies & Stack

- **Framework** : Next.js 15 avec App Router et Turbopack
- **Langage** : TypeScript avec mode strict
- **Base de données** : PostgreSQL avec Prisma ORM
- **Styling** : Tailwind CSS v4 + shadcn/ui (style New York)
- **UI Components** : Radix UI primitives
- **Icônes** : Lucide React
- **Authentification** : Server Actions avec bcryptjs
- **Formulaires** : React Hook Form
- **Tests** : Vitest avec React Testing Library + tests optimistic updates
- **Runtime** : Node.js

## 🧩 Architecture du Projet

```
hotelix/
├── src/
│   ├── app/                    # App Router Next.js 15
│   │   ├── actions/           # Server Actions (auth, interventions, messages)
│   │   ├── api/               # API Routes (minimal, webhooks)
│   │   ├── auth/              # Pages d'authentification
│   │   ├── dashboard/         # Interface principale
│   │   └── globals.css        # Styles globaux
│   ├── components/            # Composants React
│   │   ├── auth/             # Authentification et providers
│   │   ├── dashboard/        # Interface de gestion
│   │   ├── interventions/    # Gestion des interventions
│   │   └── ui/               # shadcn/ui components
│   ├── lib/                  # Utilitaires et configurations
│   │   ├── types/            # Types TypeScript
│   │   ├── validations/      # Schémas de validation
│   │   └── prisma.ts         # Client Prisma singleton
│   └── test/                 # Infrastructure de tests
│       ├── setup.ts          # Configuration test environnement
│       ├── db-utils.ts       # Utilitaires base de données test
│       └── __tests__/        # Tests d'intégration
├── prisma/                   # Base de données
│   ├── schema.prisma         # Schéma de données
│   └── seed.ts              # Données d'exemple
├── public/                   # Assets statiques
├── vitest.config.mts         # Configuration Vitest
├── docker-compose.test.yml   # Base de données test Docker
└── package.json             # Dépendances et scripts
```

## 📦 Installation & Prérequis

### Prérequis Techniques
- **Node.js** ≥ 18.0.0
- **PostgreSQL** ≥ 14.0
- **Docker** (pour les tests)
- **npm** ou **yarn**
- **Git**

### Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/votre-username/hotelix.git
   cd hotelix
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration de l'environnement**
   ```bash
   # Créer le fichier d'environnement
   cp .env.example .env

   # Ou créer manuellement le fichier .env avec :
   DATABASE_URL="postgresql://username:password@localhost:5432/hotelix?schema=public"
   ```

4. **Initialiser la base de données**
   ```bash
   # Créer et migrer la base de données
   npx prisma migrate dev --name init

   # Insérer les données d'exemple
   npm run seed
   ```

## ▶️ Lancement du Projet

### Mode Développement
```bash
# Démarrer le serveur de développement avec Turbopack
npm run dev
```
🌐 L'application sera accessible sur **http://localhost:3000**

### Mode Production
```bash
# Construire l'application
npm run build

# Démarrer en production
npm start
```

### Scripts de Développement
```bash
# Lancer les tests de syntaxe
npm run lint

# Régénérer le client Prisma
npx prisma generate

# Visualiser la base de données
npx prisma studio

# Tests unitaires et d'intégration
npm test

# Tests avec interface utilisateur
npm run test:ui

# Tests avec couverture de code
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

## 🔧 Configuration de Base de Données

### Variables d'Environnement (.env)
```env
# Base de données PostgreSQL (production/développement)
DATABASE_URL="postgresql://username:password@localhost:5432/hotelix?schema=public"

# Base de données de test (automatiquement configurée)
# DATABASE_URL_TEST="postgresql://test:test@localhost:5433/hotelix_test"
```

### Données de Test (Seed)
Le projet inclut des données d'exemple pour tester toutes les fonctionnalités :

**Hôtel** : Club Med Palmiye (Kemer, Antalya, Turquie)

**Comptes de Test** :
- **Manager** : `manager@clubmed.com` / `password123`
- **Staff** : `staff@clubmed.com` / `password123`
- **12 Techniciens** avec spécialités variées : `plombier@clubmed.com`, `electricien@clubmed.com`, etc.

**Données générées** :
- 4 zones principales avec sous-zones
- 54 interventions avec statuts variés
- Messages entre utilisateurs

## 🗂 Modèle de Données

### Entités Principales

**User** (Utilisateur)
- Rôles : MANAGER, STAFF, TECHNICIEN
- Spécialité (pour techniciens)
- Relation avec un hôtel unique

**Hotel** (Hôtel)
- Informations générales : nom, adresse, pays
- Relations : utilisateurs, zones, interventions

**Intervention**
- Types : Plomberie, Électricité, Climatisation, etc.
- Priorités : Basse, Normale, Haute, Urgente
- Statuts : En attente, En cours, Terminée, Annulée
- Assignation aux techniciens

**Zone & SousZone**
- Organisation hiérarchique des espaces
- Types : Chambre, Restaurant, Piscine, etc.

**Message**
- Communication entre utilisateurs
- Contexte par hôtel

## 🔄 Workflow de Développement

### Architecture Moderne (Clean Code)

#### ✅ Utilisation des Server Actions
```typescript
// ❌ Éviter les API Routes classiques
// ✅ Privilégier les Server Actions
export async function createIntervention(formData: FormData) {
  'use server'
  // Logique serveur optimisée
}
```

#### ✅ Progressive Enhancement
- Server Components par défaut (SSR)
- Client Components uniquement pour l'interactivité
- Fallbacks et états de chargement optimisés

#### ✅ Validation Double
- Côté client : React Hook Form
- Côté serveur : Fonctions de validation TypeScript

### Git Workflow
```bash
# 1. Créer une branche feature
git checkout -b feature/nouvelle-fonctionnalite

# 2. Développer et tester
npm run dev
npm run lint

# 3. Commit propre
git add .
git commit -m "feat: ajouter nouvelle fonctionnalité"

# 4. Push et Pull Request
git push origin feature/nouvelle-fonctionnalite
```

## ✅ Tests & Qualité

### Infrastructure de Tests
Le projet dispose d'une **infrastructure de tests complète** avec **36 tests passing** :

- **Tests d'authentification** : 17 tests (Server Actions, validation, sécurité)
- **Tests de logique métier** : 11 tests (interventions, permissions, assignations)
- **Tests de base de données** : 8 tests (relations, contraintes, isolation)

### Lancer les Tests
```bash
# Tous les tests (recommandé : exécution séquentielle)
npm test -- --run --pool=forks --poolOptions.forks.singleFork=true

# Tests rapides en mode watch
npm run test:watch

# Interface utilisateur pour les tests
npm run test:ui

# Couverture de code
npm run test:coverage

# Tests par catégorie
npm run test:unit              # Tests unitaires (Server Actions, validations)
npm run test:integration       # Tests d'intégration (base de données)

# Tests spécifiques
npm test src/app/actions/__tests__/auth.test.ts
npm test src/app/actions/__tests__/intervention.test.ts
npm test src/test/__tests__/database-relationships.test.ts
```

### Base de Données de Test
```bash
# Commandes automatisées (recommandé)
npm run test:db:setup          # Démarrer + configurer la base de test
npm run test:db:teardown       # Arrêter la base de test
npm run db:test:push           # Pousser le schéma seulement

# Commandes manuelles Docker
docker-compose -f docker-compose.test.yml up -d
DATABASE_URL=postgresql://test:test@localhost:5433/hotelix_test npx prisma db push
docker-compose -f docker-compose.test.yml down
```

### CI/CD Integration
Le projet inclut une pipeline GitHub Actions automatique (`.github/workflows/test.yml`) :

- ✅ **Tests automatiques** sur chaque push et pull request
- ✅ **Base de données PostgreSQL** automatiquement configurée
- ✅ **Rapports de couverture** générés à chaque build
- ✅ **Intégration VSCode** avec extension Vitest

```bash
# Simulation locale de la CI/CD
npm ci
npm run test:db:setup
npm run test:coverage -- --run --pool=forks --poolOptions.forks.singleFork=true
npm run test:db:teardown
```

### Lancer les Vérifications Qualité
```bash
# ESLint pour la qualité du code
npm run lint

# TypeScript type checking
npx tsc --noEmit

# Tests Prisma
npx prisma validate

# Tests complets avec couverture
npm run test:coverage
```

### Standards de Qualité
- **ESLint** : Configuration Next.js stricte
- **TypeScript** : Mode strict activé
- **Vitest** : Framework de tests moderne (3-4x plus rapide que Jest)
- **React Testing Library** : Tests de composants
- **Docker** : Isolation des tests de base de données
- **Convention** : Nommage cohérent (camelCase, PascalCase)

### Couverture de Tests
- ✅ **Authentification & Sécurité** : Validation, hachage de mots de passe, Server Actions
- ✅ **Logique Métier** : Permissions basées sur les rôles, gestion des interventions
- ✅ **Base de Données** : Isolation hôtelière, contraintes relationnelles, intégrité des données
- ✅ **Validation** : Fonctions de validation côté client et serveur

## 🗺 Conventions & Guidelines

### Structure des Composants
```typescript
// Server Component (par défaut)
export default function ServerComponent() {
  return <div>Rendu côté serveur</div>
}

// Client Component (interactivité)
'use client'
export default function ClientComponent() {
  return <div>Rendu côté client</div>
}
```

### Nommage des Fichiers
- **Pages** : `page.tsx`, `layout.tsx`
- **Composants** : `kebab-case.tsx`
- **Actions** : `camelCase.ts`
- **Types** : `PascalCase` interfaces

### Gestion des Erreurs
```typescript
interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

## 👥 Contribution

### Comment Contribuer

1. **Fork le projet**
   ```bash
   gh repo fork https://github.com/original-owner/hotelix
   ```

2. **Cloner votre fork**
   ```bash
   git clone https://github.com/votre-username/hotelix.git
   ```

3. **Créer une branche**
   ```bash
   git checkout -b amelioration/description
   ```

4. **Développer & Tester**
   - Suivre les conventions existantes
   - Écrire des tests pour les nouvelles fonctionnalités
   - Vérifier avec `npm run lint` et `npm test`

5. **Commit & Push**
   ```bash
   git commit -m "type: description claire du changement"
   git push origin amelioration/description
   ```

6. **Créer une Pull Request**
   - Description détaillée des changements
   - Screenshots si interface modifiée
   - Tests de régression effectués

### Types de Commits
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `refactor:` Refactoring de code
- `style:` Modifications esthétiques
- `docs:` Documentation
- `test:` Tests

## 📊 Roadmap & Évolutions Prévues

### Version 1.0 ✅ (Complété)
- [x] Infrastructure de tests complète (36 tests)
- [x] Tests d'authentification et sécurité
- [x] Tests de logique métier et permissions
- [x] Tests de base de données et relations
- [x] Docker pour isolation des tests

### Version 1.1 (En développement)
- [ ] CI/CD avec GitHub Actions
- [ ] Notifications push en temps réel
- [ ] Export des données en PDF/Excel
- [ ] Calendrier de planification des interventions
- [ ] Upload de photos pour les interventions

### Version 1.2 (Planifiée)
- [ ] Application mobile (React Native)
- [ ] API REST publique
- [ ] Intégration avec systèmes tiers
- [ ] Analytics avancés et reporting

### Contribuer aux Issues
- 🐛 [Bugs connus](https://github.com/votre-username/hotelix/labels/bug)
- ✨ [Features demandées](https://github.com/votre-username/hotelix/labels/enhancement)
- 📖 [Documentation](https://github.com/votre-username/hotelix/labels/documentation)

## 👨‍💻 Auteurs & Remerciements

### Équipe de Développement
- **François** - *Développeur Principal* - Conception et développement de l'architecture

### Remerciements
- Communauté **Next.js** pour le framework
- **Prisma** pour l'ORM de qualité
- **shadcn/ui** pour les composants UI
- **Vercel** pour l'hébergement de développement

### Contributeurs
Merci à tous ceux qui ont contribué à améliorer Hotelix ! 🙏

## 📜 Licence

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**💡 Besoin d'aide ?**
- 📧 Email : support@hotelix.com
- 🐛 Issues : [GitHub Issues](https://github.com/votre-username/hotelix/issues)
- 📚 Documentation : [Wiki du projet](https://github.com/votre-username/hotelix/wiki)

**⭐ N'hésitez pas à laisser une étoile si ce projet vous plaît !**