# PLAN DE TESTS UNITAIRES - HOTELIX

> Plan exhaustif des tests unitaires nécessaires pour la logique métier du système de gestion hôtelière Hotelix.
>
> **Généré le :** 2025-01-14
> **Architecture :** Next.js 15, TypeScript, Prisma, PostgreSQL
> **Focus :** Logique métier uniquement (pas de tests UI/composants visuels)

## 📋 **SOMMAIRE**

- [🎯 PRIORITÉ 1 (URGENTE ET CRITIQUE)](#-priorité-1-urgente-et-critique)
- [🔥 PRIORITÉ 2 (À FAIRE DÈS QUE POSSIBLE)](#-priorité-2-à-faire-dès-que-possible)
- [📈 PRIORITÉ 3 (SECOND TEMPS)](#-priorité-3-second-temps)
- [🎮 STRATÉGIE DE TESTS](#-stratégie-de-tests)
- [✅ SUIVI D'AVANCEMENT](#-suivi-davancement)

---

## 🎯 **PRIORITÉ 1 (URGENTE ET CRITIQUE)**

### **A. Logique d'Authentification et Autorisation**

**Fichiers concernés :**
- `src/app/actions/auth.ts`
- `src/lib/validations/auth.ts`

#### **A.1 - Validation des entrées utilisateur**

**Tests à implémenter :**
- [ ] **`validateEmail()`**
  - Email valide (format RFC) → `null`
  - Email vide → `"Email requis"`
  - Format invalide (`test@`, `@domain.com`, `invalid-email`) → `"Format d'email invalide"`

- [ ] **`validatePassword()`**
  - Mot de passe valide (≥6 chars) → `null`
  - Mot de passe vide → `"Mot de passe requis"`
  - Mot de passe trop court (< 6 chars) → `"Le mot de passe doit contenir au moins 6 caractères"`

- [ ] **`validateHotelId()`**
  - ID valide (nombre > 0) → `null`
  - ID invalide (0, négatif, null, undefined) → `"Hôtel requis"`

- [ ] **`validateRegisterForm()`**
  - Données valides → `{}` (objet vide)
  - Mots de passe différents → `{ confirmPassword: "Les mots de passe ne correspondent pas" }`
  - Combinaisons d'erreurs multiples

- [ ] **`validateLoginForm()`**
  - Données valides → `{}` (objet vide)
  - Champs manquants → erreurs appropriées par champ

#### **A.2 - Actions d'authentification**

**Tests à implémenter :**
- [ ] **`registerAction()`**
  - ✅ Création utilisateur avec données valides
  - ❌ Email déjà existant → `AuthError.EmailTaken`
  - ❌ Hôtel inexistant → `AuthError.HotelNotFound`
  - ❌ Données invalides → `AuthError.ValidationError` + fieldErrors
  - ❌ Erreur base de données → `AuthError.DatabaseError`
  - Vérification hashage mot de passe (bcryptjs)

- [ ] **`loginAction()`**
  - ✅ Connexion avec identifiants valides
  - ❌ Email inexistant → `AuthError.InvalidCredentials`
  - ❌ Mauvais mot de passe → `AuthError.InvalidCredentials`
  - ❌ Mauvais hôtel → `AuthError.InvalidCredentials`
  - ❌ Données invalides → `AuthError.ValidationError`

- [ ] **`updateProfileAction()`**
  - ✅ Mise à jour profil sans changement mot de passe
  - ✅ Mise à jour profil avec changement mot de passe
  - ❌ Utilisateur inexistant → `AuthError.InvalidCredentials`
  - ❌ Mauvais mot de passe actuel → `AuthError.InvalidCredentials`
  - ❌ Email déjà utilisé → `AuthError.EmailTaken`

#### **A.3 - Contrôle des permissions par rôle**

**Tests à implémenter :**
- [ ] **Permissions MANAGER**
  - Peut modifier toutes les interventions de l'hôtel
  - Peut assigner/désassigner techniciens
  - Peut changer statut de toute intervention

- [ ] **Permissions STAFF**
  - Peut créer des interventions
  - Ne peut PAS assigner de techniciens
  - Ne peut PAS modifier le statut des interventions

- [ ] **Permissions TECHNICIEN**
  - Peut modifier uniquement ses interventions assignées
  - Ne peut PAS modifier interventions d'autres techniciens
  - Peut changer statut de ses interventions seulement

### **B. Workflow des Interventions (Cœur Métier)**

**Fichiers concernés :**
- `src/app/actions/intervention.ts`

#### **B.1 - Transitions de statut légales**

**Tests à implémenter :**
- [ ] **`updateInterventionStatut()` - Transitions valides**
  - EN_ATTENTE → EN_COURS : doit créer `dateDebut`
  - EN_COURS → TERMINEE : doit créer `dateFin`
  - EN_ATTENTE → TERMINEE : doit créer `dateDebut` ET `dateFin`
  - EN_COURS → EN_ATTENTE : préserve `dateDebut`, supprime `dateFin`

- [ ] **Transitions interdites**
  - TERMINEE → * : aucune modification autorisée
  - ANNULEE → * : aucune modification autorisée
  - Vérification message d'erreur approprié

- [ ] **Vérifications de permissions**
  - MANAGER peut modifier toute intervention
  - TECHNICIEN peut modifier seulement ses interventions assignées
  - STAFF ne peut PAS modifier de statut
  - Utilisateur inexistant → erreur

#### **B.2 - Logique d'assignation**

**Tests à implémenter :**
- [ ] **`assignerIntervention()` - Assignation**
  - ✅ Manager assigne intervention à technicien valide
  - ✅ Vérification statut reste EN_ATTENTE après assignation
  - ❌ Utilisateur non-manager tente assignation
  - ❌ Technicien inexistant
  - ❌ Technicien d'un autre hôtel
  - ❌ Utilisateur avec rôle non-TECHNICIEN

- [ ] **Désassignation (technicienId = 0)**
  - ✅ assigneId → `null`
  - ✅ statut → EN_ATTENTE
  - Message de confirmation approprié

#### **B.3 - CRUD Interventions**

**Tests à implémenter :**
- [ ] **`createIntervention()`**
  - ✅ Création avec données minimales
  - ✅ Création avec toutes les données optionnelles
  - Vérification `revalidatePath('/dashboard')` appelé
  - ❌ Erreur base de données

- [ ] **`updateIntervention()`**
  - ✅ Modification par MANAGER
  - ✅ Modification par TECHNICIEN assigné
  - ❌ Modification intervention TERMINEE/ANNULEE
  - ❌ TECHNICIEN modifie intervention non-assignée
  - ❌ STAFF tente modification

- [ ] **`getInterventions()` - Filtrage par rôle**
  - MANAGER/STAFF : toutes interventions de l'hôtel
  - TECHNICIEN : seulement ses interventions assignées
  - Tri par `dateCreation desc`
  - Inclusion relations (demandeur, assigne, zone, sousZone)

### **C. Calculs des Statuts Techniciens**

**Fichiers concernés :**
- `src/app/actions/technician.ts` (lignes 45-50)

#### **C.1 - Algorithme de statut dynamique**

**Tests à implémenter :**
- [ ] **Calcul statut selon interventions en cours**
  - 0 interventions EN_COURS → `DISPONIBLE`
  - 1 intervention EN_COURS → `DISPONIBLE`
  - 2 interventions EN_COURS → `DISPONIBLE`
  - 3 interventions EN_COURS → `OCCUPE`
  - 5 interventions EN_COURS → `OCCUPE`

- [ ] **Cohérence avec dernière activité**
  - Technicien avec interventions récentes mais 0 en cours
  - Technicien sans aucune intervention → `HORS_LIGNE` ?
  - Définir seuil d'inactivité pour `HORS_LIGNE`

- [ ] **Performance calculs**
  - Test avec technicien ayant 50+ interventions assignées
  - Vérification temps de réponse < 100ms

---

## 🔥 **PRIORITÉ 2 (À FAIRE DÈS QUE POSSIBLE)**

### **D. Calculs Statistiques Complexes**

**Fichiers concernés :**
- `src/app/actions/technician.ts` (lignes 122-220)

#### **D.1 - Métriques de performance techniciens**

**Tests à implémenter :**
- [ ] **`getTechnicianStats()` - Temps moyen d'intervention**
  - ✅ Calcul correct avec interventions TERMINEE ayant dateDebut et dateFin
  - ✅ Ignorer interventions sans dates complètes
  - ✅ Moyenne avec 1, 3, 10 interventions
  - ✅ 0 intervention terminée → tempsMoyenIntervention = 0
  - Vérification précision (minutes arrondies)

- [ ] **Taux de réussite**
  - Formule : `(terminées / total) * 100`
  - ✅ Cas normal : 7 terminées sur 10 total → 70%
  - ✅ Toutes terminées → 100%
  - ✅ Aucune terminée → 0%
  - ✅ 0 intervention → 0% (pas de division par 0)
  - ✅ Arrondi correct des décimales

- [ ] **Répartition par type d'intervention**
  - ✅ Calcul pourcentages corrects
  - ✅ Somme des pourcentages = 100% (à ±1% près pour arrondis)
  - ✅ Types sans interventions non inclus
  - ✅ Gestion de tous les TypeIntervention enum

#### **D.2 - Agrégations temporelles**

**Tests à implémenter :**
- [ ] **Interventions par jour (10 derniers jours)**
  - ✅ Génération correcte des 10 dates (J-9 à aujourd'hui)
  - ✅ Format de date correct (ISO string sans heure)
  - ✅ Comptage par jour exact
  - ✅ Jours sans intervention → count = 0
  - ✅ Gestion fuseaux horaires (UTC vs local)
  - ✅ Interventions créées à minuit (cas limite)

- [ ] **Totaux mensuel**
  - ✅ Comptage par statut (EN_COURS, TERMINEE, ANNULEE, EN_ATTENTE)
  - ✅ Période = 30 derniers jours
  - ✅ Cohérence : somme des statuts = total interventions période

### **E. Logique de Filtrage et Recherche**

**Fichiers concernés :**
- `src/components/interventions/interventions-list.tsx`
- `src/components/technicians/technicians-list.tsx`

#### **E.1 - Filtres interventions**

**Tests à implémenter :**
- [ ] **Recherche textuelle**
  - ✅ Recherche dans titre (case-insensitive)
  - ✅ Recherche dans nom de zone (case-insensitive)
  - ✅ Recherche partielle ("plomb" trouve "plomberie")
  - ✅ Recherche vide → toutes interventions
  - ✅ Caractères spéciaux, accents

- [ ] **Filtre par statut**
  - ✅ "ALL" → toutes interventions
  - ✅ Statut spécifique → interventions correspondantes seulement
  - ✅ Combinaison recherche + statut

- [ ] **Performance filtrage**
  - Test avec 100+ interventions
  - Filtrage temps réel (pas de délai perceptible)

#### **E.2 - Filtres techniciens**

**Tests à implémenter :**
- [ ] **Recherche multi-critères**
  - ✅ Nom (case-insensitive)
  - ✅ Email (case-insensitive)
  - ✅ Spécialité (case-insensitive)
  - ✅ Recherche partielle dans tous les champs
  - ✅ Recherche vide → tous techniciens

- [ ] **Filtres combinés**
  - ✅ Spécialité + statut
  - ✅ Recherche + spécialité + statut
  - ✅ "ALL" options → désactive filtre correspondant

### **F. Système de Messagerie**

**Fichiers concernés :**
- `src/app/actions/message.ts`

#### **F.1 - Contraintes métier messagerie**

**Tests à implémenter :**
- [ ] **`sendMessage()` - Validations**
  - ✅ Message avec contenu valide
  - ❌ Contenu vide/espaces → erreur
  - ❌ Expéditeur inexistant → erreur
  - ❌ Destinataire inexistant → erreur
  - ❌ Expéditeur et destinataire d'hôtels différents → erreur spécifique
  - ✅ Même hôtel → message créé

- [ ] **`getConversation()` - Logique bidirectionnelle**
  - ✅ Messages User1→User2 ET User2→User1
  - ✅ Tri chronologique croissant (dateEnvoi ASC)
  - ✅ Direction "sent"/"received" correcte selon utilisateur
  - ✅ Inclusion nom expéditeur

#### **F.2 - Requête SQL complexe conversations**

**Tests à implémenter :**
- [ ] **`getConversations()` - SQL raw query**
  - ✅ Participant correct (l'autre utilisateur de la conversation)
  - ✅ Dernier message de la conversation
  - ✅ Date du dernier message
  - ✅ Comptage messages non lus corrects
  - ✅ Tri par date dernier message (DESC)
  - ✅ Gestion conversations sans messages (edge case)

- [ ] **Performance requête complexe**
  - Test avec 100+ conversations
  - Test avec 1000+ messages
  - Temps de réponse acceptable

- [ ] **`markConversationAsRead()`**
  - ✅ Marque tous les messages non lus de l'expéditeur vers destinataire
  - ✅ Ne marque PAS les messages envoyés par le destinataire
  - ✅ revalidatePath appelé correctement

---

## 📈 **PRIORITÉ 3 (SECOND TEMPS)**

### **G. Logique de Validation Avancée**

**Fichiers concernés :**
- `src/lib/validations/auth.ts`
- Composants de formulaires

#### **G.1 - Validations métier spécifiques**

**Tests à implémenter :**
- [ ] **Format email RFC compliant**
  - Cas limites : `test+tag@domain.co.uk`, emails internationaux
  - Emails très longs, domaines avec tirets
  - Cas invalides subtils

- [ ] **Robustesse mots de passe**
  - Longueur exacte (5 chars → erreur, 6 chars → OK)
  - Caractères Unicode, emojis, caractères spéciaux
  - Mots de passe très longs (> 1000 chars)

- [ ] **Validation hotelId**
  - Nombres décimaux (3.5 → erreur ?)
  - Très grands nombres (dépassement entier)
  - Cohérence avec base de données

### **H. Logique d'Interface Utilisateur**

**Fichiers concernés :**
- Composants React avec logique métier

#### **H.1 - Permissions conditionnelles**

**Tests à implémenter :**
- [ ] **`canChangeStatut()` - Logique complexe**
  - MANAGER + toute intervention → `true`
  - TECHNICIEN + intervention assignée → `true`
  - TECHNICIEN + intervention non-assignée → `false`
  - STAFF + toute intervention → `false`

- [ ] **`canEditIntervention()` - États multiples**
  - Intervention TERMINEE → `false` (pour tous)
  - Intervention ANNULEE → `false` (pour tous)
  - MANAGER + intervention EN_ATTENTE/EN_COURS → `true`
  - TECHNICIEN + intervention assignée EN_ATTENTE/EN_COURS → `true`
  - Toutes autres combinaisons → `false`

#### **H.2 - Formatage dates et affichage**

**Tests à implémenter :**
- [ ] **Formats de dates localisées**
  - Format français : "14/01/2025 à 15:30"
  - Gestion 24h vs 12h selon locale
  - Dates très anciennes/très futures

- [ ] **Dates relatives**
  - Aujourd'hui → "Aujourd'hui"
  - Hier → "Hier"
  - Avant-hier → date complète
  - Changement de jour à minuit exacte

### **I. Synchronisation et Cohérence**

#### **I.1 - Mécanismes revalidatePath**

**Tests à implémenter :**
- [ ] **Cohérence actions → revalidation**
  - Création intervention → revalidatePath('/dashboard')
  - Assignation technicien → revalidatePath('/dashboard/techniciens') ET revalidatePath('/dashboard')
  - Message envoyé → revalidatePath('/dashboard/techniciens')
  - Vérifier que les paths correspondent aux pages affectées

- [ ] **Tests d'intégration cache**
  - Action serveur → mutation → revalidation → données fraîches
  - Pas de données stale après mutation

#### **I.2 - États optimistes**

**Tests à implémenter :**
- [ ] **Chat - Message temporaire** (`technician-chat.tsx:54-69`)
  - ✅ Message ajouté immédiatement à l'état local
  - ✅ Message temporaire remplacé par vraie réponse serveur
  - ❌ Erreur envoi → rollback de l'état optimiste
  - ✅ ID temporaire différent des vrais IDs
  - ✅ Rechargement conversation après envoi réussi

- [ ] **Gestion erreurs et rollback**
  - Timeout réseau → restaurer état précédent
  - Erreur serveur → afficher erreur + rollback
  - Double-envoi (clic rapide) → dédoublonnage

---

## 🎮 **STRATÉGIE DE TESTS**

### **Outils recommandés :**
- **Jest** : Framework de tests principal
- **@testing-library/react** : Tests composants React
- **@testing-library/jest-dom** : Matchers DOM
- **Prisma Mock** : Mocking des requêtes base de données
- **MSW** : Mock Service Worker pour APIs

### **Structure des tests :**
```
tests/
├── unit/
│   ├── actions/          # Server Actions
│   ├── validations/      # Fonctions de validation
│   └── utils/           # Utilitaires métier
├── integration/
│   ├── workflows/       # Flux complets métier
│   └── components/      # Composants avec logique
└── helpers/
    ├── mocks/          # Mocks réutilisables
    └── fixtures/       # Données de test
```

### **Conventions de nommage :**
- Fichiers : `*.test.ts` ou `*.spec.ts`
- Describe : nom de la fonction/composant testé
- Test : comportement attendu (format "should ... when ...")

### **Couverture cible :**
- **Priorité 1** : 100% des branches critiques
- **Priorité 2** : 90% couverture lignes
- **Priorité 3** : 80% couverture + edge cases

### **Données de test :**
- Utiliser le seed existant comme base
- Factory pattern pour générer données cohérentes
- Isoler chaque test (pas de dépendances entre tests)

---

## ✅ **SUIVI D'AVANCEMENT**

### **Priorité 1 (Critique) - 0/XX complété**
- [ ] A.1 - Validation des entrées utilisateur (0/5)
- [ ] A.2 - Actions d'authentification (0/3)
- [ ] A.3 - Contrôle permissions par rôle (0/3)
- [ ] B.1 - Transitions de statut légales (0/4)
- [ ] B.2 - Logique d'assignation (0/2)
- [ ] B.3 - CRUD Interventions (0/3)
- [ ] C.1 - Algorithme statut dynamique (0/3)

### **Priorité 2 (Important) - 0/XX complété**
- [ ] D.1 - Métriques de performance techniciens (0/3)
- [ ] D.2 - Agrégations temporelles (0/2)
- [ ] E.1 - Filtres interventions (0/3)
- [ ] E.2 - Filtres techniciens (0/2)
- [ ] F.1 - Contraintes métier messagerie (0/2)
- [ ] F.2 - Requête SQL complexe conversations (0/3)

### **Priorité 3 (Complémentaire) - 0/XX complété**
- [ ] G.1 - Validations métier spécifiques (0/3)
- [ ] H.1 - Permissions conditionnelles (0/2)
- [ ] H.2 - Formatage dates et affichage (0/2)
- [ ] I.1 - Mécanismes revalidatePath (0/2)
- [ ] I.2 - États optimistes (0/2)

### **Métriques globales :**
- **Tests implémentés :** 0 / XX total
- **Couverture actuelle :** 0%
- **Bugs critiques identifiés :** À suivre
- **Performance :** À mesurer

---

## 📝 **NOTES D'IMPLÉMENTATION**

### **Setup initial :**
1. Installer dépendances de test
2. Configurer Jest + TypeScript
3. Setup Prisma mocking
4. Créer helpers et fixtures de base

### **Ordre d'implémentation suggéré :**
1. **Validations** (fonctions pures, faciles à tester)
2. **Actions auth** (sécurité critique)
3. **Workflow interventions** (cœur métier)
4. **Calculs statistiques** (complexité algorithmique)
5. **Filtres et recherche** (UX)
6. **Messagerie** (fonctionnalité secondaire)

### **Points d'attention :**
- Mocker les dépendances externes (Prisma, bcryptjs)
- Tester les cas limites et erreurs
- Vérifier les permissions à chaque action
- Valider la cohérence des données
- Mesurer les performances sur gros volumes

---

# 🎯 **PLAN D'EXÉCUTION : COUVERTURE TESTS EN 15 JOURS**

## 📅 **PLANIFICATION QUOTIDIENNE RECOMMANDÉE**

### **Répartition générale :**
- **Jours 1-7** : Priorité 1 (Critique) ⚡
- **Jours 8-12** : Priorité 2 (Important) 🔥
- **Jours 13-15** : Priorité 3 (Complémentaire) + Polish 📈

### **Charge de travail quotidienne :**
- **2-3h par jour** de développement de tests
- **1 section majeure par jour** (ex: A.1, A.2, etc.)
- **Validation/debug** : 30min par section

---

## 🛠 **WORKFLOW QUOTIDIEN OPTIMAL**

### **🌅 DÉBUT DE JOURNÉE (15 min)**

1. **Ouvrir `TESTS_PLAN.md`** dans VS Code
2. **Identifier la section du jour** selon planning
3. **Cocher** : `- [ ]` → `- [x]` pour la section en cours
4. **Créer une branche Git** : `git checkout -b tests/section-A1-validation`

### **💻 DÉVELOPPEMENT (2-2h30)**

1. **Créer le fichier test** correspondant :
   ```bash
   # Exemple pour section A.1
   touch tests/unit/validations/auth.test.ts
   ```

2. **Utiliser la structure du plan** comme checklist :
   ```typescript
   // Copier directement depuis TESTS_PLAN.md
   describe('validateEmail()', () => {
     it('should return null for valid email format', () => {
       // Test depuis le plan : "Email valide (format RFC) → null"
     })

     it('should return "Email requis" for empty email', () => {
       // Test depuis le plan : "Email vide → "Email requis""
     })
   })
   ```

3. **Implémenter test par test** en suivant l'ordre du plan

### **✅ FIN DE JOURNÉE (30 min)**

1. **Exécuter tous les tests** : `npm test`
2. **Vérifier couverture** : `npm run test:coverage`
3. **Mettre à jour le TESTS_PLAN.md** :
   ```markdown
   ### **Priorité 1 (Critique) - 1/7 complété** ← Mettre à jour
   - [x] A.1 - Validation des entrées utilisateur (5/5) ← Cocher
   ```

4. **Commit + Push** :
   ```bash
   git add .
   git commit -m "✅ Tests: A.1 Validation entrées utilisateur (5/5)"
   git push origin tests/section-A1-validation
   ```

---

## 📋 **PLANNING DÉTAILLÉ 15 JOURS**

### **🔴 SEMAINE 1 - PRIORITÉ 1 (CRITIQUE)**

| Jour | Section | Description | Temps estimé |
|------|---------|-------------|--------------|
| **J1** | A.1 | Validation des entrées utilisateur (5 tests) | 2h |
| **J2** | A.2 | Actions d'authentification (6 tests) | 2h30 |
| **J3** | A.3 | Contrôle permissions par rôle (3 tests) | 2h |
| **J4** | B.1 | Transitions de statut légales (4 tests) | 2h30 |
| **J5** | B.2 | Logique d'assignation (2 tests) | 2h |
| **J6** | B.3 | CRUD Interventions (3 tests) | 2h30 |
| **J7** | C.1 | Algorithme statut dynamique (3 tests) + Buffer | 2h |

### **🟡 SEMAINE 2 - PRIORITÉ 2 (IMPORTANT)**

| Jour | Section | Description | Temps estimé |
|------|---------|-------------|--------------|
| **J8** | D.1 | Métriques de performance techniciens (3 tests) | 2h30 |
| **J9** | D.2 | Agrégations temporelles (2 tests) | 2h |
| **J10** | E.1 | Filtres interventions (3 tests) | 2h |
| **J11** | E.2 | Filtres techniciens (2 tests) | 2h |
| **J12** | F.1 + F.2 | Système messagerie complet (5 tests) | 3h |

### **🟢 SEMAINE 3 - PRIORITÉ 3 + FINITION**

| Jour | Section | Description | Temps estimé |
|------|---------|-------------|--------------|
| **J13** | G.1 + H.1 | Validations avancées + Permissions UI (5 tests) | 2h30 |
| **J14** | H.2 + I.1 | Formatage dates + Revalidation (4 tests) | 2h30 |
| **J15** | I.2 + Polish | États optimistes + Nettoyage + Documentation | 3h |

---

## 🎛 **OUTILS DE SUIVI QUOTIDIEN**

### **1. Commandes Git utiles**
```bash
# Voir le progrès global
git log --oneline --grep="✅ Tests"

# Branches de tests actives
git branch | grep tests/

# Stats commits tests
git log --oneline --since="15 days ago" --grep="Tests"
```

### **2. Script de vérification quotidienne**
```bash
# Créer tests/check-progress.sh
#!/bin/bash
echo "📊 PROGRÈS TESTS HOTELIX"
echo "========================"
echo "Tests passants: $(npm test 2>/dev/null | grep -o '[0-9]* passing' || echo '0 passing')"
echo "Couverture: $(npm run test:coverage 2>/dev/null | grep 'All files' | awk '{print $4}' || echo 'N/A')"
echo "Fichiers tests: $(find tests/ -name '*.test.ts' | wc -l) fichiers"
```

### **3. Template de commit quotidien**
```bash
# J1 exemple
git commit -m "✅ Tests: A.1 Validation entrées utilisateur (5/5)

- validateEmail() : 3 cas testés
- validatePassword() : 2 cas testés
- validateHotelId() : 1 cas testé
- validateRegisterForm() : 4 cas testés
- validateLoginForm() : 3 cas testés

Couverture section: 100%"
```

---

## 🎯 **MÉTHODE DE TRAVAIL EFFICACE**

### **Principe des "3 Passes"**

1. **🔴 PASS 1 - Structure (30min)**
   - Créer tous les `describe()` et `it()`
   - Copier les assertions depuis le plan
   - Tests vides mais structure complète

2. **🟡 PASS 2 - Implémentation (1h30)**
   - Implémenter test par test
   - Mock les dépendances nécessaires
   - Tests passants mais basiques

3. **🟢 PASS 3 - Robustesse (30min)**
   - Ajouter edge cases
   - Vérifier messages d'erreur exacts
   - Optimiser performances

### **Astuce : Utiliser le plan comme TODO vivant**

```markdown
- [x] ✅ validateEmail() - Email valide → null
- [x] ✅ validateEmail() - Email vide → "Email requis"
- [ ] 🔄 validateEmail() - Format invalide → "Format d'email invalide"
- [ ] ⏳ validatePassword() - Mot de passe valide → null
- [ ] validatePassword() - Mot de passe vide → "Mot de passe requis"
```

**Légende :**
- ✅ = Terminé et testé
- 🔄 = En cours
- ⏳ = Prochaine tâche
- ❌ = Bloqué (noter la raison)

---

## 🚨 **POINTS DE CONTRÔLE CRITIQUES**

### **Jour 5 - Mi-parcours Priorité 1**
- [ ] 50% de la priorité 1 complétée
- [ ] Setup de test fonctionnel
- [ ] Couverture > 80% sur sections terminées
- [ ] **🚨 Si retard : Réduire priorité 3**

### **Jour 10 - Mi-parcours Priorité 2**
- [ ] Priorité 1 = 100% terminée
- [ ] Priorité 2 = 60% terminée
- [ ] CI/CD intégré si applicable
- [ ] **🚨 Si retard : Focus sur tests critiques uniquement**

### **Jour 13 - Sprint final**
- [ ] Priorité 1 + 2 = 100% terminées
- [ ] Documentation des tests à jour
- [ ] **🚨 Jour 15 = date limite absolue**

---

## 💡 **CONSEILS POUR RÉUSSIR**

### **🎯 Focus et efficacité**
- **Une section à la fois** - Ne pas disperser
- **Tests simples d'abord** - Complexifier ensuite
- **Copier-coller intelligent** depuis le plan
- **Mock early** - Ne pas se bloquer sur l'infrastructure

### **🔥 Maintenir la motivation**
- **Cocher chaque test** - Satisfaction visuelle
- **Célébrer les jalons** - Fin de chaque priorité
- **Progrès visible** - Mettre à jour les % régulièrement
- **Partager l'avancement** - Si équipe

### **🛡 Gérer les blocages**
- **Bloquer max 30min** sur un test
- **Passer au suivant** si bloqué
- **Noter les blocages** dans le plan avec ❌
- **Revenir plus tard** avec les idées claires

---

## 📈 **EXEMPLE DE SUIVI QUOTIDIEN**

```markdown
## 📊 JOURNAL DE BORD - TESTS HOTELIX

### Jour 3 - Contrôle permissions par rôle (A.3)
**Date :** 2025-01-17
**Temps passé :** 2h15
**Tests implémentés :** 3/3 ✅

#### ✅ Complété aujourd'hui :
- Permissions MANAGER (1/1)
- Permissions STAFF (1/1)
- Permissions TECHNICIEN (1/1)

#### 🎯 Prochaine session (J4) :
- Section B.1 - Transitions de statut légales
- Objectif : 4 tests en 2h30

#### 📊 Stats globales :
- **Priorité 1 :** 3/7 sections (43%)
- **Tests total :** 14/XX implémentés
- **Couverture :** 85% sur sections terminées
```

---

## 🎮 **SETUP INITIAL RECOMMANDÉ**

### **Jour 0 - Configuration (1-2h)**

1. **Installer les dépendances de test :**
   ```bash
   npm install --save-dev jest @types/jest ts-jest
   npm install --save-dev @testing-library/jest-dom
   npm install --save-dev jest-environment-jsdom
   ```

2. **Configurer Jest (`jest.config.js`) :**
   ```javascript
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'node',
     roots: ['<rootDir>/tests'],
     testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
     collectCoverageFrom: [
       'src/**/*.ts',
       '!src/**/*.d.ts',
     ],
     coverageThreshold: {
       global: {
         branches: 80,
         functions: 80,
         lines: 80,
         statements: 80
       }
     }
   }
   ```

3. **Créer la structure de dossiers :**
   ```bash
   mkdir -p tests/{unit,integration}/{actions,validations,components,utils}
   mkdir -p tests/helpers/{mocks,fixtures}
   ```

4. **Scripts package.json :**
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage",
       "test:ci": "jest --ci --coverage --watchAll=false"
     }
   }
   ```

5. **Setup Prisma mocking (`tests/helpers/mocks/prisma.ts`) :**
   ```typescript
   import { PrismaClient } from '@prisma/client'
   import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

   import prisma from '@/lib/prisma'

   jest.mock('@/lib/prisma', () => ({
     __esModule: true,
     default: mockDeep<PrismaClient>(),
   }))

   beforeEach(() => {
     mockReset(prismaMock)
   })

   export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>
   ```

---

## 🎯 **MÉTRIQUES ET OBJECTIFS**

### **Métriques de succès :**
- **Couverture globale :** > 85%
- **Tests critiques (P1) :** 100%
- **Tests importants (P2) :** > 90%
- **Temps d'exécution :** < 30s pour la suite complète
- **Zero flaky tests :** Tous les tests doivent être déterministes

### **Objectifs par semaine :**
- **Semaine 1 :** Fondations solides + tests critiques
- **Semaine 2 :** Logique métier complexe + performance
- **Semaine 3 :** Polish + documentation + optimisation

### **Livrable final (Jour 15) :**
- [ ] Suite de tests complète et documentée
- [ ] CI/CD configuré avec tests automatiques
- [ ] Documentation des patterns de test
- [ ] Guide de contribution pour nouveaux tests
- [ ] Métriques de couverture > objectifs