# 🚀 Guide de Déploiement - AppHorse (Equinox)

## ✅ Pré-requis Complétés

- [x] Build de production testé et fonctionnel
- [x] Fichier `vercel.json` créé
- [x] Application prête pour déploiement

---

## 🌐 Option 1 : Déploiement sur Vercel (RECOMMANDÉ)

### Pourquoi Vercel ?
- ⚡ **Ultra-rapide** : CDN global automatique
- 🆓 **Gratuit** : Plan Hobby illimité pour projets personnels
- 🔄 **CI/CD automatique** : Chaque push = nouveau déploiement
- 🎯 **Zero-config** : Détecte Vite automatiquement
- 📊 **Analytics** : Statistiques de performance incluses

---

### Méthode A : Déploiement via Interface Web (Plus Simple)

#### 1. **Créer un compte Vercel**
- Aller sur [vercel.com](https://vercel.com)
- Cliquer sur "Sign Up"
- Connexion avec GitHub (recommandé) ou email

#### 2. **Uploader le projet GitHub (optionnel mais recommandé)**

**Option 2a : Via GitHub Desktop (si installé)**
```bash
# Initialiser Git
git init
git add .
git commit -m "Initial commit - AppHorse v1.0"

# Créer un repo GitHub et pusher
# (suivre les instructions GitHub Desktop)
```

**Option 2b : Via ligne de commande**
```bash
git init
git add .
git commit -m "Initial commit - AppHorse v1.0"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/apphorse.git
git push -u origin main
```

#### 3. **Importer sur Vercel**
- Sur Vercel Dashboard → "Add New Project"
- "Import Git Repository"
- Sélectionner votre repo GitHub
- Vercel détecte automatiquement Vite ✅
- Cliquer "Deploy"

⏱️ **Durée** : ~2-3 minutes

#### 4. **Accéder à votre application**
URL générée automatiquement :
```
https://apphorse-[random].vercel.app
```

---

### Méthode B : Déploiement via CLI (Plus Rapide)

#### 1. **Installer Vercel CLI**
```bash
npm install -g vercel
```

#### 2. **Login**
```bash
vercel login
```

#### 3. **Déployer**
```bash
# Depuis le dossier AppHorse
vercel

# Ou pour déployer en production directement
vercel --prod
```

**Commandes interactives** :
- Set up and deploy? **Y**
- Which scope? **[votre compte]**
- Link to existing project? **N**
- Project name? **apphorse** (ou autre)
- Directory? **./** (appuyer Entrée)

⏱️ **Durée** : ~1-2 minutes

---

## 🌐 Option 2 : Déploiement sur Netlify

### 1. **Via Interface Web**
- Aller sur [netlify.com](https://netlify.com)
- Sign up avec GitHub
- "Add new site" → "Import from Git"
- Sélectionner le repo
- Build settings :
  ```
  Build command: npm run build
  Publish directory: dist
  ```
- Deploy

### 2. **Via CLI**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

---

## 🔥 Option 3 : Firebase Hosting

### Setup
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

**Configuration** :
- Public directory: `dist`
- Single-page app: **Yes**
- GitHub auto-deploy: **No** (ou Yes si souhaité)

### Déployer
```bash
npm run build
firebase deploy --only hosting
```

---

## 📦 Option 4 : GitHub Pages (Gratuit)

### 1. **Installer gh-pages**
```bash
npm install --save-dev gh-pages
```

### 2. **Modifier package.json**
Ajouter :
```json
{
  "homepage": "https://VOTRE_USERNAME.github.io/apphorse",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

### 3. **Déployer**
```bash
npm run deploy
```

---

## ⚙️ Variables d'Environnement (si nécessaire)

Si vous utilisez des API keys (Stripe, Firebase, etc.) :

### Vercel
```bash
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_STRIPE_KEY
```

### Netlify
- Dashboard → Site Settings → Environment Variables

### Firebase
- Créer `.env.production`
- Ajouter dans Firebase Console

---

## 🎨 Domaine Personnalisé (Optionnel)

### Sur Vercel
1. Dashboard → Settings → Domains
2. Add Domain
3. Suivre les instructions DNS

### Sur Netlify
1. Domain Settings → Add custom domain
2. Configurer DNS

---

## 📊 Post-Déploiement

### Vérifications
- [ ] Toutes les pages chargent correctement
- [ ] Routing fonctionne (pas d'erreur 404)
- [ ] Assets chargent (images, fonts)
- [ ] OCR Tesseract télécharge correctement
- [ ] TensorFlow.js se charge
- [ ] LocalStorage fonctionne

### Optimisations
- [ ] Activer Vercel Analytics
- [ ] Configurer PWA (optionnel)
- [ ] Ajouter favicon personnalisé
- [ ] Configurer SEO meta tags

---

## 🐛 Troubleshooting

### Problème : Page blanche après déploiement
**Solution** : Vérifier la config du routing SPA
```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Problème : Assets 404
**Solution** : Vérifier `base` dans `vite.config.js`
```javascript
export default defineConfig({
  base: '/' // ou '/apphorse/' pour GitHub Pages
})
```

### Problème : "Module not found"
**Solution** : Nettoyer et rebuilder
```bash
rm -rf node_modules dist
npm install
npm run build
```

---

## 📱 PWA (Progressive Web App) - Bonus

Pour rendre l'app installable sur mobile :

### 1. Installer plugin Vite PWA
```bash
npm install vite-plugin-pwa -D
```

### 2. Configurer `vite.config.js`
```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Equinox - AppHorse',
        short_name: 'Equinox',
        description: 'Gestionnaire équestre intelligent',
        theme_color: '#1890ff',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

---

## 🎉 Checklist Finale

- [ ] Build local réussi (`npm run build`)
- [ ] Compte Vercel/Netlify créé
- [ ] Projet déployé
- [ ] URL de production accessible
- [ ] Tests manuels sur la version live
- [ ] Variables d'environnement configurées (si nécessaire)
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] Analytics activé
- [ ] SEO optimisé

---

## 🚀 Commandes Rapides

```bash
# Build local
npm run build

# Preview du build
npm run preview

# Déployer sur Vercel
vercel --prod

# Déployer sur Netlify
netlify deploy --prod

# Déployer sur Firebase
firebase deploy --only hosting
```

---

## 🌟 Recommandation Finale

**Pour un déploiement professionnel et sans souci** :

1. **Vercel** (1er choix) - Performance + Simplicité
2. **Netlify** (alternative) - Très similaire à Vercel
3. **Firebase Hosting** (si déjà sur Firebase)

**URL finale** : `https://equinox-apphorse.vercel.app` (ou votre domaine)

---

## 📞 Support

En cas de problème :
- Vercel Docs : https://vercel.com/docs
- Netlify Docs : https://docs.netlify.com
- Firebase Docs : https://firebase.google.com/docs/hosting

---

**Temps estimé total : 10-15 minutes** ⏱️

**Bonne chance avec votre déploiement ! 🐴✨**
