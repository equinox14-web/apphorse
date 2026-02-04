# Diagnostic du problème : Elite → Start

## Problème identifié

Quand aurelie.jossic@gmail.com choisit la formule **Elite**, elle se retrouve avec la formule **Start**.

## Cause racine

Le problème se trouve dans la synchronisation Stripe → Firestore → Application.

### Flux normal :
1. L'utilisateur choisit "Elite" dans l'onboarding
2. Le système identifie le `priceId` pour Elite (ligne 255 de Onboarding.jsx)
3. Le paiement Stripe est initié avec ce `priceId`
4. Après paiement réussi, le webhook Stripe crée un document dans `customers/{uid}/subscriptions`
5. L'AuthContext écoute cette collection et lit le champ `subDoc.role` (ligne 210-213 de AuthContext.jsx)
6. **PROBLÈME** : Le champ `role` dans le document d'abonnement Stripe ne correspond pas au plan choisi

## Solution

Il faut vérifier 2 choses :

### 1. Métadonnées produit Stripe (Dans Stripe Dashboard)

Pour chaque produit Stripe (Start, Pro, Elite, etc.), il faut définir une métadonnée `role` :

- **Start** → `role: "start"`
- **Pro** → `role: "pro"`  
- **Elite/Élite** → `role: "elite"`
- **Spécial Éleveur** → `role: "eleveur"`
- **Passion** → `role: "passion"`
- **Passion Élevage** → `role: "eleveur_amateur_paid"`

### 2. Configuration Firebase Extension

Si vous utilisez l'extension Firebase "Run Payments with Stripe", vérifiez que :
- Elle est configurée pour copier les métadonnées du produit vers le document d'abonnement
- Le champ `role` est bien synchronisé

### 3. Vérification manuelle dans Firestore

1. Connectez-vous à Firestore Console
2. Naviguez vers `customers/{uid}/subscriptions`
3. Trouvez l'uid de aurelie.jossic@gmail.com
4. Vérifiez le contenu du document d'abonnement :
   - Est-ce que le champ `role` existe ?
   - Quelle valeur a-t-il ? (probablement "start" au lieu de "elite")

## Test rapide

Ajoutez un log dans AuthContext.jsx ligne 210 :

```javascript
if (subDoc.role) {
    console.log("🔍 DEBUG Subscription Data:", subDoc);
    console.log("Abonnement détecté, Role:", subDoc.role);
    activePlan = [subDoc.role];
    activeRole = subDoc.role;
}
```

Puis demandez à l'utilisateur de se reconnecter et de vérifier la console.

## Correctif temporaire (Pour Aurelie)

En attendant la correction Stripe, vous pouvez manuellement corriger son plan :

1. Aller dans Firestore Console
2. `users/{uid_aurelie}` 
3. Modifier `plans: ["elite"]` et `role: "Pro"` (ou "Propriétaire" si c'est son besoin)
4. Lui demander de se déconnecter/reconnecter

Ou utiliser le mode Admin Bypass (qui est déjà activé pour elle dans Onboarding.jsx ligne 263).
