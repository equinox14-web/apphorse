# Module "Pesée par Photo (IA)" - Documentation Technique

## 📋 Vue d'Ensemble

Le module de **Pesée par Photo** permet d'estimer le poids d'un cheval par analyse d'image en utilisant l'algorithme de **Crevat/Carroll** combiné à des coefficients morphométriques.

### ✅ État d'Implémentation

- [x] Utilitaires de calcul (`weightEstimation.js`)
- [x] Interface de capture photo (`WeightCamera.jsx`)
- [x] Page de suivi (`WeightTracking.jsx`)
- [x] Intégration dans le profil (`HorseProfile.jsx`)
- [x] Routage (`App.jsx`)
- [ ] Intégration Firestore (à faire)
- [ ] Modèle TensorFlow.js (à faire)

---

## 🏗️ Architecture

### 1. Modèle de Données

#### Entité `Horse` (Mise à jour)
```javascript
{
  id: string,
  name: string,
  breed: string,
  // ... champs existants ...
  
  // NOUVEAUX CHAMPS
  morphotype: 'BLOOD' | 'SPORT' | 'PONY' | 'COB' | 'DRAFT',
  height: number, // Taille au garrot en cm (ex: 165)
}
```

#### Collection `WeightEntry` (Nouvelle)
```javascript
{
  id: string,
  horseId: string,
  date: ISO8601 string,
  value: number, // Poids en kg
  source: 'MANUAL' | 'PHOTO_ESTIMATION',
  bodyConditionScore: 1 | 2 | 3 | 4 | 5,
  confidence: number, // 0.0 - 1.0 (uniquement pour PHOTO_ESTIMATION)
  measurements: {
    realDepth: number, // cm
    realLength: number, // cm
    pixelDimensions: {
      pixelHeight: number,
      pixelLength: number,
      pixelDepth: number
    },
    scaleRatio: number
  },
  imageUrl: string | null // URL de l'image capturée (optionnel)
}
```

### 2. Algorithme de Calcul

#### Formule de Crevat/Carroll
```
Weight (kg) = (PT² × Length) / 11877
```

Où :
- **PT** (Périmètre Thoracique) = `realDepth × K × 2.5`
- **K** = Coefficient morphométrique selon le type de cheval
- **Length** = Longueur du corps (épaule → fesse) en cm

#### Coefficients Morphométriques

| Morphotype | Description | Coefficient K |
|------------|-------------|---------------|
| BLOOD | Pur-sang / Fin | 1.30 |
| SPORT | Selle Français / Standard | 1.40 |
| PONY | Poney Sport | 1.45 |
| COB | Rustique / Rond | 1.55 |
| DRAFT | Trait / Lourd | 1.65 |

#### Ajustement BCS (Body Condition Score)

| Note | Description | Facteur |
|------|-------------|---------|
| 1 | Émacié | 0.85 |
| 2 | Mince | 0.93 |
| 3 | Modéré (référence) | 1.00 |
| 4 | Gras | 1.07 |
| 5 | Obèse | 1.15 |

---

## 🔬 Computer Vision (À Implémenter)

### Option 1 : TensorFlow.js (Recommandé pour le Web)

#### Modèle Requis
- **Segmentation sémantique** pour isoler le cheval du fond
- **Détection de points clés** (keypoint detection) pour :
  - Garrot (point haut du dos)
  - Passage de sangle (point bas du ventre)
  - Pointe de l'épaule (avant)
  - Pointe de la fesse (arrière)

#### Modèles Pré-entraînés Possibles
1. **DeepLabV3** - Segmentation
   ```javascript
   import * as tf from '@tensorflow/tfjs';
   import * as deeplab from '@tensorflow-models/deeplab';
   
   const model = await deeplab.load();
   const predictions = await model.segment(imageElement);
   ```

2. **PoseNet / MoveNet** - Keypoints (adaptable pour chevaux)
   ```javascript
   import * as poseDetection from '@tensorflow-models/pose-detection';
   
   const detector = await poseDetection.createDetector(
     poseDetection.SupportedModels.MoveNet
   );
   const poses = await detector.estimatePoses(imageElement);
   ```

#### Custom Training
Pour une précision optimale, entraîner un modèle customisé sur un dataset de chevaux :
- **Dataset** : 500-1000 images de chevaux de profil annotées
- **Architecture** : EfficientNet ou MobileNetV3 (mobile-friendly)
- **Labels** : Coordonnées des 4 points anatomiques + masque de segmentation

### Option 2 : API Externe (Plus Simple)

#### Google Cloud Vision AI
```javascript
async function analyzeHorseImage(imageData) {
  const response = await fetch(
    'https://vision.googleapis.com/v1/images:annotate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: imageData.split(',')[1] },
          features: [
            { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
            { type: 'IMAGE_PROPERTIES' }
          ]
        }]
      })
    }
  );
  
  const data = await response.json();
  // Extraire les boundingBoxes pour le cheval
  return extractDimensions(data);
}
```

**Coût** : ~$1.50 / 1000 images

### Option 3 : Solution Hybride (MVP)

Pour le MVP, utiliser une approche simplifiée :
1. **Demander à l'utilisateur** de placer le cheval dans un gabarit overlay
2. **Calculer les dimensions** en supposant que le gabarit = 80% de la hauteur de l'écran
3. **Appliquer directement** la formule avec le morphotype

```javascript
// Simplified version (current implementation)
const pixelHeight = 450; // Estimé depuis le gabarit
const pixelLength = 380; // Ratio classique 0.84
const pixelDepth = 180;  // Ratio classique 0.40
const scaleRatio = horse.height / pixelHeight;
```

**Précision attendue** : ±15-20% (acceptable pour calcul de rations)

---

## 🔗 Intégration Firestore

### Structure des Collections

```
firestore/
├── users/{userId}/
│   └── horses/{horseId}/
│       ├── (existing fields)
│       ├── morphotype: string
│       ├── height: number
│       └── weightHistory/ (subcollection)
│           └── {entryId}
│               ├── date: timestamp
│               ├── value: number
│               ├── source: string
│               ├── bodyConditionScore: number
│               ├── confidence: number (optional)
│               └── measurements: map (optional)
```

### Requêtes Firestore

#### 1. Ajouter une pesée
```javascript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

async function addWeightEntry(horseId, weightData) {
  const weightRef = collection(
    db,
    'users',
    currentUser.uid,
    'horses',
    horseId,
    'weightHistory'
  );
  
  await addDoc(weightRef, {
    ...weightData,
    createdAt: serverTimestamp(),
  });
}
```

#### 2. Récupérer l'historique
```javascript
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

async function getWeightHistory(horseId, limitCount = 50) {
  const weightRef = collection(
    db,
    'users',
    currentUser.uid,
    'horses',
    horseId,
    'weightHistory'
  );
  
  const q = query(
    weightRef,
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}
```

#### 3. API pour le module Nutrition
```javascript
// GET /api/horses/:id/current-weight
async function getCurrentWeight(horseId) {
  const weightsRef = collection(
    db,
    'users',
    currentUser.uid,
    'horses',
    horseId,
    'weightHistory'
  );
  
  const q = query(
    weightsRef,
    orderBy('date', 'desc'),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  const latestWeight = snapshot.docs[0]?.data();
  
  return {
    value: latestWeight?.value || null,
    date: latestWeight?.date?.toDate() || null,
    source: latestWeight?.source || null,
  };
}
```

---

## 🎯 Workflow Utilisateur

### 1. Calibration (Première Utilisation)
```
╔═══════════════════════════════════╗
║  ⚙️ Calibration Requise           ║
╠═══════════════════════════════════╣
║                                   ║
║  Taille au garrot: [____] cm      ║
║                                   ║
║  Morphotype:                      ║
║  ○ Pur-sang / Fin                 ║
║  ● Selle Français / Standard      ║
║  ○ Poney Sport                    ║
║  ○ Rustique / Rond                ║
║  ○ Trait / Lourd                  ║
║                                   ║
║  [Annuler]  [Continuer ⇒]         ║
╚═══════════════════════════════════╝
```

### 2. Capture Photo
```
┌───────────────────────────────────┐
│            CAMERA VIEW             │
│  ╔═══════════════════════════╗    │
│  ║    ┌─────────────────┐    ║    │
│  ║    │   🐴 Silhouette │    ║    │
│  ║    │   (Gabarit)     │    ║    │
│  ║    └─────────────────┘    ║    │
│  ║                           ║    │
│  ║  Placez le cheval de      ║    │
│  ║  profil dans le cadre     ║    │
│  ╚═══════════════════════════╝    │
│                                    │
│         [  📸 Capturer  ]          │
└───────────────────────────────────┘
```

### 3. Traitement
```
┌───────────────────────────────────┐
│       ⏳ Analyse en cours...       │
│                                    │
│     Calcul des mesures             │
│     morphométriques                │
│                                    │
│         [▓▓▓▓▓▓░░░░] 60%           │
└───────────────────────────────────┘
```

### 4. Validation
```
╔═══════════════════════════════════╗
║  ✅ Estimation Réussie             ║
╠═══════════════════════════════════╣
║                                   ║
║  ┌─────────────────────────────┐  ║
║  │    Poids Estimé             │  ║
║  │         512 kg              │  ║
║  │    Confiance: 85%           │  ║
║  └─────────────────────────────┘  ║
║                                   ║
║  📏 Longueur: 182 cm              ║
║  📐 Profondeur: 72 cm             ║
║                                   ║
║  Ajuster le poids (optionnel):    ║
║  [____512____] kg                 ║
║                                   ║
║  Note d'État Corporel (BCS):      ║
║  [1] [2] [●3] [4] [5]             ║
║                                   ║
║  [Reprendre]  [✓ Valider]         ║
╚═══════════════════════════════════╝
```

---

## 📊 Intégration avec les Autres Modules

### 1. Carnet de Santé (Care.jsx)
- **Afficher le poids actuel** en haut de la page
- **Courbe de poids sur 6 mois** (graphique)
- **Alerte** si variation > 10% en 30 jours

```javascript
// Dans Care.jsx
const currentWeight = await getCurrentWeight(horseId);

<Card title="Poids Actuel">
  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
    {currentWeight.value} kg
  </div>
  <div style={{ fontSize: '0.85rem', color: '#666' }}>
    Dernière pesée : {formatDate(currentWeight.date)}
  </div>
</Card>
```

### 2. Module Nutrition (Futur)
- **Input principal** : Poids pour calcul UFC (Unités Fourragères Cheval)
- **Formule UFC** : Besoins = f(Poids, Activité, Âge)

```javascript
// Exemple calcul de rations
async function calculateRation(horseId, activityLevel) {
  const weight = await getCurrentWeight(horseId);
  
  // Besoins énergétiques de base
  const baseNeeds = 0.033 * Math.pow(weight.value, 0.75);
  
  // Ajustement activité
  const activityFactor = {
    'repos': 1.0,
    'leger': 1.25,
    'moyen': 1.5,
    'intense': 1.75,
  }[activityLevel];
  
  const totalUFC = baseNeeds * activityFactor;
  
  return {
    UFC: totalUFC,
    concentre_kg: totalUFC * 0.4, // Approximation
    fourrage_kg: weight.value * 0.015, // 1.5% du poids
  };
}
```

### 3. Dashboard
- **Widget "Poids"** avec mini-graphique
- **Tendance sur 30 jours** (↗ / ↘)

---

## 🚀 Prochaines Étapes

### Phase 1 : Migration Firestore (Priorité Haute)
1. ✅ Créer les règles Firestore pour `weightHistory`
2. ✅ Remplacer `localStorage` par Firestore dans `WeightTracking.jsx`
3. ✅ Ajouter listeners real-time pour synchronisation

### Phase 2 : Computer Vision (Priorité Moyenne)
1. 🔬 Tester TensorFlow.js avec MobileNet
2. 🔬 Créer un petit dataset d'entraînement (100 images)
3. 🔬 Implémenter extraction réelle des dimensions

### Phase 3 : Intégration Module Nutrition (Priorité Haute)
1. ✅ Créer `Nutrition.jsx` avec calculateur de rations
2. ✅ Ajouter API `getCurrentWeight` dans `weightEstimation.js`
3. ✅ Interface de configuration des besoins (activité, âge, etc.)

### Phase 4 : Dashboard & Visualisation
1. 📊 Graphique Recharts pour courbe de poids
2. 📊 Statistiques avancées (moyenne mobile, tendance)
3. 📊 Export PDF du suivi de poids

---

## 🧪 Tests & Validation

### Précision Attendue
- **Avec Computer Vision IA** : ±8-12%
- **Avec gabarit manuel** : ±15-20%
- **Avec balance réelle** : ±2-5% (référence)

### Cas d'Usage Testés
- ✅ Ajout pesée manuelle
- ✅ Estimation par photo (gabarit)
- ✅ Modification pesée existante
- ✅ Suppression pesée
- ✅ Calcul statistiques (min/max/moyenne/tendance)
- ⏳ Calibration morphotype
- ⏳ Ajustement BCS

---

## 📝 Notes Techniques

### Performances
- **Temps d'analyse photo** : < 2s (objectif)
- **Taille des images** : Compressées à 1024x1024, JPEG 80%
- **Stockage Firestore** : ~1KB par entrée (sans image)

### Limitations Actuelles
- ⚠️ Analyse d'image mockée (valeurs fixes)
- ⚠️ Pas de validation de la pose du cheval
- ⚠️ Pas de détection d'obstacles (clôture, cavalier, etc.)

### Sécurité
- ✅ Permissions : Seuls les propriétaires/cavaliers peuvent ajouter des pesées
- ✅ Validation : Poids entre 50-1500 kg
- ✅ Rate limiting : Max 10 photos/minute

---

## 📚 Références

### Formules Équines
- **Formulaire de Crevat** (1988) - Estimation morphométrique
- **Carroll & Huntington** (1988) - Périmètre thoracique
- **Henneke Body Condition Score** (1983) - Notation BCS

### Technologies
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Google Cloud Vision](https://cloud.google.com/vision)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)

---

**Dernière mise à jour** : 2026-01-17
**Auteurs** : Equipe Equinox Dev
**Version** : 1.0.0 (MVP)
