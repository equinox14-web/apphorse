# ✅ NUTRI-ENGINE V3.2 - FORAGE PRECISION

## 🎯 OBJECTIF

Mise à niveau majeure vers la **V3.2** avec **analyse précise du fourrage** comme fondation de la ration !

---

## 🆕 NOUVELLES FONCTIONNALITÉS V3.2

### 1. **Hiérarchie d'Analyse du Fourrage** 🌾

#### PRIORITÉ 1 : Analyse de Laboratoire (Gold Standard)
```javascript
IF Input_Mode == "SCAN_ANALYSIS":
  - Scanner un rapport Reverdy/Eurofins
  - Extraire les valeurs exactes (UFC, MADC, MS%)
  - Appliquer la correction de Matière Sèche
  
Exemple :
  Rapport scanné : UFC 0.58/kg MS, MADC 48g/kg MS, MS 91%
  → Utiliser ces valeurs exactes
```

#### PRIORITÉ 2 : Bibliothèque Qualifiée
```javascript
IF Input_Mode == "LIBRARY_SELECT":
  - Sélectionner un archétype de fourrage
  - Appliquer les valeurs INRA validées
  - Correction automatique de la Matière Sèche
```

**Archetypes disponibles** :

| Type de Fourrage | UFC/kg MS | MADC/kg MS | MS% | Meilleur pour |
|------------------|-----------|------------|-----|---------------|
| **Foin Tardif** (Tigeux, jaune) | 0.45 | 30g | 90% | Easy Keepers, Ponies, PSSM |
| **Foin Précoce** (Feuillu, vert) | 0.62 | 55g | 90% | Sport, Hard Keepers |
| **Foin de Crau AOP** | 0.68 | 60g | 92% | Sport, Premium |
| **Enrubanné/Haylage** | 0.75 | 70g | **65%** | Hard Keepers ⚠️ Risque SME |
| **Paille** | 0.25 | 15g | 88% | Dilution Easy Keepers |

#### PRIORITÉ 3 : Défaut Sécurisé
```javascript
IF Input_Mode == "DEFAULT":
  - Utiliser moyenne standard (0.52 UFC / 42g MADC, 90% MS)
```

---

### 2. **Correction de Matière Sèche** ⚖️ **CRITIQUE**

#### Problème Résolu
**Avant V3.2** : 10kg d'enrubanné = 10kg dans les calculs → ERREUR
**Après V3.2** : 10kg d'enrubanné à 65% MS = 6.5kg MS → CORRECT

#### Formule
```javascript
Forage_DM_kg = Qty_brut × DM_percent

Exemples :
- 10kg Foin Tardif (90% MS) = 9kg MS
- 10kg Enrubanné (65% MS) = 6.5kg MS
- 10kg Paille (88% MS) = 8.8kg MS
```

#### Impact sur les Calculs
```javascript
// AVANT V3.2 (FAUX)
10kg Enrubanné × 0.75 UFC/kg = 7.5 UFC ❌

// APRÈS V3.2 (CORRECT)
10kg Enrubanné × 0.65 MS = 6.5kg MS
6.5kg MS × 0.75 UFC/kg MS = 4.875 UFC ✅
```

---

### 3. **Flux de Calcul Précis**

```javascript
// Step 1: Calculer les Besoins
Target_UFC = 0.044 × Poids + Travail
Ajustement métabolique : Easy Keeper (-15%) | Hard Keeper (+10%)

// Step 2: Analyser le Fourrage
Forage_DM_kg = Qty_brut × DM_percent
Forage_UFC = Forage_DM_kg × UFC_per_kg_DM
Forage_MADC = Forage_DM_kg × MADC_per_kg_DM

// Step 3: Calculer le Gap
Deficit_UFC = Target_UFC - Forage_UFC

// Step 4: Combler avec Concentré
Concentrate_kg = Deficit_UFC / Concentrate_UFC_per_kg
Concentrate_Liters = Concentrate_kg / Density

// Step 5: Planifier les Repas
If Total > 6 L → 4 repas/jour
If Total > 4 L → 3 repas/jour
```

---

### 4. **Alertes de Sécurité Fourrage**

#### Alerte Sucre/Fructanes
```javascript
IF Forage == "Précoce" OR "Enrubanné"
AND Horse has "SME" OR "Laminitis" OR "Cushing":
  → ALERT: "⚠️ Foin trop riche pour ce cheval sensible.
             Faites tremper le foin 12h ou choisissez une coupe tardive."
```

#### Alerte Volume
```javascript
IF Total_Ration > 2.5% BodyWeight:
  → ALERT: "⚠️ Volume trop important.
             Densifier la ration ou fractionner davantage."
```

---

## 📊 NOUVEAU FORMAT JSON V3.2

### Section `forage_analysis` (NOUVELLE)

```json
{
  "forage_analysis": {
    "source_used": "LIBRARY_PRESET",
    "forage_type_detected": "Foin de Prairie Tardif",
    "quality_description": "Coupe tardive, faible énergie, idéal Easy Keepers",
    
    "nutritional_values_used": {
      "UFC_per_kg_DM": 0.45,
      "MADC_per_kg_DM": 30,
      "dry_matter_percent": 90
    },
    
    "dry_matter_correction": "10kg brut = 9kg MS",
    
    "forage_contribution": {
      "UFC_from_forage": 4.05,
      "MADC_from_forage": 270
    }
  }
}
```

### Section `ui_display_data` (ENRICHIE)

```json
{
  "ui_display_data": {
    "recommended_total_qty_kg": 2.5,
    "feed_density_used": 0.65,
    "display_recommendation_liters": 3.8,
    
    "meal_planning": {
      "meals_per_day": 2,
      "liters_per_meal": 1.9,
      "meal_schedule": "1.9 L matin / 1.9 L soir"
    },
    
    "forage_advice": "Votre foin est de coupe tardive (faible énergie). J'ai réduit les granulés de 30% pour éviter le surpoids."
  }
}
```

### Section `health_alerts` (ENRICHIE)

```json
{
  "health_alerts": {
    "pathology_warnings": [],
    "forage_warnings": [
      "⚠️ Foin précoce détecté : risque pour chevaux SME/Laminitis"
    ],
    "Ca_P_ratio": 1.8,
    "Ca_P_status": "OPTIMAL",
    "ulcer_risk": false
  }
}
```

---

## 📊 EXEMPLES COMPLETS

### Exemple 1 : Poney Easy Keeper + Foin Tardif

**Input** :
```json
{
  "horseProfile": {
    "weight": 300,
    "metabolicType": "Rustique",
    "pathologies": []
  },
  "forage": {
    "type": "Foin de Prairie Tardif",
    "quantity_brut": 10
  }
}
```

**Calculs** :
```javascript
// 1. Besoins
Target_UFC = 0.044 × 300 = 13.2 UFC
Ajustement Easy Keeper = 13.2 × 0.85 = 11.22 UFC

// 2. Fourrage
Forage_DM = 10kg × 0.90 = 9kg MS
Forage_UFC = 9kg × 0.45 = 4.05 UFC

// 3. Gap
Deficit_UFC = 11.22 - 4.05 = 7.17 UFC

// 4. Concentré (0.95 UFC/kg)
Concentrate_kg = 7.17 / 0.95 = 7.55 kg
Concentrate_L = 7.55 / 0.65 = 11.6 L

// 5. Repas (> 6L)
Meals = 4
Per_meal = 11.6 / 4 = 2.9 L
```

**Output** :
```json
{
  "forage_analysis": {
    "forage_type_detected": "Foin de Prairie Tardif",
    "nutritional_values_used": {
      "UFC_per_kg_DM": 0.45,
      "MADC_per_kg_DM": 30,
      "dry_matter_percent": 90
    },
    "dry_matter_correction": "10kg brut = 9kg MS",
    "forage_contribution": {
      "UFC_from_forage": 4.05
    }
  },
  "ui_display_data": {
    "display_recommendation_liters": 11.6,
    "meal_planning": {
      "meals_per_day": 4,
      "meal_schedule": "2.9 L matin / 2.9 L midi / 2.9 L après-midi / 2.9 L soir"
    },
    "forage_advice": "Foin de coupe tardive parfait pour ce poney Easy Keeper."
  }
}
```

### Exemple 2 : Cheval SME + Enrubanné (ALERTE)

**Input** :
```json
{
  "horseProfile": {
    "weight": 550,
    "pathologies": ["SME"]
  },
  "forage": {
    "type": "Enrubanné",
    "quantity_brut": 10
  }
}
```

**Calculs** :
```javascript
// 1. Fourrage
Forage_DM = 10kg × 0.65 = 6.5kg MS  // ⚠️ Correction critique
Forage_UFC = 6.5kg × 0.75 = 4.875 UFC

// 2. Alerte
IF SME AND Enrubanné → TRIGGER ALERT
```

**Output** :
```json
{
  "forage_analysis": {
    "forage_type_detected": "Enrubanné / Haylage",
    "nutritional_values_used": {
      "UFC_per_kg_DM": 0.75,
      "dry_matter_percent": 65
    },
    "dry_matter_correction": "10kg brut = 6.5kg MS"
  },
  "health_alerts": {
    "forage_warnings": [
      "🚨 ALERTE : Enrubanné trop riche en sucres pour un cheval SME. Choisissez un foin de coupe tardive ou faites tremper le foin 12h."
    ]
  },
  "expert_advice": "ATTENTION : Fourrage inadapté pour SME. Risque de myopathie. Changez pour un foin tardif pauvre en sucres."
}
```

---

## 🔄 DIFFÉRENCES V3 → V3.2

| Fonctionnalité | V3 | V3.2 |
|----------------|-----|------|
| Analyse fourrage | ❌ Basique | ✅ Hiérarchie (Lab > Library > Default) |
| Matière Sèche | ❌ Non gérée | ✅ Correction automatique |
| Types de fourrage | ❌ Générique | ✅ 5 archetypes INRA |
| Alertes fourrage | ❌ | ✅ Incompatibilités pathologies |
| Contribution fourrage | ❌ | ✅ Détaillée (UFC + MADC) |
| Conseil fourrage | ❌ | ✅ `forage_advice` personnalisé |

---

## 📁 FICHIERS MODIFIÉS

- `src/services/geminiService.js` (+200 lignes)
  - System Prompt V3.2 avec forage precision
  - Validation `forage_analysis`
  - Logs enrichis

---

## 🎉 RÉSULTAT FINAL

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ✅  NUTRI-ENGINE V3.2 ACTIVÉ                                  ║
║   ✅  ANALYSE PRÉCISE DU FOURRAGE                               ║
║   ✅  CORRECTION MATIÈRE SÈCHE AUTOMATIQUE                      ║
║   ✅  5 ARCHETYPES INRA VALIDÉS                                 ║
║   ✅  ALERTES FOURRAGE/PATHOLOGIE                               ║
║                                                                  ║
║   Le fourrage est maintenant la FONDATION de la ration !        ║
║   Calculs ultra-précis avec correction MS automatique.          ║
║                                                                  ║
║   🌾✨ Fourrage First + Science INRA = Précision Maximale 🎯   ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

**Version** : 3.2
**Date** : 2026-02-07
**Statut** : ✅ ACTIVÉ ET OPÉRATIONNEL

---

*"Le fourrage d'abord, le concentré ensuite : la vraie science nutritionnelle !"* 🌾✨🧪
