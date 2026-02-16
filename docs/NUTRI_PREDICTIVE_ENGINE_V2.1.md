# 🧪 MODULE NUTRI-PREDICTIVE ENGINE V2.1 - DOCUMENTATION COMPLÈTE

## 📋 Vue d'Ensemble

Le **Nutri-Predictive Engine V2.1** est un système expert d'analyse nutritionnelle pour chevaux de sport qui intègre :
- ✅ Calculs physiologiques selon **INRA 2011**
- ✅ Vérification anti-dopage **FEI/France Galop/SECF**
- ✅ **Double Check de Sécurité** : Aliment + Médicaments
- ✅ Prédiction des besoins énergétiques (intégration IA Coach)

---

## 🎯 Problématique Résolue

### AVANT (V1.0)
- ❌ Analyse nutritionnelle basique (UFC, MADC)
- ❌ Pas de vérification anti-dopage
- ❌ Pas de lien avec les traitements vétérinaires
- ❌ Pas d'anticipation des besoins futurs

### APRÈS (V2.1)
- ✅ **Analyse nutritionnelle complète** (INRA 2011)
- ✅ **Double check anti-dopage** :
  - Scan des ingrédients de l'aliment (NOPS)
  - Vérification des délais de retrait des médicaments
- ✅ **Intégration IA Coach** : Ajustement des besoins selon l'intensité prévue
- ✅ **Alerte compétition** : Détection automatique des risques de dopage

---

## 🔧 FONCTIONNEMENT

### 1. Entrées du Système

```javascript
{
  horseProfile: {
    weight: 550,              // kg
    age: 8,                   // ans
    physiologicalStatus: "Normal" | "Gestation" | "Lactation",
    discipline: "CSO"
  },
  
  coachForecast: {
    next_session_intensity: 7,    // 1-10
    days_until_competition: 10    // jours
  },
  
  feedLabelOCR: "Texte brut scanné de l'étiquette...",
  
  activePrescriptions: [
    {
      molecule: "Phenylbutazone",
      date_admin: "2026-02-01",
      withdrawal_days: 14
    }
  ]
}
```

### 2. Traitement

#### A. Calculs Nutritionnels (INRA 2011)

**Besoins Énergétiques (UFC)** :
```
UFC_maintenance = 0.044 × poids_kg
UFC_travail = {
  Léger (1-3):  +0.5 UFC/jour
  Moyen (4-6):  +1.5 UFC/jour
  Intense (7-10): +3.0 UFC/jour
}

SI intensité_prévue > 7 ALORS
  UFC_cible = UFC_cible × 1.10  // +10% pour séance intense
```

**Besoins Protéiques (MADC)** :
```
MADC_maintenance = 50g / 100kg poids
MADC_travail = +10g par UFC de travail
```

**Ratios de Sécurité** :
- **Ca:P** → 1.5:1 à 2:1 (optimal)
- **Amidon** → < 25% (risque ulcères)
- **Fréquence** → ≥ 3 repas/jour

#### B. Double Check Anti-Dopage

**1. Scan de l'Aliment (NOPS)** :

Liste des substances interdites naturelles :
- **Harpagophytum** (Griffe du Diable) - Anti-inflammatoire
- **Caféine** (Guarana, Thé, Maté)
- **Valériane** (Valeriana officinalis) - Sédatif
- **Théobromine** (Cacao, Chocolat)
- **Capsaïcine** (Piment, Poivre)
- **Morphine** (Graines de pavot)
- **Hordénine** (Germes d'orge)

**Détection** :
```
SI feedLabelOCR contient "Harpagophytum" ALORS
  feed_analysis.status = "RISK"
  detected_substances.push("Harpagophytum")
```

**2. Vérification des Médicaments** :

Délais de retrait (FEI/France Galop) :
| Molécule | Délai |
|----------|-------|
| Phenylbutazone | 14 jours |
| Flunixin | 7 jours |
| Ketoprofen | 7 jours |
| Dexamethasone | 7 jours |
| Omeprazole | 24 heures |
| Clenbuterol | 14 jours |

**Calcul** :
```
jours_écoulés = aujourd'hui - date_admin
jours_restants = withdrawal_days - jours_écoulés

SI days_until_competition < jours_restants ALORS
  veterinary_cross_check.status = "RISK"
  conflict_with_competition = true
```

**Décision Finale** :
```
is_competition_safe = (feed_analysis.status == "SAFE") 
                   && (veterinary_cross_check.status == "SAFE")
```

### 3. Sortie du Système

```json
{
  "analysis_meta": {
    "calculation_method": "INRA 2011 + FEI CLEAN SPORT",
    "timestamp": "2026-02-07T08:30:00.000Z"
  },

  "nutritional_balance": {
    "energy_UFC": {
      "status": "BALANCED",
      "target_daily": 7.5,
      "target_adjusted": 8.25,
      "current_intake": 8.0,
      "adjustment_reason": "High intensity session forecasted (+10%)"
    },
    "protein_MADC": {
      "status": "BALANCED",
      "target_daily_g": 350,
      "current_intake_g": 360
    },
    "ratios": {
      "Ca_P_ratio": 1.8,
      "Ca_P_status": "OPTIMAL",
      "ulcer_risk_alert": false,
      "ulcer_risk_reason": null
    }
  },

  "anti_doping_global_check": {
    "is_competition_safe": false,
    
    "feed_analysis": {
      "status": "SAFE",
      "detected_substances": [],
      "risk_level": "NONE",
      "details": "Aucune substance interdite détectée dans l'aliment"
    },

    "veterinary_cross_check": {
      "status": "RISK",
      "active_molecule_alert": "ATTENTION : Traitement Phenylbutazone en cours. Fin de rémanence le 15/02.",
      "conflict_with_competition": true,
      "withdrawal_end_date": "2026-02-15",
      "days_remaining": 5
    }
  },

  "recommendation_text": {
    "coach_insight": "Ration bien équilibrée pour l'intensité prévue. Maintenir 3 repas/jour.",
    "safety_alert": "🚨 ALERTE DOPAGE : Compétition prévue le 10/02 mais délai de retrait Phenylbutazone non respecté (fin le 15/02). REPORT OBLIGATOIRE.",
    "action_required": "Reporter la compétition de 5 jours OU annuler le traitement (consulter vétérinaire)"
  }
}
```

---

## 🎨 INTERFACE UTILISATEUR (Proposition)

### Modal d'Analyse Nutritionnelle

```
┌──────────────────────────────────────────────────┐
│  🧪 Analyse Nutritionnelle Avancée               │
├──────────────────────────────────────────────────┤
│                                                  │
│  📊 BILAN ÉNERGÉTIQUE                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  UFC Cible : 8.25 (ajusté +10% pour séance)     │
│  UFC Actuel : 8.0                                │
│  Statut : ✅ ÉQUILIBRÉ                           │
│                                                  │
│  🥩 PROTÉINES (MADC)                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Cible : 350g/jour                               │
│  Actuel : 360g/jour                              │
│  Statut : ✅ ÉQUILIBRÉ                           │
│                                                  │
│  ⚖️ RATIOS DE SÉCURITÉ                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Ca:P = 1.8:1 → ✅ OPTIMAL                       │
│  Risque ulcères : ❌ Aucun                       │
│                                                  │
│  🔐 VÉRIFICATION ANTI-DOPAGE                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Aliment : ✅ SAFE (aucune substance interdite) │
│  Médicaments : 🚨 RISQUE DÉTECTÉ                 │
│                                                  │
│  ⚠️ ALERTE COMPÉTITION                           │
│  ┌────────────────────────────────────────────┐ │
│  │ Traitement Phenylbutazone en cours         │ │
│  │ Fin de rémanence : 15/02/2026              │ │
│  │ Compétition prévue : 10/02/2026            │ │
│  │ → CONFLIT : 5 jours manquants              │ │
│  │                                            │ │
│  │ 🚨 COMPÉTITION NON AUTORISÉE               │ │
│  │                                            │ │
│  │ Action requise :                           │ │
│  │ • Reporter la compétition de 5 jours       │ │
│  │ • OU consulter vétérinaire pour arrêt      │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [Fermer]              [Exporter PDF]            │
└──────────────────────────────────────────────────┘
```

---

## 📊 CAS D'USAGE

### Cas 1 : Aliment Contaminé (Harpagophytum)

**Entrée** :
```javascript
{
  feedLabelOCR: "Granulés Sport Pro - Ingrédients: Avoine, Orge, Harpagophytum 2%, Vitamines...",
  coachForecast: { days_until_competition: 7 },
  activePrescriptions: []
}
```

**Sortie** :
```json
{
  "anti_doping_global_check": {
    "is_competition_safe": false,
    "feed_analysis": {
      "status": "RISK",
      "detected_substances": ["Harpagophytum"],
      "risk_level": "HIGH",
      "details": "Harpagophytum détecté (anti-inflammatoire interdit FEI)"
    },
    "veterinary_cross_check": {
      "status": "SAFE"
    }
  },
  "recommendation_text": {
    "safety_alert": "🚨 ALERTE : Aliment contient Harpagophytum (substance interdite). ARRÊT IMMÉDIAT requis.",
    "action_required": "Changer d'aliment MAINTENANT. Délai de purge : 7 jours minimum."
  }
}
```

### Cas 2 : Traitement Vétérinaire Récent

**Entrée** :
```javascript
{
  feedLabelOCR: "Granulés Classic - Ingrédients: Avoine, Orge, Luzerne...",
  coachForecast: { days_until_competition: 5 },
  activePrescriptions: [
    {
      molecule: "Phenylbutazone",
      date_admin: "2026-02-01",
      withdrawal_days: 14
    }
  ]
}
```

**Sortie** :
```json
{
  "anti_doping_global_check": {
    "is_competition_safe": false,
    "feed_analysis": {
      "status": "SAFE"
    },
    "veterinary_cross_check": {
      "status": "RISK",
      "active_molecule_alert": "Phenylbutazone administré le 01/02. Fin de rémanence le 15/02.",
      "conflict_with_competition": true,
      "withdrawal_end_date": "2026-02-15",
      "days_remaining": 9
    }
  },
  "recommendation_text": {
    "safety_alert": "🚨 ALERTE : Délai de retrait Phenylbutazone non respecté (9 jours manquants).",
    "action_required": "Reporter la compétition au 16/02 minimum."
  }
}
```

### Cas 3 : Tout est OK

**Entrée** :
```javascript
{
  feedLabelOCR: "Granulés Classic - Ingrédients: Avoine, Orge, Luzerne, Vitamines...",
  coachForecast: { 
    next_session_intensity: 8,
    days_until_competition: 30 
  },
  activePrescriptions: []
}
```

**Sortie** :
```json
{
  "anti_doping_global_check": {
    "is_competition_safe": true,
    "feed_analysis": {
      "status": "SAFE",
      "detected_substances": [],
      "risk_level": "NONE"
    },
    "veterinary_cross_check": {
      "status": "SAFE",
      "conflict_with_competition": false
    }
  },
  "recommendation_text": {
    "coach_insight": "Ration adaptée pour séance intense prévue. UFC ajusté à +10%.",
    "safety_alert": "✅ Aucun risque anti-dopage détecté. Compétition autorisée.",
    "action_required": "Aucune action requise. Continuer le programme."
  }
}
```

---

## 🔧 IMPLÉMENTATION TECHNIQUE

### API : `analyzeNutritionWithAntiDoping()`

**Localisation** : `src/services/geminiService.js` (ligne 846)

**Signature** :
```javascript
export async function analyzeNutritionWithAntiDoping(params) {
  // params: {
  //   horseProfile: Object,
  //   coachForecast: Object,
  //   feedLabelOCR: String,
  //   activePrescriptions: Array
  // }
}
```

**Retour** :
```javascript
{
  success: boolean,
  data: {
    analysis_meta: {...},
    nutritional_balance: {...},
    anti_doping_global_check: {...},
    recommendation_text: {...}
  },
  generatedAt: "ISO date"
}
```

### Intégration avec IA Coach

```javascript
// Dans le module Nutrition
import { analyzeNutritionWithAntiDoping } from '../services/geminiService';

// Récupérer les prévisions de l'IA Coach
const aiPlans = JSON.parse(localStorage.getItem('ai_training_plans') || '[]');
const horsePlan = aiPlans.find(p => p.horseId === currentHorse.id);

// Calculer l'intensité de la prochaine séance
const nextSession = horsePlan?.plan?.events?.[0];
const nextIntensity = nextSession?.intensity === 'HIGH' ? 8 : 
                     nextSession?.intensity === 'MEDIUM' ? 5 : 3;

// Récupérer les traitements vétérinaires
const vetRecords = currentHorse.healthRecords?.medications || [];
const activePrescriptions = vetRecords
  .filter(med => isStillActive(med))
  .map(med => ({
    molecule: med.name,
    date_admin: med.date,
    withdrawal_days: getWithdrawalDays(med.name)
  }));

// Appeler l'analyse
const result = await analyzeNutritionWithAntiDoping({
  horseProfile: {
    weight: currentHorse.weight,
    age: currentHorse.age,
    physiologicalStatus: currentHorse.physiologicalStatus,
    discipline: currentHorse.discipline
  },
  coachForecast: {
    next_session_intensity: nextIntensity,
    days_until_competition: daysUntilNextCompetition
  },
  feedLabelOCR: scannedFeedText,
  activePrescriptions: activePrescriptions
});

if (result.success) {
  // Afficher les résultats
  displayNutritionAnalysis(result.data);
  
  // Alerte si risque anti-dopage
  if (!result.data.anti_doping_global_check.is_competition_safe) {
    showCriticalAlert(result.data.recommendation_text.safety_alert);
  }
}
```

---

## 🔐 SÉCURITÉ ET CONFORMITÉ

### Règles de Sécurité Implémentées

1. ✅ **Approche Conservative** : En cas de doute, FLAG comme RISK
2. ✅ **Double Vérification** : Aliment ET Médicaments
3. ✅ **Délais Officiels** : Conformité FEI/France Galop/SECF
4. ✅ **Traçabilité** : Toutes les analyses sont horodatées
5. ✅ **Validation des Données** : Vérification des paramètres d'entrée

### Limitations V2.1

- ❌ Pas de base de données exhaustive de tous les aliments du marché
- ❌ Pas de détection automatique des substances "masquantes"
- ❌ Pas d'intégration avec les bases de données vétérinaires officielles
- ❌ Pas de prise en compte des variations individuelles de métabolisme

---

## 🚀 ROADMAP V3.0

### Court Terme (1-2 mois)
- [ ] Base de données d'aliments pré-analysés
- [ ] Scan automatique des ordonnances vétérinaires (OCR)
- [ ] Alertes push avant compétition
- [ ] Export PDF du rapport d'analyse

### Moyen Terme (3-6 mois)
- [ ] Intégration API FEI Clean Sport Database
- [ ] Détection substances masquantes
- [ ] Historique des analyses (tendances)
- [ ] Recommandations alternatives d'aliments

### Long Terme (6-12 mois)
- [ ] Machine Learning pour prédire les besoins
- [ ] Intégration capteurs biométriques
- [ ] Communauté : partage d'analyses anonymisées
- [ ] Certification officielle FEI/France Galop

---

## 📞 SUPPORT

### Documentation
- **Ce fichier** : Documentation complète
- **README_AI_COACH.md** : Contexte IA Coach
- **geminiService.js** : Code source

### Code Source
- **Backend** : `src/services/geminiService.js` (ligne 846)
- **Frontend** : À implémenter dans module Nutrition

### Questions Fréquentes

**Q: L'analyse est-elle juridiquement opposable ?**
R: Non, c'est un outil d'aide à la décision. Toujours consulter un vétérinaire officiel.

**Q: Que faire si un risque est détecté ?**
R: Suivre les recommandations de l'IA et consulter un vétérinaire agréé FEI.

**Q: Les délais de retrait sont-ils à jour ?**
R: Oui, basés sur les règlements FEI/France Galop 2024. Vérifier régulièrement les mises à jour.

**Q: Peut-on scanner plusieurs aliments ?**
R: Oui, analyser chaque aliment séparément puis combiner les résultats.

---

## 🎉 CONCLUSION

Le **Nutri-Predictive Engine V2.1** est un système expert unique qui combine :
- ✅ Nutrition scientifique (INRA 2011)
- ✅ Sécurité anti-dopage (FEI/France Galop)
- ✅ Intelligence prédictive (IA Coach)
- ✅ Double check de sécurité

**Objectif** : Garantir la performance ET la conformité réglementaire.

---

**Version** : 2.1
**Date** : 2026-02-07
**Auteur** : Équipe Equinox Elite

---

*"La nutrition est la base de la performance. La sécurité anti-dopage est la base de l'éthique sportive."* 🧪✨
