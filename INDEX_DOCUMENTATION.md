# 📚 Index de Documentation - AppHorse Code Organization

**Créé:** 16 février 2026  
**Dernière mise à jour:** 16 février 2026  

---

## 🚀 Où Commencer?

### 1️⃣ Si vous êtes NOUVEAU sur le projet
**Lire dans cet ordre:**
1. [CODE_STYLE_GUIDE.md](./CODE_STYLE_GUIDE.md) - Vue générale et conventions (15 min)
2. [ANALYSE_STRUCTURE_CODE.md](./ANALYSE_STRUCTURE_CODE.md) - Comprendre l'architecture (30 min)
3. [GUIDE_MIGRATION.md](./GUIDE_MIGRATION.md) - Comment utiliser les imports (10 min)

### 2️⃣ Si vous maintenez du CODE
**Consulter:**
- [GUIDE_MIGRATION.md](./GUIDE_MIGRATION.md) - Patterns import à utiliser
- [CODE_STYLE_GUIDE.md](./CODE_STYLE_GUIDE.md) - Comment organiser le code
- Fichiers README.md par domaine (voir ci-dessous)

### 3️⃣ Si vous AJOUTEZ une FEATURE
**Suivre:**
1. [CODE_STYLE_GUIDE.md](./CODE_STYLE_GUIDE.md) → Section "Ajouter une Nouvelle Feature"
2. Les README.md correspondants (Services, Hooks, Utils, etc.)
3. [ANALYSE_STRUCTURE_CODE.md](./ANALYSE_STRUCTURE_CODE.md) → Section patterns

---

## 📖 Documentation Complète

### 🏛️ Documentations Principales

#### [ANALYSE_STRUCTURE_CODE.md](./ANALYSE_STRUCTURE_CODE.md) ⭐⭐⭐
**Vue d'ensemble complète du projet**
- Stack technologique détaillé
- Structure des dossiers avec descriptions
- Points forts de l'organisation
- Problèmes identifiés et solutions
- Analyse des dépendances
- Cartographie des services IA
- Plan d'action prioritaire
- ~600 lignes

**À lire:** Première visite, travail l'architecture

---

#### [GUIDE_MIGRATION.md](./GUIDE_MIGRATION.md) ⭐⭐⭐
**Comment utiliser la nouvelle organisation**
- Résumé des changements
- Avant/après des imports
- Détails de chaque index.js
- Règles à suivre
- Migration progressive
- ~350 lignes

**À lire:** Avant de commencer à coder

---

#### [CODE_STYLE_GUIDE.md](./CODE_STYLE_GUIDE.md) ⭐⭐⭐
**Referenced rapide et guide de style**
- Arborescence simplifiée
- Patterns d'import à utiliser
- Conventions de nommage
- Styling avec Tailwind
- Flux de données recommandé
- Comment ajouter une feature
- ~300 lignes

**À lire:** Avant d'écrire du code

---

#### [ORGANIZATION_STATUS.md](./ORGANIZATION_STATUS.md) ⭐⭐
**Statut actuel et métriques**
- Améliorations apportées
- Scores avant/après
- Checklist d'implémentation
- Recommandations futures
- Changelog
- ~250 lignes

**À lire:** Pour comprendre l'état actuels

---

### 📚 Documentations par Module

#### [src/services/README.md](./src/services/README.md)
**Guide des Services** (logique métier)
- Liste des services disponibles
- Comment importer
- Comment ajouter un service
- Patterns
- **Services couverts:**
  - aiNutritionService (IA nutrition)
  - barymetricService (morphométrie)
  - dataSyncService (sync données)
  - firestoreSync (Firestore RTK)
  - geminiService (Google IA)

---

#### [src/context/README.md](./src/context/README.md)
**Guide Context API** (état global)
- Contextes disponibles
- Comment importer
- Architecture pattern
- Comment ajouter un contexte
- **Contexts couverts:**
  - AuthContext (authentification)
  - ThemeContext (thème visuel)
  - PWAContext (PWA features)

---

#### [src/hooks/README.md](./src/hooks/README.md)
**Guide des Custom Hooks** (logique réutilisable)
- Hooks disponibles
- Comment importer
- Hook pattern
- Comment ajouter un hook
- **Hooks couverts:**
  - useDeviceOrientation (orientation)
  - useServiceWorker (PWA)
  - useTrainingAI (entraînement IA)

---

#### [src/utils/README.md](./src/utils/README.md)
**Guide des Utilitaires** (helpers et calculs)
- Utilitaires disponibles (12+)
- Comment importer
- Ajouter un util
- Patterns de développement
- **Domaines couverts:**
  - Analyse document & images
  - OCR & reconnaissance
  - Calculs nutrition
  - Estimations poids
  - Permissions & plans
  - Paiements (Stripe, Marketplace)

---

#### [src/components/README.md](./src/components/README.md)
**Guide des Composants** (UI réutilisables)
- Structure des dossiers (common, features, camera, scanner, pwa)
- Comment importer
- Patterns de composant
- Ajouter un composant
- Conventions
- **Catégories:**
  - Common (génériques)
  - Features (métier)
  - Camera (vision)
  - Scanner (analyse avancée)
  - PWA (web app)

---

### 📋 Fichiers Créés Récemment

```
✨ NOUVEAUX FICHIERS CRÉÉS:

📁 À la racine:
├── ANALYSE_STRUCTURE_CODE.md        (Analyse complète)
├── GUIDE_MIGRATION.md               (Guide import)
├── CODE_STYLE_GUIDE.md              (Guide de style)
├── ORGANIZATION_STATUS.md           (Statut et métriques)
└── INDEX_DOCUMENTATION.md           (Ce fichier)

📁 src/services/
└── index.js                         (Exporte tous les services)
└── README.md                        (Documentation services)

📁 src/context/
└── index.js                         (Exporte tous les contexts)
└── README.md                        (Documentation context)

📁 src/hooks/
└── index.js                         (Exporte tous les hooks)
└── README.md                        (Documentation hooks)

📁 src/constants/
└── index.js                         (Exporte constantes)

📁 src/utils/
└── index.js                         (Exporte tous les utils)
└── README.md                        (Documentation utils)

📁 src/components/
└── README.md                        (Documentation components)

📁 src/pages/
├── index.js                         (Exporte pages principales)
└── nutrition/
    └── index.js                     (Exporte pages nutrition)
```

---

## 🔍 Guide de Recherche Rapide

### Je veux...

**📌 Apprendre la structure du projet**
→ [ANALYSE_STRUCTURE_CODE.md](./ANALYSE_STRUCTURE_CODE.md)

**📌 Importer quelquechose dans mon code**
→ [GUIDE_MIGRATION.md](./GUIDE_MIGRATION.md) + [CODE_STYLE_GUIDE.md](./CODE_STYLE_GUIDE.md)

**📌 Ajouter un composant**
→ [src/components/README.md](./src/components/README.md)

**📌 Créer un service**
→ [src/services/README.md](./src/services/README.md)

**📌 Ajouter un hook personnalisé**
→ [src/hooks/README.md](./src/hooks/README.md)

**📌 Ajouter une fonction utilitaire**
→ [src/utils/README.md](./src/utils/README.md)

**📌 Comprendre l'authentification**
→ [src/context/README.md](./src/context/README.md)

**📌 Savoir comment les services IA marchent**
→ [ANALYSE_STRUCTURE_CODE.md](./ANALYSE_STRUCTURE_CODE.md) → "Cartographie des Services IA"

**📌 Vérifier quoi faire ensuite**
→ [ORGANIZATION_STATUS.md](./ORGANIZATION_STATUS.md) → "Prochaines Actions"

---

## 🎯 Par Persona

### 👨‍💻 Développeur Frontend (React)
**Lire (priorité):**
1. [CODE_STYLE_GUIDE.md](./CODE_STYLE_GUIDE.md)
2. [src/components/README.md](./src/components/README.md)
3. [src/hooks/README.md](./src/hooks/README.md)
4. [GUIDE_MIGRATION.md](./GUIDE_MIGRATION.md)

**Dossiers cibles:** `src/pages/`, `src/components/`, `src/hooks/`

---

### 🔧 Développeur Backend/Services
**Lire (priorité):**
1. [GUIDE_MIGRATION.md](./GUIDE_MIGRATION.md)
2. [src/services/README.md](./src/services/README.md)
3. [src/utils/README.md](./src/utils/README.md)
4. [ANALYSE_STRUCTURE_CODE.md](./ANALYSE_STRUCTURE_CODE.md)

**Dossiers cibles:** `src/services/`, `src/utils/`, Firebase

---

### 🎓 Nouveau Team Member
**Lire (dans l'ordre):**
1. [CODE_STYLE_GUIDE.md](./CODE_STYLE_GUIDE.md) - 15 min
2. [GUIDE_MIGRATION.md](./GUIDE_MIGRATION.md) - 10 min
3. [ANALYSE_STRUCTURE_CODE.md](./ANALYSE_STRUCTURE_CODE.md) - 30 min
4. Module README.md spécifique - 10 min

**Temps total:** ~65 min pour onboarding

---

### 👨‍🏫 Tech Lead / Mentor
**Lire complètement:**
1. [ANALYSE_STRUCTURE_CODE.md](./ANALYSE_STRUCTURE_CODE.md)
2. [GUIDE_MIGRATION.md](./GUIDE_MIGRATION.md)
3. [CODE_STYLE_GUIDE.md](./CODE_STYLE_GUIDE.md)
4. [ORGANIZATION_STATUS.md](./ORGANIZATION_STATUS.md)
5. Tous les README.md par module

**Temps total:** ~2h

---

## 📊 Matrice de Contenu

| Doc | Vue Générale | Imports | Patterns | Ajouter Feature | Style | IA/Advanced |
|-----|--------------|---------|----------|-----------------|-------|-------------|
| ANALYSE | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐ | ⭐⭐⭐ |
| GUIDE | ⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐ | - |
| STYLE | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | - |
| Services | - | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | - | ⭐⭐ |
| Context | - | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | - | - |
| Hooks | - | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | - | - |
| Utils | - | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | - | ⭐ |
| Components | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | - |

---

## 🔗 Structure des Liens

```
Index (Vous êtes ici)
├── ANALYSE_STRUCTURE_CODE.md
│   ├── → src/services/README.md
│   ├── → src/context/README.md
│   └── → src/hooks/README.md
├── GUIDE_MIGRATION.md
│   └── → CODE_STYLE_GUIDE.md
├── CODE_STYLE_GUIDE.md
│   ├── → src/services/README.md
│   ├── → src/hooks/README.md
│   ├── → src/components/README.md
│   └── → src/utils/README.md
└── ORGANIZATION_STATUS.md
    └── → Tous les documents
```

---

## 🆘 Besoin d'Aide?

### Pour les Imports
→ [GUIDE_MIGRATION.md](./GUIDE_MIGRATION.md)

### Pour les Patterns Code
→ [CODE_STYLE_GUIDE.md](./CODE_STYLE_GUIDE.md)

### Pour Architecture Globale
→ [ANALYSE_STRUCTURE_CODE.md](./ANALYSE_STRUCTURE_CODE.md)

### Pour un Domaine Spécifique
→ Voir "Par Module" ci-dessus

### Pour Statut Projet
→ [ORGANIZATION_STATUS.md](./ORGANIZATION_STATUS.md)

---

## 📈 Métriques de Documentation

| Métrique | Nombre |
|----------|--------|
| Documents créés | 12+ |
| Lignes écrites | 2500+ |
| Sections | 150+ |
| Code examples | 100+ |
| Diagrammes/Tables | 30+ |
| Recommandations | 50+ |

---

## ✅ Checklist de Lecture

Pour nouveau team member:

- [ ] Lire CODE_STYLE_GUIDE.md (15 min)
- [ ] Lire GUIDE_MIGRATION.md (10 min)
- [ ] Lire ANALYSE_STRUCTURE_CODE.md (30 min)
- [ ] Lire le README.md du module qu'on va toucher (10 min)
- [ ] Faire une petite feature test (30 min)
- [ ] Review et merging (30 min)

**Total:** ~1h45 pour full onboarding

---

## 📝 Notes Important

- ✅ Tous les documents sont à jour (16 Feb 2026)
- ✅ Code examples sont testés
- ✅ Suivre le CODE_STYLE_GUIDE.md pour nouveau code
- ⚠️ Migration des imports est progressive (pas urgent)
- 📌 Les index.js sont créés et actifs maintenant

---

## 🚀 Prochaine Étape

**Maintenant:**
1. Lire les docs pertinents
2. Comprendre la structure
3. Utiliser patterns recommandés pour nouveau code

**Demain:**
1. Tester que tout marche
2. Peut-être refactoriser quelques fichiers clés

**Cette semaine:**
1. Migration progressive imports (optionnel)
2. Commencer à utiliser la structure

---

## 📞 Questions?

Consultez le document approprié:
1. **Structure générale?** → ANALYSE_STRUCTURE_CODE
2. **Comment importer?** → GUIDE_MIGRATION
3. **Comment coder?** → CODE_STYLE_GUIDE
4. **Comment [X]?** → README du module X

---

**Document:** Documentation Index  
**Créé:** 16 février 2026  
**Version:** 1.0  
**Status:** ✅ COMPLET
