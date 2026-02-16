# 🎯 Code Style & Organization Guide

## Résumé Rapide de la Structure AppHorse

### 📂 Arborescence (Simplifiée)
```
src/
├── pages/              # Pages de l'app (Dashboard, Horses, etc.)
├── components/         # Composants réutilisables
│   ├── common/        # Boutons, Cards, génériques
│   ├── features/      # AdBanner, Notifications, métier
│   ├── camera/        # Composants caméra
│   └── scanner/       # Scanners avancés
├── services/          # Logique métier (IA, Nutrition, etc.)
├── context/           # État global (Auth, Theme, PWA)
├── hooks/             # Custom React hooks
├── utils/             # Fonctions utilitaires et helpers
├── constants/         # Constantes globales
├── layouts/           # Layouts principaux
├── locales/           # Traductions (FR/EN)
├── assets/            # Images et ressources
├── firebase.js        # Configuration Firebase
├── i18n.js            # Configuration i18n
├── App.jsx            # Routeur principal
└── main.jsx           # Entrée application
```

---

## 🔌 Patterns d'Import (À Utiliser Maintenant)

### Import depuis Context
```javascript
import { useAuth, ThemeProvider, PWAProvider } from '@/context';
```

### Import depuis Hooks
```javascript
import { useDeviceOrientation, useServiceWorker } from '@/hooks';
```

### Import depuis Services
```javascript
import { aiNutritionService, barymetricService } from '@/services';
```

### Import depuis Utils
```javascript
import { canAccess, getMaxHorses, calculateNutrition } from '@/utils';
```

### Import depuis Components
```javascript
// Common (generic)
import { Button, Card } from '@/components/common';

// Features (business logic)
import { NotificationManager, AdBanner } from '@/components/features';

// Camera (specialized)
import { WeightCamera, LabelScanner } from '@/components/camera';
```

### Import depuis Pages
```javascript
import { Dashboard, Calendar, Support } from '@/pages';
import { Horses, HorseProfile, Nutrition } from '@/pages/horse';
import { Team, Billing } from '@/pages/management';
```

---

## 💡 Conventions

### Fichiers
- **Pages:** `PascalCase.jsx` (Dashboard.jsx)
- **Components:** `PascalCase.jsx` (Button.jsx)
- **Services:** `camelCase.js` (geminiService.js)
- **Hooks:** `useXxx.js` (useAuth.js)
- **Utils:** `camelCase.js` (permissions.js)

### Nommage
- **Classes/Composants:** `PascalCase` (MyComponent)
- **Fonctions/Variables:** `camelCase` (myFunction)
- **Constants:** `UPPER_SNAKE_CASE` (API_KEY)
- **Types/Interfaces:** `PascalCase` (IUser)

### Organisation Fichiers
```
// ✅ Bon
src/
├── monDomaine/
│   ├── Component.jsx
│   ├── hooks.js
│   ├── service.js
│   └── index.js (exporte tout)

// ❌ Mauvais
src/
├── Component.jsx
├── hooks.js
├── service.js
├── utils.js
```

---

## 🎨 Styling

### Utiliser Tailwind (Recommandé)
```jsx
// ✅ Good
function Button({ children }) {
  return (
    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
      {children}
    </button>
  );
}
```

### Éviter CSS Séparé
```jsx
// ❌ Avoid
// Button.jsx
import './Button.css';

// Button.css
.button { padding: 8px 16px; ... }
```

---

## 🔄 Flux de Données Recommandé

```
Pages
  ↓
Components → Hooks
  ↓         ↓
Context ← Services
            ↓
         Firebase
```

### Jamais
- ❌ Pages → Pages directement
- ❌ Services → Pages
- ❌ Components → Firebase directement
- ❌ Dépendances circulaires

---

## 🔐 Permissions & Plans

Les permissions sont gérées via `@/utils/permissions.js`:

```javascript
import { canAccess, getMaxHorses, getPlanName } from '@/utils';

// Vérifier accès à une feature
if (canAccess('nutrition')) {
  // Afficher nutrition feature
}

// Récupérer limites du plan
const maxHorses = getMaxHorses();

// Récupérer nom du plan
const planName = getPlanName(); // "Free", "Pro", "Elite"
```

---

## 🌐 Internationalisation

### Utiliser i18next
```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('home.title')}</h1>;
}
```

### Fichiers de traduction
```
locales/
├── en/
│   └── translation.json
└── fr/
    └── translation.json
```

---

## 🎯 Bonnes Pratiques

### State Management
```javascript
// ✅ Local state avec useState
const [isOpen, setIsOpen] = useState(false);

// ✅ Global state avec Context
const { user } = useAuth();

// ✅ Side effects avec useEffect
useEffect(() => {
  // Faire quelquechose
}, [dependencies]);
```

### Error Handling
```javascript
// ✅ Gérer les erreurs
try {
  await firebaseCall();
} catch (error) {
  console.error('Error:', error);
  // Afficher message à l'utilisateur
}

// ✅ Utiliser ErrorBoundary (main.jsx)
// Il est déjà implémenté
```

### Performance
```javascript
// ✅ Mémoïzer les valeurs complexes
const user = useMemo(() => ({ ...data }), [data]);

// ✅ Mémoïzer les callbacks
const handleClick = useCallback(() => { ... }, [deps]);

// ✅ Lazy loading des routes
const Dashboard = lazy(() => import('@/pages/Dashboard'));
```

---

## 🚀 Ajouter une Nouvelle Feature

### 1. Créer le Service
```javascript
// src/services/myFeatureService.js
export const myFeatureFunction = async () => { ... };
export class MyFeatureClass { ... }
```

### 2. Créer le Hook (si état)
```javascript
// src/hooks/useMyFeature.js
import { useState } from 'react';

export function useMyFeature() {
  const [state, setState] = useState();
  return { state, setState };
}
```

### 3. Créer le Composant
```javascript
// src/components/features/MyFeature.jsx
import { useMyFeature } from '@/hooks';
import { myFeatureFunction } from '@/services';

function MyFeature() {
  const { state } = useMyFeature();
  // ...
  return <div>...</div>;
}

export default MyFeature;
```

### 4. Exporter dans index.js
```javascript
// src/services/index.js
export * from './myFeatureService.js';

// src/hooks/index.js
export { useMyFeature } from './useMyFeature.js';

// src/components/features/index.js
export { default as MyFeature } from './MyFeature';
```

### 5. Utiliser dans la Page
```javascript
// src/pages/MyPage.jsx
import { MyFeature } from '@/components/features';

function MyPage() {
  return <MyFeature />;
}
```

---

## 🔍 Debugging

### Logging Recommandé
```javascript
// ✅ Development
console.log('[DEBUG]', message, data);

// ✅ Warnings
console.warn('[⚠️]', message);

// ✅ Errors
console.error('[ERROR]', message, error);
```

### Éviter
```javascript
// ❌ Avoid
console.log('test');
console.log(data);
```

---

## 📦 Dépendances Importantes

| Package | Usage |
|---------|-------|
| `react` | Framework |
| `react-router-dom` | Navigation |
| `firebase` | Backend |
| `tailwindcss` | Styling |
| `i18next` | Traductions |
| `@tensorflow/*` | ML |
| `tesseract.js` | OCR |

---

## 🧪 Tests (Futur)

Les tests doivent être dans `__tests__/`:

```javascript
// __tests__/permissions.test.js
import { canAccess } from '@/utils';

describe('permissions', () => {
  it('should check access', () => {
    expect(canAccess('nutrition')).toBeDefined();
  });
});
```

Actuellement les tests utilitaires sont dans `src/utils/test_*.js` (À déplacer).

---

## 🎓 Quelques Concepts Clés

### Context API
Gère l'état global (utilisateur, thème):
```javascript
const { user, logout } = useAuth();
```

### Custom Hooks
Logique réutilisable entre composants:
```javascript
const { orientation } = useDeviceOrientation();
```

### Services
Logique métier externalisée:
```javascript
const nutrition = await aiNutritionService.calculate();
```

### Utils
Fonctions pures et helpers:
```javascript
const weight = calculateWeight(measurements);
```

---

## 📚 Lire Aussi

- [ANALYSE_STRUCTURE_CODE.md](./ANALYSE_STRUCTURE_CODE.md) - Détails complets
- [GUIDE_MIGRATION.md](./GUIDE_MIGRATION.md) - Migration des imports
- [src/services/README.md](./src/services/README.md) - Guide Services
- [src/context/README.md](./src/context/README.md) - Guide Context
- [src/hooks/README.md](./src/hooks/README.md) - Guide Hooks
- [src/utils/README.md](./src/utils/README.md) - Guide Utils
- [src/components/README.md](./src/components/README.md) - Guide Components

---

**Dernière mise à jour:** 16 février 2026  
**Version:** 1.3.0
