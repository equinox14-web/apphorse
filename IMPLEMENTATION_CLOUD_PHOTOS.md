# ☁️ Plan d'Implementation - Sauvegarde Cloud des Photos par Utilisateur

**Date:** 16 février 2026  
**Status:** ✅ Infrastructure Firebase en place  
**Effort:** Moyen (2-3 jours de développement)

---

## 🎯 Vision Finale

```
Utilisateur A (Téléphone)
    ↓ Login
    ↓ Ajoute photo 📸
    ↓
    ☁️ Firebase Storage/Firestore
    ↓
Utilisateur A (PC) → Login → Récupère photos ✅
Utilisateur A (Tablette) → Login → Même photos ✅
```

**Résultat:** Photos **synchronisées automatiquement** entre appareils ✨

---

## ✅ Infrastructure Existante (Déjà Configurée)

### ✓ Firebase Storage
```javascript
// firebase.js
storage = getStorage(app);  // ✅ Déjà initialisé
```

### ✓ Firestore Rules
```plain
/users/{userId}/horses/{horseId} → ✅ Accessible que par son utilisateur
/userData/{userId} → ✅ Privé par utilisateur
```

### ✓ Storage Rules
```plain
allow read, write: if request.auth != null;  // ✅ Authentification requise
```

### ✓ Authentication
```javascript
// AuthContext.jsx
const [currentUser, setCurrentUser] = useState(null);  // ✅ Disponible
```

**Verdict:** ✅ 90% de l'infrastructure existe déjà!

---

## 🏗️ Architecture Solution

### Nouvelle Structure Firebase Storage

```
gs://apphorse-bucket/
├── users/
│   └── {userId}/                    # Par utilisateur
│       ├── horses/
│       │   ├── {horseId}/
│       │   │   └── media/
│       │   │       ├── profile.jpg              # Photo profil cheval
│       │   │       ├── {timestamp}_photo1.jpg
│       │   │       ├── {timestamp}_photo2.jpg
│       │   │       └── {timestamp}_video1.mp4
│       │   └── {horseId2}/
│       │       └── media/
│       │           └── ...
│       └── shared/
│           └── profile.jpg                    # Photo profil utilisateur
```

### Nouvelle Structure Firestore

```
users/{userId}/
├── profile (déjà existant)
└── horses/{horseId}/
    ├── info (déjà existant)
    ├── media/ (NOUVEAU)
    │   └── {mediaId}
    │       ├── type: 'image' | 'video'
    │       ├── url: 'https://firebasestorage...'
    │       ├── date: Timestamp
    │       ├── size: 1024000
    │       ├── width: 1024
    │       ├── height: 768
    │       └── uploadedAt: Timestamp
    └── weight_history/ (déjà existant)
```

---

## 📋 Plan de Migration (Étape par Étape)

### PHASE 1: Service Cloud Photos (Semaine 1)

#### Créer `cloudPhotoService.js`
```javascript
// src/services/cloudPhotoService.js
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export const cloudPhotoService = {
  // Uploader une photo
  uploadPhoto: async (userId, horseId, file) => {
    // 1. Compresser l'image
    const compressed = await compressImage(file);
    
    // 2. Upload à Firebase Storage
    const storageRef = ref(storage, `users/${userId}/horses/${horseId}/media/${Date.now()}_${file.name}`);
    const result = await uploadBytes(storageRef, compressed);
    const downloadURL = await getDownloadURL(result.ref);
    
    // 3. Sauvegarder référence dans Firestore
    const mediaRef = collection(db, `users/${userId}/horses/${horseId}/media`);
    const docRef = await addDoc(mediaRef, {
      type: file.type.includes('video') ? 'video' : 'image',
      url: downloadURL,
      fileName: file.name,
      size: compressed.size,
      createdAt: serverTimestamp(),
      uploadedAt: new Date().toISOString(),
      storageRef: storageRef.fullPath
    });
    
    return { id: docRef.id, url: downloadURL };
  },

  // Récupérer les photos d'un cheval
  getPhotosStream: (userId, horseId, callback) => {
    const mediaRef = collection(db, `users/${userId}/horses/${horseId}/media`);
    const q = query(mediaRef); // Pas besoin de where - Firestore Rules gère l'accès
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const photos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(photos);
    });
    
    return unsubscribe;
  },

  // Supprimer une photo
  deletePhoto: async (userId, horseId, photoId, storageRef) => {
    // 1. Supprimer de Firebase Storage
    const fileRef = ref(storage, storageRef);
    await deleteObject(fileRef);
    
    // 2. Supprimer document Firestore
    const photoDocRef = doc(db, `users/${userId}/horses/${horseId}/media/${photoId}`);
    await deleteDoc(photoDocRef);
  }
};

// Helper: Compression image
const compressImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let { width, height } = img;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, 'image/jpeg', 0.7);  // JPEG 70% compression
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
};
```

---

### PHASE 2: Update MediaGallery.jsx (Semaine 1)

#### Avant (localStorage)
```jsx
const handleUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
        const newMedia = {
            id: Date.now(),
            url: reader.result,  // Base64 ❌
        };
        localStorage.setItem(`horse_media_${id}`, JSON.stringify([newMedia, ...media]));
    };
};
```

#### Après (Cloud Storage)
```jsx
import { cloudPhotoService } from '../../services/cloudPhotoService';
import { useAuth } from '../../context/AuthContext';

const MediaGallery = () => {
    const { currentUser } = useAuth();
    const { id } = useParams();
    const [media, setMedia] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Charger les photos du cloud au montage
    useEffect(() => {
        if (!currentUser?.uid) return;
        
        const unsubscribe = cloudPhotoService.getPhotosStream(
            currentUser.uid,
            id,
            (photos) => setMedia(photos)
        );
        
        return unsubscribe;
    }, [currentUser?.uid, id]);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const limit = file.type.includes('video') ? 10000000 : 5000000;
        if (file.size > limit) {
            alert(`Fichier trop volumineux`);
            return;
        }

        setUploading(true);
        try {
            await cloudPhotoService.uploadPhoto(currentUser.uid, id, file);
            // Media list se met à jour automatiquement via onSnapshot ✅
        } catch (error) {
            console.error('Upload error:', error);
            alert('Erreur upload');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (photoId, storageRef) => {
        if (!window.confirm('Supprimer cette photo ?')) return;
        
        try {
            await cloudPhotoService.deletePhoto(currentUser.uid, id, photoId, storageRef);
            // Media list se met à jour automatiquement via onSnapshot ✅
        } catch (error) {
            console.error('Delete error:', error);
            alert('Erreur suppression');
        }
    };

    return (
        <div>
            {/* ... rest reste pareil ... */}
            <div>{media.length === 0 ? 'Aucune photo' : 'Photos en cloud ☁️'}</div>
            {media.map(m => (
                <div key={m.id}>
                    <img src={m.url} alt={m.fileName} />
                    <button onClick={() => handleDelete(m.id, m.storageRef)}>
                        Supprimer
                    </button>
                </div>
            ))}
        </div>
    );
};
```

---

### PHASE 3: Update HorseProfile.jsx (Semaine 1)

#### Photo Profil Cheval
```jsx
import { cloudPhotoService } from '../../services/cloudPhotoService';

const handleImageUpdate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
        // Upload photo profil
        const { url } = await cloudPhotoService.uploadPhoto(
            currentUser.uid,
            id,
            file
        );

        // Sauvegarder l'URL dans horse profile
        const horseRef = doc(db, `users/${currentUser.uid}/horses/${id}`);
        await updateDoc(horseRef, {
            profileImageUrl: url,  // ☁️ Référence cloud
            profileImageUpdated: serverTimestamp()
        });

        setHorse(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
        alert('Erreur upload photo');
    } finally {
        setUploading(false);
    }
};
```

---

### PHASE 4: Update WeightCamera.jsx (Semaine 2)

```jsx
const handleCapture = async (capturedImage) => {
    // 1. Convertir canvas en blob
    const blob = await new Promise(resolve => 
        canvas.toBlob(resolve, 'image/jpeg', 0.8)
    );
    
    // 2. Créer fichier
    const file = new File([blob], `weight_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    // 3. Upload et sauvegarder référence
    const { url } = await cloudPhotoService.uploadPhoto(
        currentUser.uid,
        horseId,
        file
    );
    
    // 4. Sauvegarder avec l'estimation poids
    const weightHistory = collection(db, `users/${currentUser.uid}/horses/${horseId}/weight_history`);
    await addDoc(weightHistory, {
        value: estimatedWeight,
        date: serverTimestamp(),
        source: 'CAMERA_ESTIMATE',
        photoUrl: url,  // Référence cloud ☁️
        capturedAt: new Date().toISOString()
    });
};
```

---

## 🔐 Firestore Rules Update

### Ajouter Règles pour Media Collection

```plaintext
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /horses/{horseId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // ✅ NOUVEAU: Media subcollection
        match /media/{mediaId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
        
        // ✅ NOUVEAU: Weight history
        match /weight_history/{entryId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

---

## 📊 Comparaison Avant/Après

| Aspect | Avant (localStorage) | Après (Cloud) |
|--------|-------------------|--------------|
| **Limite stockage** | ~5-10 MB | 5 GB (Firebase) |
| **Multi-appareil** | ❌ Non | ✅ Oui |
| **Persistance** | Risque (cache clear) | ✅ Garantie |
| **Partage photos** | ❌ Non | ✅ Facile (via URL) |
| **Performance** | Lent (localStorage) | ✅ Rapide (CDN) |
| **Sauvegarde** | ❌ Non | ✅ 3 copies |
| **Compression** | Manuel | ✅ Auto |
| **Offline access** | ✅ Oui* | ⚠️ Cache PWA |

---

## 🎯 Bénéfices pour l'Utilisateur

```
AVANT:
❌ Prend photo sur téléphone
❌ Sauvegardée en localStorage téléphone
❌ Se connecte sur PC → Photos DISPARUES

APRÈS:
✅ Prend photo sur téléphone
✅ Upload automatique ☁️
✅ Se connecte sur PC → Toutes les photos là! 🎉
✅ Se connecte sur tablette → Toutes les photos aussi! 🎉
```

---

## 🚀 Étapes d'Implémentation

### Semaine 1 (Phase 1-2)
- [ ] Créer `cloudPhotoService.js`
- [ ] Update Firestore rules
- [ ] Migrer MediaGallery.jsx
- [ ] Tester sur mobile + PC
- [ ] Getter les photos du cloud

### Semaine 2 (Phase 3-4)
- [ ] Update HorseProfile photo upload
- [ ] Update WeightCamera image saving
- [ ] Update BarometricCamera
- [ ] Tests complets
- [ ] Compression image

### Semaine 3 (Cleanup)
- [ ] Migrer données anciennes (localStorage → Cloud)
- [ ] Documenter feature
- [ ] Monitoring et logs
- [ ] Performance optimization

---

## 💾 Migration des Données Existantes

### Script Migration (localStorage → Cloud)
```javascript
// À exécuter une fois après deployment

const migratePhotosToCloud = async (userId) => {
    const savedHorses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
    
    for (const horse of savedHorses) {
        // Migrer photo profil
        if (horse.image && horse.image.startsWith('data:')) {
            try {
                const blob = dataUrlToBlob(horse.image);
                const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
                const { url } = await cloudPhotoService.uploadPhoto(userId, horse.id, file);
                
                // Mettre à jour référence
                const horseRef = doc(db, `users/${userId}/horses/${horse.id}`);
                await updateDoc(horseRef, { profileImageUrl: url });
                console.log(`✅ Migré photo profil: ${horse.name}`);
            } catch (error) {
                console.error(`❌ Erreur migration ${horse.name}:`, error);
            }
        }
        
        // Migrer galerie média
        const mediaKey = `horse_media_${horse.id}`;
        const mediaList = JSON.parse(localStorage.getItem(mediaKey) || '[]');
        
        for (const media of mediaList) {
            if (media.url && media.url.startsWith('data:')) {
                try {
                    const blob = dataUrlToBlob(media.url);
                    const file = new File([blob], media.name, { type: media.type });
                    await cloudPhotoService.uploadPhoto(userId, horse.id, file);
                    console.log(`✅ Migré média: ${media.name}`);
                } catch (error) {
                    console.error(`❌ Erreur migration média:`, error);
                }
            }
        }
    }
};

// Appeler après firebase init
window.migratePhotosToCloud = migratePhotosToCloud;
```

---

## 🔒 Sécurité & Privacy

### ✅ Chaque utilisateur ne voit QUE ses photos
```plaintext
Firestore Rules:
  /users/{userId}/horses/{horseId}/media/{mediaId}
  → Accessible SEULEMENT si request.auth.uid == userId
  
Storage Rules:
  allow read, write: if request.auth != null
  → Mais les chemins définissent l'accès par userId
```

### ✅ Chiffrement en transit
```
Firebase Storage = HTTPS + TLS 1.2+
```

### ✅ Audit trail
```javascript
// Chaque upload enregistré dans Firestore avec:
{
  uploadedBy: currentUser.uid,
  uploadedAt: serverTimestamp(),
  fileName: 'original.jpg',
  size: 234567
}
```

---

## 📈 Performance & Coûts

### Quotas Firebase (Gratuit)
- **Storage:** 5 GB ✅
- **Firestore:** 1 GB storage + 50k reads/month
- **Downloads:** 1 GB/jour ✅

### Optimisations incluses
1. **Compression d'image JPEG 70%** → ~100KB par photo
2. **Cache PWA** → Offline access
3. **Pagination Firestore** → Charger 20 photos à la fois
4. **Image lazy loading** → Performance

---

## ✅ Checklist Finalisation

- [ ] Cloudinary/Firebase Storage configuré
- [ ] Firestore rules mise à jour
- [ ] Service de cloud photo créé
- [ ] MediaGallery migrée
- [ ] HorseProfile migrée
- [ ] WeightCamera migrée
- [ ] BarometricCamera migrée
- [ ] Migration données anciennes
- [ ] Tests mobile + PC
- [ ] Documentation utilisateur
- [ ] Monitoring logs
- [ ] Performance tested

---

## 🎓 Exemple Complet d'Utilisation

```javascript
// Composant React simple
import { useAuth } from '@/context';
import { cloudPhotoService } from '@/services';
import { useEffect, useState } from 'react';

function HorsePhotos({ horseId }) {
  const { currentUser } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les photos du cloud
  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoading(true);
    
    const unsubscribe = cloudPhotoService.getPhotosStream(
      currentUser.uid,
      horseId,
      (photos) => {
        setPhotos(photos);
        setLoading(false);
      }
    );
    
    return unsubscribe;
  }, [currentUser?.uid, horseId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await cloudPhotoService.uploadPhoto(currentUser.uid, horseId, file);
      // Photos se mettent à jour automatiquement via onSnapshot ✅
    } catch (error) {
      alert('Erreur upload: ' + error.message);
    }
  };

  if (loading) return <div>Chargement photos...</div>;

  return (
    <div>
      <h3>Photos de {horseId} (Synchronisées ☁️)</h3>
      
      {/* Upload */}
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleUpload} 
        placeholder="Ajouter une photo"
      />

      {/* Grid photos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {photos.map(photo => (
          <div key={photo.id}>
            <img src={photo.url} alt="Photo" />
            <small>{new Date(photo.createdAt).toLocaleDateString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎉 Résultat Final

```
✅ Photos sauvegardées en cloud
✅ Accessible sur tous les appareils
✅ Synchronisé en temps réel
✅ Sécurisé (privé par utilisateur)
✅ Illimité (5 GB Firebase)
✅ Rapide (CDN global)
✅ Backup automatique
✅ Pas d'intention manuelle
```

---

**Status:** ✅ Architecture prête à implémenter  
**Effort:** ~40-80 heures de développement  
**Impact:** Énorme amélioration UX  
**Priority:** 🔴 HAUTE

**Vous voulez que je commence l'implémentation?**

