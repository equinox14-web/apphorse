# 📚 Services - Documentation

## Vue d'ensemble
Le dossier `services/` contient la logique métier externalisée et réutilisable de l'application.

## Services Disponibles

### 🤖 `aiNutritionService.js`
Calculs et recommandations nutrition IA-driven
- Analyse des besoins nutritionnels
- Génération de plans alimentaires
- Optimisation des rations

### 📊 `barymetricService.js`
Analyse morphométrique des chevaux
- Calculs de mesures
- Analyse du poids et morphologie
- Estimation basée sur dimensions

### 🔄 `dataSyncService.js`
Synchronisation des données avec Firestore
- Stockage/récupération
- Gestion des mises à jour
- Cache local

### 🔥 `firestoreSync.js`
Intégration Firestore avancée
- Synchronisation RTK
- Listeners
- Batch operations

### 🎨 `geminiService.js`
Intégration Google Generative AI (Gemini)
- Analyse de texte
- Génération de recommandations
- Analyse de documents

## Imports

```javascript
// ✅ Recommended (via index.js)
import { aiNutritionService, barymetricService } from '@/services';

// ❌ Direct (toujours possible)
import { aiNutritionService } from '@/services/aiNutritionService';
```

## Patterns

### Service Pattern
Chaque service exporte des fonctions/classes réutilisables:

```javascript
// service.js
export const serviceFunction = async () => { ... };
export class ServiceClass { ... }

// Usage
import { serviceFunction, ServiceClass } from '@/services';
```

## Ajouter un Nouveau Service

1. Créer `src/services/monService.js`
2. Exporter les functions/classes
3. Ajouter l'export dans `src/services/index.js`

```javascript
// src/services/index.js
export * from './monService.js';
```

## Notes
- ⚠️ Les services ne doivent pas importer les pages
- ✅ Les services peuvent importer d'autres services
- ✅ Les services peuvent utiliser Firebase
- ⚠️ Minimiser les dépendances externes
