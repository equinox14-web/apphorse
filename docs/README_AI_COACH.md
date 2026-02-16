# 🏆 EQUINOX ELITE - AI TRAINING COACH v2.2

## 🚀 Démarrage Rapide

### 1. Lancer l'application
```bash
npm run dev
```
Ouvrir: **http://localhost:5173/ai-coach**

### 2. Générer votre premier planning

1. **Sélectionnez un cheval**
2. **Choisissez la discipline** (CSO, Dressage, Endurance, Galop, Trot, Loisir)
3. **Précisez le type** (si Galop ou Trot):
   - Pour **Galop**: mentionnez "PLAT", "HAIES" ou "STEEPLE" dans le focus
   - Pour **Trot**: mentionnez "ATTELÉ" ou "MONTÉ" dans le focus
4. **Cliquez "Générer mon planning IA"**
5. **Admirez le résultat !** 🎉

---

## 📚 Documentation

### Fichiers principaux

| Fichier | Description |
|---------|-------------|
| `EQUINOX_ELITE_v2.1_FINAL.md` | **📖 Guide complet** - Tout ce qu'il faut savoir |
| `TABLEAU_COMPARATIF_DISCIPLINES.md` | **📊 Tableau comparatif** - 10 disciplines côte à côte |
| `DYNAMIC_ADAPTATION_MODULE.md` | **🧠 Module Adaptatif** - IA Auto-Apprenante (RAG, Feedback, Contexte) |
| `INTEGRATION_EQUINOX_ELITE.md` | **🔧 Guide intégration** - Vue technique |
| `COURSES_GALOP_INTEGRATION.md` | **🏇 Spécifique GALOP** - PLAT/HAIES/STEEPLE |
| `COURSES_TROT_INTEGRATION.md` | **🐎 Spécifique TROT** - ATTELÉ/MONTÉ |
| `docs/AI_COACH_ELITE_SYSTEM.md` | **📚 Documentation système** - Détails techniques |

### Lire en priorité (5 min)

1. **Ce fichier** (README_AI_COACH.md) → Vue d'ensemble
2. **TABLEAU_COMPARATIF_DISCIPLINES.md** → Comprendre les différences
3. **EQUINOX_ELITE_v2.1_FINAL.md** → Checklist et exemples

---

## 🎯 Disciplines Supportées

### Standard (5)
- ✅ **CSO** - Saut d'obstacles
- ✅ **Dressage** - Haute école
- ✅ **Endurance** - Longue distance
- ✅ **Loisir** - Détente et plaisir
- ✅ **Jeune Cheval** - Débourrage et progression

### Courses de Galop (3 sous-types)
- ✅ **PLAT** - Vitesse pure, pas d'obstacles
- ✅ **HAIES** - Mécanisation, sauts rapides
- ✅ **STEEPLE** - Obstacles fixes, courage

### Courses de Trot (2 sous-types)
- ✅ **ATTELÉ** - Propulsion, sulky
- ✅ **MONTÉ** - Gainage, portage

**TOTAL: 10 types de plannings spécialisés**

---

## ⚡ Exemples Rapides

### Exemple 1: CSO Amateur
```javascript
{
    discipline: "CSO",
    level: "Compétition",
    frequency: 4,
    focus: "Préparation Grand Prix 140cm",
    targetDate: "2026-03-15"
}
```

### Exemple 2: Galop PLAT (Course)
```javascript
{
    discipline: "Galop",
    level: "Compétition",
    frequency: 5,
    focus: "Prix de l'Arc de Triomphe (PLAT). Vitesse pure, boîtes.",
    targetDate: "2026-10-04"
}
```

### Exemple 3: Trot ATTELÉ (Course)
```javascript
{
    discipline: "Trot",
    level: "Compétition",
    frequency: 6,
    focus: "Prix d'Amérique (ATTELÉ). Heats, sulky, 1'15\"/km.",
    targetDate: "2026-01-26"
}
```

---

## 🔍 Comment le système détecte le type?

### Pour GALOP
Le système cherche dans le **focus** :
- Mention "PLAT" ou "flat" ou "vitesse pure" → **PLAT**
- Mention "HAIES" ou "hurdles" ou "balais" → **HAIES**
- Mention "STEEPLE" ou "cross" ou "bullfinch" → **STEEPLE**

### Pour TROT
Le système cherche dans le **focus** :
- Mention "ATTELÉ" ou "harness" ou "sulky" → **ATTELÉ**
- Mention "MONTÉ" ou "ridden" ou "gainage" → **MONTÉ**

**💡 Conseil**: Soyez explicite dans le focus pour garantir la bonne détection !

---

## 🚨 Sécurités Critiques

### ❌ GALOP PLAT
**AUCUN obstacle jamais suggéré** - Vérification automatique

### ❌ TROT (tous types)
**AUCUN galop/obstacle jamais suggéré** - Vérification automatique

### ⚠️ GALOP (tous types)
**Soins tendons obligatoires** après chaque Breeze/Gaz

### ⚠️ CSO
**Pas de gros sauts J-3 avant compétition**

### ⚠️ Jeune Cheval
**Séances courtes max 45min** - Vérification automatique

---

## 🧪 Tests

### Lancer tous les tests
```javascript
// Dans la console navigateur (F12)

// Tests disciplines standard
import { runAllTests } from './utils/test_ai_coach_examples.js';
await runAllTests();

// Tests GALOP
import { runGalopTests } from './utils/test_galop_examples.js';
await runGalopTests();

// Tests TROT
import { runTrotTests } from './utils/test_trot_examples.js';
await runTrotTests();
```

### Tests individuels
```javascript
// Test spécifique GALOP PLAT
import { testGalop_PLAT_ArcDeTriomphe } from './utils/test_galop_examples.js';
const result = await testGalop_PLAT_ArcDeTriomphe();
console.log(result);

// Test spécifique TROT ATTELÉ
import { testTrot_ATTELE_PrixAmerique } from './utils/test_trot_examples.js';
const result = await testTrot_ATTELE_PrixAmerique();
console.log(result);
```

---

## 📊 Structure de Sortie

### Format JSON retourné par l'API
```json
{
    "plan_summary": "Stratégie globale du planning...",
    "events": [
        {
            "date": "2026-02-10",
            "type": "TRAINING|CARE|REST|COMPETITION",
            "title": "Titre de la séance",
            "intensity": "LOW|MEDIUM|HIGH",
            "duration_min": 60,
            "description": "Description détaillée: Échauffement + Travail + Récup",
            "tags": ["Tag1", "Tag2"]
        }
    ]
}
```

### Transformation automatique
Le système transforme **automatiquement** le format `events[]` en `weeklySchedule[]` pour le front-end existant. **Aucune modification du front-end nécessaire** !

---

## 🎓 Vocabulaire par Discipline

### GALOP PLAT 🏁
- **Breeze/Gaz** : Accélération courte distance
- **Canter** : Galop de travail
- **Boîtes** : Starting gates
- **Déboulé** : Sprint final

### GALOP HAIES 🚧
- **Mécanisation** : Automatisation du saut
- **Balais** : Haies mobiles
- **Fluidité** : Continuité mouvement

### GALOP STEEPLE 🌄
- **Schooling** : Entraînement obstacles
- **Bullfinch** : Haie épaisse
- **Rivière** : Obstacle d'eau
- **Franchise** : Courage

### TROT ATTELÉ 🏁
- **Heat** : Série chronométrée
- **Sulky** : Voiture attelée
- **Propulsion** : Force traction
- **Réduction Kilométrique** : 1'30"/km

### TROT MONTÉ 🏇
- **Gainage** : Engagement core
- **Portage** : Porter le jockey
- **Se tendre** : Extension dorsale
- **Assis/En équilibre** : Positions jockey

---

## 🔧 Architecture Technique

### Fichiers Code
```
src/
├── services/
│   └── geminiService.js          ← System Prompt + API
├── pages/
│   └── AITrainingCoach.jsx       ← Interface utilisateur
├── hooks/
│   └── useTrainingAI.js          ← Logic hook
└── utils/
    ├── test_ai_coach_examples.js ← Tests standard
    ├── test_galop_examples.js    ← Tests GALOP
    └── test_trot_examples.js     ← Tests TROT
```

### Fichiers Documentation
```
docs/
└── AI_COACH_ELITE_SYSTEM.md      ← Documentation système

racine/
├── README_AI_COACH.md            ← Ce fichier
├── EQUINOX_ELITE_v2.1_FINAL.md   ← Guide complet
├── TABLEAU_COMPARATIF_DISCIPLINES.md
├── INTEGRATION_EQUINOX_ELITE.md
├── COURSES_GALOP_INTEGRATION.md
└── COURSES_TROT_INTEGRATION.md
```

---

## ✅ Checklist Avant Génération

### Informations Cheval
- [ ] Nom du cheval
- [ ] Âge (> 3 ans pour courses)
- [ ] Race adaptée à la discipline
- [ ] Poids estimé

### Informations Cavalier/Driver
- [ ] Nom
- [ ] Niveau (Galop 1-7 ou Amateur/Pro)

### Configuration Planning
- [ ] Discipline choisie
- [ ] **Si GALOP**: Type précisé (PLAT/HAIES/STEEPLE) dans le focus
- [ ] **Si TROT**: Type précisé (ATTELÉ/MONTÉ) dans le focus
- [ ] Fréquence adaptée (2-6/semaine)
- [ ] Focus détaillé (> 20 caractères)

### Optionnel - Compétition
- [ ] Date cible (si compétition)
- [ ] Nom événement (si compétition)
- [ ] Délai réaliste (> 2 semaines)

---

## 🆘 Résolution Problèmes

### Le planning suggère du galop pour un TROTTEUR
❌ **Problème critique** - Vérifier que:
1. Discipline = "Trot" ou "Trotteur"
2. Le focus ne contient pas "galop"
3. Relancer la génération

### Le planning suggère des obstacles pour un GALOP PLAT
❌ **Problème critique** - Vérifier que:
1. Le focus mentionne bien "PLAT"
2. Relancer la génération
3. Si persiste, contacter le support

### Le planning ne détecte pas le bon type (ATTELÉ vs MONTÉ)
⚠️ **Améliorer le focus**:
- Pour ATTELÉ: mentionner "sulky", "attelé", "propulsion"
- Pour MONTÉ: mentionner "monté", "gainage", "portage", "selle"

### Les séances sont trop longues pour un jeune cheval
⚠️ **Vérifier**:
- Âge < 6 ans ?
- Niveau = "Jeune" ?
- Séances doivent être < 45min

---

## 📞 Support

### Documentation
- 📖 Lire `EQUINOX_ELITE_v2.1_FINAL.md`
- 📊 Consulter `TABLEAU_COMPARATIF_DISCIPLINES.md`
- 🔧 Voir `docs/AI_COACH_ELITE_SYSTEM.md`

### Tests
- 🧪 Lancer les tests automatiques (voir section Tests)
- ✅ Utiliser les fonctions de validation

---

## 🎉 Prêt à Commencer !

1. **Lancez l'application**: `npm run dev`
2. **Ouvrez**: http://localhost:5173/ai-coach
3. **Générez votre premier planning** 🏆

**Bon entraînement ! 🐴✨**

---

*Equinox Elite v2.2 - L'IA la plus avancée pour la génération de plannings d'entraînement équestres - Maintenant avec Adaptation Dynamique !*

---

## 🧠 MODULE ADAPTIVE FEEDBACK LOOP (V1.0)

### Nouvelle Fonctionnalité : Adaptation Post-Séance

L'IA Coach ne se contente plus de générer un planning statique. Elle **s'adapte dynamiquement** après chaque séance en fonction de votre feedback !

**Comment ça marche ?**

1. **Montez votre cheval** selon le planning IA
2. **Validez la séance** dans le Calendrier
3. **Remplissez le feedback** :
   - RPE (Ressenti 1-10) : Comment le cheval a vécu la séance ?
   - État de récupération : Frais / Normal / Fatigué / Épuisé
   - Commentaires optionnels
4. **L'IA analyse** et adapte automatiquement les 3 prochaines séances
5. **Recevez le message** de l'IA expliquant les modifications

**Exemples d'adaptation** :

- 🟢 **RPE conforme** → Planning maintenu
- 🟡 **Cheval fatigué** → Séance de demain allégée, récupération active
- 🔴 **Fatigue critique** → Repos forcé 72h, surveillance vétérinaire
- 🔵 **Cheval en forme** → Intensité légèrement augmentée (+10%)

**Documentation complète** : Voir `ADAPTIVE_FEEDBACK_LOOP.md`

---

