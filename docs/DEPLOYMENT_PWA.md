# Guide de Déploiement - Système de Mise à Jour PWA

## 🚀 Déploiement sur Vercel

### Étapes de déploiement

1. **Build local (test)**
   ```bash
   npm run build
   npm run preview
   ```
   Visitez `http://localhost:4173` pour tester le build en local

2. **Push vers Git**
   ```bash
   git add .
   git commit -m "feat: Ajout système mise à jour automatique PWA"
   git push origin main
   ```

3. **Déploiement automatique Vercel**
   - Vercel détecte automatiquement le push
   - Le build est lancé avec `npm run build`
   - Le Service Worker est généré automatiquement
   - Le déploiement est en HTTPS (requis pour PWA)

## ✅ Vérification Post-Déploiement

### 1. Inspection du Service Worker

Après le déploiement, visitez votre site et :

1. Ouvrez Chrome DevTools (F12)
2. Allez dans l'onglet **Application**
3. Section **Service Workers** (panneau de gauche)
4. Vérifiez que le SW est **activé** et **en cours d'exécution**

### 2. Test de mise à jour

Pour tester le système de mise à jour :

1. **Premier déploiement** : Visitez le site sur mobile
2. **Modification** : Changez quelque chose (ex: une couleur, un texte)
3. **Second déploiement** : Push et déployez
4. **Attente** : Attendez ~1h OU rechargez la page
5. **Notification** : Le toast devrait apparaître !

### 3. Simulation rapide (Dev)

Pour tester sans attendre 1 heure :

1. Dans Chrome DevTools → Application → Service Workers
2. Cochez "Update on reload"
3. Modifiez le code et redéployez
4. Rechargez la page → Le toast apparaît immédiatement

## 📱 Test sur Mobile

### Installation PWA

1. Visitez le site sur Safari (iOS) ou Chrome (Android)
2. Menu → "Ajouter à l'écran d'accueil"
3. L'icône PWA est installée
4. Ouvrez l'app depuis l'écran d'accueil

### Test de mise à jour mobile

1. **App installée** : Ouvrez la PWA depuis l'écran d'accueil
2. **Nouvelle version** : Déployez une mise à jour sur Vercel
3. **Attente** : Attendez 1h maximum
4. **Notification** : Le toast apparaît automatiquement
5. **Action** : Cliquez sur "Recharger"
6. **Résultat** : L'app se met à jour instantanément

## 🔧 Configuration Vercel (Optionnel)

### Variables d'environnement

Si vous avez des variables d'environnement sensibles :

1. Allez dans Vercel Dashboard → Votre projet → Settings → Environment Variables
2. Ajoutez vos variables
3. Redéployez pour appliquer

### Headers personnalisés (vercel.json)

Pour optimiser le cache :

```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/workbox-*.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## 🐛 Troubleshooting

### Le Service Worker ne s'enregistre pas

**Causes possibles :**
- Site non HTTPS (Vercel = HTTPS automatique ✅)
- Erreur dans le build
- Cache navigateur

**Solutions :**
1. Vider le cache : DevTools → Application → Clear storage → Clear site data
2. Vérifier la console pour les erreurs
3. Inspecter l'onglet Service Workers

### La notification n'apparaît pas

**Causes possibles :**
- Pas de nouvelle version détectée
- Délai d'1h non écoulé
- Service Worker bloqué

**Solutions :**
1. Forcer l'update : DevTools → Application → Service Workers → Update
2. Décocher "Bypass for network"
3. Vérifier les logs console (🔍 "Vérification des mises à jour...")

### Le toast reste affiché indéfiniment

**Causes possibles :**
- Erreur lors du reload
- Nouveau SW bloqué

**Solutions :**
1. Cliquer sur "Ignorer" (X)
2. Forcer le reload manuel (Ctrl+Shift+R)
3. Unregister le SW et relancer

## 📊 Monitoring

### Logs à surveiller

En production, surveillez ces logs dans la console :

```
✅ Service Worker enregistré: /sw.js
🔍 Vérification des mises à jour...
🔄 Nouvelle version disponible
✅ Application prête pour le mode hors ligne
```

### Analytics (Optionnel)

Ajoutez un tracking pour mesurer :
- Nombre d'utilisateurs qui mettent à jour
- Délai moyen de mise à jour
- Utilisateurs en mode hors ligne

## 🎯 Checklist Finale

Avant de déployer en production :

- [ ] Le build local fonctionne (`npm run build`)
- [ ] Le Service Worker est bien configuré
- [ ] Le toast s'affiche correctement
- [ ] Les stratégies de cache sont adaptées
- [ ] La documentation est à jour
- [ ] Les variables d'environnement sont configurées
- [ ] Le test sur mobile a été effectué
- [ ] La notification de mise à jour fonctionne

## 🚀 Commande Rapide

```bash
# Build + Test + Deploy
npm run build && git add . && git commit -m "feat: PWA updates" && git push
```

---

**🎉 Félicitations !** Votre système de mise à jour PWA est maintenant opérationnel !
