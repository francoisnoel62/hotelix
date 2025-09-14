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

## 🛠 Technologies & Stack

- **Framework** : Next.js 15 avec App Router et Turbopack
- **Langage** : TypeScript avec mode strict
- **Base de données** : PostgreSQL avec Prisma ORM
- **Styling** : Tailwind CSS v4 + shadcn/ui (style New York)
- **UI Components** : Radix UI primitives
- **Icônes** : Lucide React
- **Authentification** : Server Actions avec bcryptjs
- **Formulaires** : React Hook Form
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
│   └── lib/                  # Utilitaires et configurations
│       ├── types/            # Types TypeScript
│       ├── validations/      # Schémas de validation
│       └── prisma.ts         # Client Prisma singleton
├── prisma/                   # Base de données
│   ├── schema.prisma         # Schéma de données
│   └── seed.ts              # Données d'exemple
├── public/                   # Assets statiques
└── package.json             # Dépendances et scripts
```

## 📦 Installation & Prérequis

### Prérequis Techniques
- **Node.js** ≥ 18.0.0
- **PostgreSQL** ≥ 14.0
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
```

## 🔧 Configuration de Base de Données

### Variables d'Environnement (.env)
```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/hotelix?schema=public"
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

### Lancer les Vérifications
```bash
# ESLint pour la qualité du code
npm run lint

# TypeScript type checking
npx tsc --noEmit

# Tests Prisma
npx prisma validate
```

### Standards de Qualité
- **ESLint** : Configuration Next.js stricte
- **TypeScript** : Mode strict activé
- **Prettier** : Formatage automatique
- **Convention** : Nommage cohérent (camelCase, PascalCase)

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
   - Tester toutes les fonctionnalités
   - Vérifier avec `npm run lint`

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

### Version 1.1 (En développement)
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