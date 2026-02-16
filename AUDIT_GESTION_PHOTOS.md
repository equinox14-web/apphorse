# 📸 Audit - Gestion des Photos dans AppHorse

**Date:** 16 février 2026  
**Analyse:** Sauvegarde et synchronisation des photos sur mobile, tablette et PC  

---

## ✅ Vue Générale

L'application **AppHorse** supporte la capture et l'upload de photos sur **3 plateformes** :
- ✅ **Téléphone** (iOS/Android)
- ✅ **Tablette** (iOS/Android)
- ✅ **PC** (Web browser)

Avec **2 modes de sauvegarde** :
- 📱 **Local** (localStorage du navigateur)
- ☁️ **Cloud** (Firebase Storage - optionnel)

---

## 🎯 Fonctionnalités Photos

### 1️⃣ **Galerie Média** (`MediaGallery.jsx`)
**Endpoint:** `/horse/{id}/media`

#### ✅ Fonctionnalités
- ✅ Ajouter des photos
- ✅ Ajouter des vidéos
- ✅ Visualiser en lightbox
- ✅ Supprimer des médias
- ✅ Affichage par grille responsive

#### 📦 Stockage
```javascript
// Local Storage
localStorage.setItem(`horse_media_${horseId}`, JSON.stringify(mediaArray))

// Structure d'un média
{
  id: 1708086400000,
  type: 'image' | 'video',
  url: 'data:image/jpeg;base64,...',  // Base64 encodé
  date: '2026-02-16T10:00:00.000Z',
  name: 'photo_cheval.jpg'
}
```

#### 🎛️ Limites
- Photos: **5 MB max**
- Vidéos: **10 MB max**
- Format: `image/*` ou `video/*`

#### 📝 Code
```jsx
const handleUpload = (e) => {
    const file = e.target.files[0];
    const limit = uploadType === 'image' ? 5000000 : 10000000;
    
    if (file.size > limit) {
        alert(`Fichier trop volumineux`);
        return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
        const newMedia = {
            id: Date.now(),
            type: uploadType,
            url: reader.result,  // Base64
            date: new Date().toISOString(),
            name: file.name
        };
        
        localStorage.setItem(`horse_media_${id}`, JSON.stringify([newMedia, ...media]));
    };
    reader.readAsDataURL(file);
};
```

**Résumé:** ✅ **Fonctionne sur PC/Mobile/Tablette - LocalStorage uniquement**

---

### 2️⃣ **Photo de Profil** (`HorseProfile.jsx`)
**Endpoint:** `/horse/{id}`

#### ✅ Fonctionnalités
- ✅ Upload depuis galerie/appareil photo
- ✅ Compression et redimensionnement auto
- ✅ Aperçu en hover
- ✅ Support `capture="environment"` pour caméra mobile

#### 📦 Stockage
```javascript
// Local Storage
localStorage.setItem('my_horses_v4', JSON.stringify(horsesArray))

// Structure (champ image)
{
  id: 123,
  name: 'Tonnerre',
  image: 'data:image/jpeg;base64,...',  // Base64 encodé
  ...otherFields
}
```

#### 🎯 Compression
```jsx
const resizeImage = (file, callback) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    
    // Max dimensions: 1024x1024
    const MAX_WIDTH = 1024;
    const MAX_HEIGHT = 1024;
    
    // Compress to JPEG 80%
    callback(canvas.toDataURL('image/jpeg', 0.8));
};
```

#### 📱 Support Mobile
```jsx
{/* PC: Browse files */}
<input id="profile-upload" type="file" accept="image/*" onChange={handleImageUpdate} />

{/* Mobile: Camera app */}
<input id="profile-cam" type="file" accept="image/*" capture="environment" onChange={handleImageUpdate} />
```

**Résumé:** ✅ **Fonctionne sur PC/Mobile/Tablette - LocalStorage + Compression**

---

### 3️⃣ **Caméra Poids** (`WeightCamera.jsx`)
**Endpoint:** `/horses/{id}/weight`

#### ✅ Fonctionnalités
- ✅ Capture de photo en temps réel
- ✅ Détection automatique du cheval (ML)
- ✅ Estimation poids à partir de dimensions
- ✅ Sauvegarder la estimé

#### 📦 Stockage
```javascript
// Sauvegardé dans Weight History
localStorage.setItem(`weightHistory_${horseId}`, JSON.stringify({
  id: Date.now(),
  date: '2026-02-16T10:00:00Z',
  value: 450,
  source: 'CAMERA_ESTIMATE'
}))
```

**Résumé:** ✅ **Fonctionne sur PC/Mobile/Tablette - LocalStorage**

---

### 4️⃣ **Caméra Baryométrique** (`BarometricCamera.jsx`)
**Endpoint:** `/horses/{id}/baryometric`

#### ✅ Fonctionnalités
- ✅ Capture 2 photos (profil + dos)
- ✅ ML detection pour alignment
- ✅ Calcul morphométrie
- ✅ Estimation poids avancée

#### 📦 Stockage
```javascript
// Sauvegardé avec mesures
localStorage.setItem(`horseMetrics_${horseId}`, JSON.stringify({
  profilePhoto: 'base64...',
  dorsalPhoto: 'base64...',
  measurements: { barrel: 180, height: 165, ... },
  date: '2026-02-16T10:00:00Z'
}))
```

**Résumé:** ✅ **Fonctionne sur PC/Mobile/Tablette - LocalStorage**

---

### 5️⃣ **Scanner Étiquette** (`LabelScanner.jsx`)
**Endpoint:** `/nutrition/feed-library` (optionnel)

#### ✅ Fonctionnalités
- ✅ Scan photo d'étiquette alimentaire
- ✅ OCR extraction nutrition
- ✅ Reconnaissance IA

#### 📦 Stockage
```javascript
// Stocké dans feed library
localStorage.setItem('feedLibrary', JSON.stringify([{
  id: '1708086400000',
  name: 'Royal Equine Premium',
  photoUrl: 'base64...',
  nutrition: { protein: 12, fiber: 15, ... }
}]))
```

**Résumé:** ✅ **Fonctionne sur PC/Mobile/Tablette - LocalStorage**

---

### 6️⃣ **Messagerie Photos** (`Messaging.jsx`)
**Endpoint:** `/messaging`

#### ✅ Fonctionnalités
- ✅ Upload photos dans les messages
- ✅ Support FirebaseStorage ☁️
- ✅ Affichage image dans chat

#### 📦 Stockage
```javascript
// Firebase Storage
const storageRef = ref(storage, `chat/${channelId}/${Date.now()}_${file.name}`);
await uploadBytes(storageRef, file);
const downloadURL = await getDownloadURL(storageRef);

// Firestore message
{
  channelId: '...',
  senderId: '...',
  type: 'image',
  imageUrl: downloadURL,  // Firebase Storage URL
  timestamp: serverTimestamp()
}
```

**Résumé:** ✅ **Fonctionne sur PC/Mobile/Tablette - Firebase Storage**

---

## 🔄 Synchronisation Firebase

### État Actuel
| Feature | LocalStorage | Firebase Storage | Firebase Firestore |
|---------|--------------|------------------|-------------------|
| MediaGallery | ✅ YES | ❌ NO | ❌ NO |
| HorseProfile | ✅ YES | ❌ NO | ✅ YES (data) |
| WeightCamera | ✅ YES | ❌ NO | ❌ NO |
| Baryometric | ✅ YES | ❌ NO | ❌ NO |
| LabelScanner | ✅ YES | ❌ NO | ❌ NO |
| Messaging | ✅ YES | ✅ **YES** | ✅ YES |

### 📝 Remarques
- ❌ **MediaGallery, WeightCamera, Baryometric:** Sauvegardées **UNIQUEMENT en localStorage**
  - Les photos sont perdues si navigateur cache est effacé
  - Pas de synchronisation avec cloud
  - Données non partagées entre appareils

- ✅ **HorseProfile:** Synchronisé partiellement
  - Image en base64 dans localStorage
  - Horses data synced à Firestore via `syncHorsesToFirestore()`
  - Mais images elles-mêmes NOT dans Firebase Storage

- ✅ **Messaging:** Sauvegardé correctement
  - Photos uploades dans Firebase Storage
  - URLs sauvegardées dans Firestore
  - Partageable et durable

---

## 📊 Matrix Sauvegarde Photos

```
Appareil          → LocalStorage → Firebase Storage → Cloud Backup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Téléphone:
  MediaGallery    ✅            ❌              ❌
  Profile         ✅            ❌              ⚠️ (data only)
  WeightCamera    ✅            ❌              ❌
  Baryometric     ✅            ❌              ❌

Tablette:
  (Identique au téléphone)

PC/Web:
  MediaGallery    ✅            ❌              ❌
  Profile         ✅            ❌              ⚠️ (data only)
  WeightCamera    ✅            ❌              ❌
  Baryometric     ✅            ❌              ❌
```

---

## ⚠️ Problèmes Identifiés

### 🔴 CRITIQUE

#### ❌ Photos NOT Sauvegardées en Cloud
```
Problème: MediaGallery, WeightCamera, Baryometric utilisent UNIQUEMENT localStorage
Renaissances:
  - Si utilisateur clear cache du navigateur → PERTE TOTALE des photos
  - Pas de backup automatique
  - Pas de synchronisation entre appareils
  - Impossibilité d'accéder aux photos sur autre appareil
```

#### ❌ Base64 Inefficace
```javascript
// ACTUELLEMENT (problématique)
const newMedia = {
  url: reader.result,  // "data:image/jpeg;base64,/9j/4AAQSkZ..."
  // ☝️ Très volumineux dans localStorage (~1-3MB par photo)
}

// PROBLÈME: localStorage limit ~5-10MB
// Après 3-5 photos → localStorage PLEIN
```

#### ❌ Pas de Résumé des Photos
```
Problème: Aucun index/preview des photos sur la page principale
          L'utilisateur ne voit pas qu'il a des photos sauf s'il
          va spécifiquement dans MediaGallery
```

---

### 🟡 IMPORTANT

#### ⚠️ Pas d'Upload Caméra Automatique
```
Problème: WeightCamera et Baryometric calculent estimation
         mais ne sauvegardent QUE la valeur, pas la photo prise
         
Décision: Need to clarify - save photos or just metrics?
```

#### ⚠️ Pas de Synchronisation Cross-Device
```
Problème: Si utilisateur utilise mobile ET PC
         Photos sur mobile ≠ Photos sur PC
         (chaque navigateur a son propre localStorage)
```

#### ⚠️ Pas de Suppression Automatique
```
Problème: Photos jamais supprimées automatiquement
         localStorage peut se remplir indéfiniment
```

---

### 🟢 FONCTIONNANT

✅ **Photos sur Téléphone (Galerie)** 
- Input `type="file"` sélectionne photos du téléphone ✅
- Affichage correct ✅
- Suppression fonctionne ✅
- Limite de taille contrôlée ✅

✅ **Photos sur Tablette (Galerie)**
- Fonctionnel identiquement au téléphone ✅
- Interface responsive ✅

✅ **Photos sur PC**
- Upload via drag-drop ou file picker ✅
- Affichage correct ✅
- Fonctionne sur tous les navigateurs ✅

✅ **Appareil Photo (Mobile)**
- `capture="environment"` sur HorseProfile ✅
- WeightCamera accès caméra direct ✅
- BarometricCamera double photo ✅

✅ **Messagerie Photos**
- Upload Firebase Storage fonctionnel ✅
- Cross-device partageable ✅
- Persistance garantie ✅

---

## 🔧 Recommandations

### 🔴 URGENT (Haute Priorité)

#### 1. Migrer MediaGallery vers Firebase Storage
```javascript
// AVANT (localStorage Base64)
const reader = new FileReader();
reader.readAsDataURL(file);  // ❌ Inefficace

// APRÈS (Firebase Storage)
const storageRef = ref(storage, `horse_media/${horseId}/${Date.now()}_${file.name}`);
const result = await uploadBytes(storageRef, file);
const downloadURL = await getDownloadURL(result.ref);

// Firestore
{
  horseId,
  type: 'image',
  url: downloadURL,
  date: serverTimestamp(),
  uploadedBy: userId
}
```

**Bénéfices:**
- ✅ Pas de limite de taille (Firebase: 5GB par fichier)
- ✅ Accessible sur tous les appareils
- ✅ Sauvegarde automatique en cloud
- ✅ Plus rapide (réduction localStorage)

---

#### 2. Implémenter Compression Côté Client
```javascript
// Avant upload à Firebase
const compressImage = async (file) => {
  const canvas = await loadImage(file);
  const compressed = canvas.toBlob(blob => blob, 'image/jpeg', 0.6);
  return compressed;  // ~100KB au lieu de 2MB
};
```

---

#### 3. Stocker Références dans Firestore
```javascript
// Structure Firestore
collection('horses').doc(horseId).collection('media').add({
  type: 'image' | 'video',
  url: 'https://firebasestorage.googleapis.com/...',
  date: serverTimestamp(),
  uploadedBy: userId,
  metadata: {
    size: 234567,
    width: 1024,
    height: 768
  }
});
```

---

### 🟡 IMPORTANT (Moyen Terme)

#### 4. Ajouter Cache Strategy Avancée
```javascript
// Service Worker pour offline access
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('firebasestorage')) {
    event.respondWith(
      caches.open('image-cache-v1').then(cache => 
        cache.match(event.request)
          .then(response => response || fetch(event.request))
      )
    );
  }
});
```

---

#### 5. Afficher Gallerie sur Dashboard
```jsx
// Ajouter dans HorseProfile
<section>
  <h3>Photos Récentes</h3>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
    {recentPhotos.slice(0, 6).map(photo => (
      <img key={photo.id} src={photo.url} style={{ borderRadius: '8px', cursor: 'pointer' }} />
    ))}
  </div>
  <Button>Voir la Galerie Complète</Button>
</section>
```

---

#### 6. Gestion du Quota localStorage
```javascript
// Vérifier capacité avant upload
const getStorageSize = () => {
  let size = 0;
  for (let key in localStorage) {
    size += localStorage[key].length + key.length;
  }
  return size;  // bytes
};

// Si > 80% du quota, prompt pour supprimer
if (getStorageSize() > 8000000) {  // 8MB
  alert('Espace manquant. Supprimez des photos anciennes.');
}
```

---

### 🟢 FUTUR (Nice to Have)

#### 7. Génération de Thumbnails
```javascript
// Petit preview pour galerie
const generateThumbnail = async (file) => {
  const thumbnail = await ImageData.resize(file, {
    width: 150,
    height: 150,
    type: 'image/jpeg',
    quality: 0.5
  });
  return thumbnail;
};
```

---

#### 8. Détection Duplicate Photos
```javascript
// Utiliser hash pour éviter doublons
const getImageHash = async (file) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return hashToHex(hashBuffer);
};
```

---

## 📋 Checklist Vérification

### ✅ Fonctionne Correctement
- [x] Photos depuis galerie (téléphone/tablette/PC)
- [x] Appareil photo (téléphone/tablette)
- [x] Upload manuel (PC)
- [x] Affichage lightbox
- [x] Suppression photos
- [x] Limite de taille

### ❌ À AMÉLIORER
- [ ] Sauvegarde cloud pour MediaGallery
- [ ] Sauvegarde cloud pour WeightCamera
- [ ] Sauvegarde cloud pour Baryometric
- [ ] Synchronisation cross-device
- [ ] Compression automatique
- [ ] Gestion quota localStorage
- [ ] Thumbnail preview
- [ ] Partage photos

### ⚠️ À CLARIFIER
- [ ] Quelle est la politique de rétention des photos?
- [ ] Doivent-elles être accessible offline?
- [ ] Qui peut accéder aux photos partagées?
- [ ] Quelle compression acceptable?

---

## 🎯 Plan d'Action Recommandé

### Phase 1 (URGENT - Cette Semaine)
1. Migrer MediaGallery → Firebase Storage
2. Ajouter compression d'images
3. Implémenter stockage Firestore references

### Phase 2 (Suivant - 2 Semaines)
1. Migrer WeightCamera photos
2. Ajouter cache strategy PWA
3. Implémenter gestion quota

### Phase 3 (Futur - 1 Mois)
1. Thumbnails et preview
2. Détection doublons
3. Partage sécurisé

---

## 🔐 Configuration Firebase Actuelle

### ✅ Storage Rules
```plaintext
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;  // ✅ Utilisateur authentifié requise
    }
  }
}
```

**Status:** ✅ Sécurisé (nécessite authentification)

---

## 📊 Résumé Final

### ✅ Fonctionnalities Vérifiées
| Feature | Mobile 📱 | Tablette 📱 | PC 💻 | Cloud ☁️ |
|---------|-----------|-----------|-------|---------|
| Galerie | ✅ | ✅ | ✅ | ❌ |
| Profile | ✅ | ✅ | ✅ | ⚠️ |
| WeightCam | ✅ | ✅ | ✅ | ❌ |
| Baryometric | ✅ | ✅ | ✅ | ❌ |
| Messagerie | ✅ | ✅ | ✅ | ✅ |

### 🎯 Verdict
```
✅ Capture fonctionne: Oui (tous appareils)
✅ Galerie accès: Oui (téléphone + PC)
✅ Suppression: Oui
❌ Sauvegarde cloud: Partiellement (messagerie seulement)
❌ Cross-device sync: Non (localStorage seulement)
⚠️ Persistance: À risque (cache clear = perte)
```

---

**Document:** Photo Management Audit  
**Créé:** 16 février 2026  
**Status:** ✅ ANALYSE COMPLÈTE
