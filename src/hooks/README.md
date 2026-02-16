# 🎣 Hooks - Documentation

## Vue d'ensemble
Le dossier `hooks/` contient les custom React Hooks réutilisables pour la logique de composant.

## Hooks Disponibles

### 📱 `useDeviceOrientation.js`
Détecte l'orientation du périphérique
- Portrait/Landscape
- Orientation change events
- Calibration pour caméra

**Utilisé par:**
- BarometricCamera
- WeightCamera

### 🔔 `useServiceWorker.js`
Gestion du Service Worker et PWA
- Registration
- Update notifications
- Offline detection

**Utilisé par:**
- PWAContext
- App principale

### 🏋️ `useTrainingAI.js`
Hook pour l'IA d'entraînement
- Plans d'entraînement personnalisés
- Recommandations IA
- Analyse de performance

**Utilisé par:**
- AITrainingCoach.jsx
- Dashboard.jsx

## Imports

```javascript
// ✅ Recommended (via index.js)
import { useDeviceOrientation, useServiceWorker } from '@/hooks';

// ❌ Direct (toujours possible)
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
```

## Hook Pattern

```javascript
// src/hooks/useCustomHook.js
import { useState } from 'react';

export function useCustomHook(initialValue) {
  const [state, setState] = useState(initialValue);
  
  return { state, setState };
}

// Usage
import { useCustomHook } from '@/hooks';

function MyComponent() {
  const { state, setState } = useCustomHook('initial');
  // ...
}
```

## Ajouter un Nouveau Hook

1. Créer `src/hooks/useMonHook.js`
2. Exporter avec le pattern `use*`
3. Ajouter l'export dans `src/hooks/index.js`

```javascript
// src/hooks/index.js
export { useMonHook } from './useMonHook.js';
```

## Notes
- ✅ Hooks doivent utiliser les rules of hooks (React)
- ✅ Hooks peuvent appeler des services
- ✅ Hooks peuvent utiliser Context
- ⚠️ Ne pas créer dépendances circulaires
