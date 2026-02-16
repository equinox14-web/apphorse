# 🎨 Photo Gallery - Visual Components Preview

État final des composants livrés avec prévisualisations

---

## 📱 Composant 1: PhotoGallery (Grille)

```
┌─────────────────────────────────────────────────────────────┐
│  🖼️ Historique photos - Mon Cheval                         │
│  Suivi visuel de l'évolution                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔍 [Rechercher par date...]     [Timeline] [4 photos]     │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │  📷     │  │  📷     │  │  📷     │  │  📷     │       │
│  │  Jan    │  │  Jan    │  │  Fev    │  │  Fev    │       │
│  │ 15 kg   │  │ 16 kg   │  │ 20 kg   │  │ 22 kg   │       │
│  │ BCS 5.0 │  │ BCS 5.2 │  │ BCS 5.5 │  │ BCS 5.8 │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                                                             │
│  [Photo sauvegardée  01/12/2025   14:30]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Props:**
```jsx
<PhotoGallery
  userId={user.uid}
  horseId={horse.id}
  compact={false}
/>
```

---

## 📆 Composant 2: PhotoGallery (Timeline)

```
┌─────────────────────────────────────────────────────────────┐
│  Timeline  │ Grille                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ▼ Février 2025 (2 photos)                                 │
│  ├─ [📷] photo1.jpg - 16/02/2025 10:30                    │
│  │  ⚖️ 460kg | 📊 BCS 5.8                                   │
│  │                            [Supprimer]                   │
│  │                                                         │
│  └─ [📷] photo2.jpg - 15/02/2025 14:00                    │
│     ⚖️ 458kg | 📊 BCS 5.7                                   │
│                            [Supprimer]                      │
│                                                             │
│  ▼ Janvier 2025 (4 photos)                                 │
│  ├─ [📷] photo3.jpg - 31/01/2025 09:15                    │
│  │  ⚖️ 450kg | 📊 BCS 5.5                                   │
│  │                            [Supprimer]                   │
│  │  ...                                                     │
│                                                             │
│  ▶ Décembre 2024 (8 photos)                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📤 Composant 3: PhotoUpload

```
┌─────────────────────────────────────────────────────────────┐
│  DRAG & DROP                                               │
│                                                             │
│     📤  📷                                                   │
│   [Upload] [Camera]                                        │
│                                                             │
│  Ajouter une photo                                         │
│  Glissez-déposez ou cliquez                                │
│                                                             │
│        [Sélectionner une image]                            │
│                                                             │
│  ⓘ JPEG ou PNG, max 10MB                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

APRÈS SÉLECTION:

┌─────────────────────────────────────────────────────────────┐
│  📷 [                Preview                           ✕]   │
│  │                                                         │
│  │           ┌──────────────────┐                         │
│  │           │                  │                         │
│  │           │   PREVIEW        │                         │
│  │           │   IMAGE HERE     │                         │
│  │           │                  │                         │
│  │           │                  │                         │
│  │           └──────────────────┘                         │
│  │                                                         │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
│  Date de capture: [16/02/2025]     Poids: ⚖️ 460kg       │
│                                     BCS: 📊 5.8          │
│                                                             │
│  Notes:  [Profil pour suivi BCS...]                        │
│                                                             │
│  [Annuler]  [📤 Upload la photo]                           │
│                                                             │
│  💡 Le poids et BCS actuels seront sauvegardés            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Props:**
```jsx
<PhotoUpload
  userId={user.uid}
  horseId={horse.id}
  horseData={{
    currentWeight: 460,
    bcs: 5.8
  }}
  onSuccess={() => alert('Done!')}
  compact={false}
/>
```

---

## 🔄 Composant 4: PhotoComparison (Slider)

```
┌─────────────────────────────────────────────────────────────┐
│                   COMPARAISON AVANT/APRÈS                  │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │                                                        ││
│  │  Photo AVANT                      Photo APRÈS         ││
│  │  [Image 1]     ║ Slider         [Image 2 visible]    ││
│  │                ║  Glissez        [aperçu 40%]        ││
│  │                ║  le curseur                          ││
│  │                ║              ▲   (slider handle)     ││
│  │                ║◄─────────────┼─────────────►        ││
│  │                ║              ▼                       ││
│  │  [Image 1]     ║              [Image 2]              ││
│  │                                                        ││
│  │             40% Après  |Glissez ou cliquez           ││
│  │                                                        ││
│  └────────────────────────────────────────────────────────┘│
│                                                             │
│  [◀] 40% Après [▶]                                         │
│                                                             │
│  STATS COMPARAISON:                                        │
│  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │ ⚖️ Poids            │  │ 📊 BCS              │       │
│  │                     │  │                     │       │
│  │ Avant: 450 kg       │  │ Avant: 5.0          │       │
│  │ Après: 460 kg       │  │ Après: 5.8          │       │
│  │ +10 kg  📈          │  │ +0.8    📈          │       │
│  └─────────────────────┘  └─────────────────────┘       │
│                                                             │
│  Avant: 15/01/2025  |  Après: 16/02/2025                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Props:**
```jsx
<PhotoComparison
  beforePhoto={{
    url: 'https://...',
    weight: 450,
    bcs: 5.0,
    capturedAt: '2025-01-15'
  }}
  afterPhoto={{
    url: 'https://...',
    weight: 460,
    bcs: 5.8,
    capturedAt: '2025-02-16'
  }}
  beforeLabel="Janvier"
  afterLabel="Février"
  compact={false}
/>
```

---

## 📱 Mode Mobile (Responsive)

### PhotoGallery Grid → 2 colonnes
```
┌──────────────────────────┐
│  🔍 [Rechercher...]      │
│  [Timeline] [2 photos]   │
│                          │
│  ┌────────┐  ┌────────┐ │
│  │ Photo  │  │ Photo  │ │
│  │ 15 kg  │  │ 16 kg  │ │
│  │ BCS 5  │  │ BCS 5.2│ │
│  └────────┘  └────────┘ │
│                          │
│  ┌────────┐  ┌────────┐ │
│  │ Photo  │  │ Photo  │ │
│  │ 18 kg  │  │ 20 kg  │ │
│  │ BCS 5.4│  │ BCS 5.5│ │
│  └────────┘  └────────┘ │
│                          │
└──────────────────────────┘
```

### PhotoUpload (Single Column)
```
┌──────────────────────────┐
│ DRAG & DROP              │
│                          │
│    📤 📷                  │
│                          │
│ [Sélectionner une image] │
│                          │
│ ⓘ JPEG ou PNG, max 10MB │
│                          │
└──────────────────────────┘
```

### PhotoComparison (Full Width)
```
┌──────────────────────────┐
│┌────────────────────────┐│
││                        ││ Slider
││    ║Slider            ││ vertical
││    ║Handle            ││ ou touch
││                        ││
└└────────────────────────┘┘
│                          │
│ 40% Après               │
│                          │
│ [◀] [▶]                 │
│                          │
│ STATS (stacked)         │
│ ⚖️ Poids: +10 kg        │
│ 📊 BCS: +0.8            │
│                          │
└──────────────────────────┘
```

---

## 🔧 Interactions clés

### PhotoGallery
```
1. Clic grille → Modal détail
2. Hover image → Overlay dark + Trash icon
3. Click date mois → Expand/collapse photos
4. Recherche → Filtre en temps réel
5. Delete → Confirmation dialog → Delete
```

### PhotoUpload
```
1. Drag file → Preview + form
2. Click select → File picker
3. Fill form → Enable upload button
4. Upload → Progress + success toast
5. Success → Reset form
```

### PhotoComparison
```
1. Mouse down slider → Start drag
2. Move mouse → Slider follows
3. Release → Snap to position
4. Touch two-fingers → Drag on mobile
5. Button click → Jump ±10%
```

---

## 🎨 States visuels

### Loading
```
┌─────────────────────────────────────┐
│      ⟳ Chargement des photos...     │
└─────────────────────────────────────┘
```

### Error
```
┌─────────────────────────────────────┐
│  ⚠️ Erreur de chargement             │
│  Network error ou Firestore down    │
└─────────────────────────────────────┘
```

### Empty
```
┌─────────────────────────────────────┐
│  🖼️ Aucune photo                     │
│  Commencez par uploader la première │
└─────────────────────────────────────┘
```

### Success Toast
```
┌─────────────────────────────────────┐
│  ✅ Photo uploadée avec succès      │
└─────────────────────────────────────┘
```

### Confirmation Dialog
```
┌──────────────────────────────────────┐
│  Supprimer cette photo ?             │
│                                      │
│  Cette action est irréversible.      │
│  La photo sera supprimée du cloud.   │
│                                      │
│  [Annuler]    [Supprimer]           │
└──────────────────────────────────────┘
```

---

## 🌈 Couleur & Spacing

### Tailwind Colors Used
```
Primary (Blue):     bg-blue-600, hover:bg-blue-700
Danger (Red):       bg-red-500, hover:bg-red-600
Gray:               bg-gray-50, border-gray-200
Text:               text-gray-900, text-gray-600, text-gray-500
Background:         bg-white, bg-gray-50, bg-gray-100
Overlay:            bg-black/50, bg-black/70
```

### Spacing
```
Large gaps:   gap-4, gap-6
Small gaps:   gap-2, gap-3
Padding:      p-4, p-6, p-8
Margins:      mb-2, mb-4, mt-4
Borders:      border, border-2
Radius:       rounded, rounded-lg
```

---

## 📐 Responsive Breakpoints

```
Mobile (< 640px):
  Grid: 2 colonnes
  Layout: Single column
  Modal: Full width, scrollable

Tablet (640px - 768px):
  Grid: 3 colonnes
  Layout: Single column avec padding

Desktop (> 768px):
  Grid: 4 colonnes
  Layout: 2 colonnes
  Modal: max-w-2xl, centered
```

---

## ⌨️ Keyboard Support

```
Upload Form:
  Tab      → Next field
  Enter    → Submit (if focused on button)
  Escape   → Cancel

Gallery:
  Escape   → Close modal
  
Search:
  Type     → Live filter
  Escape   → Clear
```

---

## 📊 Data Flow Visuel

```
User Interface (Composants)
         ↓
usePhotoHistory Hook
         ↓
firestoreService + cloudPhotoService
         ↓
Firebase (Firestore + Cloud Storage)
         ↓
Browser Storage (localStorage + IndexedDB)
```

### Uploader une photo:
```
[PhotoUpload Component]
      ↓ file + metadata
[usePhotoHistory.uploadPhoto()]
      ↓
[cloudPhotoService.uploadPhoto()]  ← Upload file
      ↓ success, url, photoId
[firestoreService.addArrayElement()]  ← Save metadata
      ↓
[Firestore horses/.../photos[]]
      ↓
[Real-time listener triggered]
      ↓
[usePhotoHistory refetch]
      ↓
[PhotoGallery re-render]
```

### Supprimer une photo:
```
[Delete Button Clicked]
      ↓
[Confirmation Dialog]
      ↓ User confirms
[usePhotoHistory.deletePhoto()]
      ↓
[cloudPhotoService.deletePhoto()]  ← Delete file
        +
[firestoreService.removeArrayElement()]  ← Remove metadata
      ↓
[Firestore updated]
      ↓
[Real-time listener triggered]
      ↓
[Gallery automatically updates]
```

---

## 🎬 Animations

```
Image Hover:
  scale-110 transition-transform

Overlay Appear:
  opacity-0 → opacity-100 on hover

Loading Spinner:
  animate-spin rounded-full

Modal Fade In:
  Fixed overlay with bg-black/50

Button Hover:
  bg-color transitions smoothly
```

---

## 📐 Component Sizes

```
Photo Grid Items:
  aspect-square (1:1)
  Responsive: sm:gap-3, gap-2

Modal:
  max-w-2xl w-full
  max-h-96 overflow-hidden

Upload Preview:
  aspect-video (16:9)
  bg-gray-100

Slider Container:
  aspect-video (16:9)
  min-height: 200px compact

Buttons:
  px-4 py-2 (height: 40px)
  px-3 py-1 (height: 32px) small
  px-6 py-2 (height: 44px) large
```

---

## ✅ Features visuels résumés

| Feature | Visuel | Support |
|---------|--------|---------|
| Drag & Drop | 📤 Overlay highlight | ✅ Desktop + Mobile |
| Grid layout | 📷 Responsive 2-4 cols | ✅ All sizes |
| Timeline | 📅 Expandable groups | ✅ All sizes |
| Slider | 🔄 Handle with arrows | ✅ Desktop |
| Touch | 🖐️ Two-finger drag | ✅ Mobile |
| Search | 🔍 Live filter | ✅ All sizes |
| Modal | 🪟 Centered overlay | ✅ All sizes |
| Confirmation | ⚠️ Dialog with buttons | ✅ All sizes |
| Loading | ⟳ Spinner indicator | ✅ All sizes |
| Error | ⚠️ Red alert box | ✅ All sizes |

---

*Prévisualisation générale des composants Phase 2*  
*Pour des exemples interactifs, intégrer dans une page !*
