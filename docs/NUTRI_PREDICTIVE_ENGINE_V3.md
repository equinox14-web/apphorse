# ✅ NUTRI-PREDICTIVE ENGINE V3 - UNIVERSAL NUTRITION ENGINE

## 🎯 OBJECTIF

Mise à niveau du moteur nutritionnel vers la **V3** avec :
- ✅ **Profils métaboliques** (Easy Keeper, Hard Keeper, Pathologies)
- ✅ **Conversion Kg → Litres** (affichage utilisateur)
- ✅ **Planification des repas** (quantités par repas)
- ✅ **Adaptations pathologiques** (PSSM, SME, Ulcères)

---

## 🆕 NOUVELLES FONCTIONNALITÉS V3

### 1. **Profils Métaboliques**

#### Easy Keeper (Poney/Cob/Rustique)
```javascript
- Réduction automatique de -15% des besoins UFC
- Alerte si Amidon > 10%
- Recommandation : aliments riches en fibres, faible énergie
```

#### Hard Keeper (Pur-Sang/Senior/Sang)
```javascript
- Suggestion d'huile/matières grasses
- Augmentation de la densité énergétique
- Recommandation : petits repas fréquents
```

#### Gestation/Lactation
```javascript
- Vérification des contraintes de volume
- Si Ration > 2.5% du poids → "Densifier la ration"
- Augmentation protéines et minéraux
```

### 2. **Gestion des Pathologies**

#### PSSM/SME (Myopathies)
```javascript
- BLOCAGE STRICT si Amidon+Sucre > 10%
- Recommandation : sources d'énergie lipidiques
- Alerte immédiate utilisateur
```

#### Ulcères
```javascript
- Recommandation : 3-4 repas/jour minimum
- Suggestion : luzerne (effet tampon)
- Limitation amidon < 20%
```

### 3. **Conversion Kg → Litres** ⭐ **CRITIQUE**

#### Problème Résolu
**Avant V3** : L'IA retournait "2.5 kg" → Utilisateur ne sait pas combien de litres
**Après V3** : L'IA calcule et affiche "3.8 L" → Utilisateur peut mesurer avec son scoop

#### Formule
```javascript
Liters_Required = Recommended_Kg / Feed_Density

Exemple :
- Recommandé : 3.0 kg
- Densité : 0.65 kg/L (granulés)
- Affichage : 4.6 Litres
```

#### Densités par Défaut
```javascript
{
  "Granulés": 0.65 kg/L,
  "Floconnés": 0.50 kg/L,
  "Avoine": 0.55 kg/L,
  "Orge": 0.60 kg/L,
  "Maïs": 0.70 kg/L
}
```

### 4. **Planification des Repas**

#### Règles de Fractionnement
```javascript
if (Total > 6 Liters) {
    meals_per_day = 4;
} else if (Total > 4 Liters) {
    meals_per_day = 3;
} else {
    meals_per_day = 2;
}
```

#### Exemple de Sortie
```json
{
  "meal_planning": {
    "meals_per_day": 3,
    "liters_per_meal": 1.5,
    "meal_schedule": "1.5 L matin / 1.5 L midi / 1.5 L soir"
  }
}
```

---

## 📊 NOUVEAU FORMAT DE SORTIE V3

### Structure JSON

```json
{
  "status": "SUCCESS",
  "meta": {
    "profile_type_detected": "Easy Keeper",
    "calculation_method": "INRA 2011 + FEI CLEAN SPORT",
    "timestamp": "2026-02-07T09:20:00.000Z"
  },

  "nutritional_calculation": {
    "target_UFC": 4.8,
    "target_UFC_adjusted": 4.1,
    "adjustment_reason": "Easy Keeper -15%",
    "actual_UFC": 4.2,
    "balance_status": "OK",
    
    "target_MADC_g": 350,
    "actual_MADC_g": 360,
    "protein_status": "OK"
  },

  "security_check": {
    "anti_doping_safe": true,
    "feed_analysis": {
      "status": "SAFE",
      "detected_substances": [],
      "risk_level": "NONE"
    },
    "veterinary_check": {
      "status": "SAFE",
      "active_molecule_alert": null,
      "days_remaining": null
    },
    "alerts": []
  },

  "ui_display_data": {
    "recommended_total_qty_kg": 3.0,
    "feed_density_used": 0.65,
    "display_recommendation_liters": 4.6,
    
    "meal_planning": {
      "meals_per_day": 3,
      "liters_per_meal": 1.5,
      "meal_schedule": "1.5 L matin / 1.5 L midi / 1.5 L soir"
    }
  },

  "health_alerts": {
    "pathology_warnings": [],
    "Ca_P_ratio": 1.8,
    "Ca_P_status": "OPTIMAL",
    "ulcer_risk": false,
    "ulcer_risk_reason": null
  },

  "expert_advice": "Ration bien équilibrée pour un Easy Keeper. Maintenir 3 repas/jour pour prévenir les ulcères. Aucun risque anti-dopage détecté."
}
```

---

## 🔄 DIFFÉRENCES V2.1 → V3

### Changements de Structure

| V2.1 | V3 | Raison |
|------|-----|--------|
| `anti_doping_global_check` | `security_check` | Nom plus clair |
| `nutritional_balance` | `nutritional_calculation` | Plus précis |
| `recommendation_text` | `expert_advice` | Simplifié |
| ❌ Pas de conversion L | ✅ `ui_display_data` | **FIX CRITIQUE** |
| ❌ Pas de profils | ✅ `meta.profile_type_detected` | Nouvelle feature |
| ❌ Pas de planning repas | ✅ `meal_planning` | Nouvelle feature |

### Nouveaux Champs

```json
{
  "meta": {
    "profile_type_detected": "NEW"  // Easy Keeper, Hard Keeper, etc.
  },
  "ui_display_data": {              // NEW SECTION
    "recommended_total_qty_kg": float,
    "feed_density_used": float,
    "display_recommendation_liters": float,  // ⭐ CRITIQUE
    "meal_planning": {                       // NEW
      "meals_per_day": integer,
      "liters_per_meal": float,
      "meal_schedule": "String"
    }
  },
  "health_alerts": {                // NEW SECTION
    "pathology_warnings": [],
    "Ca_P_ratio": float,
    "Ca_P_status": "String",
    "ulcer_risk": boolean
  }
}
```

---

## 🔧 UTILISATION

### Appel de la Fonction

```javascript
import { analyzeNutritionWithAntiDoping } from './services/geminiService';

const result = await analyzeNutritionWithAntiDoping({
  horseProfile: {
    weight: 560,
    age: 8,
    metabolicType: 'Rustique',        // NEW
    pathologies: ['None'],            // NEW
    physiologicalStatus: 'Gestation_Late',
    discipline: 'Repos / Paddock',
    feedDensity: 0.65                 // NEW
  },
  coachForecast: {
    next_session_intensity: 5,
    days_until_competition: null
  },
  feedLabelOCR: "FERTO-LAC 3\nUFC: 0.95/kg\nMADC: 120g/kg\n...",
  activePrescriptions: []
});
```

### Affichage des Résultats

```javascript
if (result.success) {
  const data = result.data;
  
  // Afficher la recommandation en LITRES
  console.log(`Quantité recommandée : ${data.ui_display_data.display_recommendation_liters} L`);
  
  // Afficher le planning des repas
  console.log(`Planning : ${data.ui_display_data.meal_planning.meal_schedule}`);
  
  // Vérifier le profil détecté
  console.log(`Profil : ${data.meta.profile_type_detected}`);
  
  // Vérifier la sécurité anti-dopage
  if (!data.security_check.anti_doping_safe) {
    alert(`⚠️ ALERTE : ${data.security_check.alerts.join(', ')}`);
  }
}
```

---

## 📊 EXEMPLES DE CAS D'USAGE

### Cas 1 : Poney Easy Keeper

**Input** :
```json
{
  "horseProfile": {
    "weight": 350,
    "metabolicType": "Rustique",
    "pathologies": ["None"]
  }
}
```

**Output** :
```json
{
  "meta": {
    "profile_type_detected": "Easy Keeper"
  },
  "nutritional_calculation": {
    "target_UFC": 3.0,
    "target_UFC_adjusted": 2.55,  // -15%
    "adjustment_reason": "Easy Keeper -15%"
  },
  "ui_display_data": {
    "display_recommendation_liters": 2.5,
    "meal_planning": {
      "meals_per_day": 2,
      "meal_schedule": "1.25 L matin / 1.25 L soir"
    }
  }
}
```

### Cas 2 : Cheval PSSM

**Input** :
```json
{
  "horseProfile": {
    "weight": 550,
    "pathologies": ["PSSM"]
  },
  "feedLabelOCR": "Amidon: 25%"  // TROP ÉLEVÉ
}
```

**Output** :
```json
{
  "health_alerts": {
    "pathology_warnings": [
      "🚨 BLOCAGE STRICT : Amidon > 10% détecté (25%). PSSM incompatible."
    ]
  },
  "expert_advice": "ATTENTION : Aliment inadapté pour PSSM. Choisir un aliment à base de lipides avec amidon < 10%."
}
```

### Cas 3 : Jument Gestante

**Input** :
```json
{
  "horseProfile": {
    "weight": 560,
    "physiologicalStatus": "Gestation_Late"
  }
}
```

**Output** :
```json
{
  "nutritional_calculation": {
    "target_UFC": 5.5,
    "target_MADC_g": 450  // +100g pour gestation
  },
  "ui_display_data": {
    "display_recommendation_liters": 5.2,
    "meal_planning": {
      "meals_per_day": 3,
      "meal_schedule": "1.7 L matin / 1.7 L midi / 1.8 L soir"
    }
  },
  "expert_advice": "Gestation avancée : augmentation protéines et minéraux. Fractionner en 3 repas minimum."
}
```

---

## 🎨 INTÉGRATION UI

### Affichage Modal

```javascript
{showAnalysisModal && analysisResult && (
  <div className="modal">
    <h2>Analyse Nutritionnelle V3</h2>
    
    {/* Profil Détecté */}
    <div className="profile-badge">
      {analysisResult.meta.profile_type_detected}
    </div>
    
    {/* Recommandation Principale */}
    <div className="recommendation">
      <h3>Quantité Recommandée</h3>
      <div className="quantity-display">
        {analysisResult.ui_display_data.display_recommendation_liters} L
      </div>
      <div className="quantity-detail">
        ({analysisResult.ui_display_data.recommended_total_qty_kg} kg)
      </div>
    </div>
    
    {/* Planning des Repas */}
    <div className="meal-planning">
      <h3>Planning des Repas</h3>
      <div className="meals-per-day">
        {analysisResult.ui_display_data.meal_planning.meals_per_day} repas/jour
      </div>
      <div className="meal-schedule">
        {analysisResult.ui_display_data.meal_planning.meal_schedule}
      </div>
    </div>
    
    {/* Alertes Pathologiques */}
    {analysisResult.health_alerts.pathology_warnings.length > 0 && (
      <div className="pathology-alerts">
        {analysisResult.health_alerts.pathology_warnings.map((warning, i) => (
          <div key={i} className="alert-warning">{warning}</div>
        ))}
      </div>
    )}
    
    {/* Sécurité Anti-Dopage */}
    <div className={`security-status ${analysisResult.security_check.anti_doping_safe ? 'safe' : 'risk'}`}>
      {analysisResult.security_check.anti_doping_safe ? '✅ SAFE' : '🚨 RISK'}
    </div>
  </div>
)}
```

---

## 📁 FICHIERS MODIFIÉS

- `src/services/geminiService.js` (+150 lignes) - System Prompt V3 + Validation

---

## 🎉 RÉSULTAT FINAL

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ✅  NUTRI-PREDICTIVE ENGINE V3 ACTIVÉ                         ║
║   ✅  PROFILS MÉTABOLIQUES INTÉGRÉS                             ║
║   ✅  CONVERSION KG → LITRES AUTOMATIQUE                        ║
║   ✅  PLANNING DES REPAS GÉNÉRÉ                                 ║
║   ✅  ADAPTATIONS PATHOLOGIQUES ACTIVES                         ║
║                                                                  ║
║   Le moteur nutritionnel est maintenant universel et adapte     ║
║   ses recommandations au profil métabolique du cheval !         ║
║                                                                  ║
║   🧪✨ Science + UX Optimale + Sécurité 🏆                      ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

**Version** : 3.0
**Date** : 2026-02-07
**Statut** : ✅ ACTIVÉ ET OPÉRATIONNEL

---

*"De la science aux litres : enfin une IA qui parle le langage des cavaliers !"* 🧪✨📏
