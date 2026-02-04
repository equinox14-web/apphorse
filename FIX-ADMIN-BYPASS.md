# Script de correction rapide pour isAdminBypass

## Problème
Le champ `isAdminBypass` dans Firestore revient toujours à `false` au lieu de rester à `true`.

## Solution appliquée
✅ **Modifié** : `src/pages/auth/Onboarding.jsx` ligne 318
- Avant : `isAdminBypass: false`
- Après : `isAdminBypass: true`

Maintenant, quand un admin (comme aurelie.jossic@gmail.com) sélectionne un plan, le champ restera à `true`.

## Correction manuelle immédiate

Si le champ est déjà à `false` dans Firestore, voici comment le corriger :

### Option 1 : Via la console Chrome (recommandé)

1. Connectez-vous avec aurelie.jossic@gmail.com
2. Ouvrez la console Chrome (F12)
3. Copiez-collez ce code et appuyez sur Entrée :

```javascript
import('https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js').then(({ initializeApp }) => {
  import('https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js').then(({ getFirestore, doc, updateDoc }) => {
    import('https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js').then(({ getAuth }) => {
      const auth = getAuth();
      const db = getFirestore();
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      updateDoc(userRef, { isAdminBypass: true })
        .then(() => {
          console.log('✅ isAdminBypass défini à true !');
          alert('✅ Correction appliquée ! La page va se recharger.');
          location.reload();
        })
        .catch(err => console.error('❌ Erreur:', err));
    });
  });
});
```

### Option 2 : Version courte (si Firebase est déjà chargé)

Si vous êtes déjà sur l'application, utilisez cette version simplifiée :

```javascript
// Copier-coller dans la console
(async () => {
  const { db, auth } = window; // Supposant que db et auth sont globaux
  const { doc, updateDoc } = await import('firebase/firestore');
  
  if (!auth?.currentUser) {
    alert('❌ Vous devez être connecté');
    return;
  }
  
  const userRef = doc(db, 'users', auth.currentUser.uid);
  await updateDoc(userRef, { isAdminBypass: true });
  
  console.log('✅ isAdminBypass = true');
  alert('✅ Correction appliquée !');
  location.reload();
})();
```

### Option 3 : Manuellement via Firestore Console

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Cliquez sur "Firestore Database"
4. Naviguez vers `users/`
5. Trouvez le document avec l'email aurelie.jossic@gmail.com
6. Cliquez sur le document
7. Modifiez le champ `isAdminBypass` : cochez `true`
8. Sauvegardez
9. Demandez à Aurelie de se déconnecter/reconnecter

## Vérification

Après la correction, vérifiez sur `/diagnostic-plans` que :
- `isAdminBypass: true` est affiché
- Le plan est bien "elite"

## Email à Aurelie

Bonjour Aurelie,

Le problème a été identifié et corrigé ! Le champ `isAdminBypass` était réinitialisé à `false` à chaque connexion.

**J'ai corrigé le code**, mais il faut aussi corriger votre profil dans la base de données :

1. **Option simple** : Déconnectez-vous et reconnectez-vous, puis refaites la sélection du plan Elite
2. **Option rapide** : Exécutez le script de correction ci-dessus dans la console Chrome

Après cela, votre plan Elite devrait être correctement activé et rester actif.

Cordialement
