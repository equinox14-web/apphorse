# 🏆 EQUINOX ELITE - AI Training Coach System

**Version:** 2.0  
**Date:** 2026-02-06  
**Status:** Production Ready

---

## 📋 Vue d'ensemble

Le système **Equinox Elite** est le moteur d'IA le plus avancé pour la génération de plannings d'entraînement équestres. Il combine :

- ✅ **Sécurité vétérinaire stricte** par discipline
- ✅ **Périodisation scientifique** (Backwards Planning)
- ✅ **Format JSON structuré** pour intégration front-end parfaite
- ✅ **Terminologie professionnelle** en français
- ✅ **Adaptation intelligente** au niveau cavalier/cheval

---

## 🔐 Règles de Sécurité par Discipline (CRITICAL)

### 🏇 Trotteur / Galopeur
```
❌ INTERDIT: Sauts d'obstacles
✅ AUTORISÉ: Heats, Intervals, Promenade, Ligne Droite, Travail au trot, Tempo
```

### 🏃 Endurance
```
✅ FOCUS: Récupération cardiaque, marche active, LSD (Long Slow Distance)
📊 METRICS: BPM, VO2max, seuils aérobies
```

### 🏅 CSO (Saut d'Obstacles)
```
⚠️ RÈGLE: Pas de gros sauts 3 jours avant compétition
✅ FOCUS: Gymnastique, barres au sol, petits obstacles
```

### 🎭 Dressage
```
✅ FOCUS: Assouplissement, transitions, cessions, épaule en dedans
📊 METRICS: Qualité de la foulée, rectitude, impulsion
```

### 🏇 COURSES DE GALOP (Intelligence Spécifique)

#### 🔍 Détection Automatique de Sous-Discipline
Le système détecte automatiquement le type de course via :
- Le niveau du cheval (ex: "Groupe 1" → PLAT probable)
- Le focus/objectif (ex: "Prix d'Amérique" → TROT, "Grand Steeple" → STEEPLE)
- Le nom de l'événement

#### 📋 Règles Communes Tous Types de Galop
```
✅ VOCABULAIRE: Canter, Breeze (Gaz), Hack, Lot, Furlong, Déboulé
⚠️ TENDONS CRITIQUES: Soins obligatoires (argile + glace) après chaque Breeze
🧠 MENTAL: Repos mental régulier (stress élevé)
```

#### A) 🏁 PLAT (Flat Racing)
```
🎯 OBJECTIF: Vitesse pure, explosivité, départ boîtes
❌ INTERDIT ABSOLU: Obstacles, barres, sauts (terrain plat uniquement)

EXERCICES TYPES:
- Canter de chasse (1500-2000m, tempo modéré)
- Breeze/Gaz (400-600m, vitesse maximale)
- Éducation aux boîtes (calme + explosivité)
- Hack (récupération active)

EXEMPLE:
"Canter de chasse 1500m à 400m/min suivi d'un déboulé (breeze) 
sur 400m à fond. Rentrer au pas calme 15min. 
Soins tendons obligatoires (argile froide)."

TAGS: ["Vitesse", "Cardio", "Explosivité", "Plat"]
```

#### B) 🚧 HAIES (Hurdles)
```
🎯 OBJECTIF: Vitesse d'exécution, fluidité, temps minimal au saut
⚡ FOCUS: Mécanisation (sauts rapides et bas)

EXERCICES TYPES:
- Mécanisation: Sauts rapides, cheval doit "raser" l'obstacle
- Rythme: Maintenir vitesse élevée à l'abord
- Gymnastique: Réactivité des antérieurs
- Balais (haies mobiles): Sécurité avant vitesse

EXEMPLE:
"Travail sur 4 balais à 80m d'intervalle. Galop de course, 
chercher la fluidité et la reprise immédiate du galop à la réception. 
Pas de ralentissement."

TAGS: ["Haies", "Technique", "Vitesse", "Mécanisation"]
```

#### C) 🌄 STEEPLE (Steeplechase / Cross-Country)
```
🎯 OBJECTIF: Force, courage, tenue, respect obstacles fixes
💪 FOCUS: Schooling (variété d'obstacles)

EXERCICES TYPES:
- Schooling: Obstacles variés (Rivière, Mur, Bullfinch, Talus, Open Ditch)
- Le Fond: Distances longues, train soutenu
- La Franchise: Approche confiante, pas de recul
- Sécurité: Trajectoire sûre > vitesse en entraînement

EXEMPLE:
"Parcours de schooling: Gros passage de route + Bullfinch + Rivière. 
On cherche le calme, la trajectoire sécuritaire, et le respect 
de l'obstacle. Pas de chrono aujourd'hui."

TAGS: ["Steeple", "Obstacles", "Courage", "Cross"]
```

#### ⚠️ Surveillance Vétérinaire Spécifique Galop
```
APRÈS CHAQUE BREEZE/GAZ:
✅ Palpation des tendons (chaleur, gonflement)
✅ Application argile froide 30min
✅ Glace sur boulets et tendons
✅ Repos box 24h minimum
✅ Surveillance locomotion (boiterie légère)

SIGNAUX D'ALERTE:
🚨 Chaleur excessive tendons
🚨 Gonflement anormal
🚨 Irrégularité au trot
→ STOP entraînement, appel vétérinaire immédiat
```

---

### 🐎 COURSES DE TROT (Intelligence Spécifique)

#### 🔍 Détection Automatique de Sous-Discipline
Le système détecte automatiquement le type de course via :
- L'équipement mentionné (Sulky → ATTELÉ, Selle → MONTÉ)
- Le focus/objectif (ex: "gainage dorsal" → MONTÉ, "propulsion" → ATTELÉ)
- Le nom de l'événement (ex: "Prix d'Amérique" → ATTELÉ, "Prix de Cornulier" → MONTÉ)

#### 📋 Règles Communes Tous Types de Trot
```
✅ VOCABULAIRE OBLIGATOIRE: Heat, Promenade, Ligne droite, Intervalle, Faux-train, Trot de Chasse
❌ INTERDICTIONS STRICTES: 
   - Galop (sauf exception rare morale)
   - Obstacle (sauf cavalettis au sol)
   - Saut, CSO
📏 VITESSE: Notation en Réduction Kilométrique (ex: 1'30"/km) ou Vite/Demi-vite/Train
🎯 BIOMÉCANIQUE: Précision athlétique, rythme, cadence, diagonale constante
```

#### A) 🏁 ATTELÉ (Harness Racing)
```
🎯 OBJECTIF BIOMÉCANIQUE: Propulsion pure et traction (sulky)
💪 FOCUS: Puissance, résistance harnais, bouche

EXERCICES TYPES:
- Foncier (Trot de Chasse): 5-8km tempo modéré, capacité pulmonaire
- Heats (Vitesse): Séries chronométrées sur piste
- Bouche: Travail embouchure, résistance sulky
- Technique: Diagonale constante, pas de passage au galop

EXEMPLE:
"3 Heats de 2000m dégressifs:
  1er à 1'40"/km (chauffe)
  2ème à 1'30"/km (seuil)
  3ème à 1'20"/km (vitesse max)
  Récupération active 10min entre chaque."

TAGS: ["Trot", "Attelé", "Vitesse", "Heats", "Propulsion"]
```

#### B) 🏇 MONTÉ (Ridden Trot)
```
🎯 OBJECTIF BIOMÉCANIQUE: Portage (carrying) + Gainage (abs/dos)
💪 FOCUS: Le cheval doit "se tendre" sous la selle

EXERCICES TYPES:
- Dos (Back strength): Travail côtes ou plat, chaîne dorsale
- Équilibre: Transitions jockey (Assis ↔ En équilibre)
- Souplesse: Cessions au pas, décontraction sous selle
- Gainage: Exercices core pour supporter le jockey

EXEMPLE:
"Intervalle en côte (MONTÉ):
  3 montées de 800m au train soutenu
  Jockey en équilibre (poids vers l'avant)
  Récupération active en descente au pas
  Focus gainage dorsal et portage."

TAGS: ["Trot", "Monté", "Gainage", "Côtes", "Portage"]
```

#### ⚠️ Erreurs Critiques à Éviter
```
❌ JAMAIS suggérer le galop comme entraînement régulier
   (trotteurs doivent rester en allure diagonale)

❌ JAMAIS suggérer sauts d'obstacles
   (c'est du CSO, pas du trot)

❌ JAMAIS confondre ATTELÉ (sulky) avec MONTÉ (selle)
   (équipement et biomécanique différents)

✅ TOUJOURS mentionner "Surveiller le trot"
   (pas de passage au galop intempestif)

✅ TOUJOURS préciser la vitesse en réduction kilométrique
   (ex: 1'25"/km, pas juste "vite")
```

#### 📊 Notation Vitesse Spécifique Trot
```
RÉDUCTION KILOMÉTRIQUE (temps pour faire 1km):
- 1'40"/km → Trot calme/foncier
- 1'30"/km → Tempo de travail/seuil
- 1'20"/km → Vitesse élevée
- 1'15"/km → Vitesse course Groupe 1
- 1'10"/km → Vitesse exceptionnelle (record)

OU VERBAL:
- Train → Tempo soutenu
- Demi-vite → Vitesse modérée
- Vite → Vitesse maximale
```

---

## 📅 Périodisation Scientifique

### Principe : **Backwards Planning**
On ne planifie JAMAIS depuis aujourd'hui → On part du **JOUR J** et on remonte le temps.

### Zone Rouge (7 derniers jours avant compétition)

```
J-7 à J-5  │ Dernier stimulus HIGH intensity
J-4 à J-3  │ Décharge progressive (LOW volume, MEDIUM intensity)
J-2        │ Travail technique très léger ou repos actif
J-1        │ REPOS ACTIF OBLIGATOIRE (pas, trot léger, stretching)
J-DAY      │ COMPÉTITION 🏆
```

### Règles d'or
1. **Jamais 2 séances HIGH consécutives**
2. **Séance intense → toujours suivie de repos/récupération**
3. **Si compétition dimanche → dernier gros effort = mercredi max**

---

## 📊 Format JSON de Sortie

### Structure Nouvelle (events[])

```json
{
  "plan_summary": "Préparation 28 jours axée sur le développement du foncier aérobie...",
  "events": [
    {
      "date": "2026-02-07",
      "type": "TRAINING | CARE | REST | COMPETITION",
      "title": "Foncier Aérobie - LSD",
      "intensity": "LOW | MEDIUM | HIGH",
      "duration_min": 60,
      "description": "Échauffement (15min): Pas actif 5min + Trot enlevé 10min. Travail principal (35min): Trot de travail continu à 140-160 BPM. Récupération (10min): Pas rênes longues.",
      "tags": ["Foncier", "Cardio", "Endurance"]
    }
  ]
}
```

### Adaptateur Automatique

Le système détecte automatiquement le format retourné par Gemini et le transforme en format `weeklySchedule[]` pour rétrocompatibilité avec le front-end existant.

**Logique :**
```javascript
if (trainingPlan.events && Array.isArray(trainingPlan.events)) {
    // Transformation automatique events[] → weeklySchedule[]
    trainingPlan.weeklySchedule = transformEvents(trainingPlan.events);
}
```

---

## 🎯 Adaptation Intelligente

### Niveau Cavalier
```
Débutant (Galop 1-4)    → Exercices simples, sécurité maximale
Confirmé (Galop 5-7+)   → Enchaînements techniques complexes
Pro/Amateur Élite       → Exigence maximale locomotion + précision
```

### Niveau Cheval
```
Jeune (< 6 ans)         → Séances courtes (30-40min), variété, récup longue
Surpoids (> 550kg)      → Aérobie, longues distances, faible intensité
Élite/Olympique         → Lactique, explosivité, mental, simulation compét
```

---

## 🧪 Vocabulaire Technique Obligatoire

### Termes Physiologiques
- **Seuil anaérobie** : Intensité où le lactate s'accumule
- **VO2max** : Consommation maximale d'oxygène
- **BPM** : Battements par minute (fréquence cardiaque)
- **Foulée** : Qualité et amplitude du mouvement
- **Cadence** : Rythme et régularité

### Termes Entraînement
- **LSD** : Long Slow Distance (foncier)
- **Affûtage/Tapering** : Réduction volume avant compétition
- **Surcompensation** : Pic de forme post-récupération
- **Load Management** : Gestion de la charge d'entraînement
- **Stimulus** : Effort provoquant une adaptation

---

## 🔌 Intégration API

### Paramètres d'entrée

```javascript
const params = {
    horse: {
        name: "Noblesse",
        age: 8,
        breed: "Selle Français",
        estimatedWeight: 520
    },
    rider: {
        name: "Sophie Martin",
        level: "Galop 7"
    },
    discipline: "CSO",
    level: "Compétition",
    frequency: 4,
    focus: "Préparation Grand Prix 140cm",
    targetDate: "2026-03-15",  // OPTIONNEL
    eventName: "GP Fontainebleau"  // OPTIONNEL
};
```

### Appel API

```javascript
import { generateTrainingPlan } from './services/geminiService';

const result = await generateTrainingPlan(params);

if (result.success) {
    const plan = result.data;
    // plan.weeklySchedule est automatiquement disponible
    // plan.events contient les données brutes (si nouveau format)
}
```

---

## 📈 Exemple de Planning Généré

### Scénario : CSO Amateur Elite, 4 semaines

```
SEMAINE 1 (Développement)
- Lundi: Foncier LSD (MEDIUM) - 60min
- Mardi: Repos
- Mercredi: Gymnastique obstacles (MEDIUM) - 45min
- Jeudi: Récupération active (LOW) - 30min
- Vendredi: Cardio fractionné (HIGH) - 50min
- Samedi: Repos
- Dimanche: Technique plat (LOW) - 40min

SEMAINE 4 (Affûtage)
- Lundi: Rappel technique (MEDIUM) - 35min
- Mardi: Repos actif (LOW) - 20min
- Mercredi: Dernier stimulus (HIGH) - 40min
- Jeudi: Décharge (LOW) - 25min
- Vendredi: Travail mental léger (LOW) - 20min
- Samedi: REPOS ACTIF obligatoire
- Dimanche: COMPÉTITION 🏆
```

---

## ⚙️ Configuration Gemini

### Modèle utilisé
```
gemini-2.0-flash
```

### Paramètres
```javascript
{
    temperature: 0.7,  // Créativité modérée
    topP: 0.8,
    maxOutputTokens: 8192  // Supporte jusqu'à 65k
}
```

---

## 🚨 Gestion des Erreurs

### Codes d'erreur API
```
API_KEY_INVALID       → Clé API invalide
RESOURCE_EXHAUSTED    → Quota épuisé
SAFETY                → Contenu bloqué par filtres
NOT_FOUND             → Modèle non trouvé
PERMISSION_DENIED     → API non activée
```

### Messages utilisateur
Tous les messages d'erreur sont traduits en français pour l'utilisateur final.

---

## 🎓 Best Practices

### ✅ À FAIRE
1. Toujours fournir le `targetDate` si compétition connue
2. Préciser le `focus` pour personnalisation maximale
3. Vérifier le `estimatedWeight` du cheval pour adaptation précise
4. Respecter les recommandations de la Zone Rouge (J-7 à J-DAY)

### ❌ À ÉVITER
1. Ne jamais modifier manuellement les phases de tapering
2. Ne pas sauter les jours de repos (risque de surentraînement)
3. Ne pas ignorer les warnings physiologiques générés
4. Ne pas appliquer un planning Trot à un cheval CSO (et vice-versa)

---

## 📚 Références Scientifiques

- **Périodisation** : Tudor Bompa (2009)
- **Physiologie équine** : INRA/IFCE (2012)
- **Tapering** : Mujika & Padilla (2003)
- **Load Management** : Gabbett (2016)

---

## 🔄 Changelog

### v2.0 (2026-02-06)
- ✨ Nouveau format JSON structuré (`events[]`)
- 🔐 Règles de sécurité strictes par discipline
- 📅 Backwards Planning Strategy
- 🔄 Adaptateur automatique pour rétrocompatibilité
- 🌍 Terminologie professionnelle en français

### v1.0 (2025-01)
- 🎉 Version initiale avec `weeklySchedule[]`

---

## 👥 Support

Pour toute question ou amélioration :
- 📧 Contact: support@equinox-app.com
- 📖 Documentation: `/docs`
- 🐛 Issues: GitHub Issues

---

**Équinox Elite - La science au service de la performance équestre** 🐴✨
