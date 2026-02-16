# Guide de Test - Migration Photos Cloud ✅

**Date:** 16 février 2026  
**Status:** Prêt pour test

---

## 📋 Checklist de vérification

### ✅ Fichiers créés
- [x] `src/services/migrationService.js` - Service de migration
- [x] `src/components/migration/PhotoMigrationWizard.jsx` - Interface wizard
- [x] `src/hooks/useMigration.js` - Hook React
- [x] `test_migration_setup.js` - Script de test

### ✅ Modifications effectuées
- [x] `src/pages/profile/Settings.jsx` - Section migration ajoutée
- [x] `src/services/index.js` - Export migrationService
- [x] `src/hooks/index.js` - Export useMigration
- [x] `src/layouts/MainLayout.jsx` - Menu "Paramètres" déjà présent
- [x] `src/App.jsx` - Route `/settings` déjà présente

---

## 🚀 Étapes de test

### 1. Démarrer l'application

```powershell
# Dans le terminal
cd c:\Users\wolft\Desktop\AppHorse
npm run dev
```

L'application devrait démarrer sans erreurs.

---

### 2. Créer des données de test

**Option A: Via console navigateur (Recommandé)**

1. Ouvrir l'application dans le navigateur
2. Ouvrir la console (F12)
3. Copier-coller le contenu de `test_migration_setup.js`
4. Appuyer sur Enter

Vous devriez voir:
```
✅ CONFIGURATION TERMINÉE
   Total chevaux: 3
   Total photos: 45
```

**Option B: Manuellement dans console**

```javascript
// Créer un cheval
const horse = {
  id: 'test_' + Date.now(),
  name: 'Dragon Test',
  breed: 'Pur-Sang'
};

const horses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
horses.push(horse);
localStorage.setItem('my_horses_v4', JSON.stringify(horses));

// Créer des photos
const testPhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
const photos = [
  { id: 'p1', dataUrl: testPhoto, timestamp: Date.now() },
  { id: 'p2', dataUrl: testPhoto, timestamp: Date.now() }
];
localStorage.setItem(`horse_${horse.id}_photos`, JSON.stringify(photos));

console.log('✅ Données créées');
```

---

### 3. Naviguer vers Settings

1. Dans l'app, cliquer sur "Paramètres" dans le menu latéral
2. Ou aller directement sur: `http://localhost:5173/settings`

---

### 4. Vérifier l'affichage du résumé

**✅ Ce que vous devriez voir:**

Si photos à migrer:
```
┌─────────────────────────────────────┐
│ ☁️ Migration Photos Cloud          │
├─────────────────────────────────────┤
│ ⚠️ Photos à migrer                 │
│ 45 photos trouvées en stockage     │
│                                     │
│ 🐴 Dragon Test: 15 photos          │
│ 🐴 Marie: 20 photos                │
│ 🐴 Spirit: 10 photos               │
│                                     │
│ [Commencer migration (45 photos)]  │
└─────────────────────────────────────┘
```

Si aucune photo:
```
┌─────────────────────────────────────┐
│ ✅                                  │
│ Toutes vos photos sont déjà        │
│ dans le cloud!                     │
└─────────────────────────────────────┘
```

**🐛 Si problème:**
- Ouvrir console: vérifier erreurs JavaScript
- Vérifier que `localStorage.getItem('my_horses_v4')` retourne des chevaux
- Vérifier que `localStorage.getItem('horse_<id>_photos')` existe

---

### 5. Tester le flux de migration

#### Phase 1: SUMMARY
1. Cliquer "Commencer la migration"
2. ✅ Voir modal avec résumé
3. ✅ Nombre total correct
4. ✅ Détails par cheval affichés
5. ✅ Boutons "Commencer" et "Annuler"

#### Phase 2: CONFIRMATION
1. Cliquer "Commencer la migration"
2. ✅ Voir estimations: durée, connexion, espace
3. ✅ Warnings affichés correctement
4. ✅ Boutons "Migrer maintenant" et "Retour"

#### Phase 3: MIGRATION
1. Cliquer "Migrer maintenant"
2. ✅ Loader animé visible
3. ✅ Nom du cheval actuel affiché
4. ✅ Barre de progression: cheval actuel
5. ✅ Barre de progression: globale
6. ✅ Compteur temps réel (X/Y migré)
7. ✅ Message "Ne pas quitter"

**⏱️ Durée attendue:** ~500ms par photo
- 10 photos = 5 secondes
- 50 photos = 25 secondes
- 100 photos = 50 secondes

#### Phase 4: RESULTS
1. Attendre fin de migration
2. ✅ Grille 3 colonnes: Total / Réussies / Échouées
3. ✅ Détails par cheval
4. ✅ Message de succès coloré
5. ✅ Bouton "Supprimer anciennes données"
6. ✅ Bouton "Fermer"

---

### 6. Vérifier Firebase Storage

**Via Firebase Console:**

1. Aller sur: https://console.firebase.google.com
2. Sélectionner votre projet
3. Storage → Files
4. Naviguer: `users/{userId}/horses/{horseId}/media/`

**✅ Ce que vous devriez voir:**
```
users/
  └── <userId>/
      └── horses/
          └── <horseId>/
              └── media/
                  ├── photo_1708089600000_0.jpg
                  ├── photo_1708089600123_1.jpg
                  └── ...
```

**Via Console navigateur:**

```javascript
// Vérifier uploads Firebase
import { getStorage, ref, listAll } from 'firebase/storage';

const storage = getStorage();
const userId = 'YOUR_USER_ID';
const horseId = 'YOUR_HORSE_ID';

const photosRef = ref(storage, `users/${userId}/horses/${horseId}/media/`);
const result = await listAll(photosRef);

console.log(`📸 ${result.items.length} fichiers uploadés`);
result.items.forEach(item => console.log('  -', item.name));
```

---

### 7. Vérifier Firestore (optionnel)

**Si votre app stocke aussi des refs dans Firestore:**

1. Firebase Console → Firestore
2. Collection `horses` → Document `<horseId>`
3. Vérifier champ `photos` avec URLs

---

### 8. Tester le cleanup

1. Après migration réussie
2. Cliquer "Supprimer les anciennes données"
3. ✅ Message "✅ Nettoyage complété"
4. Vérifier dans console:

```javascript
// Devrait retourner null ou undefined
localStorage.getItem('horse_<horseId>_photos')
```

---

## 🐛 Troubleshooting

### Problème: "0 photos à migrer" alors qu'il devrait y en avoir

**Solution:**
```javascript
// Dans console, vérifier structure localStorage
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.includes('horse') && key.includes('photos')) {
    console.log(key, localStorage.getItem(key).length + ' bytes');
  }
}
```

Vérifier que les clés suivent le format: `horse_<id>_photos`

---

### Problème: Migration bloquée en phase 3

**Solution:**
1. Ouvrir console navigateur
2. Chercher erreurs réseau
3. Vérifier Firebase Rules permettent uploads:

```javascript
// Storage Rules (Firebase Console)
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/horses/{horseId}/media/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

### Problème: Erreur "User not authenticated"

**Solution:**
```javascript
// Vérifier auth
import { getAuth } from 'firebase/auth';
const auth = getAuth();
console.log('User:', auth.currentUser);

// Si null, se reconnecter
```

---

### Problème: Photos uploadées mais pas visibles dans MediaGallery

**Solution:**
Vérifier que MediaGallery utilise `cloudPhotoService.streamPhotos()`:

```javascript
// Dans MediaGallery.jsx
import { cloudPhotoService } from '@/services';

useEffect(() => {
  cloudPhotoService.streamPhotos(userId, horseId, (photos) => {
    setPhotos(photos);
  });
}, [userId, horseId]);
```

---

## 📊 Metrics de test

### Performance attendue
- Upload: ~50-100ms par photo (variable selon taille)
- Délai inter-photos: 500ms
- Total pour 50 photos: ~30 secondes

### Success rate attendu
- Connexion stable: 99-100%
- Connexion instable: 90-95%
- Hors ligne: 0% (erreur immédiate)

---

## ✅ Validation finale

Cocher chaque item:

- [ ] App démarre sans erreurs console
- [ ] Settings page charge correctement
- [ ] Résumé migration affiche bon nombre
- [ ] Phase 1 (Summary) s'affiche
- [ ] Phase 2 (Confirmation) s'affiche
- [ ] Phase 3 (Migration) progresse correctement
- [ ] Phase 4 (Results) affiche stats
- [ ] Photos visibles dans Firebase Storage
- [ ] Cleanup localStorage fonctionne
- [ ] Aucune erreur dans console

---

## 🔄 Reset des tests

Pour recommencer les tests depuis zéro:

```javascript
// Supprimer toutes les photos de test
const horses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
horses.forEach(h => {
  localStorage.removeItem(`horse_${h.id}_photos`);
});

// Supprimer les chevaux de test (optionnel)
const realHorses = horses.filter(h => !h.id.includes('test'));
localStorage.setItem('my_horses_v4', JSON.stringify(realHorses));

console.log('✅ Tests réinitialisés');
```

---

## 📞 Support

Si problèmes persistants:
1. Consulter `docs/PHASE_3_MIGRATION_GUIDE.md`
2. Consulter `docs/PHASE_3_TROUBLESHOOTING.md`
3. Vérifier Firebase Console → Logs
4. Capturer console.log complet

---

**Dernière mise à jour:** 16 février 2026  
**Status:** ✅ PRÊT POUR TEST
