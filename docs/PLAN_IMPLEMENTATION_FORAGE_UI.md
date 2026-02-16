# 📋 PLAN D'IMPLÉMENTATION - FORAGE PRECISION UI

## 🎯 OBJECTIF

Implémenter l'interface utilisateur pour la V3.2 Forage Precision :
1. ✅ 5 types de fourrage INRA dans le sélecteur
2. ✅ Scanner d'analyse de foin (Reverdy/Eurofins)
3. ✅ Affichage de la correction de matière sèche
4. ✅ Contribution du fourrage visible

---

## 📝 TÂCHES

### TÂCHE 1 : Ajouter les 5 Types de Fourrage INRA

**Fichier** : `src/utils/nutritionCalculator.js`

**Action** : Remplacer les 3 fourrages génériques par 5 types INRA précis

```javascript
// AVANT (3 types génériques)
- Foin de Prairie (0.50 UFC, 30g MADC, 85% MS)
- Foin de Luzerne (0.60 UFC, 100g MADC, 85% MS)
- Enrubannage (0.70 UFC, 50g MADC, 50% MS)

// APRÈS (5 types INRA)
- Foin de Prairie Tardif (0.45 UFC, 30g MADC, 90% MS)
- Foin de Prairie Précoce (0.62 UFC, 55g MADC, 90% MS)
- Foin de Crau AOP (0.68 UFC, 60g MADC, 92% MS)
- Enrubanné/Haylage (0.75 UFC, 70g MADC, 65% MS) ⚠️
- Paille (0.25 UFC, 15g MADC, 88% MS)
```

---

### TÂCHE 2 : Créer le Scanner d'Analyse de Foin

**Fichier** : `src/components/scanner/ForageAnalysisScanner.jsx` (NOUVEAU)

**Fonctionnalités** :
- Capture photo de l'analyse (Reverdy/Eurofins)
- OCR avec Gemini Vision
- Extraction des valeurs : UFC, MADC, MS%, Ca, P
- Validation et affichage

**Structure** :
```jsx
<ForageAnalysisScanner
  onAnalysisComplete={(values) => {
    // values = { ufc, madc, ms, calcium, phosphore }
    setForageAnalysis(values);
  }}
/>
```

---

### TÂCHE 3 : Mettre à Jour le Sélecteur de Fourrage

**Fichier** : `src/pages/horse/NutritionCalculator.jsx`

**Modifications** :
1. Ajouter un bouton "📄 Scanner une analyse"
2. Afficher les valeurs nutritionnelles pour chaque type
3. Montrer la correction MS en temps réel

**UI** :
```
┌─────────────────────────────────────────────────┐
│ 🌾 Fourrage (Base)                              │
├─────────────────────────────────────────────────┤
│ [Sélecteur ▼] Foin de Prairie Tardif           │
│                                                  │
│ 📊 Valeurs nutritionnelles :                    │
│ • UFC : 0.45/kg MS                              │
│ • MADC : 30g/kg MS                              │
│ • Matière Sèche : 90%                           │
│                                                  │
│ 📏 Correction MS :                              │
│ 10kg brut = 9kg MS                              │
│                                                  │
│ [📄 Scanner une analyse de laboratoire]        │
└─────────────────────────────────────────────────┘
```

---

### TÂCHE 4 : Afficher la Contribution du Fourrage

**Fichier** : `src/pages/horse/NutritionCalculator.jsx`

**Ajout** : Section "Contribution du Fourrage" dans les stats

```jsx
{stats && (
  <div className="forage-contribution">
    <h3>🌾 Contribution du Fourrage</h3>
    <div className="stats-grid">
      <div>
        <span>UFC fourrage</span>
        <strong>{stats.forageInfo.nutrition.ufc.toFixed(2)}</strong>
      </div>
      <div>
        <span>MADC fourrage</span>
        <strong>{stats.forageInfo.nutrition.madc}g</strong>
      </div>
      <div>
        <span>% des besoins UFC</span>
        <strong>
          {((stats.forageInfo.nutrition.ufc / stats.needs.ufc) * 100).toFixed(0)}%
        </strong>
      </div>
    </div>
  </div>
)}
```

---

### TÂCHE 5 : Intégrer avec l'IA V3.2

**Fichier** : `src/pages/horse/NutritionCalculator.jsx`

**Modification** : Passer les données de fourrage à l'IA

```javascript
const handleAIExpertAnalysis = async () => {
  // ...
  
  // Préparer les données de fourrage
  const forageData = {
    input_mode: forageAnalysis ? "SCAN_ANALYSIS" : "LIBRARY_SELECT",
    selected_type: selectedForageId,
    quantity_brut: forageQuantity,
    
    // Si scan d'analyse
    analysis_values: forageAnalysis ? {
      ufc: forageAnalysis.ufc,
      madc: forageAnalysis.madc,
      ms_percent: forageAnalysis.ms
    } : null
  };
  
  // Passer à l'IA
  const result = await analyzeNutritionWithAntiDoping({
    horseProfile,
    forageData,  // NOUVEAU
    coachForecast,
    feedLabelOCR,
    activePrescriptions
  });
};
```

---

## 🎨 MAQUETTE UI

### Sélecteur de Fourrage Amélioré

```
╔══════════════════════════════════════════════════════════════════╗
║ 🌾 FOURRAGE (BASE DE LA RATION)                                 ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║ Type de fourrage :                                               ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │ Foin de Prairie Tardif ▼                                   │  ║
║ ├────────────────────────────────────────────────────────────┤  ║
║ │ • Foin de Prairie Tardif (Tigeux, jaune)                   │  ║
║ │ • Foin de Prairie Précoce (Feuillu, vert) ⚠️ Poneys       │  ║
║ │ • Foin de Crau AOP (Premium)                               │  ║
║ │ • Enrubanné / Haylage ⚠️ Risque SME                        │  ║
║ │ • Paille (Dilution)                                        │  ║
║ └────────────────────────────────────────────────────────────┘  ║
║                                                                  ║
║ 📊 Valeurs nutritionnelles (par kg MS) :                        ║
║ ┌────────────┬────────────┬────────────┐                        ║
║ │ UFC        │ MADC       │ MS%        │                        ║
║ │ 0.45/kg    │ 30g/kg     │ 90%        │                        ║
║ └────────────┴────────────┴────────────┘                        ║
║                                                                  ║
║ Quantité : [10] kg brut                                         ║
║                                                                  ║
║ 📏 Correction Matière Sèche :                                   ║
║ 10kg brut × 90% MS = 9kg MS                                     ║
║                                                                  ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │ 📄 Scanner une analyse de laboratoire (Reverdy/Eurofins)  │  ║
║ └────────────────────────────────────────────────────────────┘  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### Scanner d'Analyse

```
╔══════════════════════════════════════════════════════════════════╗
║ 📄 SCANNER UNE ANALYSE DE FOIN                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║ Prenez en photo votre analyse de laboratoire :                  ║
║ • Reverdy                                                        ║
║ • Eurofins                                                       ║
║ • Autres laboratoires                                            ║
║                                                                  ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │                                                            │  ║
║ │                    📷 PHOTO                                │  ║
║ │                                                            │  ║
║ │              [Prendre une photo]                           │  ║
║ │                                                            │  ║
║ └────────────────────────────────────────────────────────────┘  ║
║                                                                  ║
║ L'IA va extraire automatiquement :                              ║
║ ✓ UFC/kg MS                                                     ║
║ ✓ MADC/kg MS                                                    ║
║ ✓ % Matière Sèche                                               ║
║ ✓ Calcium & Phosphore                                           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### Résultat du Scan

```
╔══════════════════════════════════════════════════════════════════╗
║ ✅ ANALYSE SCANNÉE AVEC SUCCÈS                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║ 📊 Valeurs extraites :                                          ║
║                                                                  ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │ UFC/kg MS        : 0.58                                    │  ║
║ │ MADC/kg MS       : 48g                                     │  ║
║ │ Matière Sèche    : 91%                                     │  ║
║ │ Calcium          : 6.2g/kg                                 │  ║
║ │ Phosphore        : 2.8g/kg                                 │  ║
║ └────────────────────────────────────────────────────────────┘  ║
║                                                                  ║
║ 🌾 Qualité détectée : Foin de Prairie de Bonne Qualité         ║
║                                                                  ║
║ [✓ Utiliser ces valeurs] [✗ Annuler]                           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 📁 FICHIERS À CRÉER/MODIFIER

### À Créer
1. `src/components/scanner/ForageAnalysisScanner.jsx` - Scanner OCR
2. `src/utils/forageOCR.js` - Logique extraction OCR

### À Modifier
1. `src/utils/nutritionCalculator.js` - Ajouter 5 types INRA
2. `src/pages/horse/NutritionCalculator.jsx` - UI fourrage + scanner
3. `src/services/geminiService.js` - Déjà fait (V3.2)

---

## ⏱️ ESTIMATION

- **Tâche 1** : 15 min (Ajouter 5 types INRA)
- **Tâche 2** : 45 min (Scanner OCR)
- **Tâche 3** : 30 min (UI sélecteur)
- **Tâche 4** : 15 min (Affichage contribution)
- **Tâche 5** : 15 min (Intégration IA)

**TOTAL** : ~2h

---

## 🚀 PROCHAINE ÉTAPE

Voulez-vous que je commence par :
1. ✅ **Tâche 1** : Ajouter les 5 types INRA (rapide, visible immédiatement)
2. ✅ **Tâche 2** : Créer le scanner d'analyse (plus complexe)
3. ✅ **Tout implémenter** d'un coup

Quelle option préférez-vous ?
