# Instructions de diagnostic - Problème Elite → Start

Bonjour,

J'ai identifié le problème et ajouté des outils de diagnostic pour le résoudre. Voici les étapes à suivre :

## Étape 1 : Accéder à la page de diagnostic

1. Connectez-vous avec le compte **aurelie.jossic@gmail.com**
2. Dans la barre d'adresse du navigateur, allez sur : `https://votre-site.com/diagnostic-plans`
   (ou en local : `http://localhost:5173/diagnostic-plans`)
3. Cette page affichera TOUTES les informations sur les plans

## Étape 2 : Vérifier les logs de la console

1. Ouvrez les outils de développement Chrome (F12)
2. Allez dans l'onglet **Console**
3. Cliquez sur "Effacer la console" (icône 🚫)
4. Actualisez la page (F5)
5. Cherchez les logs qui commencent par :
   - `🔍 [STRIPE DEBUG]` - affiche les données de l'abonnement Stripe
   - `✅ Abonnement détecté` - confirme que le plan est bien chargé
   - `⚠️ Subscription found but NO role field` - PROBLÈME : le champ role est absent dans Stripe

## Étape 3 : Tester la sélection d'un plan

1. Déconnectez-vous
2. Reconnectez-vous avec aurelie.jossic@gmail.com
3. Si vous êtes redirigé vers l'onboarding :
   - Choisissez "Professionnel"
   - Cliquez sur **Elite**
   - Cliquez sur "Valider la sélection"
4. Regardez la console, vous devriez voir :
   ```
   [ADMIN MODE] Activation immédiate.
   🔍 [ADMIN ACTIVATION DEBUG] { selectedId: '...', productName: '...' }
   ✅ [ADMIN ACTIVATION] Mapped Plan: { internalKey: 'elite', ... }
   ```

## Étape 4 : Solutions selon le diagnostic

### Cas A : Le champ `role` est absent dans l'abonnement Stripe

**Problème** : La console affiche `⚠️ Subscription found but NO role field`

**Solution** :
1. Allez dans votre [Dashboard Stripe](https://dashboard.stripe.com)
2. Naviguez vers **Produits**
3. Trouvez le produit "Elite" (ou "Élite")
4. Cliquez sur "Modifier"
5. Ajoutez une métadonnée :
   - Clé : `role`
   - Valeur : `elite`
6. Sauvegardez
7. Demandez à Aurelie de se déconnecter/reconnecter

### Cas B : Le nom du produit n'est pas reconnu

**Problème** : Dans la console, vous voyez `⚠️ [getInternalPlanId] Unknown product name: ...`

**Solution** :
1. Vérifiez le nom exact du produit dans Firestore (`products/`)
2. Le nom DOIT contenir l'un de ces mots-clés :
   - "elite" ou "élite" → plan `elite`
   - "start" → plan `start`
   - "pro" (mais PAS "proprietaire") → plan `pro`
   - "spécial éleveur" → plan `eleveur`
3. Si le nom ne correspond à rien, renommez le produit dans Stripe

### Cas C : Correctif immédiat (temporaire)

Si vous voulez activer le plan Elite immédiatement pour Aurelie :

1. Allez dans Firestore Console
2. Trouvez `users/{uid_aurelie}` (vous pouvez chercher par email)
3. Modifiez les champs :
   ```json
   {
     "plans": ["elite"],
     "role": "Pro",
     "isAdminBypass": false
   }
   ```
4. Demandez à Aurelie d'exécuter ce code dans la console Chrome :
   ```javascript
   localStorage.setItem('subscriptionPlan', JSON.stringify(['elite']));
   localStorage.setItem('user_role', 'Pro');
   location.reload();
   ```

## Étape 5 : Vérification finale

Après application de la solution, vérifiez que :

1. Page `/diagnostic-plans` affiche :
   - ✅ Plans définis dans Firestore users/{uid}
   - ✅ Champ 'role' présent dans l'abonnement Stripe
   - ✅ subscriptionPlan dans localStorage
   
2. La console Chrome affiche (après reconnexion) :
   ```
   ✅ Abonnement détecté, Role: elite
   ```

3. La page Settings affiche bien "Elite" comme plan actif

## Informations supplémentaires

- L'email aurelie.jossic@gmail.com est dans la liste ADMIN_EMAILS, donc elle bénéficie d'une activation directe sans passer par Stripe
- Cette activation directe utilise la fonction `getInternalPlanId()` qui a été améliorée pour mieux gérer les accents et l'ordre de priorité
- Les logs ont été ajoutés dans le code pour faciliter le diagnostic

## Besoin d'aide ?

Si le problème persiste après ces étapes, envoyez-moi :
1. Une capture d'écran de la page `/diagnostic-plans`
2. Les logs de la console (tout ce qui contient `[ADMIN`, `🔍` ou `✅`)
3. Le nom exact des produits dans Firestore

---

**Fichiers modifiés** :
- `src/context/AuthContext.jsx` - Ajout de logs détaillés pour le diagnostic Stripe
- `src/pages/auth/Onboarding.jsx` - Amélioration de `getInternalPlanId()` + logs de debug
- `src/pages/DiagnosticPlans.jsx` - Nouvelle page de diagnostic
- `src/App.jsx` - Ajout de la route `/diagnostic-plans`
