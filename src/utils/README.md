# ⚙️ Utils - Documentation

## Vue d'ensemble
Le dossier `utils/` contient les fonctions utilitaires, helpers et calculs métier réutilisables.

## Utilitaires Disponibles

### 📄 `documentAnalysis.js`
Analyse documentaire et détection de texte
- Extraction de contenu
- Reconnaissance de documents
- Parsing de données

### 🖼️ `geminiVision.js`
Vision par ordinateur avec Gemini
- Analyse d'images
- Reconnaissance d'objets
- Extraction de données visuelles

### 🔍 `imageAnalyzer.js`
Analyse générale d'images
- Détection de features
- Comparaison d'images
- Bounding box detection

### 📝 `labelOCR.js`
OCR spécialisé pour étiquettes alimentaires
- Reconnaissance de texte
- Extraction d'ingrédients
- Parsing de nutrition

### 💳 `marketplacePayment.js`
Paiements sur la marketplace
- Transactions
- Gestion orders
- Refunds

### 🥗 `nutritionCalculator.js`
Calculs nutritionnels
- Besoins énergétiques
- Ratios macronutriments
- Plans alimentaires

**Exports clés:**
```javascript
export const ACTIVITY_LEVELS = { ... }
export const PHYSIOLOGICAL_STATES = { ... }
export const calculateNutrition = (...) => { ... }
```

### 🔐 `permissions.js`
Système de permission et gestion de plans
- Vérification d'accès aux features
- Gestion des plans (Free, Pro, Elite)
- Whitelist testers

**Fonctions principales:**
```javascript
export const canAccess = (feature) => bool
export const getMaxHorses = () => number
export const isWhitelistedTester = (email) => bool
export const getPlanName = () => string
```

### 💰 `stripePayment.js`
Intégration Stripe
- Checkout
- Subscription management
- Portal client

**Fonctions principales:**
```javascript
export const startCheckoutSession = async (priceId) => void
export const changeSubscriptionPlan = async (newPriceId) => void
export const redirectToCustomerPortal = async () => void
```

### ⚖️ `weightEstimation.js`
Estimation du poids des chevaux
- Calculs à partir de photos
- Morphotypes
- Body Condition Score

**Exports clés:**
```javascript
export const MORPHOTYPES = { ... }
export const estimateWeightFromPhoto = async (image) => number
export const calculateWeight = (measurements) => number
```

### 🧪 `test_*.js` (À déplacer)
Tests en local (À migrer dans `__tests__/`)
- `test_ai_coach_examples.js`
- `test_galop_examples.js`
- `test_trot_examples.js`

## Imports

```javascript
// ✅ Recommended (via index.js)
import { 
  canAccess, 
  calculateNutrition,
  estimateWeightFromPhoto 
} from '@/utils';

// ❌ Direct (toujours possible)
import { canAccess } from '@/utils/permissions';
```

## Ajouter un Util

1. Créer `src/utils/monUtil.js`
2. Exporter functions/constants
3. Ajouter à `src/utils/index.js`

```javascript
// src/utils/index.js
export * from './monUtil.js';
```

## Pattern de Développement

### Fonction Pure
```javascript
// utils/math.js
export const add = (a, b) => a + b;
export const multiply = (a, b) => a * b;
```

### Classe Utilitaire
```javascript
// utils/cache.js
export class CacheManager {
  constructor() {
    this.cache = new Map();
  }
  
  set(key, value) { ... }
  get(key) { ... }
  clear() { ... }
}
```

### Async Helper
```javascript
// utils/api.js
export const apiCall = async (url) => {
  try {
    const response = await fetch(url);
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

## Notes
- ✅ Fonctions PURES (pas de side effects)
- ✅ Réutilisables dans toute l'app
- ⚠️ Ne pas importer les pages
- ✅ Peuvent importer services
- ⚠️ Minimiser les dépendances externes
