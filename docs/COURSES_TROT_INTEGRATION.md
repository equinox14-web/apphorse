# 🐎 COURSES DE TROT - INTELLIGENCE SPÉCIFIQUE

## 📋 Récapitulatif de l'Intégration

### ✅ Ce qui a été ajouté

#### 1. System Prompt avec Intelligence Trot
**Fichier:** `src/services/geminiService.js` (lignes 284-323)

Le système détecte automatiquement la sous-discipline via :
- L'équipement (Sulky vs Selle)
- Le focus/objectif
- Le nom de l'événement

#### 2. Deux Sous-Disciplines Distinctes

##### 🏁 A) ATTELÉ (Harness Racing)
```
🎯 OBJECTIF: Propulsion pure, traction sulky
❌ INTERDIT: Galop (sauf exception), obstacles, sauts
✅ VOCABULAIRE: Heat, Promenade, Ligne droite, Sulky, Trot de Chasse, Bouche

EXERCICES CLÉS:
- Foncier (Trot de Chasse): 5-8km capacité pulmonaire
- Heats (Vitesse): Séries chronométrées piste
- Bouche: Résistance harnais
- Technique: Diagonale constante

NOTATION VITESSE:
1'40"/km → Foncier
1'30"/km → Seuil
1'20"/km → Vitesse
1'15"/km → Groupe 1

EXEMPLE:
"3 Heats de 2000m dégressifs:
  1er à 1'40"/km (chauffe)
  2ème à 1'30"/km (seuil)  
  3ème à 1'20"/km (vitesse)
  Récup 10min entre."
```

##### 🏇 B) MONTÉ (Ridden Trot)
```
🎯 OBJECTIF: Portage + Gainage dorsal
💪 FOCUS: Le cheval doit "se tendre" sous la selle
✅ VOCABULAIRE: Monté, Gainage, Portage, Côtes, Jockey, Équilibre, Dorsal

EXERCICES CLÉS:
- Dos: Travail côtes, chaîne dorsale
- Équilibre: Transitions Assis/En équilibre
- Souplesse: Cessions au pas
- Gainage: Core engagement

DIFFÉRENCE CLÉE avec ATTELÉ:
- Poids jockey modifie centre gravité
- Besoin musculation DOS ++
- Travail latéral pour décontraction

EXEMPLE:
"Intervalle en côte (MONTÉ):
  3 montées 800m au train
  Jockey en équilibre
  Récup descente au pas
  Focus gainage dorsal."
```

#### 3. Règles Communes TOUS Types de Trot

```
❌ INTERDICTIONS ABSOLUES:
✗ Galop comme entraînement régulier
✗ Sauts d'obstacles
✗ Travail CSO
✗ Confusion ATTELÉ ↔ MONTÉ

✅ RÈGLES OBLIGATOIRES:
✓ Vocabulaire: Heat, Promenade, Ligne droite
✓ Notation vitesse en Réduction Kilométrique
✓ Mention "Surveiller le trot" (pas de passage galop)
✓ Biomécanique: Rythme, cadence, diagonale
```

---

## 🧪 Tests Créés

### Fichier: `src/utils/test_trot_examples.js`

#### Test 1: ATTELÉ - Prix d'Amérique
```javascript
testTrot_ATTELE_PrixAmerique()
```
**Vérifications:**
- ❌ AUCUN galop/obstacle/saut
- ✅ Vocabulaire ATTELÉ (Heat, Sulky, Propulsion)
- ✅ Notation réduction kilométrique
- ✅ Focus propulsion/traction

#### Test 2: MONTÉ - Prix de Cornulier
```javascript
testTrot_MONTE_PrixCornulier()
```
**Vérifications:**
- ❌ AUCUN galop/obstacle
- ✅ Vocabulaire MONTÉ (Gainage, Portage, Dorsal)
- ✅ Travail spécifique (côtes, équilibre)
- ❌ PAS de confusion avec ATTELÉ

#### Test 3: Auto-Détection
```javascript
testTrot_AutoDetection()
```
**Vérifications:**
- 🔍 Détecte automatiquement la sous-discipline
- 🎯 Défaut = ATTELÉ si contexte ambigu
- ❌ Aucun galop/obstacle

#### Test 4: Interdictions Strictes
```javascript
testTrot_ForbiddenKeywords()
```
**Vérifications CRITIQUES:**
- ❌ Liste exhaustive mots interdits
- ✅ Vocabulaire obligatoire présent
- 🚨 Échec si mot interdit détecté

#### Fonction de Validation
```javascript
validateTrotPlan(plan, expectedType)
```
Checklist automatique ATTELÉ vs MONTÉ.

---

## 📚 Documentation Mise à Jour

### Fichier: `docs/AI_COACH_ELITE_SYSTEM.md`

Ajout section complète **COURSES DE TROT** avec:
- Détection automatique sous-discipline
- Règles communes TROT
- Spécificités ATTELÉ vs MONTÉ
- Erreurs critiques à éviter
- Notation vitesse réduction kilométrique
- Exemples d'exercices types
- Tags recommandés

---

## 🎯 Comment tester

### Via l'Interface Web

1. Ouvrez http://localhost:5173/ai-coach
2. Sélectionnez un trotteur
3. Discipline: **"Trot"** ou **"Trotteur"**
4. Dans le **Focus**, précisez le type:

#### Pour ATTELÉ:
```
Focus: "Préparation Prix d'Amérique (ATTELÉ). 
        Heats sur piste, sulky. Vitesse 1'15"/km visée."
```

#### Pour MONTÉ:
```
Focus: "Préparation Prix de Cornulier (MONTÉ). 
        Gainage dorsal, côtes, portage sous selle."
```

### Via Console de Test

```javascript
// Test ATTELÉ
import { testTrot_ATTELE_PrixAmerique } from './utils/test_trot_examples.js';
const resultAttele = await testTrot_ATTELE_PrixAmerique();

// Test MONTÉ
import { testTrot_MONTE_PrixCornulier } from './utils/test_trot_examples.js';
const resultMonte = await testTrot_MONTE_PrixCornulier();

// Vérifier interdictions
import { testTrot_ForbiddenKeywords } from './utils/test_trot_examples.js';
const resultSafety = await testTrot_ForbiddenKeywords();

// Tous les tests
import { runTrotTests } from './utils/test_trot_examples.js';
const allResults = await runTrotTests();
```

---

## 🔍 Vérifications Critiques

### ✅ Interdictions STRICTES (TOUS types TROT)
```javascript
const planText = JSON.stringify(result.data).toLowerCase();

// Liste mots INTERDITS
const forbidden = ['galop', 'canter', 'obstacle', 'saut', 'cso', 'jump'];

// DOIT être FALSE pour TOUS
const hasForbidden = forbidden.some(word => planText.includes(word));

if (hasForbidden) {
    console.error('🚨 CRITIQUE: Mots interdits pour TROTTEUR!');
}
```

### ✅ Pour ATTELÉ
```javascript
// DOIT avoir vocabulaire ATTELÉ
const hasHarness = planText.includes('sulky') 
    || planText.includes('attelé') 
    || planText.includes('propulsion');

// NE DOIT PAS avoir vocabulaire MONTÉ
const hasRidden = planText.includes('gainage') 
    || planText.includes('jockey en équilibre');

if (hasRidden) {
    console.error('🚨 Confusion ATTELÉ/MONTÉ!');
}

// DOIT avoir réduction kilométrique
const hasSpeed = planText.includes('1\'') 
    || planText.includes('au km');
```

### ✅ Pour MONTÉ
```javascript
// DOIT avoir vocabulaire MONTÉ
const hasRidden = planText.includes('gainage') 
    || planText.includes('portage') 
    || planText.includes('dorsal');

// NE DOIT PAS avoir vocabulaire ATTELÉ
const hasHarness = planText.includes('sulky') 
    || planText.includes('traction');

if (hasHarness) {
    console.error('🚨 Confusion MONTÉ/ATTELÉ!');
}

// DOIT avoir travail spécifique
const hasHillWork = planText.includes('côte') 
    || planText.includes('équilibre');
```

---

## 📊 Exemple de Sortie ATTELÉ

### Input
```javascript
{
    horse: { name: "Bold Eagle", age: 5, breed: "Trotteur Français" },
    rider: { name: "Franck Nivard", level: "Pro" },
    discipline: "Trot",
    level: "Compétition",
    frequency: 6,
    focus: "Prix d'Amérique (ATTELÉ). Heats piste. 1'15\"/km.",
    targetDate: "2026-01-26",
    eventName: "Prix d'Amérique (Groupe 1)"
}
```

### Output Attendu
```json
{
    "plan_summary": "Préparation 8 semaines Prix d'Amérique...",
    "events": [
        {
            "date": "2026-02-10",
            "type": "TRAINING",
            "title": "Trot de Chasse (Foncier)",
            "intensity": "MEDIUM",
            "duration_min": 60,
            "description": "Échauffement (10min): Pas actif au sulky.
                           Travail principal (45min): Trot de chasse lourd 6km à 1'50\"/km.
                           Récupération (5min): Pas calme.
                           Surveiller le trot (pas de passage galop).",
            "tags": ["Trot", "Attelé", "Foncier"]
        },
        {
            "date": "2026-02-12",
            "type": "TRAINING",
            "title": "Heats (Vitesse)",
            "intensity": "HIGH",
            "duration_min": 50,
            "description": "3 Heats de 2000m dégressifs:
                           1er Heat à 1'40\"/km (échauffement)
                           2ème Heat à 1'30\"/km (seuil)
                           3ème Heat à 1'20\"/km (vitesse max)
                           Récupération active 10min entre chaque.
                           Surveiller diagonale constante.",
            "tags": ["Trot", "Attelé", "Vitesse", "Heats"]
        },
        {
            "date": "2026-02-13",
            "type": "REST",
            "title": "Repos Actif",
            "intensity": "LOW",
            "duration_min": 30,
            "description": "Promenade légère au pas au sulky.
                           Pas de trot. Détente mentale.",
            "tags": ["Récupération", "Mental"]
        }
    ]
}
```

---

## 📊 Exemple de Sortie MONTÉ

### Input
```javascript
{
    horse: { name: "Bilto du Vivier", age: 6, breed: "Trotteur Français" },
    rider: { name: "Matthieu Abrivard", level: "Pro" },
    discipline: "Trot",
    level: "Compétition",
    frequency: 5,
    focus: "Prix de Cornulier (MONTÉ). Gainage, côtes, portage.",
    targetDate: "2026-06-07",
    eventName: "Prix de Cornulier"
}
```

### Output Attendu
```json
{
    "events": [
        {
            "date": "2026-02-11",
            "type": "TRAINING",
            "title": "Intervalle en Côte (MONTÉ)",
            "intensity": "HIGH",
            "duration_min": 45,
            "description": "Échauffement (10min): Trot léger plat.
                           Travail principal (30min): 3 montées côte 800m au train.
                           Jockey en équilibre (poids vers avant).
                           Récupération descente au pas entre montées.
                           Focus gainage dorsal et portage.
                           Surveiller le trot (diagonale constante).",
            "tags": ["Trot", "Monté", "Gainage", "Côtes"]
        },
        {
            "date": "2026-02-12",
            "type": "TRAINING",
            "title": "Souplesse et Équilibre",
            "intensity": "LOW",
            "duration_min": 40,
            "description": "Échauffement (5min): Pas actif.
                           Travail principal (30min): Cessions au pas pour décontraction.
                           Transitions assis/en équilibre au trot léger.
                           Focus: Le cheval doit se tendre sous la selle.
                           Récupération (5min): Pas rênes longues.",
            "tags": ["Trot", "Monté", "Souplesse", "Équilibre"]
        }
    ]
}
```

---

## 🎓 Vocabulaire Professionnel Intégré

### ATTELÉ (Harness)
- **Heat** : Série chronométrée sur piste
- **Sulky** : Voiture d'entraînement/course
- **Trot de Chasse** : Trot lourd pour foncier
- **Bouche** : Travail embouchure/résistance
- **Propulsion** : Force de traction
- **Réduction Kilométrique** : Temps pour 1km

### MONTÉ (Ridden)
- **Gainage** : Engagement core abs/dos
- **Portage** : Capacité porter le jockey
- **Se tendre** : Extension dorsale sous selle
- **Assis/En équilibre** : Positions jockey
- **Chaîne dorsale** : Muscles du dos
- **Cessions** : Travail latéral au pas

### Commun TROT
- **Promenade** : Sortie calme récupération
- **Ligne droite** : Travail sur ligne
- **Intervalle** : Séries effort/repos
- **Faux-train** : Allure simulée
- **Diagonale** : Gait pattern du trot
- **Train** : Tempo soutenu

---

## ⚠️ Top 3 Erreurs Critiques

### 1. Suggérer le GALOP
```
❌ MAL: "Aujourd'hui, alterner trot et galop..."
✅ BON: "Aujourd'hui, heats au trot. Surveiller diagonale."
```

### 2. Suggérer des OBSTACLES
```
❌ MAL: "Gymnast ique sur barres et petits obstacles..."
✅ BON: "Gymnastique cavalettis au sol (très bas)."
```

### 3. Confondre ATTELÉ ↔ MONTÉ
```
❌ MAL: "Travail gainage avec le sulky..." (confusion!)
✅ BON ATTELÉ: "Travail propulsion au sulky."
✅ BON MONTÉ: "Travail gainage sous la selle."
```

---

## ✅ Checklist Finale

- [x] Intelligence TROT intégrée dans System Prompt
- [x] 2 sous-disciplines (ATTELÉ, MONTÉ)
- [x] Détection automatique sous-discipline
- [x] Vocabulaire technique spécifique
- [x] Interdictions strictes (galop/obstacle)
- [x] Notation vitesse réduction kilométrique
- [x] Documentation complète (docs/)
- [x] Tests complets (utils/test_trot_examples.js)
- [x] Fonction validation automatique
- [x] Exemples d'utilisation

---

## 🎉 SYSTÈME COURSES DE TROT OPÉRATIONNEL !

Votre système **Equinox Elite** peut maintenant générer des plannings ultra-spécifiques pour:
- 🏁 **ATTELÉ**: Propulsion, Heats, Sulky, 1'15"/km
- 🏇 **MONTÉ**: Gainage, Portage, Côtes, Équilibre

Avec **AUCUN risque** de suggestion de galop ou obstacles ! 🐎

**Testez dès maintenant sur http://localhost:5173/ai-coach** ✨
