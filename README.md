# 🐴 Equinox - AppHorse

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-7.3-646cff.svg)

**Équinox** est une application web intelligente de gestion équestre avec IA intégrée.

## ✨ Fonctionnalités

### 🎯 Modules Principaux

- 📊 **Gestion Multi-Chevaux** : Profils complets, pedigree, historique médical
- ⚖️ **Pesée par Photo (IA)** : Estimation du poids via TensorFlow.js (COCO-SSD)
- 🥕 **Calculateur de Rations INRA** : Calcul scientifique des besoins nutritionnels
- 📸 **Scanner OCR d'Étiquettes** : Extraction automatique des valeurs nutritionnelles (Tesseract.js)
- 📅 **Planning & Calendrier** : Gestion des événements et soins
- 💰 **Suivi Financier** : Budget, facturation (Stripe Connect)
- 👥 **Gestion d'Équipe** : Multi-utilisateurs avec permissions
- 🏆 **Compétitions** : Suivi des performances
- 🐎 **Élevage** : Gestion des saillies et poulains

### 🤖 Intelligence Artificielle

1. **Pesée par Photo**
   - Détection automatique du cheval (COCO-SSD)
   - Calcul morphométrique (Algorithme Crevat/Carroll)
   - Précision : ±10-15%

2. **OCR Label Scanner**
   - Reconnaissance de texte (Tesseract.js)
   - Parsing intelligent des valeurs nutritionnelles
   - Estimation UFC/MADC (fallback INRA)

### 🔬 Scientifiquement Validé

- **Normes INRA** : Calculs nutritionnels basés sur les standards de l'Institut National de Recherche Agronomique
- **Formules vétérinaires** : Algorithmes validés par des professionnels équins

## 🚀 Technologies

- **Frontend** : React 18.3 + Vite 7.3
- **Routing** : React Router 7
- **UI/UX** : Lucide Icons, Custom Components
- **IA** : TensorFlow.js, Tesseract.js
- **Charts** : Recharts
- **State Management** : React Hooks
- **Storage** : LocalStorage (migration Firestore prévue)
- **Payments** : Stripe Connect
- **i18n** : i18next (FR/EN)

## 📦 Installation

### Prérequis

- Node.js 18+ 
- npm ou yarn

### Installation Locale

```bash
# Cloner le repo
git clone https://github.com/VOTRE_USERNAME/apphorse.git
cd apphorse

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 🏗️ Build de Production

```bash
# Build
npm run build

# Preview du build
npm run preview
```

## 🌐 Déploiement

L'application est déployée automatiquement sur Vercel via CI/CD.

**URL Production** : https://equinox-apphorse.vercel.app

Chaque push sur `main` déclenche un déploiement automatique.

## 📂 Structure du Projet

```
AppHorse/
├── src/
│   ├── components/       # Composants réutilisables
│   ├── pages/           # Pages de l'application
│   ├── utils/           # Utilitaires (OCR, IA, calculs)
│   ├── context/         # Context API (Auth, Theme)
│   ├── layouts/         # Layouts (MainLayout)
│   └── locales/         # Traductions i18n
├── public/              # Assets statiques
├── docs/                # Documentation technique
└── dist/                # Build de production
```

## 🧪 Modules Principaux

### 1. Weight Estimation (AI)
- `src/utils/weightEstimation.js` : Algorithme morphométrique
- `src/utils/imageAnalyzer.js` : TensorFlow.js (détection)
- `src/components/WeightCamera.jsx` : Interface capture

### 2. Nutrition Calculator (INRA)
- `src/utils/nutritionCalculator.js` : Calculs UFC/MADC
- `src/pages/NutritionCalculator.jsx` : Interface calculateur

### 3. OCR Label Scanner
- `src/utils/labelOCR.js` : Tesseract.js + parsing
- `src/components/LabelScanner.jsx` : Interface scan

## 📊 Performances

- **Lighthouse Score** : 95+ (après optimisation)
- **Bundle Size** : ~2.5 MB (avec code splitting)
- **Temps de chargement** : < 2s (3G rapide)
- **PWA Ready** : Installable sur mobile

## 🗺️ Roadmap

- [ ] **Phase 2 OCR** : Web Search enrichissement
- [ ] **Phase 3** : Migration Firestore (sync cloud)
- [ ] **Phase 4** : Application mobile native (React Native)
- [ ] **Phase 5** : Marketplace aliments (crowdsourcing)
- [ ] **Phase 6** : ML avancé (prédiction besoins)

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 License

Ce projet est sous licence MIT. Voir `LICENSE` pour plus de détails.

## 👨‍💻 Auteur

**Équipe AppHorse**

- 🌐 Site : [equinox-apphorse.vercel.app](https://equinox-apphorse.vercel.app)
- 📧 Contact : contact@apphorse.com

## 🙏 Remerciements

- **INRA** : Standards nutritionnels équins
- **TensorFlow.js** : Framework ML
- **Tesseract.js** : OCR open-source
- **Vercel** : Hébergement & CI/CD
- **React Team** : Framework extraordinaire

---

**Made with ❤️ for horses** 🐴
