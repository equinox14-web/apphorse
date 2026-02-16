# Integration Checklist - Photo History Gallery

**Prêt à intégrer la galerie photos ?** ✅ Tout ce que vous devez faire maintenant

---

## 🎯 Étapes rapides (5 minutes)

### Étape 1: Importer les composants
```jsx
// src/pages/HorsePhotoPage.jsx
import PhotoGallery from '../components/PhotoHistory/PhotoGallery';
import PhotoUpload from '../components/PhotoHistory/PhotoUpload';
import PhotoComparison from '../components/PhotoHistory/PhotoComparison';
import { usePhotoHistory } from '../hooks/usePhotoHistory';
```

### Étape 2: Utiliser dans votre page
```jsx
export default function HorsePhotoPage() {
  const { user } = useAuth();
  const { currentHorse } = useHorse();
  
  return (
    <div>
      <h1>📸 Photos - {currentHorse.name}</h1>
      
      {/* Galerie */}
      <PhotoGallery 
        userId={user.uid}
        horseId={currentHorse.id}
      />
      
      {/* Ajouter une photo */}
      <PhotoUpload
        userId={user.uid}
        horseId={currentHorse.id}
        horseData={currentHorse}
      />
    </div>
  );
}
```

### Étape 3: Tester
```bash
# 1. Ouvrir la page
# 2. Uploader une image (drag-drop ou clic)
# 3. Vérifier dans Firestore console
# 4. Supprimer → confirmation dialog
```

---

## ✅ Vérification Firestore

Votre structure devrait être:
```javascript
horses/
  ├── {userId}/
  │   └── {horseId}/
  │       ├── name: "Mon Cheval"
  │       ├── weight: {...}
  │       ├── bcs: 5.5
  │       └── photos: [        ⬅️ ARRAY
  │           {
  │             id: "photo_123",
  │             url: "https://...",
  │             uploadedAt: "2025-02-16T...",
  │             capturedAt: "2025-02-16T...",
  │             metadata: {
  │               fileName: "...",
  │               notes: "..."
  │             }
  │           }
  │         ]
```

## 🔧 Configuration cloudPhotoService

Vérifiez que `cloudPhotoService` a ces méthodes:
```javascript
// Doit exister et retourner {success, photoId, url, cloudPath}
cloudPhotoService.uploadPhoto(userId, horseId, file, metadata)

// Doit exister
cloudPhotoService.deletePhoto(userId, photoId, cloudPath)
```

Si manquant, créer:
```javascript
// src/services/cloudPhotoService.js
export const uploadPhoto = async (userId, horseId, file, metadata) => {
  // 1. Upload file vers Cloud Storage
  // 2. Générer URL accessible
  // 3. Retourner {success: true, photoId, url, cloudPath}
};

export const deletePhoto = async (userId, photoId, cloudPath) => {
  // 1. Supprimer de Cloud Storage au chemin cloudPath
  // 2. Retourner {success: true}
};
```

## 🚨 Erreurs courantes

### ❌ "Missing userId or horseId"
```jsx
// ❌ MAUVAIS
<PhotoGallery />

// ✅ BON
<PhotoGallery userId={user.uid} horseId={horse.id} />
```

### ❌ "cloudPhotoService is not defined"
```javascript
// Vérifier dans src/services/index.js
export { cloudPhotoService } from './cloudPhotoService.js';
```

### ❌ "Photos array doesn't exist in Firestore"
```javascript
// Upload automatiquement crée l'array, ou manuellement:
db.collection('horses').doc(userId).collection('horses').doc(horseId).update({
  photos: firebase.firestore.FieldValue.arrayUnion({...})
});
```

## 📱 Mobile compatibility

PhotoComparison slider fonctionne en touch:
```javascript
// Automatique avec onTouchMove et onTouchEnd
// Pas besoin de config supplémentaire
```

## 🎨 Styles Tailwind

Tous les composants utilisent Tailwind nativement:
```jsx
// Pas besoin d'imports CSS
// Pas besoin de modules externes
```

## 🔐 Firestore Rules

Ajouter si manquant:
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /horses/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## 💾 Cloud Storage Rules

Fichiers photos à:
```
gs://projet.appspot.com/horses/{userId}/{horseId}/photos/{photoId}
```

Rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /horses/{userId}/{horseId}/photos/{allPaths=**} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId && 
                      request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

## 🔬 Test en localhost

```javascript
// Firestore emulator ready ?
// 1. firebase emulators:start
// 2. Dans votre app init: 
//    connectEmulator('localhost', 5001)
// 3. Photos seront dans emulator
```

## 📊 Performance checklist

- [ ] Images sont lazy-loaded
- [ ] Modal détail ne charge qu'au clic
- [ ] Timeline loads au scroll
- [ ] No memory leaks on unmount
- [ ] Real-time listeners nettoyés

## 🐛 Debug mode

Ajouter en haut de PhotoGallery.jsx:
```javascript
const DEBUG = true; // Set to false for production

useEffect(() => {
  if (DEBUG) {
    console.log('📸 Photos loaded:', photos);
    console.log('🔄 Grouped by month:', photosByMonth);
  }
}, [photos, photosByMonth]);
```

## ✨ Personnalisations courantes

### Afficher seulement les 10 dernières photos
```jsx
<PhotoGallery 
  photos={photos.slice(0, 10)} 
  ...
/>
```

### Changer les icones
```jsx
// Remplacer Lucide icons par autres
import { Heart } from 'lucide-react'; // ou autre lib
```

### Couleurs personnalisées
```jsx
// Remplacer bg-blue-600 par bg-green-600 etc.
className="bg-green-600 hover:bg-green-700"
```

---

## 🚀 Après intégration

1. **Tester tous les modes:**
   - [ ] Grille desktop
   - [ ] Timeline mobile
   - [ ] Upload drag-drop
   - [ ] Upload sélection
   - [ ] Comparaison slider
   - [ ] Comparaison touch

2. **Vérifier real-time sync:**
   - [ ] Uploader depuis device 1
   - [ ] Voir apparaître sur device 2 en temps réel

3. **Tester offline:**
   - [ ] Désactiver réseau
   - [ ] Uploader → devrait queuer
   - [ ] Réactiver réseau → sync auto

4. **Vérifier Firestore:**
   - [ ] Photos array créé
   - [ ] Métadonnées sauvegardées
   - [ ] Cloud Storage rempli

---

**Questions ?**
→ Voir PHOTO_GALLERY_INTEGRATION.md pour doc complète
→ Vérifier les logs console (préfixe 📸, ✅, ❌)
