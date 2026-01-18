# 🔄 Système de Mise à Jour PWA - Equinox

## 📋 Vue d'ensemble

Ce système permet à votre application **Equinox** de détecter automatiquement les nouvelles versions déployées sur Vercel et de proposer une mise à jour élégante à vos utilisateurs via une notification toast.

---

## ✨ Fonctionnalités

✅ **Détection automatique** des nouvelles versions (vérification toutes les heures)  
✅ **Notification élégante** en bas de l'écran avec design moderne  
✅ **Mise à jour en un clic** avec rechargement automatique  
✅ **Compatible mobile** (iOS Safari & Android Chrome)  
✅ **Cache intelligent** pour Firebase, images, fonts et API  
✅ **Mode hors ligne** activé automatiquement  
✅ **Aucun impact en développement** (désactivé sur localhost)

---

## 🎯 Comportement utilisateur

### Scénario type :

1. **Installation PWA** : L'utilisateur installe Equinox sur son téléphone
2. **Utilisation normale** : Le Service Worker tourne en arrière-plan
3. **Vous déployez** : Une nouvelle version est poussée sur Vercel
4. **Détection** : Automatique dans l'heure qui suit (ou au prochain rechargement)
5. **Notification** : Un toast apparaît en bas :
   ```
   ╔═══════════════════════════════════════════════════╗
   ║ 🔄  Nouvelle version disponible                   ║
   ║     Cliquez pour mettre à jour l'application      ║
   ║                               [Recharger]  [X]    ║
   ╚═══════════════════════════════════════════════════╝
   ```
6. **Action** :
   - **Recharger** → L'app se met à jour instantanément
   - **Ignorer (X)** → Le toast disparaît, l'utilisateur reste sur l'ancienne version

---

## 📁 Architecture des fichiers

### Fichiers principaux

| Fichier | Rôle |
|---------|------|
| `src/hooks/useServiceWorker.js` | Hook React gérant le Service Worker |
| `src/components/UpdateNotification.jsx` | Composant Toast de notification |
| `vite.config.js` | Configuration PWA avec vite-plugin-pwa |
| `src/App.jsx` | Intégration globale du système |

### Documentation

| Fichier | Contenu |
|---------|---------|
| `PWA_UPDATE_SYSTEM.md` | Documentation technique complète |
| `DEPLOYMENT_PWA.md` | Guide de déploiement sur Vercel |
| `PWA_CUSTOMIZATION_EXAMPLES.js` | Exemples de personnalisation |
| `PWA_IMPLEMENTATION_SUMMARY.txt` | Résumé visuel de l'implémentation |

---

## 🚀 Déploiement

### Étapes rapides

```bash
# 1. Build et test en local
npm run build
npm run preview

# 2. Déployer sur Vercel
git add .
git commit -m "feat: Système de mise à jour PWA"
git push origin main

# 3. Vérifier le déploiement
# Visitez votre site → DevTools → Application → Service Workers
```

### Vérification

Après déploiement, dans Chrome DevTools :
1. Onglet **Application**
2. Section **Service Workers**
3. Vérifiez que le SW est **activé** ✅

---

## 🎨 Personnalisation

### Changer la fréquence de vérification

**Fichier** : `src/hooks/useServiceWorker.js` (ligne ~42)

```javascript
// Par défaut : 1 heure
setInterval(() => {
  registration.update();
}, 60 * 60 * 1000);

// Exemple : toutes les 30 minutes
setInterval(() => {
  registration.update();
}, 30 * 60 * 1000);
```

### Modifier l'apparence du toast

**Fichier** : `src/components/UpdateNotification.jsx`

```javascript
// Position : remplacer "bottom-6" par "top-6"
<div className="fixed top-6 left-1/2 ...">

// Couleur : remplacer "violet-600" par "blue-600"
<div className="bg-gradient-to-r from-blue-600 to-cyan-600 ...">
```

### Changer les stratégies de cache

**Fichier** : `vite.config.js`

```javascript
// Exemple : cache images pendant 90 jours
{
  urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
  handler: 'CacheFirst',
  options: {
    cacheName: 'images-cache',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24 * 90 // 90 jours
    }
  }
}
```

Plus d'exemples dans `PWA_CUSTOMIZATION_EXAMPLES.js`

---

## 🧪 Test en production

### Simulation rapide

1. **Déployez** la version actuelle sur Vercel
2. **Modifiez** quelque chose (ex: une couleur, un texte)
3. **Re-déployez** sur Vercel
4. **Attendez** ~1h OU rechargez la page
5. **Résultat** : Le toast devrait apparaître ! 🎉

### Simulation immédiate (DevTools)

1. Chrome DevTools → **Application** → **Service Workers**
2. Cochez **"Update on reload"**
3. Modifiez le code et re-déployez
4. Rechargez → Le toast apparaît immédiatement

---

## 📱 Test sur mobile

### iOS (Safari)

1. Visitez `votre-site.vercel.app`
2. Icône **Partager** → **"Sur l'écran d'accueil"**
3. Ouvrez l'app depuis l'écran d'accueil
4. Déployez une mise à jour
5. La notification apparaît dans l'heure

### Android (Chrome)

1. Visitez `votre-site.vercel.app`
2. Menu → **"Ajouter à l'écran d'accueil"**
3. Ouvrez l'app
4. Déployez une mise à jour
5. La notification apparaît automatiquement

---

## 🐛 Dépannage

### Le toast n'apparaît pas

**Causes possibles :**
- Pas en production (localhost ne fonctionne pas)
- Délai d'1h non écoulé
- Pas de nouvelle version détectée

**Solutions :**
- Vérifier que vous êtes sur Vercel (HTTPS)
- Forcer l'update : DevTools → Application → SW → "Update"
- Vérifier la console pour les logs

### Le Service Worker ne s'enregistre pas

**Causes possibles :**
- Site non HTTPS
- Cache navigateur
- Erreur de build

**Solutions :**
- Vider le cache : DevTools → Application → "Clear storage"
- Vérifier la console pour erreurs
- Re-build : `npm run build`

### Erreur "Module not found: virtual:pwa-register"

**Cause :** En mode développement, le module PWA n'est pas chargé

**Solution :** C'est normal ! Le SW est désactivé en dev. Le message console confirme :
```
⚠️ Service Worker désactivé en mode développement
```

---

## 📊 Logs console

### En développement (localhost)

```javascript
⚠️ Service Worker désactivé en mode développement
```

### En production (Vercel)

```javascript
✅ Service Worker enregistré: /sw.js
🔍 Vérification des mises à jour...       // Toutes les heures
🔄 Nouvelle version disponible            // Quand mise à jour détectée
✅ Application prête pour le mode hors ligne
```

---

## ⚙️ Configuration cache

| Type | Stratégie | Durée | Priorité |
|------|-----------|-------|----------|
| Firebase Storage | CacheFirst | 30 jours | Images hébergées |
| Images locales | CacheFirst | 30 jours | Assets |
| Google Fonts | CacheFirst | 1 an | Typographie |
| Firestore API | NetworkFirst | 1 jour | Données dynamiques |
| HTML/CSS/JS | CacheFirst | Based on build | Application |

---

## 📚 Ressources

- **Documentation technique** : Voir `PWA_UPDATE_SYSTEM.md`
- **Guide de déploiement** : Voir `DEPLOYMENT_PWA.md`
- **Exemples de code** : Voir `PWA_CUSTOMIZATION_EXAMPLES.js`
- **vite-plugin-pwa** : https://vite-pwa-org.netlify.app/
- **Workbox** : https://developer.chrome.com/docs/workbox/

---

## 🎉 Résumé

Ce système garantit que vos utilisateurs bénéficient toujours de la dernière version d'Equinox, **avec leur consentement**, tout en offrant :
- ✅ Expérience utilisateur fluide
- ✅ Contrôle total sur le moment de la mise à jour
- ✅ Notifications non-intrusives
- ✅ Performance optimale (cache intelligent)
- ✅ Mode hors ligne automatique

**Prêt pour le déploiement ! 🚀**

---

## 🆘 Support

Pour toute question ou problème :
1. Consultez la documentation dans `/PWA_*.md`
2. Vérifiez les logs console
3. Testez d'abord en local avec `npm run build && npm run preview`

---

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2026  
**Compatibilité** : Chrome 90+, Safari 14+, Edge 90+, Firefox 88+
