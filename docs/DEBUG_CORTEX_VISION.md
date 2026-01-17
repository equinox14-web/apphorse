# 🔍 Guide de débogage Cortex Vision

## État actuel
J'ai amélioré le code avec des logs détaillés pour identifier le problème.

## 🧪 Comment tester maintenant

### Étape 1 : Ouvrir la console du navigateur
1. Ouvrez votre application sur **http://localhost:5173**
2. Appuyez sur **F12** pour ouvrir les outils de développement
3. Allez dans l'onglet **Console**

### Étape 2 : Tester Cortex Vision
1. Allez dans **"Mes Chevaux"**
2. Cliquez sur **"Ajouter un cheval"**
3. Cliquez sur **"Scanner le carnet (Auto-remplissage)"**
4. Sélectionnez une photo d'un carnet de cheval

### Étape 3 : Observer les logs dans la console

Vous devriez voir ces messages dans la console :

```
🔵 [Cortex Vision] Début de l'analyse...
✅ [Cortex Vision] Firebase AI initialisé
✅ [Cortex Vision] Modèle Gemini configuré
✅ [Cortex Vision] Image préparée, taille: XXXXX caractères
⏳ [Cortex Vision] Envoi de la requête à Gemini...
✅ [Cortex Vision] Réponse reçue de Gemini
📝 [Cortex Vision] Texte brut reçu: {...}
✅ [Cortex Vision] JSON parsé avec succès: {...}
✅ [Cortex Vision] Données nettoyées: {...}
🎉 [Cortex Vision] Analyse terminée avec succès
```

### Étape 4 : Identifier le problème

#### ❌ Si vous voyez "Firebase AI n'est pas initialisé"
**Problème** : Le service Firebase AI n'est pas activé

**Solution** :
1. Allez sur https://console.firebase.google.com/
2. Sélectionnez votre projet `equinox-320c1`
3. Allez dans **Build** > **AI** (ou cherchez "Gemini" dans la recherche)
4. Activez l'API **Gemini AI** / **Firebase AI**
5. Acceptez les conditions d'utilisation

#### ❌ Si vous voyez une erreur de quota ou de permission
**Problème** : API non activée ou quota dépassé

**Solution** :
1. Vérifiez que l'API est bien activée dans Firebase Console
2. Vérifiez vos quotas dans **Google Cloud Console**
3. Assurez-vous que le billing est activé

#### ❌ Si vous voyez "Aucun JSON trouvé dans la réponse"
**Problème** : Gemini ne retourne pas le format JSON attendu

**La console affichera** : `📝 [Cortex Vision] Texte brut reçu: ...`

**Solution** :
- Regardez ce que Gemini a répondu dans la console
- Il faut peut-être ajuster le prompt
- L'image est peut-être trop floue

#### ❌ Si vous voyez "Aucune information extraite"
**Problème** : L'image ne contient pas d'informations lisibles

**Solution** :
- Utilisez une photo plus nette
- Assurez-vous que c'est bien un carnet d'identification de cheval
- Vérifiez que le texte est lisible

## 📋 Checklist de vérification

- [ ] Serveur localhost est lancé (`npm run dev`)
- [ ] Console du navigateur est ouverte (F12)
- [ ] Firebase AI est activé dans la console Firebase
- [ ] L'image utilisée est claire et lisible
- [ ] Vous voyez les logs `[Cortex Vision]` dans la console

## 🆘 Si ça ne fonctionne toujours pas

Envoyez-moi une capture d'écran de :
1. **La console du navigateur** avec les logs d'erreur
2. **L'image que vous essayez d'analyser**
3. **La console Firebase** pour vérifier si l'API AI est activée

## 🔑 Points importants

### Firebase AI doit être activé
Le module Firebase AI doit être activé dans votre projet Firebase. C'est une fonctionnalité récente qui n'est peut-être pas activée par défaut.

### Billing Cloud requis
Google Gemini AI nécessite que la facturation soit activée sur votre projet Google Cloud (même si vous êtes dans le quota gratuit).

### Variables d'environnement
Assurez-vous que votre fichier `.env` contient bien toutes les clés Firebase :
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_AUTH_DOMAIN=...
etc.
```

## 🎯 Ce que j'ai amélioré

1. ✅ **Logs détaillés** à chaque étape
2. ✅ **Vérification** que Firebase AI est initialisé
3. ✅ **Messages d'erreur clairs** pour identifier rapidement le problème
4. ✅ **Affichage de la réponse brute** de Gemini en cas d'erreur de parsing

---

**Testez maintenant et dites-moi ce que vous voyez dans la console !** 🔍
