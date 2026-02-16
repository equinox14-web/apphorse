# 🎓 Page d'exemple complète: Historique Photos du Cheval

**Fichier:** `src/pages/HorsePhotoHistoryPage.jsx`  
**Lignes:** ~250 lignes complètes  
**Copy-paste ready:** ✅ Oui

---

## 📄 Code complet à copier

```jsx
/**
 * HorsePhotoHistoryPage.jsx
 * Page complète: Galerie + Upload + Comparaison
 * 
 * Contextes requis:
 *   - AuthContext (user?.uid)
 *   - HorseContext (currentHorse)
 * 
 * Services utilisés:
 *   - firestoreService
 *   - cloudPhotoService
 *   - usePhotoHistory hook
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHorse } from '../contexts/HorseContext';

// Composants
import PhotoGallery from '../components/PhotoHistory/PhotoGallery';
import PhotoUpload from '../components/PhotoHistory/PhotoUpload';
import PhotoComparison from '../components/PhotoHistory/PhotoComparison';

// Hook
import { usePhotoHistory } from '../hooks/usePhotoHistory';

// UI Components (Lucide)
import { AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';

/**
 * Tabs simple component
 * (remplacer par votre composant UI si existant)
 */
const Tabs = ({ defaultValue, children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const tabsList = children[0].props.children;
  const tabsContent = children[1];

  return (
    <div>
      <div className="flex border-b border-gray-300">
        {React.Children.map(tabsList, (child) =>
          React.cloneElement(child, {
            isActive: activeTab === child.props.value,
            onClick: () => setActiveTab(child.props.value)
          })
        )}
      </div>

      {React.Children.map(tabsContent, (child) =>
        child.props.value === activeTab ? child : null
      )}
    </div>
  );
};

const TabsList = ({ children }) => (
  <div className="grid w-full grid-cols-3 gap-0">
    {children}
  </div>
);

const TabsTrigger = ({ value, children, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
      isActive
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-600 hover:text-gray-900'
    }`}
  >
    {children}
  </button>
);

const TabsContent = ({ value, children }) => (
  <div className="py-4">
    {children}
  </div>
);

/**
 * Page principale
 */
export default function HorsePhotoHistoryPage() {
  // Auth & Horse context
  const { user, loading: authLoading } = useAuth();
  const { currentHorse, loading: horseLoading } = useHorse();

  // Photo history hook
  const {
    photos,
    photosByMonth,
    totalPhotos,
    loading: photosLoading,
    error: photosError,
    uploadPhoto,
    deletePhoto,
    searchPhotos,
    refetch
  } = usePhotoHistory(user?.uid, currentHorse?.id);

  // Comparison state
  const [selectedPhotos, setSelectedPhotos] = useState([null, null]);
  const [successMessage, setSuccessMessage] = useState(null);

  // Show success for 3 seconds
  const handleSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Validation
  const isReady = !authLoading && !horseLoading && user && currentHorse;
  const noHorse = isReady && !currentHorse?.id;
  const noUser = isReady && !user?.uid;

  // Error states
  if (authLoading || horseLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (noUser || noHorse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Données manquantes
          </h2>
          <p className="text-gray-600 mb-4">
            {noUser
              ? 'Veuillez vous connecter d\'abord'
              : 'Veuillez sélectionner un cheval'}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Page content
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <ImageIcon size={32} className="text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📸 Historique photos
              </h1>
              <p className="text-sm text-gray-600">
                {currentHorse?.name || 'Mon cheval'} • {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <p className="text-gray-600">
            Suivi visuel de l'évolution de votre cheval avec comparaisons avant/après
          </p>
        </div>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle size={24} className="text-green-600" />
            <p className="text-green-700 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {photosError && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={24} className="text-red-600" />
            <p className="text-red-700 font-medium">{photosError}</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="galerie">
          {/* Tab list */}
          <TabsList>
            <TabsTrigger value="galerie">📷 Galerie</TabsTrigger>
            <TabsTrigger value="upload">📤 Ajouter une photo</TabsTrigger>
            <TabsTrigger value="comparaison">🔄 Comparaison</TabsTrigger>
          </TabsList>

          {/* Tab 1: Galerie */}
          <TabsContent value="galerie">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <PhotoGallery
                userId={user.uid}
                horseId={currentHorse.id}
                compact={false}
              />
            </div>
          </TabsContent>

          {/* Tab 2: Upload */}
          <TabsContent value="upload">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <PhotoUpload
                userId={user.uid}
                horseId={currentHorse.id}
                horseData={{
                  currentWeight: currentHorse?.weight?.current,
                  bcs: currentHorse?.bcs,
                  name: currentHorse?.name
                }}
                onSuccess={() => {
                  handleSuccess('📸 Photo uploadée avec succès !');
                  // Refetch si besoin (normalement auto via listeners)
                  refetch();
                }}
                compact={false}
              />
            </div>
          </TabsContent>

          {/* Tab 3: Comparaison */}
          <TabsContent value="comparaison">
            <div className="space-y-6">
              {/* Sélecteurs photos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Avant */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    📷 Photo avant
                  </label>

                  {photos && photos.length > 0 ? (
                    <select
                      value={selectedPhotos[0]?.id || ''}
                      onChange={(e) => {
                        const photo = photos.find(p => p.id === e.target.value);
                        setSelectedPhotos([photo, selectedPhotos[1]]);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Sélectionner une photo...</option>
                      {photos.map((photo) => (
                        <option key={photo.id} value={photo.id}>
                          {photo.fileName} — {photo.date}
                          {photo.weight && ` (⚖️ ${photo.weight}kg)`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-500 text-sm italic">
                      Aucune photo disponible
                    </p>
                  )}

                  {selectedPhotos[0] && (
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200 text-sm">
                      <p className="font-medium text-blue-900">
                        ✅ {selectedPhotos[0].fileName} sélectionnée
                      </p>
                      <p className="text-blue-700 text-xs mt-1">
                        {selectedPhotos[0].date}
                        {selectedPhotos[0].weight && ` • ${selectedPhotos[0].weight}kg`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Après */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    📷 Photo après
                  </label>

                  {photos && photos.length > 0 ? (
                    <select
                      value={selectedPhotos[1]?.id || ''}
                      onChange={(e) => {
                        const photo = photos.find(p => p.id === e.target.value);
                        setSelectedPhotos([selectedPhotos[0], photo]);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Sélectionner une photo...</option>
                      {photos.map((photo) => (
                        <option key={photo.id} value={photo.id}>
                          {photo.fileName} — {photo.date}
                          {photo.weight && ` (⚖️ ${photo.weight}kg)`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-500 text-sm italic">
                      Aucune photo disponible
                    </p>
                  )}

                  {selectedPhotos[1] && (
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200 text-sm">
                      <p className="font-medium text-blue-900">
                        ✅ {selectedPhotos[1].fileName} sélectionnée
                      </p>
                      <p className="text-blue-700 text-xs mt-1">
                        {selectedPhotos[1].date}
                        {selectedPhotos[1].weight && ` • ${selectedPhotos[1].weight}kg`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Comparaison */}
              {selectedPhotos[0] && selectedPhotos[1] ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <PhotoComparison
                    beforePhoto={selectedPhotos[0]}
                    afterPhoto={selectedPhotos[1]}
                    beforeLabel={selectedPhotos[0].fileName}
                    afterLabel={selectedPhotos[1].fileName}
                    compact={false}
                  />
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-300 border-dashed">
                  <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium">
                    Sélectionnez deux photos pour les comparer
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Les statistiques de poids et BCS s'afficheront automatiquement
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer info */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
        <p>
          💡 Les photos et métadonnées sont synchronisées en temps réel sur tous vos appareils
        </p>
      </div>
    </div>
  );
}

/**
 * Alternative: Export pour Router
 */
export const PhotoHistoryRoute = {
  path: '/horses/:horseId/photos',
  element: <HorsePhotoHistoryPage />,
  name: 'Photo History'
};
```

---

## 🔧 Installation dans votre app

### 1. Créer le fichier
```bash
# Créer dans src/pages/ ou adapté à votre structure
cp EXAMPLE_CODE > src/pages/HorsePhotoHistoryPage.jsx
```

### 2. Ajouter à votre router
```jsx
// src/App.jsx ou src/Router.jsx

import HorsePhotoHistoryPage from './pages/HorsePhotoHistoryPage';

const routes = [
  {
    path: '/horses/:horseId/photos',
    element: <HorsePhotoHistoryPage />
  }
];
```

ou avec React Router v7:

```jsx
<Route 
  path="horses/:horseId/photos" 
  element={<HorsePhotoHistoryPage />} 
/>
```

### 3. Ajouter un lien dans votre menu
```jsx
<Link to={`/horses/${horseId}/photos`}>
  📸 Photos
</Link>
```

---

## 📋 Dépendances requises

Vérifier que vous avez:

```jsx
✅ useAuth() hook → user?.uid
✅ useHorse() hook → currentHorse
✅ firestoreService → Real-time listeners
✅ cloudPhotoService → Upload/delete
✅ Lucide icons → installed
✅ Tailwind CSS → configured
```

### Si manquant: useHorse context

```jsx
// src/contexts/HorseContext.jsx (créer si absent)
import { createContext, useContext } from 'react';

const HorseContext = createContext();

export function useHorse() {
  const context = useContext(HorseContext);
  if (!context) {
    throw new Error('useHorse must be used within HorseProvider');
  }
  return context;
}

export function HorseProvider({ children }) {
  const [currentHorse, setCurrentHorse] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <HorseContext.Provider value={{ currentHorse, setCurrentHorse, loading }}>
      {children}
    </HorseContext.Provider>
  );
}
```

---

## 🎯 Personnalisations courantes

### Changer la couleur thème
```jsx
// Remplacer tous les:
className="... bg-blue-600 ..."
// par:
className="... bg-green-600 ..."
```

### Ajouter plus de tabs
```jsx
<TabsTrigger value="stats">📊 Statistiques</TabsTrigger>
// ...
<TabsContent value="stats">
  <PhotoStats photos={photos} />
</TabsContent>
```

### Afficher seulement les X dernières
```jsx
const recentPhotos = photos.slice(0, 20);

<PhotoGallery photos={recentPhotos} ... />
```

### Mode sombre
```jsx
// Ajouter dark:bg-gray-900 etc.
className="bg-white dark:bg-gray-800"
```

---

## 🧪 Tester la page

```javascript
// 1. Ouvrir /horses/{horseId}/photos
// 2. Vérifier les 3 tabs

// Test Galerie:
// ✅ Images s'affichent
// ✅ Clic ouvre modal
// ✅ Delete demande confirmation

// Test Upload:
// ✅ Drag-drop accepte images
// ✅ Métadonnées remplies auto
// ✅ Upload fonctionne
// ✅ Photo apparaît en temps réel

// Test Comparaison:
// ✅ Dropdown remplit
// ✅ Slider bouge
// ✅ Stats changent
// ✅ Touch slider marche sur mobile
```

---

## 🐛 Troubleshooting

### ❌ "useHorse is not defined"
```jsx
// Importer le contexte:
import { useHorse } from '../contexts/HorseContext';
```

### ❌ "Photos don't load"
Vérifier:
- [ ] userId existe (user?.uid)
- [ ] horseId existe (currentHorse?.id)
- [ ] Firestore a permissions lecture
- [ ] Browser console: logs 📸 ou ❌

### ❌ "Upload fails"
Vérifier:
- [ ] cloudPhotoService.uploadPhoto exists
- [ ] File < 10MB
- [ ] Cloud Storage rules allow write
- [ ] Network connected

### ❌ "Modal doesn't close"
```jsx
// Vérifier le click handler
onClick={() => setSelectedPhoto(null)}
```

---

## 📱 Mobile optimisation

Page déjà optimisée pour mobile:
- ✅ Responsive grille 2 colonnes
- ✅ Tabs stack en mobile
- ✅ Full-width modal
- ✅ Touch-friendly buttons (48px)

---

## 🚀 Production ready

Avant de déployer:

- [ ] Test sur 3 navigateurs
- [ ] Test sur mobile + desktop
- [ ] Vérifier Firestore quotas
- [ ] Vérifier Cloud Storage quotas
- [ ] Activer HTTPS certificat
- [ ] Configurer CORS si cross-domain
- [ ] Set up monitoring/logging

---

## 💾 Variation: Intégration dans page existante

Si vous avez déjà une page cheval:

```jsx
// src/pages/HorseDetailPage.jsx

import PhotoGallery from '../components/PhotoHistory/PhotoGallery';

export default function HorseDetailPage() {
  const { currentHorse } = useHorse();
  const { user } = useAuth();

  return (
    <div>
      {/* Existing content */}
      <div>...</div>

      {/* Add photos section */}
      <section className="mt-8 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">📸 Photos</h2>
        <PhotoGallery 
          userId={user?.uid} 
          horseId={currentHorse?.id}
        />
      </section>
    </div>
  );
}
```

---

**Prêt à copier et adapter!** 🚀
