# 📋 Plan de Migration & Implémentation - AppHorse 2025

**Date**: 16 février 2026  
**Version**: 1.0.0  
**Status**: 🔴 En planification

---

## 🎯 Objectifs Prioritaires

### Phase 1: Migration Firestore (Semaine 1-2)
- ✅ Schéma Firestore finalisé
- ✅ Service de synchronisation robuste
- ✅ Listeners real-time
- ✅ Sync multi-device

### Phase 2: Nouvelles Fonctionnalités (Semaine 3-4)
- 📊 Graphiques évolution poids
- 📸 Historique photos complet
- 🔔 Notifications rappel pesée
- 📱 Cache mobile optimisé

### Phase 3: Polish & Qualité (Semaine 5)
- 🔧 Responsive design AI ration
- 🌐 Offline-first validation
- 📦 PWA cache strategy

---

## 📊 PHASE 1: MIGRATION FIRESTORE

### 1.1 Schéma Firestore
```
firestore/
├── users/{userId}
│   ├── profile: {name, email, logo, role, theme, mode}
│   ├── subscription: {plan, startDate, status}
│   └── lastSyncTimestamp: timestamp
│
├── horses/{userId}/{horseId}
│   ├── details: {name, breed, age, birthDate, ...}
│   ├── measurements: [{timestamp, weight, height, bcs}]
│   ├── health: [{date, type, notes}]
│   ├── photos: [{id, url, date, timestamp}]
│   └── metadata: {createdAt, updatedAt}
│
├── nutrition/{userId}/{planId}
│   ├── name: string
│   ├── horseId: string
│   ├── calculations: {uc, madc, total_protein, ...}
│   ├── timeline: [{timestamp, modification}]
│   └── metadata: {createdAt, updatedAt}
│
├── events/{userId}/{eventId}
│   ├── type: "weighing|care|competition|breeding"
│   ├── horseId: string
│   ├── date: timestamp
│   ├── reminder: {enabled, offset_minutes}
│   └── metadata: {createdAt, updatedAt}
│
├── photos/{userId}/{photoId}
│   ├── horseId: string
│   ├── url: string (Firebase Storage path)
│   ├── metadata: {name, size, width, height}
│   ├── date: timestamp
│   ├── cloudPath: string
│   └── localBackup: boolean
│
└── settings/{userId}
    ├── preferences: {theme, mode, language}
    ├── notifications: {weighing, care, breeding}
    └── privacy: {shareData, deviceSync}
```

### 1.2 Service Architecture
```
services/
├── firestoreService.js (NEW - Remplace firestoreSync)
│   ├── saveToFirestore(userId, dataType, data)
│   ├── loadFromFirestore(userId, dataType)
│   ├── setupRealtimeListener(userId, dataType, callback)
│   ├── deleteFromFirestore(userId, dataType, id)
│   └── batchSync(userId, changes)
│
├── syncService.js (NEW - Coordonne la sync multi-device)
│   ├── initSyncListener(userId)
│   ├── detectConflicts(localData, remoteData)
│   ├── resolveConflict(strategy: 'remote'|'local'|'merge')
│   ├── queueOfflineChanges(change)
│   └── syncOfflineQueue()
│
├── cloudPhotoService.js (UPGRADE - Intégre Firestore)
│   ├── uploadPhoto(userId, horseId, file)
│   ├── getPhotoHistory(userId, horseId)
│   ├── deletePhoto(userId, photoId)
│   └── migrateLocalPhotos(userId)
│
└── offlineStorageService.js (NEW)
    ├── saveToIndexedDB(key, data)
    ├── getFromIndexedDB(key)
    ├── clearExpiredCache(maxAge)
    └── getOfflineQueue()
```

### 1.3 Migration Steps

**Étape 1: Backup**
```javascript
// Script de backup avant migration
// Exporter toutes les données localStorage en JSON
// Uploader manuellement dans Firestore ou via batch script
```

**Étape 2: Adapter les contextes**
- ✏️ Modifier `AuthContext.jsx` pour charger depuis Firestore
- ✏️ Modifier `DataContext.jsx` (si existe) pour real-time listeners
- ✏️ Setup `SyncContext.jsx` (NEW) pour gérer l'état de sync

**Étape 3: Real-time Listeners**
```javascript
// Dans AuthContext ou nouveau SyncContext
useEffect(() => {
  if (userId) {
    const unsubscribe = setupRealtimeListener(userId, (data) => {
      updateLocalState(data);
      emit('syncComplete', {timestamp, device});
    });
    return unsubscribe;
  }
}, [userId]);
```

**Étape 4: Déployer progressivement**
1. Déployer avec fallback localStorage
2. Monitorer Firestore usage
3. Désactiver localStorage pour 10% des users
4. Monitoring confusion & rollback capability
5. Déployer complètement

---

## 📊 PHASE 2: NOUVELLES FONCTIONNALITÉS

### 2.1 Graphique Évolution Poids

**Fichiers à créer:**
- `components/Charts/WeightEvolutionChart.jsx`
- `utils/chartHelpers.js`
- `hooks/useWeightData.js`

**Fonctionnalités:**
```javascript
<WeightEvolutionChart 
  horseId={horseId}
  dateRange={{from: Date, to: Date}}
  showTrendline={true}
  showTarget={true}
  metrics={{weight, bcs, targetWeight}}
/>
```

**Données requises:**
- Tous les enregistrements de pesée par date
- Poids cible du cheval
- Score BCS (Body Condition Score) optionnel
- Trendline (smoothed average)

**Implémentation:**
```javascript
// hooks/useWeightData.js
export const useWeightData = (userId, horseId) => {
  const [measurements, setMeasurements] = useState([]);
  
  useEffect(() => {
    const unsubscribe = firestoreService.setupRealtimeListener(
      userId,
      `measurements/${horseId}`,
      (data) => {
        const sorted = data.sort((a, b) => a.timestamp - b.timestamp);
        setMeasurements(sorted);
      }
    );
    return unsubscribe;
  }, [userId, horseId]);
  
  return {
    measurements,
    average: calculateAverage(measurements),
    trend: calculateTrend(measurements),
    deviation: calculateDeviation(measurements)
  };
};
```

### 2.2 Historique Photos

**Fichiers à créer:**
- `components/PhotoHistory/PhotoGallery.jsx`
- `components/PhotoHistory/PhotoTimeline.jsx`
- `hooks/usePhotoHistory.js`

**Fonctionnalités:**
- 📅 Timeline chronologique
- 🔍 Filtrage par date/mois/année
- 🎚️ Slider pour comparer avant/après
- 📊 Métadonnées: date, poids, BCS
- 🗑️ Suppression avec confirmation

**Database:**
```javascript
// Dans horses/{userId}/{horseId}/photos array
[
  {
    id: "photo_123",
    cloudPath: "gs://bucket/user_id/photo_123",
    url: "https://cdn....",
    date: timestamp,
    localBackup: true,
    metadata: {
      weight: 520,
      bcs: 5.5,
      measuredAt: timestamp
    }
  }
]
```

### 2.3 Notifications Rappel Pesée

**Fichiers à créer:**
- `services/notificationService.js`
- `components/Settings/NotificationSettings.jsx`
- `hooks/useNotifications.js`

**Implémentation:**
```javascript
// services/notificationService.js
export const notificationService = {
  scheduleWeighingReminder: async (userId, horseId, frequency) => {
    // frequency: 'daily' | 'weekly' | 'monthly'
    // Créer event dans Firestore
    // Setup Web Push Notification
    // ou utiliser Local Notification (PWA)
  },

  checkAndNotify: async (userId) => {
    // Vérifier si rappel dû
    // Envoyer notification push
    // Log dans events
  }
};
```

**Storage Configuration:**
```javascript
// settings/{userId}/notifications
{
  weighing: {
    enabled: true,
    frequency: "weekly",
    dayOfWeek: 1, // Monday
    time: "09:00",
    horseIds: ["horse_1", "horse_2"]
  },
  care: {enabled: false},
  breeding: {enabled: true}
}
```

### 2.4 Cache Mobile Optimisé

**Fichiers à créer:**
- `services/cacheStrategy.js`
- `hooks/useCacheManagement.js`

**Stratégie:**
```javascript
// services/cacheStrategy.js
export const cacheStrategy = {
  VERSION: '1.3.0',
  
  shouldClearCache: async () => {
    const stored = localStorage.getItem('app_version');
    return stored !== cacheStrategy.VERSION;
  },
  
  clearExpiredCache: async () => {
    // Vider IndexedDB mais garder offline queue
    // Vider images cache
    // Garder settings & preferences
  },
  
  onAppUpdate: async () => {
    localStorage.setItem('app_version', cacheStrategy.VERSION);
    await clearExpiredCache();
    // Trigger full resync depuis Firestore
  }
};
```

**Dans Service Worker:**
```javascript
// In service worker
self.addEventListener('install', async (event) => {
  const version = '1.3.0';
  const storedVersion = await getStoredVersion();
  
  if (version !== storedVersion) {
    await clearOldCaches();
    await storeNewVersion(version);
  }
});
```

---

## 🔌 PHASE 3: VALIDATION & QUALITÉ

### 3.1 Responsive Design - AI Ration Calculator

**Fichiers à modifier:**
- `pages/AICalculator.jsx` ou `components/Calculator/*`

**Points à vérifier:**
- [ ] Mobile: Stack vertical
- [ ] Tablet: 2-column layout
- [ ] Desktop: 3-column avec sidebar
- [ ] Inputs: Touch-friendly (48px minimum)
- [ ] Charts: Recharts responsive
- [ ] Modals: Fullscreen sur mobile
- [ ] Keyboard: Support numérique pour iOS

**Tests:**
```javascript
// Test responsive breakpoints
const breakpoints = {
  xs: 320,
  sm: 640,
  md: 1024,
  lg: 1280,
  xl: 1920
};
```

### 3.2 Offline-First Data Persistence

**Checker list:**
```
✅ Données disponibles hors ligne
✅ Sync automatique à reconnexion
✅ Gestion des conflits résolvus
✅ Toast notifications du statut sync
✅ Offline indicator dans navbar
✅ Queue visible pour debug
```

**Testing:**
```javascript
// Dans useServiceWorker ou SyncContext
navigator.onLine === false
  ? updateUI('offline_mode')
  : syncOfflineQueue()
```

### 3.3 PWA Script Cache Strategy

**Fichiers:**
- `public/sw-custom.js` ou `service-worker.js`

**Stratégie:**
```javascript
// Cache Strategy en priorité
'Cache First' pour:
  - Assets statiques (JS, CSS)
  - Images de local cache
  - Fonts

'Network First' pour:
  - Appels Firestore
  - Photos cloud
  - Real-time data

'Stale While Revalidate' pour:
  - Profils utilisateur
  - Configuration
```

---

## 📅 Timeline d'Implémentation

| Semaine | Tâche | Dev | QA | Status |
|---------|-------|-----|-----|--------|
| S1 | Firestore schema finalisé | 2d | 1d | 🔴 |
| S1 | Service de sync implémenté | 2d | 1d | 🔴 |
| S2 | Real-time listeners + tests | 2d | 2d | 🔴 |
| S2 | Multi-device sync | 2d | 1d | 🔴 |
| S3 | Weight chart feature | 2d | 1d | 🔴 |
| S3 | Photo history + upload | 2d | 1d | 🔴 |
| S4 | Notifications système | 1.5d | 1d | 🔴 |
| S4 | Cache strategy mobile | 1d | 1d | 🔴 |
| S5 | Responsive fix IA calc | 1.5d | 1d | 🔴 |
| S5 | Offline persistence test | 1.5d | 1d | 🔴 |

---

## 🛠️ Technologies & Dependencies

```json
{
  "firebase": "^12.7.0",
  "idb": "^8.0.0",  // IndexedDB wrapper
  "dexie": "^4.0.0", // IndexedDB ORM
  "workbox": "^7.0.0" // PWA offline
}
```

---

## ⚠️ Risques & Mitigation

| Risque | Impact | Mitigation |
|--------|--------|-----------|
| Perte données migration | 🔴 Critique | Backup complet avant, rollback strategy |
| Firestore quota exceeded | 🔴 Critique | Rate limiting, batch operations |
| Sync conflicts multi-device | 🟡 Moyen | Last-write-wins ou conflict resolution UI |
| Cold start Firestore | 🟡 Moyen | IndexedDB cache + offline-first |
| Photo upload lent | 🟡 Moyen | Compression + background sync |

---

## ✅ Checklist Deployment

- [ ] Firestore Security Rules updated
- [ ] Backup automatique de localStorage en JSON
- [ ] Rollback procedure documentée
- [ ] Monitoring Firestore costs
- [ ] User notification strategy
- [ ] Performance tests (< 2s load)
- [ ] Offline mode tested on slow 3G
- [ ] Cache clearing tested on app update

---

## 📞 Support & Documentation

**Docs à créer:**
- `docs/FIRESTORE_SCHEMA.md` - Structure détaillée
- `docs/MIGRATION_GUIDE.md` - Guide technique
- `docs/OFFLINE_STRATEGY.md` - Offline-first implementation
- `docs/REAL_TIME_SYNC.md` - Real-time listeners

---

**Auteur**: Équipe Dev  
**Dernière mise à jour**: 16/02/2026
