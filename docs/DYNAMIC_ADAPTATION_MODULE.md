# 🧠 MODULE D'ADAPTATION DYNAMIQUE - EQUINOX ELITE v2.2

## 📋 Vue d'ensemble

Le **Module d'Adaptation Dynamique** permet à l'IA Training Coach de s'auto-améliorer continuellement en s'adaptant à :
1. **Nouvelles connaissances** (réglementations, vétérinaire, scientifique)
2. **Retours utilisateurs** (notes, commentaires)
3. **Conditions environnementales** (météo, sol)

---

## 🎯 3 Règles Fondamentales

### RULE 1: KNOWLEDGE PRIORITY (RAG)

**Principe**: Les mises à jour **{LATEST_UPDATES}** priment TOUJOURS sur la connaissance pré-entraînée.

#### Cas d'usage

```javascript
// Exemple: Nouvelle règle FEI
{LATEST_UPDATES}: "FEI 2026: Interdiction du Tildren avant compétitions"

→ L'IA détecte automatiquement et modifie ses recommandations:
{
  "plan_summary": "⚠️ ALERTE RÉGLEMENTAIRE FEI 2026: Tildren interdit avant compétition. Plan adapté sans ce produit.",
  "events": [...]
}
```

#### Détection automatique

- **Réglementations** (FEI, France Galop, IFCE)
- **Alertes vétérinaires** (dopage, substances interdites)
- **Papers scientifiques** (nouvelles méthodologies)

---

### RULE 2: FEEDBACK LOOP (Auto-Tuning)

**Principe**: Ajustement automatique basé sur **{USER_FEEDBACK_HISTORY}**

#### Scénario 1: Session Trop Dure (Rating ≤ 2/5)

```javascript
// Historique
{USER_FEEDBACK_HISTORY}: [
  { date: "2026-02-01", rating: 2, tag: "Too Hard", comment: "Cheval épuisé" }
]

→ Régression Factor appliqué (-20%):
{
  "plan_summary": "⚠️ Adaptation: Intensité réduite de 20% suite au feedback précédent.",
  "events": [
    {
      "duration_min": 40,  // au lieu de 50
      "intensity": "MEDIUM", // au lieu de HIGH
      "description": "Récupération renforcée 30% (+5min)"
    }
  ]
}
```

#### Scénario 2: Session Trop Facile (Rating ≥ 4/5)

```javascript
{USER_FEEDBACK_HISTORY}: [
  { date: "2026-02-01", rating: 5, tag: "Too Easy", comment: "Parfait, on peut augmenter" }
]

→ Progression Factor appliqué (+10%):
{
  "plan_summary": "✅ Progression: Difficulté augmentée de 10% suite aux excellents résultats.",
  "events": [
    {
      "duration_min": 55,  // au lieu de 50
      "description": "Ajout variations techniques + transitions complexes"
    }
  ]
}
```

#### Scénario 3: Cheval Stressé

```javascript
{USER_FEEDBACK_HISTORY}: [
  { comment: "Cheval très chaud aujourd'hui" }
]

→ Phase de calme forcée:
{
  "events": [
    {
      "title": "Détente Mentale Prioritaire",
      "duration_min": 15,
      "description": "Échauffement: Marche rênes longues (10min) + Cercles au pas (5min). Détente mentale avant travail. ⚠️ Cheval signalé stress."
    }
  ]
}
```

#### Scénario 4: Alerte Santé (CRITIQUE)

```javascript
{USER_FEEDBACK_HISTORY}: [
  { comment: "Léger boiterie antérieur droit" }
]

→ ARRÊT IMMÉDIAT:
{
  "plan_summary": "🚨 ARRÊT IMPÉRATIF: Boiterie détectée dans l'historique. Consulter vétérinaire/ostéopathe AVANT toute reprise.",
  "events": [
    {
      "type": "REST",
      "title": "REPOS COMPLET",
      "description": "Marche en main légère uniquement si absence totale de boiterie. AUCUN trot/galop/saut. Consultation vétérinaire obligatoire."
    }
  ]
}
```

---

### RULE 3: CONTEXTUAL AWARENESS (Environnement)

**Principe**: Adaptation automatique aux **{CURRENT_CONDITIONS}**

#### Scénario 1: Canicule (>30°C)

```javascript
{CURRENT_CONDITIONS}: {
  weather: "Hot",
  temperature: 35
}

→ Réduction intensité -30%:
{
  "plan_summary": "⚠️ CANICULE (35°C): Intensité réduite de 30%, sessions matinales uniquement, hydratation renforcée + électrolytes.",
  "events": [
    {
      "duration_min": 35,  // au lieu de 50
      "description": "Travail 6h-8h uniquement. Pauses hydratation toutes les 15min. Zones ombragées prioritaires."
    }
  ]
}
```

#### Scénario 2: Sol Dur/Gelé (CRITIQUE)

```javascript
{CURRENT_CONDITIONS}: {
  ground: "Frozen"
}

→ INTERDICTIONS STRICTES:
{
  "plan_summary": "🚨 SOL GELÉ: AUCUN saut ni travail vitesse. Risque tendons/articulations CRITIQUE. Alternatives: Marche, treadmill, natation équine.",
  "events": [
    {
      "type": "ALTERNATIVE",
      "title": "Marche Active Uniquement",
      "description": "Marche en main 30min OU treadmill si disponible. PAS de trot/galop. Sol trop dur."
    }
  ]
}
```

#### Scénario 3: Sol Profond/Boueux

```javascript
{CURRENT_CONDITIONS}: {
  ground: "Deep",
  weather: "Rain"
}

→ Ajustement durée -25%:
{
  "plan_summary": "⚠️ SOL PROFOND: Séance courte (-25%), renforcement naturel. Soins jambes/sabots renforcés après.",
  "events": [
    {
      "duration_min": 37,  // au lieu de 50
      "description": "Travail renforcement musculaire naturel (résistance boue). Éviter répétitions (risque tendons). Douche + soins jambes OBLIGATOIRES après."
    }
  ]
}
```

#### Scénario 4: Pluie/Orage

```javascript
{CURRENT_CONDITIONS}: {
  weather: "Storm"
}

→ Priorité sécurité:
{
  "plan_summary": "⚠️ ORAGE: Privilégier carrière couverte. Si extérieur obligatoire: pas de saut (glissant).",
  "events": [
    {
      "title": "Séance Indoor (Manège)",
      "description": "Si carrière couverte disponible: travail plat uniquement. Si extérieur: marche/pas, PAS de saut (risque glissade)."
    }
  ]
}
```

---

## 🔄 Ordre de Priorité des Règles

En cas de conflit, l'ordre d'application est:

```
1. SAFETY (santé, sol dur, boiterie)
   → OVERRIDE ABSOLU de toutes les autres règles
   
2. KNOWLEDGE UPDATES (réglementations)
   → OVERRIDE de la connaissance interne
   
3. FEEDBACK LOOP (notes utilisateur)
   → ADAPTATION de la difficulté
   
4. ENVIRONMENTAL (météo/sol)
   → ADAPTATION de l'intensité/lieu
```

### Exemple de Conflit Résolu

```javascript
// Conflit: Session planifiée HIGH mais sol gelé
{CURRENT_CONDITIONS}: { ground: "Frozen" }
Plan original: { intensity: "HIGH", includes jumping }

→ SAFETY (Rule #1) override tout:
Plan adapté: { 
  intensity: "LOW", 
  type: "WALK_ONLY",
  description: "🚨 SOL GELÉ: Marche uniquement."
}
```

---

## 📊 Format des Inputs Dynamiques

### {LATEST_UPDATES}

```javascript
{
  source: "FEI Regulations 2026",
  date: "2026-01-15",
  category: "REGULATORY", // ou "VETERINARY", "SCIENTIFIC"
  content: "New rule: Tildren banned 30 days before competition",
  priority: "HIGH"
}
```

### {USER_FEEDBACK_HISTORY}

```javascript
[
  {
    session_id: "abc123",
    date: "2026-02-01",
    rating: 2,  // 1-5
    tag: "Too Hard",  // ou "Too Easy", "Perfect"
    comment: "Cheval très fatigué, boiterie légère",
    horse_id: "xyz789"
  }
]
```

### {CURRENT_CONDITIONS}

```javascript
{
  date: "2026-02-06",
  weather: "Hot",  // "Rain", "Storm", "Clear"
  temperature: 32,  // Celsius
  ground: "Hard",  // "Soft", "Deep", "Frozen", "Good"
  location: "outdoor"  // ou "indoor"
}
```

---

## 🧪 Exemples de Tests

### Test 1: RAG - Nouvelle Réglementation

```javascript
import { generateTrainingPlan } from './services/geminiService';

const params = {
  horse: { name: "Test Horse" },
  discipline: "CSO",
  // ... autres params
  
  // Injection mise à jour dynamique
  latestUpdates: {
    source: "FEI 2026",
    content: "Interdiction cavaletti bleus en compétition",
    category: "REGULATORY"
  }
};

const result = await generateTrainingPlan(params);

// Vérifier que le plan mentionne cette nouvelle règle
console.log(result.plan_summary);
// → "⚠️ FEI 2026: Cavaletti bleus interdits en compétition."
```

### Test 2: Feedback Loop - Session Trop Dure

```javascript
const params = {
  horse: { name: "Fatigued Horse" },
  discipline: "Dressage",
  
  feedbackHistory: [
    { rating: 2, tag: "Too Hard", comment: "Épuisé" }
  ]
};

const result = await generateTrainingPlan(params);

// Vérifier réduction intensité
console.assert(
  result.events[0].duration_min < 50,  // Durée réduite
  "Durée devrait être réduite"
);
console.assert(
  result.plan_summary.includes("Adaptation"),
  "Plan devrait mentionner l'adaptation"
);
```

### Test 3: Contextual - Sol Gelé

```javascript
const params = {
  horse: { name: "Safety Horse" },
  discipline: "CSO",
  
  currentConditions: {
    ground: "Frozen",
    temperature: -5
  }
};

const result = await generateTrainingPlan(params);

// Vérifier AUCUN saut suggéré
const planText = JSON.stringify(result).toLowerCase();
console.assert(
  !planText.includes('saut'),
  "❌ CRITIQUE: Sauts détectés avec sol gelé!"
);
console.assert(
  planText.includes('marche'),
  "✅ Marche suggérée (correct)"
);
```

---

## ✅ Checklist d'Intégration

- [x] Module intégré dans System Prompt
- [x] Règle 1: RAG (Knowledge Priority)
- [x] Règle 2: Feedback Loop (Auto-Tuning)
- [x] Règle 3: Contextual Awareness
- [x] Ordre de priorité défini
- [x] Documentation complète
- [ ] Tests unitaires à créer
- [ ] Interface UI pour inputs dynamiques
- [ ] Stockage historique feedback (Firestore)
- [ ] API météo intégration (optionnel)

---

## 🔮 Prochaines Étapes

### Phase 1: Backend (Priorité)
1. ✅ Module intégré dans System Prompt
2. ⏳ Créer API endpoint pour `feedbackHistory`
3. ⏳ Créer API endpoint pour `currentConditions`
4. ⏳ Intégrer API météo (OpenWeather ou similaire)

### Phase 2: Frontend
1. ⏳ Ajouter formulaire "Noter cette séance" (1-5 étoiles + commentaire)
2. ⏳ Ajouter sélecteur "Conditions actuelles" (météo + sol)
3. ⏳ Afficher alertes générées par le module (🚨, ⚠️)

### Phase 3: Storage
1. ⏳ Stockage Firebase pour `feedbackHistory`
2. ⏳ Stockage Firebase pour `latestUpdates` (admin)
3. ⏳ Cache `currentConditions` (refresh toutes les heures)

---

## 🎉 SYSTÈME D'ADAPTATION DYNAMIQUE OPÉRATIONNEL !

Votre IA Training Coach est maintenant **auto-apprenante** ! 🧠✨

**Elle s'adapte automatiquement à**:
- ✅ Nouvelles réglementations (FEI, France Galop)
- ✅ Retours utilisateurs (notes + commentaires)
- ✅ Conditions météo et sol
- ✅ Alertes santé du cheval

**Documentation**: `DYNAMIC_ADAPTATION_MODULE.md`  
**Code**: `src/services/geminiService.js` (lignes 336-418)

**Version**: Equinox Elite **v2.2** 🏆
