# Solution au problème Elite → Start

## Problème identifié

Aurelie Jossic (aurelie.jossic@gmail.com) choisit la formule **Elite** mais se retrouve avec **Start**.

## Causes possibles et solutions

### Cause 1: Nom du produit mal configuré dans Firestore

**Symptôme**: Le produit "Elite" existe dans Firestore mais son nom n'est pas reconnu par `getInternalPlanId()`.

**Diagnostic**:
1. Ouvrir Firestore Console
2. Aller à `products/`
3. Vérifier que le produit Elite existe et noter son ID exact
4. Vérifier le champ `name` du produit

**Solution rapide**: Le nom du produit Firestore DOIT contenir "elite" ou "élite" (insensible à la casse).

Exemples de noms valides :
- "Elite"
- "Élite"  
- "Pro Elite"
- "Formule Elite"

### Cause 2: Problème dans l'ordre de sélection

**Symptôme**: L'utilisateur clique sur Elite mais `selectedPlanIds` contient l'ID d'un autre produit.

**Diagnostic**: 
1. Activer les logs de la console Chrome DevTools
2. Se connecter avec aurelie.jossic@gmail.com
3. Aller sur la page d'onboarding (professionnel)
4. Cliquer sur Elite
5. Cliquer sur "Valider la sélection"
6. Observer les logs console :
   - `[ADMIN MODE] Activation immédiate.`
   - `🔍 [ADMIN ACTIVATION DEBUG]` - vérifier `selectedId` et `productName`
   - `✅ [ADMIN ACTIVATION] Mapped Plan` - vérifier `internalKey`

**Si `internalKey` n'est PAS "elite"**, le problème vient du mapping.

### Cause 3: Mauvais ID dans `selectedPlanIds`

**Symptôme**: Quand on clique sur Elite, un autre plan est sélectionné.

**Possible conflit**: Les IDs des cartes de plan ne correspondent pas aux vrais IDs Firestore.

**Solution**: Vérifier que les produits chargés depuis Firestore ont bien les bons IDs.

## Correctif immédiat pour Aurelie

### Option A: Correction manuelle dans Firestore

1. Se connecter à Firestore Console
2. Trouver l'UID de aurelie.jossic@gmail.com dans `users/`
3. Modifier directement le document :
   ```json
   {
     "plans": ["elite"],
     "role": "Pro",
     "isAdminBypass": false
   }
   ```
4. Demander à Aurelie de se déconnecter/reconnecter

### Option B: Utiliser le mode Debug Plans

1. Se connecter avec aurelie.jossic@gmail.com
2. Aller sur `/debug-plans` (si la page existe)
3. Sélectionner manuellement "Elite"

### Option C: Console du navigateur (temporaire)

Aurelie peut exécuter ce code dans la console Chrome pendant qu'elle est connectée :

```javascript
// Forcer le plan Elite localement
localStorage.setItem('subscriptionPlan', JSON.stringify(['elite']));
localStorage.setItem('user_role', 'Pro');
localStorage.setItem('force_elite_access', 'true');
location.reload();
```

⚠️ **Note**: Ceci est TEMPORAIRE et sera écrasé à la prochaine connexion si le problème Firestore n'est pas résolu.

## Correctif définitif

### Étape 1: Vérifier les noms de produits dans Firestore

S'assurer que TOUS les produits ont des noms corrects :

| ID Produit Firestore | Nom du produit | Mapping attendu |
|---------------------|----------------|-----------------|
| (à vérifier) | "Start" | `start` |
| (à vérifier) | "Pro" | `pro` |
| (à vérifier) | "Elite" ou "Élite" | `elite` |
| (à vérifier) | "Spécial Éleveur" | `eleveur` |
| (à vérifier) | "Passion" | `passion` |
| (à vérifier) | "Passion Élevage" | `eleveur_amateur_paid` |

### Étape 2: Améliorer la fonction getInternalPlanId

Modifier `Onboarding.jsx` ligne 249-259 pour être plus robuste :

```javascript
const getInternalPlanId = (name) => {
    const n = (name || '').toLowerCase().trim();
    
    // Normaliser les accents
    const normalized = n.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Order matters: specific before generic
    if (n.includes('passion élevage') || n.includes('passion elevage') || normalized.includes('passion elevage')) {
        return 'eleveur_amateur_paid';
    }
    if (n.includes('passion')) return 'passion';
    
    // Professional plans
    if (n.includes('élite') || n.includes('elite') || normalized.includes('elite')) {
        return 'elite';
    }
    if (n.includes('spécial') || n.includes('special') || normalized.includes('special eleveur') || normalized.includes('eleveur')) {
        // Note: Check "special eleveur" BEFORE just "eleveur" to avoid false positives
        return 'eleveur';
    }
    if (n.includes('pro') && !n.includes('passion')) { // Avoid matching "Passion Proprio"
        return 'pro';
    }
    if (n.includes('start')) return 'start';
    
    // Free plan
    if (n.includes('découverte') || n.includes('decouverte') || normalized.includes('decouverte')) {
        return 'decouverte';
    }
    
    console.warn('⚠️ Unknown plan name:', name, '- Defaulting to decouverte');
    return 'decouverte'; // Default fallback
};
```

### Étape 3: Contacter aurelie.jossic@gmail.com

Lui demander de :
1. Ouvrir la console Chrome (F12)
2. Se reconnecter
3. Refaire le processus de sélection Elite
4. Copier TOUS les logs qui commencent par `[ADMIN` ou `🔍`
5. Vous envoyer ces logs

Cela permettra de voir EXACTEMENT ce qui se passe.

## Vérification après correctif

1. Se connecter avec aurelie.jossic@gmail.com (ou un autre compte admin)
2. Aller sur Settings
3. Vérifier que le plan affiché est "Elite"
4. Vérifier `localStorage.getItem('subscriptionPlan')` dans la console → devrait être `["elite"]`
5. Vérifier `localStorage.getItem('user_role')` → devrait être `"Pro"`

## Prévention future

**Créer un test unitaire** pour `getInternalPlanId` :

```javascript
// Test cases
console.assert(getInternalPlanId('Elite') === 'elite', 'Elite mapping failed');
console.assert(getInternalPlanId('Élite') === 'elite', 'Élite (accent) mapping failed');
console.assert(getInternalPlanId('Start') === 'start', 'Start mapping failed');
console.assert(getInternalPlanId('Pro') === 'pro', 'Pro mapping failed');
console.assert(getInternalPlanId('Passion') === 'passion', 'Passion mapping failed');
console.assert(getInternalPlanId('Passion Élevage') === 'eleveur_amateur_paid', 'Passion Élevage mapping failed');
console.assert(getInternalPlanId('Spécial Éleveur') === 'eleveur', 'Spécial Éleveur mapping failed');
```
