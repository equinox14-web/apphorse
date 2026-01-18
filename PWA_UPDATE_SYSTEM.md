# Service Worker Update Manager
# Ce fichier explique comment fonctionne le système de mise à jour PWA

## 🎯 Fonctionnement

### 1. Détection de mise à jour
- Le Service Worker vérifie les mises à jour **automatiquement toutes les heures**
- Lorsqu'une nouvelle version est détectée sur Vercel, l'événement `onNeedRefresh` est déclenché

### 2. Notification utilisateur
- Un **Toast élégant** apparaît en bas de l'écran
- Message : "Nouvelle version disponible - Cliquez pour mettre à jour"
- L'utilisateur peut :
  - ✅ **Recharger** immédiatement l'application
  - ❌ **Ignorer** la notification (elle disparaît)

### 3. Mise à jour
- Cliquer sur "Recharger" active le nouveau Service Worker
- L'application se recharge automatiquement avec `window.location.reload()`
- Le cache est vidé et la nouvelle version est installée

## 📂 Fichiers du système

### `src/hooks/useServiceWorker.js`
Hook React qui gère :
- Enregistrement du Service Worker
- Détection des mises à jour (avec vérification horaire)
- Callbacks pour needRefresh/offlineReady

### `src/components/UpdateNotification.jsx`
Composant Toast qui affiche :
- Notification de mise à jour disponible
- Notification de mode hors ligne activé
- Boutons d'action (Recharger / Ignorer)

### `vite.config.js`
Configuration PWA avec :
- `registerType: 'prompt'` → Active le prompt manuel
- `skipWaiting: false` → Attend l'action de l'utilisateur
- Stratégies de cache pour Firebase, images, fonts
- Nettoyage automatique des anciens caches

### `src/App.jsx`
Intégration globale :
- Utilise `useServiceWorker()` hook
- Affiche `<UpdateNotification />` en overlay global

## 🚀 Déploiement

### En local (test impossible)
Le Service Worker ne fonctionne **PAS** en mode développement (`npm run dev`) car :
- Les mises à jour sont désactivées en dev
- Le Service Worker n'est généré qu'au build

### En production (Vercel)
1. Buildez l'application : `npm run build`
2. Déployez sur Vercel
3. Le Service Worker sera généré automatiquement
4. À chaque nouveau déploiement :
   - Les utilisateurs recevront la notification après ~1h maximum
   - Ou immédiatement s'ils rechargent l'onglet

## 🎨 Personnalisation

### Modifier le délai de vérification
Dans `src/hooks/useServiceWorker.js`, ligne ~25 :
```javascript
setInterval(() => {
  registration.update();
}, 60 * 60 * 1000); // Modifier ici (actuellement 1 heure)
```

### Changer le style du Toast
Modifiez `src/components/UpdateNotification.jsx` :
- Couleurs dans les classes Tailwind
- Position avec `top-6` au lieu de `bottom-6`
- Animations dans les styles JSX

## 🔧 Debug

### Console logs
Le système affiche des logs :
- ✅ "Service Worker enregistré"
- 🔍 "Vérification des mises à jour..."
- 🔄 "Nouvelle version disponible"
- ❌ "Erreur d'enregistrement du Service Worker"

### Inspection Chrome
1. Ouvrir DevTools (F12)
2. Onglet "Application"
3. Section "Service Workers"
4. Voir le statut, forcer l'update, unregister

## ⚠️ Important

- Le Service Worker ne fonctionne que sur **HTTPS** (ou localhost)
- Vercel déploie automatiquement en HTTPS ✅
- Les utilisateurs doivent **accepter** la mise à jour
- Le cache est configuré pour 30 jours (images) à 1 an (fonts)
