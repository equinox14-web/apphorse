# ✅ Solution pour différencier Aurelie (Super Admin) des Testeurs

## 🎯 Demande
Aurelie Jossic doit pouvoir être **Admin** et **se balader sur TOUTES les offres** (y compris Découverte, Start, Pro, Elite), ce qui est différent des testeurs classiques qui sont souvent restreints à Elite.

## 🔧 Modification appliquée
**Fichier** : `src/context/AuthContext.jsx`

J'ai séparé la logique en deux catégories d'utilisateurs bypassés :

### 1. 🦅 Super Admin (Vous)
- **Emails concernés** : `aurelie.jossic@gmail.com` (et autres dans la whitelist permanente)
- **Comportement** : **Liberté totale**.
  - Si vous sélectionnez "Découverte" dans l'onboarding → Vous aurez le plan Découverte.
  - Si vous sélectionnez "Elite" → Vous aurez Elite.
- **Pourquoi ?** : Le système respecte maintenant à 100% ce qui est enregistré dans Firestore pour vous, sans jamais forcer un plan par défaut.

### 2. 🧪 Testeurs Standards
- **Emails concernés** : Testeurs whitelistés mais non permanents (ex: via `isAdminBypass: true` dans Firestore)
- **Comportement** : Forcés en **Elite** par défaut, sauf s'ils ont explicitement activé un autre plan via le simulateur.

## 📋 Comment tester la "balade" ?

1. **Allez sur l'Onboarding** (ou page `/admin-plans` si disponible)
2. Sélectionnez une offre (ex: "Découverte" ou "Start")
3. Validez
4. **Résultat** : Votre compte aura exactement l'offre choisie, sans être rebasculé automatiquement sur Elite.

Vous pouvez maintenant naviguer librement entre toutes les offres pour les tester ! 🚀
