# 🧪 Guide de Test - Cortex Vision

## Guide rapide pour tester la fonctionnalité d'analyse de carnets d'identification

### ✅ Prérequis

1. **Serveur de développement en cours d'exécution** : `npm run dev`
2. **Firebase AI activé** dans votre projet Firebase
3. **Un carnet d'identification de cheval** pour tester (photo ou scan)

---

## 🎯 Étapes de test

### 1. Accéder à la page des chevaux

1. Ouvrez http://localhost:5173
2. Connectez-vous à votre compte (ou créez-en un)
3. Naviguez vers **"Mes Chevaux"** ou **"Mon Écurie"**

### 2. Ouvrir le modal d'ajout

1. Cliquez sur le bouton **"Ajouter un cheval"** (icône +)
2. Le modal d'ajout devrait s'ouvrir

### 3. Tester Cortex Vision

**Option A : Avec votre caméra (recommandé sur mobile)**
1. Dans le modal, cliquez sur l'encadré bleu **"Scanner le livret avec l'appareil photo"**
2. Autorisez l'accès à la caméra si demandé
3. Prenez une photo claire du carnet d'identification
4. Attendez l'analyse (spinner visible)

**Option B : Avec un fichier existant**
1. Modifiez temporairement le champ dans `Horses.jsx` pour autoriser les uploads :
   ```jsx
   <input
       id="scan-doc"
       type="file"
       accept="image/*"
       // Retirer : capture="environment"
   ```

### 4. Vérifier les résultats

Après l'analyse, vous devriez voir :

**✅ Cas de succès**
- Une alerte : "✅ Cortex Vision : X information(s) extraite(s) du livret !"
- Les champs du formulaire pré-remplis avec les données extraites
- Possibilité de modifier/compléter avant validation

**⚠️ Cas d'avertissement**
- "Aucune information n'a pu être extraite"
- Document illisible ou incompatible

**❌ Cas d'erreur**
- Message d'erreur spécifique
- Suggestions pour réessayer

---

## 📸 Conseils pour de meilleures photos

### ✅ À FAIRE

- ✅ Éclairage uniforme et lumineux
- ✅ Document à plat (pas de plis)
- ✅ Cadrage serré sur la page d'information
- ✅ Photo nette (pas de flou)
- ✅ Angle perpendiculaire au document

### ❌ À ÉVITER

- ❌ Photo floue ou pixelisée
- ❌ Ombres portées
- ❌ Reflets ou surexposition
- ❌ Document froissé ou plié
- ❌ Angle trop prononcé

---

## 🧪 Cas de test suggérés

### Test 1 : Carnet complet et clair
**Objectif** : Vérifier l'extraction complète
**Attendu** : Tous les champs remplis (nom, race, âge, couleur, sexe)

### Test 2 : Photo partielle
**Objectif** : Tester l'extraction partielle
**Attendu** : Seuls les champs visibles sont remplis, les autres restent vides

### Test 3 : Photo floue
**Objectif** : Vérifier la gestion d'erreur
**Attendu** : Message d'avertissement sur la qualité

### Test 4 : Document non-équestre
**Objectif** : Tester la robustesse
**Attendu** : Message d'erreur approprié

### Test 5 : Plusieurs scans successifs
**Objectif** : Vérifier que l'input se réinitialise
**Attendu** : Possibilité de rescanner plusieurs fois

---

## 🐛 Points de vérification

### Console du navigateur

Ouvrez les DevTools (F12) et vérifiez :

```javascript
// Aucune erreur rouge ne devrait apparaître
// Vous devriez voir des logs comme :
"Cortex Vision : Analyse en cours..."
"Données extraites : {name: '...', breed: '...', ...}"
```

### État du formulaire

Après un scan réussi :
- [ ] Le champ "Nom" est pré-rempli
- [ ] Le champ "Race" est pré-rempli
- [ ] Le champ "Âge" est pré-rempli
- [ ] Le champ "Couleur" est pré-rempli
- [ ] Le sexe correct est sélectionné (Jument/Étalon/Hongre)

### Comportement du spinner

- [ ] Le spinner apparaît immédiatement après la sélection
- [ ] Le texte "Cortex Vision analyse votre document..." est visible
- [ ] Le spinner disparaît après l'analyse

---

## 📊 Exemples de documents supportés

### ✅ Documents compatibles

1. **Livret SIRE** (France)
   - Document officiel des Haras Nationaux
   - Pages d'identité principales

2. **Passeport équin** (UE)
   - Pages d'identification
   - Signalement graphique acceptable

3. **Certificat d'origine**
   - Si contient les informations requises

### ❌ Documents non supportés

- Radiographies
- Photos du cheval seul
- Documents manuscrits illisibles
- Captures d'écran de basse qualité

---

## 🔧 Dépannage

### Problème : "Erreur Firebase AI"

**Solution** :
1. Vérifiez que l'API Firebase AI est activée dans la console
2. Vérifiez les variables d'environnement dans `.env`
3. Redémarrez le serveur de développement

### Problème : "Parsing JSON échoué"

**Solution** :
1. Photo probablement trop floue
2. Réessayez avec une meilleure qualité

### Problème : Pas de réponse pendant longtemps

**Solution** :
1. Vérifiez votre connexion internet
2. Vérifiez les quotas de l'API Gemini
3. Console DevTools pour voir les erreurs réseau

### Problème : Données incorrectes extraites

**Solution** :
1. C'est normal, l'IA n'est pas parfaite à 100%
2. L'utilisateur peut corriger manuellement
3. Prenez une meilleure photo pour améliorer la précision

---

## 📈 Métriques de succès

Un test est considéré comme **réussi** si :

✅ Au moins 3 champs sur 5 sont correctement remplis
✅ Aucune erreur technique (crash, freeze)
✅ L'utilisateur peut corriger facilement les erreurs
✅ Le temps de réponse est < 10 secondes
✅ Les messages d'erreur sont clairs et utiles

---

## 🎬 Vidéo de démonstration

Pour créer une démo :

1. Enregistrez votre écran avec OBS / Loom
2. Montrez le processus complet :
   - Ouverture du modal
   - Scan du document
   - Attente de l'analyse
   - Résultat affiché
   - Validation finale

---

## 📝 Rapport de test

Après vos tests, notez :

```
Date : ___________
Navigateur : ___________
Type de document : ___________

Résultats :
- Champs correctement extraits : __ / 5
- Temps d'analyse : __ secondes
- Qualité perçue : 1-5 ⭐
- Problèmes rencontrés : ___________
- Suggestions d'amélioration : ___________
```

---

## 🚀 Prochaines étapes après validation

Une fois les tests concluants :

1. [ ] Déployer en production
2. [ ] Monitorer les taux de réussite
3. [ ] Collecter les feedbacks utilisateurs
4. [ ] Itérer sur le prompt Gemini si nécessaire
5. [ ] Ajouter des analytics (temps moyen, taux de succès)

---

**Bonne chance avec vos tests ! 🐴✨**

Si vous rencontrez des problèmes, référez-vous à `CORTEX_VISION.md` pour plus de détails techniques.
