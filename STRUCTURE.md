# Structure des Dossiers - AppHorse

## 📁 Nouvelle Organisation

### ✅ Réorganisation Complétée le 21/01/2026

L'application a été réorganisée pour améliorer la maintenabilité et la clarté du code.

## Structure Actuelle

```
src/
├── components/
│   ├── common/              # Composants réutilisables de base
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── LanguageSwitcher.jsx
│   │   ├── LanguageSwitcher.css
│   │   ├── SEO.jsx
│   │   └── index.js        # Point d'export
│   │
│   ├── camera/              # Composants liés à la caméra/scan
│   │   ├── WeightCamera.jsx
│   │   ├── LabelScanner.jsx
│   │   └── index.js
│   │
│   ├── pwa/                 # Composants PWA
│   │   ├── PWAPrompt.jsx
│   │   ├── InstallAppCard.jsx
│   │   ├── UpdateNotification.jsx
│   │   └── index.js
│   │
│   └── features/            # Composants spécifiques
│       ├── AdBanner.jsx
│       ├── CallInterface.jsx
│       ├── NotificationManager.jsx
│       └── index.js
│
├── pages/
│   ├── auth/                # Pages d'authentification
│   │   ├── Login.jsx
│   │   ├── LoginCode.jsx
│   │   ├── Register.jsx
│   │   ├── SignUp.jsx
│   │   ├── Onboarding.jsx
│   │   └── index.js
│   │
│   ├── horse/               # Pages liées aux chevaux
│   │   ├── Horses.jsx
│   │   ├── HorseProfile.jsx
│   │   ├── WeightTracking.jsx
│   │   ├── Nutrition.jsx
│   │   ├── NutritionCalculator.jsx
│   │   ├── Care.jsx
│   │   ├── Breeding.jsx
│   │   ├── BreedingDetail.jsx
│   │   ├── BreedingAdvice.jsx
│   │   ├── MediaGallery.jsx
│   │   └── index.js
│   │
│   ├── management/          # Pages de gestion professionnelle
│   │   ├── Clients.jsx
│   │   ├── ClientsManagement.jsx
│   │   ├── Team.jsx
│   │   ├── Billing.jsx
│   │   ├── Budget.jsx
│   │   ├── Stock.jsx
│   │   └── index.js
│   │
│   ├── profile/             # Pages de profil et paramètres
│   │   ├── Settings.jsx
│   │   ├── Profile.jsx
│   │   ├── SwitchAccount.jsx
│   │   └── index.js
│   │
│   └── [autres pages]       # Pages racine non catégorisées
│       ├── Dashboard.jsx
│       ├── LandingPage.jsx
│       ├── Calendar.jsx
│       ├── Messaging.jsx
│       ├── etc...
│
├── hooks/                   # Custom React hooks
├── services/                # Services API
├── context/                 # React Contexts
├── utils/                   # Fonctions utilitaires
├── layouts/                 # Layouts de l'application
└── locales/                 # Fichiers de traduction
```

## 📦 Imports Simplifiés

### Avant (imports directs)
```javascript
import Button from './components/Button';
import Card from './components/Card';
import WeightCamera from './components/WeightCamera';
```

### Après (imports groupés)
```javascript
import { Button, Card } from './components/common';
import { WeightCamera } from './components/camera';
import { PWAPrompt } from './components/pwa';
```

## 🎯 Avantages

1. **Meilleure Organisation** : Fichiers groupés par fonctionnalité
2. **Plus Maintenable** : Facile de trouver et modifier des fichiers
3. **Imports Propres** : Moins de lignes d'import, plus lisible
4. **Scalabilité** : Estructura prête pour l'ajout de nouvelles features
5. **Séparation des Responsabilités** : Chaque dossier a un rôle clair

## ✅ Fichiers Modifiés

- `src/App.jsx` - Imports mis à jour
- `src/pages/horse/WeightTracking.jsx` - Imports corrigés
- Tous les fichiers d'index créés pour les exports

## 🚀 Fonctionnalité

✅ L'application fonctionne normalement
✅ Tous les imports sont corrects
✅ Aucune régression fonctionnelle
✅ Dev server démarre sans erreur
