# 🚀 Guide de Test & Déploiement - Photos Cloud

## ✅ Checklist Pré-Déploiement

### Configuration Firebase
- [ ] Firestore rules mises à jour avec `match /users/{userId}/horses/{horseId}/media`
- [ ] Storage rules mises à jour avec structure `users/{userId}/horses/{horseId}`
- [ ] Firebase Storage activé dans Firebase Console
- [ ] Firestore activé dans Firebase Console
- [ ] `.env` contient les credentials Firebase corrects

### Code Source
- [ ] `cloudPhotoService.js` créé dans `src/services/`
- [ ] `services/index.js` exporte `cloudPhotoService`
- [ ] `MediaGallery.jsx` utilise `cloudPhotoService`
- [ ] `HorseProfile.jsx` utilise `cloudPhotoService` pour photos profil
- [ ] Aucune erreur de compilation: `npm run build`
- [ ] Imports corrects: `import { cloudPhotoService } from '@/services'`

### Dépendances
- [ ] `firebase` v9+ installé: `npm list firebase`
- [ ] React 19.2.0 utilisé: `package.json`

---

## 🧪 Tests Locaux

### Test 1: Upload de Photo (MediaGallery)

**Étapes:**
1. Connectez-vous avec votre compte
2. Ouvrez un cheval
3. Cliquez "Ajouter Photo"
4. Sélectionnez une image (JPG/PNG ~1-2 MB)
5. Attendez le loader "Uploading..."

**Vérifications:**
- [ ] Photo disparaît du modal après upload
- [ ] Photo apparaît dans la galerie grid
- [ ] Firebase Console → Storage contient le fichier
  - Chemin: `users/[uid]/horses/[horseId]/media/[timestamp]_filename.jpg`
- [ ] Firebase Console → Firestore contient le document
  - Collection: `users/[uid]/horses/[horseId]/media/`
  - Champs: `type`, `fileName`, `url`, `uploadedAt`

**Si ça fail:**
```javascript
// Ouvrir DevTools → Console et chercher:
// ❌ "Error uploading photo"
// ❌ "UserId et horseId sont requis"
// ❌ "Permission denied"
```

### Test 2: Suppression de Photo

**Étapes:**
1. Survoler une photo dans la galerie
2. Cliquer bouton poubelle rouge
3. Attendre le loader

**Vérifications:**
- [ ] Photo disparaît de la galerie
- [ ] Fichier supprimé de Firebase Storage
- [ ] Document supprimé de Firestore
- [ ] Pas d'erreur console

### Test 3: Synchronisation Multi-Device

**Étapes:**
1. Ouvrir AppHorse sur 2 navigateurs différents (ou 1 PC + 1 Mobile)
2. Se connecter avec le **même compte**
3. Aller sur le même cheval dans les deux onglets
4. Upload une photo dans le premier navigateur
5. Attendre 2-5 secondes dans le deuxième

**Vérifications:**
- [ ] Photo apparaît **automatiquement** dans l'autre navigateur
- [ ] Pas besoin de rafraîchir la page
- [ ] Suppression dans un navigateur = suppression dans l'autre

**Si ça fail:**
- [ ] Vérifier même utilisateur: `currentUser.uid` identique
- [ ] Vérifier connection Internet stable
- [ ] Vérifier Firestore listener actif: DevTools → Network

### Test 4: Photo de Profil (HorseProfile)

**Étapes:**
1. Ouvrir un cheval
2. Survoler la photo de profil
3. Cliquer upload/caméra
4. Sélectionner image
5. Attendre le spinner

**Vérifications:**
- [ ] Photo se met à jour immédiatement
- [ ] URL stockée dans Firestore `horses.image`
- [ ] Icône ☁️ visible à côté du nom du cheval
- [ ] Photo persiste après rafraîchissement
- [ ] Visible sur autre appareil connecté

### Test 5: Compression Images

**Étapes:**
1. Upload une image 4K ou grosse (~5 MB)
2. Vérifier taille fichier dans Firebase Storage Console

**Vérifications:**
- [ ] Fichier compressé à ~200-400 KB
- [ ] Qualité JPEG 70% acceptable
- [ ] Dimensions réduites à max 1024x1024

**Fichier de test:**
```bash
# Créer image de test 2MB
ffmpeg -f lavfi -i color=color=blue:s=3840x2160 -t 1 test.jpg

# Uploader et vérifier taille en Storage
# Attendu: ~150-300 KB après compression
```

---

## 🌐 Tests Production

### Test 6: Performance Galerie

**Étapes:**
1. Upload 50+ photos sur un cheval
2. Ouvrir MediaGallery
3. Scroller dans la galerie
4. Mesurer temps de chargement

**Accepté si:**
- [ ] Galerie charge en <2 secondes (50 photos)
- [ ] Scroll smooth (60 fps sur desktop)
- [ ] Pas de crash même avec 100+ photos
- [ ] Photos affichées progressivement

### Test 7: Offline Handling

**Étapes:**
1. Uploader une photo
2. Ouvrir DevTools → Network → Offline
3. Essayer de supprimer une photo
4. Remettre Online

**Vérifications:**
- [ ] Erreur claire affichée: "No internet"
- [ ] Pas de suppression silencieuse
- [ ] Rétry possible après reconnexion

### Test 8: Permissions & Sécurité

**Étapes:**
1. **Utilisateur A** upload photo sur cheval
2. Se connecter comme **Utilisateur B**
3. Essayer d'accéder aux photos de A (URL directe)
4. Essayer de supprimer via console

**Vérifications:**
- [ ] Utilisateur B voit erreur 403 Forbidden
- [ ] Pas accès photos privées
- [ ] Logs audit Firebase Console

---

## 📊 Vérifications Firebase Console

### Storage
```
gs://apphorse-staging.appspot.com/
├── users/
│   └── [uid1]/
│       └── horses/
│           └── [horseId1]/
│               └── media/
│                   ├── 1704841234_photo1.jpg (150 KB)
│                   └── 1704841235_photo2.jpg (180 KB)
```

**Commandes CLI:**
```bash
# Lister tous les fichiers d'un utilisateur
firebase storage:list gs://apphorse-staging.appspot.com/users/[uid]/

# Vérifier taille
firebase storage:get gs://apphorse-staging.appspot.com/users/[uid]/horses/[horseId]/media/
```

### Firestore
```
users/[uid]/horses/[horseId]/media/
  ├── auto-id-1: {
  │   type: "image",
  │   fileName: "photo.jpg",
  │   url: "https://storage.googleapis.com/.../...",
  │   uploadedAt: Timestamp,
  │   size: 150000
  │ }
```

**Vérifier contenu:**
```javascript
// Console navigateur (sur la page AppHorse)
const db = firebase.firestore();
const photos = await db
  .collection('users')
  .doc('YOUR_UID')
  .collection('horses')
  .doc('HORSE_ID')
  .collection('media')
  .get();

photos.forEach(doc => console.log(doc.data()));
```

---

## 🐛 Debugging

### Enable Console Logs

**En développement:**
```javascript
// cloudPhotoService.js - Déjà plein de logs
console.log('📤 Upload déclaré pour: ...')
console.log('✅ Photo uploadée: ...')
console.error('❌ Erreur upload photo:', error)
```

**Vérifier logs:**
```javascript
// DevTools → Console filtre "upload" ou "photo"
// Chercher ✅ ❌ emojis pour statut
```

### Vérifier Authentication

```javascript
// Console navigateur
const auth = firebase.auth();
console.log('Current user:', auth.currentUser);
console.log('UID:', auth.currentUser?.uid);
```

### Vérifier Firestore Connection

```javascript
// Console navigateur
const db = firebase.firestore();
db.collection('users').limit(1).get().then(snap => {
  console.log('Firestore OK:', snap.docs.length ? '✅' : 'No data');
}).catch(err => {
  console.error('Firestore ERROR:', err);
});
```

### Vérifier Storage Connection

```javascript
// Console navigateur
const storage = firebase.storage();
storage.ref('users').listAll().then(res => {
  console.log('Storage OK:', '✅', res.items.length, 'folders');
}).catch(err => {
  console.error('Storage ERROR:', err);
});
```

---

## 📋 Rapport de Test

### Template pour Documenter Tests

```markdown
## Test Execution Report
**Date:** 2024-01-09
**Tester:** [Nom]
**Browser:** Chrome 121 / Safari 17 / Firefox 121
**Device:** Desktop / Mobile iOS / Mobile Android

### Results
- [x] MediaGallery upload works
- [x] Cross-device sync works
- [x] Profile photo sync works
- [ ] BarometricCamera captures (Not yet implemented)

### Issues Found
- Issue #1: Compression sometimes fails on HEIC images (iPhone only)
  - Fixed: Add format validation
  - Status: ✅ Resolved
  
### Performance
- 50 photos load time: **1.2 seconds** ✅
- Scroll FPS: **55-60 fps** ✅
- Memory usage: **85 MB** ✅

### Recommendations
- [ ] Add pagination for 100+ photos
- [ ] Implement offline queue for uploads
- [ ] Add progress bar for large videos
```

---

## 🚀 Déploiement Production

### Avant Déploiement

```bash
# 1. Build et vérifier pas d'erreurs
npm run build
# Vérifier dossier dist/

# 2. Tester les règles Firestore
firebase emulators:start
# Tester localement avec règles actives

# 3. Vérifier variables d'environnement
echo $VITE_FIREBASE_API_KEY
echo $VITE_FIREBASE_PROJECT_ID

# 4. Lancer tests
npm run test:e2e
```

### Déploiement Firebase Hosting

```bash
# 1. Déployer avec vérification
firebase deploy --only hosting

# 2. Vérifier déploiement
open https://apphorse.web.app

# 3. Test smoke
# - Login
# - Upload une photo
# - Vérifier dans Storage Console
```

### Retour Arrière

```bash
# Si problème majeur
firebase hosting:channel:list
firebase hosting:domain:list

# Revenir à déploiement précédent
firebase hosting:clone [SOURCE_VERSION] [TARGET_VERSION]
```

---

## 📞 Support & Escalation

### Erreur Commune 1: "Permission denied"
```
❌ Error: Permission denied @ firestore.documents['users/uid/horses/hid/media/docid']
```
**Cause:** Mauvaises règles Firestore
**Fix:** Vérifier `firestore.rules` contient:
```
match /users/{userId}/horses/{horseId}/media/{mediaId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### Erreur Commune 2: "Object not found"
```
❌ Storage: Object not found @ 'users/uid/horses/hid/media/...'
```
**Cause:** StorageRef incorrect en Firestore
**Fix:** Vérifier `storageRef` en Firestore pour chaque photo:
```javascript
// Bon format:
"users/uid123/horses/hid456/media/1704841234_photo.jpg"

// Mauvais:
"photos/photo.jpg"  // ❌ Simple path
```

### Escalation Contact
- **Firebase Issues:** Create issue on GitHub or Firebase Support
- **App Issues:** Slack #tech or Email dev@apphorse.app
- **Performance:** Check Firebase Console → Analytics

---

**Last Updated:** 2024-01-09
**Next Review:** After BarometricCamera integration

