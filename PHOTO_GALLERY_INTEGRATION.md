# Photo History Gallery - Guide d'Intégration

> Phase 2: Historique et galerie de photos avec comparaison avant/après

## 📦 Fichiers créés

| Fichier | Type | Lignes | Description |
|---------|------|--------|-------------|
| `src/hooks/usePhotoHistory.js` | Hook | 280 | Gestion des photos (load, upload, delete) |
| `src/components/PhotoHistory/PhotoGallery.jsx` | Composant | 400+ | Galerie grille/timeline avec filtrage |
| `src/components/PhotoHistory/PhotoUpload.jsx` | Composant | 280+ | Upload drag-drop avec metadata |
| `src/components/PhotoHistory/PhotoComparison.jsx` | Composant | 300+ | Slider avant/après avec stat |

## 🎯 Fonctionnalités

### 1️⃣ Galerie Photos (PhotoGallery)
- ✅ Affichage grille responsive (2-4 colonnes selon l'écran)
- ✅ Vue Timeline chronologique avec regroupement par mois
- ✅ Barre de recherche (date, nom, notes)
- ✅ Filtrage par mois avec expand/collapse
- ✅ Modal détail photo avec metadata complète
- ✅ Suppression avec confirmation
- ✅ Badges avec date de capture

**Props:**
```jsx
<PhotoGallery 
  userId={userId} 
  horseId={horseId}
  compact={false}  // Mode compact pour mobile
/>
```

### 2️⃣ Upload Photo (PhotoUpload)
- ✅ Drag & drop (glisser-déposer)
- ✅ Sélecteur fichier classique
- ✅ Validation format (JPEG/PNG) et taille (max 10MB)
- ✅ Prévisualisation avant upload
- ✅ Métadonnées:
  - 📅 Date de capture
  - ⚖️ Poids snapshot
  - 📊 BCS snapshot
  - 📝 Notes libres

**Props:**
```jsx
<PhotoUpload 
  userId={userId} 
  horseId={horseId}
  horseData={{
    currentWeight: 450,
    bcs: 5.5
  }}
  onSuccess={() => console.log('uploaded')}
  compact={false}
/>
```

### 3️⃣ Comparaison Avant/Après (PhotoComparison)
- ✅ Slider interactif glissable (souris + touch)
- ✅ Boutons de navigation rapide (-10%, +10%)
- ✅ Affichage % de progression
- ✅ Comparaison metadata (poids, BCS)
- ✅ Calcul du changement de poids
- ✅ Affichage dates

**Props:**
```jsx
<PhotoComparison 
  beforePhoto={{
    url: 'https://...',
    weight: 450,
    bcs: 5.0,
    capturedAt: '2025-01-01'
  }}
  afterPhoto={{
    url: 'https://...',
    weight: 460,
    bcs: 5.5,
    capturedAt: '2025-02-01'
  }}
  beforeLabel="Janvier"
  afterLabel="Février"
  compact={false}
/>
```

### 4️⃣ Hook usePhotoHistory
- ✅ Chargement real-time avec listeners Firestore
- ✅ Upload avec cloudPhotoService
- ✅ Suppression cloud + Firestore
- ✅ Recherche et filtrage
- ✅ Regroupement par mois
- ✅ Fallback localStorage

**Usage:**
```jsx
const {
  photos,              // Array de photos
  photosByMonth,       // Array {monthKey, month, count, photos}
  totalPhotos,         // Nombre total
  loading,             // Booléen
  error,               // Message erreur ou null
  uploading,           // Booléen
  uploadPhoto,         // fn(file, metadata)
  deletePhoto,         // fn(photoId)
  searchPhotos,        // fn(query)
  refetch              // fn()
} = usePhotoHistory(userId, horseId);
```

## 🚀 Intégration dans une page

### Exemple complet: Page Historique Photos

**`src/pages/PhotoHistoryPage.jsx`**
```jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHorse } from '../contexts/HorseContext';
import PhotoGallery from '../components/PhotoHistory/PhotoGallery';
import PhotoUpload from '../components/PhotoHistory/PhotoUpload';
import PhotoComparison from '../components/PhotoHistory/PhotoComparison';
import { usePhotoHistory } from '../hooks/usePhotoHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';

export default function PhotoHistoryPage() {
  const { user } = useAuth();
  const { currentHorse } = useHorse();
  const { photos } = usePhotoHistory(user?.uid, currentHorse?.id);
  
  const [selectedPhotos, setSelectedPhotos] = useState([null, null]);

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          🖼️ Historique photos - {currentHorse?.name}
        </h1>
        <p className="text-gray-600">
          Suivi visuel de l'évolution de votre cheval
        </p>
      </div>

      <Tabs defaultValue="galerie" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="galerie">Galerie</TabsTrigger>
          <TabsTrigger value="upload">Ajouter</TabsTrigger>
          <TabsTrigger value="comparaison">Comparaison</TabsTrigger>
        </TabsList>

        {/* Tab 1: Galerie */}
        <TabsContent value="galerie" className="space-y-4">
          <PhotoGallery 
            userId={user?.uid}
            horseId={currentHorse?.id}
          />
        </TabsContent>

        {/* Tab 2: Upload */}
        <TabsContent value="upload" className="space-y-4">
          <PhotoUpload
            userId={user?.uid}
            horseId={currentHorse?.id}
            horseData={{
              currentWeight: currentHorse?.weight?.current,
              bcs: currentHorse?.bcs
            }}
            onSuccess={() => alert('Photo uploadée !')}
          />
        </TabsContent>

        {/* Tab 3: Comparaison */}
        <TabsContent value="comparaison" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Sélecteur avant */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Photo avant
              </label>
              <select
                value={selectedPhotos[0]?.id || ''}
                onChange={(e) => {
                  const photo = photos.find(p => p.id === e.target.value);
                  setSelectedPhotos([photo, selectedPhotos[1]]);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Sélectionner une photo...</option>
                {photos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.fileName} - {p.date}
                  </option>
                ))}
              </select>
            </div>

            {/* Sélecteur après */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Photo après
              </label>
              <select
                value={selectedPhotos[1]?.id || ''}
                onChange={(e) => {
                  const photo = photos.find(p => p.id === e.target.value);
                  setSelectedPhotos([selectedPhotos[0], photo]);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Sélectionner une photo...</option>
                {photos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.fileName} - {p.date}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparaison */}
          {selectedPhotos[0] && selectedPhotos[1] ? (
            <PhotoComparison
              beforePhoto={selectedPhotos[0]}
              afterPhoto={selectedPhotos[1]}
              beforeLabel="Avant"
              afterLabel="Après"
            />
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                📸 Sélectionnez deux photos pour les comparer
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## 📋 Intégration Firestore Schema

Le hook `usePhotoHistory` s'attend à cette structure dans Firestore:

```javascript
horses/{userId}/{horseId}
  └─ photos: [
      {
        id: "photo_123",
        url: "https://storage.googleapis.com/...",
        cloudPath: "horses/{userId}/{horseId}/photos/photo_123",
        uploadedAt: "2025-02-16T10:30:00Z",
        capturedAt: "2025-02-16T10:00:00Z",
        metadata: {
          fileName: "profil_cheval.jpg",
          size: 2048576,
          mimeType: "image/jpeg",
          notes: "Profil pour suivi BCS"
        },
        horseDataSnapshot: {
          weight: 450,
          bcs: 5.5
        }
      }
    ]
```

## 🔗 Dépendances

### Services utilisés
- `firestoreService`: Real-time listeners + CRUD
- `cloudPhotoService`: Upload/delete cloud storage

### Contextes requis
```jsx
<AuthContext>    // user.uid
<HorseContext>   // currentHorse.id
```

### Composants UI (Lucide)
```jsx
import {
  Grid,           // Icône grille
  Search,         // Icône recherche
  X,              // Icône fermer
  Trash2,         // Icône supprimer
  Calendar,       // Icône calendar
  Weight,         // Icône poids
  Zap,            // Icône BCS
  ChevronDown,    // Icône chevron
  ChevronUp,      // Icône chevron
  ChevronLeft,    // Icône gauche
  ChevronRight,   // Icône droite
  Camera,         // Icône camera
  Upload,         // Icône upload
  AlertCircle,    // Icône alerte
  CheckCircle     // Icône check
} from 'lucide-react';
```

## 🚫 Cas d'erreur

### Erreur upload
```html
❌ Erreur uploadPhoto: File is too large
❌ Erreur uploadPhoto: Missing userId or horseId
❌ Erreur loading photos: Network error
```

### Fallback localStorage
Le hook bascule automatiquement si Firestore est indisponible:
```javascript
localStorage.getItem(`horse_media_${horseId}`)
```

## 📊 Performance

| Aspect | Valeur | Notes |
|--------|--------|-------|
| Rechargement | Real-time | Listeners Firestore |
| Taille max | 10 MB | Validation client |
| Images | JPG/PNG | Support natif |
| Responsive | ✅ | 2-4 colonnes selon écran |
| Touch | ✅ | Slider deux-doigts |

## 🎨 Personnalisation

### Couleurs Tailwind
```jsx
// Bouton upload
className="bg-blue-600 hover:bg-blue-700"

// Bouton supprimer
className="bg-red-500 hover:bg-red-600"

// Badge date
className="bg-black/70 text-white"
```

### Responsive breakpoints
```jsx
// Grille
grid-cols-2 sm:grid-cols-3 md:grid-cols-4

// Formulaire
grid-cols-1 md:grid-cols-2
```

## ✅ Checklist d'intégration

- [ ] Importer usePhotoHistory dans les pages/composants
- [ ] Importer PhotoGallery, PhotoUpload, PhotoComparison
- [ ] Vérifier userId et horseId disponibles
- [ ] Tester upload avec fichier local
- [ ] Tester suppression avec confirmation
- [ ] Tester comparaison avec deux photos
- [ ] Valider sur mobile (touch slider)
- [ ] Tester mode offline (localStorage)
- [ ] Vérifier Firestore rules pour photos
- [ ] Configurer CloudStorage quotas

## 🔐 Sécurité Firestore Rules

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Photos visibles uniquement au propriétaire
    match /horses/{userId}/{horseId} {
      allow read, write: if request.auth.uid == userId;
      
      match /photos/{photoId} {
        // L'array photos est géré dans le parent
      }
    }
  }
}
```

## 📡 Événements logging

Chaque action est loggée dans Firestore:
```javascript
// Automatic logging in:
settings/{userId}/events
  └─ type: "photo_uploaded" | "photo_deleted"
  └─ timestamp: ...
  └─ horseId: ...
  └─ photoId: ...
```

## 🐛 Debugging

### Vérifier les photos en localStorage
```javascript
localStorage.getItem(`horse_media_${horseId}`)
```

### Afficher les listeners actifs
```javascript
firestoreService.REAL_TIME_LISTENERS
```

### Vérifier le statut upload
```javascript
// Console affiche:
✅ Photo uploadée: photo_123
📸 3 photos chargées
🔄 Photos mises à jour: 4
```

---

**Prochaines étapes:**
1. ✅ Créer les composants (FAIT)
2. → Intégrer dans une page exemple
3. → Tester sur mobile
4. → Optimiser les images (compression)
5. → Ajouter les tests unitaires
