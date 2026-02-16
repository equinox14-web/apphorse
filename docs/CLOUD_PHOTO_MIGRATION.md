# 🌍 Migration des Photos vers le Cloud (Firebase)

## Aperçu Général

AppHorse passe de la sauvegarde locale des photos (localStorage) à la sauvegarde dans le cloud Firebase. Cela signifie:

✅ **Vos photos sont maintenant sauvegardées en cloud**
✅ **Accès à vos photos sur tous vos appareils**
✅ **Pas de perte de données si vous videz le cache**
✅ **Partage plus facile des photos d'équitation**

## Avant vs Après

### AVANT (localStorage)
```
❌ Photos stockées uniquement en mémoire locale (Base64)
❌ Taille limite ~5-10 MB par cheval
❌ Pas de synchronisation entre appareils
❌ Perte de photos si cache navigateur vidé
❌ Taille fichier importante (Base64 encoding inefficace)
```

### APRÈS (Firebase Cloud)
```
✅ Photos stockées dans Firebase Cloud Storage
✅ Espace illimité (sauf limite de compte Firebase)
✅ Synchronisation automatique entre appareils
✅ Accès sécurisé via authentification
✅ Compression automatique (JPEG 70%, max 1024x1024)
✅ Métadonnées sauvegardées dans Firestore
✅ Suppression facile avec gestion cohérente
```

## Fonctionnalités Impactées

### 1️⃣ Galerie Média (MediaGallery.jsx)

**Nouvelle structure:**
```
users/{userId}/horses/{horseId}/media/
  ├── {timestamp}_{nom_fichier}.jpg
  ├── {timestamp}_{nom_fichier}.mp4
  └── ...
```

**Changements:**
- ✅ Upload photos et vidéos en cloud
- ✅ Affichage en temps réel avec Firestore listener
- ✅ Suppression depuis le cloud (Storage + Firestore)
- ✅ Interface améliorée avec statut de chargement
- ✅ Compression automatique des images avant upload

**Utilisation:**
```jsx
import { cloudPhotoService } from '@/services';
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { currentUser } = useAuth();
  
  // Upload une photo
  const result = await cloudPhotoService.uploadPhoto(
    currentUser.uid,
    horseId,
    file  // File object depuis <input type="file">
  );
  
  // result contient: { id, url, fileName, type }
}
```

### 2️⃣ Profil du Cheval (HorseProfile.jsx)

**Nouvelle structure:**
```
users/{userId}/horses/{horseId}/profile/
  └── {timestamp}_profile.jpg
```

**Changements:**
- ✅ Upload photo de profil en cloud
- ✅ URL stockée dans Firestore (horse.image)
- ✅ Synchronisation avec Firebase
- ✅ Indicateur visuellement ☁️ dans le titre
- ✅ Loader pendant upload

**Avant:**
```javascript
// Vieille méthode (localStorage)
horse.image = resizeImage(file);  // Base64 string
```

**Après:**
```javascript
// Nouvelle méthode (Cloud)
const result = await cloudPhotoService.uploadProfilePhoto(
  currentUser.uid,
  horseId,
  file
);
horse.image = result.url;  // URL cloud
```

### 3️⃣ Photos de Poids (WeightTracking + BarometricCamera)

**À venir - Structure planifiée:**
```
users/{userId}/horses/{horseId}/media/
  └── weight_{timestamp}.jpg
```

**Intégration future:**
- Capturer photo de profil/arrière du cheval
- Upload automatique en cloud
- Association avec l'entrée de poids
- Référence dans Firestore: `weightEntry.photoUrl`

## API cloudPhotoService

```javascript
export const cloudPhotoService = {
  /**
   * Upload une photo vers le cloud
   * @param {string} userId - UID Firebase
   * @param {string} horseId - ID du cheval
   * @param {File} file - Fichier image/vidéo
   * @returns {Promise<{id, url, fileName, type}>}
   */
  uploadPhoto: async (userId, horseId, file) => {...},

  /**
   * Écouter les photos d'un cheval en temps réel
   * @param {string} userId - UID Firebase
   * @param {string} horseId - ID du cheval
   * @param {Function} callback - Appelé avec Array<photo>
   * @returns {Function} Non-subscribe function
   */
  getPhotosStream: (userId, horseId, callback) => {...},

  /**
   * Supprimer une photo du cloud
   * @param {string} userId - UID Firebase
   * @param {string} horseId - ID du cheval
   * @param {string} photoId - ID du document Firestore
   * @param {string} storageRef - Chemin complet dans Storage
   */
  deletePhoto: async (userId, horseId, photoId, storageRef) => {...},

  /**
   * Upload photo de profil du cheval
   * @param {string} userId - UID Firebase
   * @param {string} horseId - ID du cheval
   * @param {File} file - Image du profil
   * @returns {Promise<{url, ...}>}
   */
  uploadProfilePhoto: async (userId, horseId, file) => {...},
};
```

## Structure Firestore

### Collection: `users/{userId}/horses/{horseId}/media/`

```json
{
  "type": "image",
  "fileName": "photo_galop.jpg",
  "size": 245000,
  "mimeType": "image/jpeg",
  "url": "https://storage.googleapis.com/.../photo_galop.jpg",
  "storageRef": "users/uid123/horses/horse456/media/1704841234_photo_galop.jpg",
  "uploadedAt": "2024-01-09T10:30:45Z",
  "uploadedBy": "uid123",
  "createdAt": "2024-01-09T10:30:45Z"
}
```

## Règles de Sécurité Firebase

### Firestore Rules (firestore.rules)
```
match /users/{userId}/horses/{horseId}/media/{mediaId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### Storage Rules (storage.rules)
```
match /users/{userId}/horses/{horseId}/media/{allFiles=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

**Signification:**
✅ Chaque utilisateur ne peut voir/modifier que ses propres photos
✅ Photos authentifiées uniquement
✅ Pas d'accès public

## Compression & Optimisation

Chaque image est automatiquement compressée avant upload:

```javascript
const compressImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionner à max 1024x1024
        // JPEG 70% qualité
        // Résultat: 50-300 KB vs 1-3 MB original
      };
    };
  });
};
```

## Limitations & Quotas Firebase

### Plan Spark (Gratuit)
- **Storage:** 10 GB total
- **Firestore:** 1 GB stockage + 50K lectures/jour
- **Download:** 1 GB/jour

### Plan Blaze (Pay-as-you-go)
- **Storage:** $0.18/GB stockage
- **Firestore:** $0.06/100K lectures
- **Download:** $0.12/GB

**Estimation pour AppHorse:**
- 100 chevaux × 50 photos = 5000 photos
- Taille moyenne: 150 KB compressé = 750 MB
- Firestore: ~5000 documents = 0.006 GB ✅

## Troubleshooting

### ❌ "Photo n'a pas uploadé"
**Causes possibles:**
- Pas authentifié → Vérifiez `currentUser`
- Fichier trop volumineux → Max 50 MB vidéo, 5 MB image
- Connection Internet → Vérifiez WiFi/4G
- Quota Firebase dépassé → Vérifiez plan Firebase

**Solution:**
```javascript
try {
  await cloudPhotoService.uploadPhoto(userId, horseId, file);
} catch (err) {
  console.error('Upload failed:', err.message);
  // Afficher message d'erreur utilisateur
}
```

### ❌ "Photos ne se synchronisent pas entre appareils"
**Causes:**
- Utilisateurs différents → Même compte requis
- Offline → Vérifiez connection
- Firestore non mise à jour → Attendez 5 secondes

**Solution:**
```javascript
// Ajouter listener Firestore dans useEffect
useEffect(() => {
  const unsubscribe = cloudPhotoService.getPhotosStream(
    userID,
    horseId,
    setPhotos
  );
  return unsubscribe;
}, [userId, horseId]);
```

### ❌ "Impossible de supprimer une photo"
**Causes:**
- Pas propriétaire → Vérifiez `currentUser.uid`
- Storage ref incorrect → Vérifiez `storageRef` en Firestore
- Erreur permission → Vérifiez rules Firestore/Storage

**Solution:**
```javascript
await cloudPhotoService.deletePhoto(
  currentUser.uid,
  horseId,
  photoId,
  storageRef  // crucial!
);
```

## Plan de Migration Progressif

### Phase 1: Déjà Complétée ✅
- ✅ CloudPhotoService créé
- ✅ MediaGallery.jsx migrée
- ✅ HorseProfile.jsx migrée
- ✅ Firestore + Storage rules mises à jour

### Phase 2: En Développement 🔄
- 🔄 WeightTracking + BarometricCamera
- 🔄 Migration des anciennes photos localStorage → cloud
- 🔄 Tests cross-device

### Phase 3: À Venir 📅
- 📅 OCRLabelScanner cloud images
- 📅 Partage photos entre utilisateurs
- 📅 Compression intelligente (WebP, héic)
- 📅 Galerie optimisée avec pagination

## Exemple Complet d'Intégration

```jsx
import { useState, useEffect } from 'react';
import { cloudPhotoService } from '@/services';
import { useAuth } from '@/context/AuthContext';

function PhotoGallery({ horseId }) {
  const { currentUser } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Écouter les photos en temps réel
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = cloudPhotoService.getPhotosStream(
      currentUser.uid,
      horseId,
      setPhotos
    );

    return unsubscribe;
  }, [currentUser?.uid, horseId]);

  // Uploader une photo
  const handleUpload = async (file) => {
    if (!currentUser?.uid) {
      alert('Authentification requise');
      return;
    }

    setUploading(true);
    try {
      const result = await cloudPhotoService.uploadPhoto(
        currentUser.uid,
        horseId,
        file
      );
      console.log('Photo uploadée:', result.url);
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  // Supprimer une photo
  const handleDelete = async (photoId, storageRef) => {
    try {
      await cloudPhotoService.deletePhoto(
        currentUser.uid,
        horseId,
        photoId,
        storageRef
      );
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => handleUpload(e.target.files[0])}
        disabled={uploading}
      />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {photos.map(photo => (
          <div key={photo.id}>
            <img src={photo.url} alt={photo.fileName} />
            <button onClick={() => handleDelete(photo.id, photo.storageRef)}>
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Prochaines Étapes

1. **Tester la galerie media** sur mobile et desktop
2. **Vérifier la synchronisation** entre appareils (2 onglets)
3. **Finaliser WeightTracking** avec upload d'images
4. **Migration des anciennes photos** depuis localStorage

---

**Dernière mise à jour:** 2024-01-09
**Statut:** En développement actif
**Support:** Dans `docs/` ou discord #tech

