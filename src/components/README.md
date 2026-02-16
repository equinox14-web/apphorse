# 🧩 Components - Documentation

## Vue d'ensemble
Le dossier `components/` contient les composants React réutilisables de l'application, organisés par type et niveau de réutilisabilité.

## Structure des Dossiers

### 📦 `common/` - Composants Génériques
Éléments visuels basiques réutilisables partout.

**Composants:**
- `Button.jsx` - Boutons stylisés
- `Card.jsx` - Cartes/conteneurs
- `LanguageSwitcher.jsx` - Switch langue FR/EN
- `SEO.jsx` - Gestion des meta tags

**Caractéristiques:**
- Sans logique métier
- Très réutilisables
- Props configurables
- Export centralisé via `index.js`

**Usage:**
```javascript
import { Button, Card } from '@/components/common';

function MyComponent() {
  return (
    <Card>
      <Button variant="primary">Click me</Button>
    </Card>
  );
}
```

### ⚡ `features/` - Composants Métier
Fonctionnalités spécialisées et features complexes.

**Composants:**
- `AdBanner.jsx` - Bannière publicitaire
- `CallInterface.jsx` - Interface d'appel
- `DemoModeWarning.jsx` - Avertissement démo
- `NotificationManager.jsx` - Gestion notifications
- `TrialModeWarning.jsx` - Avertissement trial

**Caractéristiques:**
- Logique métier intégrée
- Dépendances sur Context/Services
- Réutilisables mais spécifiques
- Export centralisé via `index.js`

**Usage:**
```javascript
import { NotificationManager, AdBanner } from '@/components/features';

function Dashboard() {
  return (
    <>
      <NotificationManager />
      <AdBanner />
    </>
  );
}
```

### 📷 `camera/` - Composants Caméra
Traitement caméra et vision par ordinateur.

**Composants:**
- `WeightCamera.jsx` - Capture pour estimation poids
- `LabelScanner.jsx` - Scanner étiquettes alimentaires
- `BarometricCamera.jsx` - Capture mesures morphométriques

**Caractéristiques:**
- Accès caméra/permissions
- ML models (TensorFlow)
- Device orientation awareness
- Export centralisé via `index.js`

**Usage:**
```javascript
import { WeightCamera } from '@/components/camera';

function WeightTracking() {
  return <WeightCamera onWeightEstimated={handleWeight} />;
}
```

### 📱 `scanner/` - Scanners Avancés
Analyse avancée de documents et forage.

**Composants:**
- `ForageAnalysisScanner.jsx` - Analyse nutrition fourrage

**Caractéristiques:**
- Analyse ML complète
- Données détaillées
- Recognition avancée

### 📲 `pwa/` - Composants PWA
Features de Progressive Web App.

**À explorer et documenter**

## Patterns

### Pattern Composant Simple
```javascript
// components/common/MonComposant.jsx
function MonComposant({ title, children, ...props }) {
  return (
    <div {...props}>
      <h1>{title}</h1>
      {children}
    </div>
  );
}

export default MonComposant;
```

### Pattern avec Logique
```javascript
// components/features/MonFeature.jsx
import { useState } from 'react';

function MonFeature() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        Toggle
      </button>
      {isOpen && <div>Content</div>}
    </div>
  );
}

export default MonFeature;
```

## Imports

```javascript
// ✅ Recommended (via index.js)
import { Button, Card } from '@/components/common';
import { NotificationManager } from '@/components/features';
import { WeightCamera } from '@/components/camera';

// ❌ Direct (toujours possible)
import Button from '@/components/common/Button';
```

## Ajouter un Composant

1. Créer le fichier ou dossier approprié
2. Créer le composant avec props claires
3. Ajouter à `index.js` du dossier parent

### Exemple: Nouveau composant common
```javascript
// components/common/Avatar.jsx
function Avatar({ src, alt, size = 'md' }) {
  const sizeClass = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }[size];
  
  return <img src={src} alt={alt} className={sizeClass} />;
}

export default Avatar;
```

```javascript
// components/common/index.js
export { default as Avatar } from './Avatar';
// ... autres exports
```

## Conventions

- ✅ **Naming:** PascalCase (MyComponent)
- ✅ **Props:** Cohérent et typé (si possible)
- ✅ **Styles:** Tailwind CSS préféré
- ✅ **Documentation:** JSDoc pour props complexes
- ⚠️ **Logique:** Minimisée (déplacer dans Hooks/Services)

## Notes
- ✅ Composants réutilisables sans logique métier → `common/`
- ✅ Composants with métier logic → `features/`
- ✅ Composants spécialisés (camera, scanner) → Dossier dédié
- ⚠️ Pas de CSS files sauf cas spéciaux
- ✅ Préférer Tailwind pour cohérence
