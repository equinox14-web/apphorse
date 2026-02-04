# ✅ PROBLÈME RÉSOLU : isAdminBypass toujours à false

## 🎯 Problème identifié par l'utilisateur

Le champ `isAdminBypass` dans Firestore revient constamment à `false` même après modification manuelle à `true`.

## 🔍 Cause racine

Dans `src/pages/auth/Onboarding.jsx` ligne 318, le code définissait explicitement :

```javascript
isAdminBypass: false // ❌ PROBLÈME ICI
```

Cela signifie qu'à **chaque fois** qu'un admin (comme aurelie.jossic@gmail.com) sélectionnait un plan dans l'onboarding, le champ était réinitialisé à `false`.

## ✅ Correction appliquée

**Fichier modifié** : `src/pages/auth/Onboarding.jsx`
**Ligne** : 318

**AVANT** :
```javascript
await updateDoc(doc(db, "users", auth.currentUser.uid), {
    plans: [internalKey],
    role: userType === 'pro' ? 'Pro' : 'Propriétaire',
    isAdminBypass: false // ❌ Réinitialisait à false
});
```

**APRÈS** :
```javascript
await updateDoc(doc(db, "users", auth.currentUser.uid), {
    plans: [internalKey],
    role: userType === 'pro' ? 'Pro' : 'Propriétaire',
    isAdminBypass: true // ✅ Maintient à true pour les admins
});
```

## 📋 Prochaines étapes

### 1. Correction manuelle dans Firestore (une seule fois)

Puisque le champ est actuellement à `false`, il faut le corriger manuellement :

**Option A - Via Firestore Console** (recommandé) :
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Firestore Database → `users/`
4. Trouvez le document avec `email: "aurelie.jossic@gmail.com"`
5. Cliquez dessus, modifiez `isAdminBypass` → cochez `true`
6. Sauvegardez

**Option B - Via console Chrome** :
1. Connectez-vous avec aurelie.jossic@gmail.com
2. Ouvrez la console (F12)
3. Allez sur `/diagnostic-plans` pour vérifier l'UID
4. Puis, dans Firestore Console, trouvez ce document et modifiez-le

### 2. Vérification

Après la correction manuelle :

1. Allez sur `/diagnostic-plans`
2. Vérifiez que `isAdminBypass: true` est affiché
3. Vérifiez que le plan est bien "elite"

### 3. Test de non-régression

Pour être sûr que le problème est résolu :

1. **Déconnectez-vous** avec aurelie.jossic@gmail.com
2. **Reconnectez-vous**
3. Retournez sur `/onboarding` (si vous y êtes redirigé)
4. Sélectionnez **Elite** à nouveau
5. Cliquez sur "Valider"
6. Retournez à Firestore et vérifiez : `isAdminBypass` devrait toujours être à `true` ✅

## 🎉 Résultat attendu

Après ces corrections :

- ✅ `isAdminBypass` restera à `true` pour aurelie.jossic@gmail.com
- ✅ Elle pourra choisir n'importe quel plan (Start, Pro, Elite, etc.)
- ✅ Le plan sélectionné restera actif sans être écrasé
- ✅ Aucun paiement Stripe ne sera requis (bypass actif)

## 📝 Note technique

Les emails dans la liste `ADMIN_EMAILS` bénéficient d'une activation directe sans passer par Stripe :

```javascript
const ADMIN_EMAILS = [
    'admin@equinox.com',
    'dev@equinox.com',
    'aurelie.jossic@gmail.com',  // ← Concerné
    'papy.gamers14@gmail.com',
    'horse-equinox@outlook.com'
];
```

Ces utilisateurs ont maintenant un bypass permanent grâce à `isAdminBypass: true`.

---

**Résumé des fichiers modifiés** :
- ✅ `src/pages/auth/Onboarding.jsx` - Ligne 318 : `isAdminBypass: false` → `isAdminBypass: true`

**Action requise** :
- 🔧 Corriger manuellement dans Firestore le champ `isAdminBypass` à `true` pour les documents existants
