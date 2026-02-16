# 🏗️ Architecture Overview - AppHorse v1.3.0

**Firestore Cloud Infrastructure**

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         🌐 APPHORSE FRONTEND (React)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Pages & Components                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │ Horse List   │  │ Horse Detail │  │ AI Calculator│          │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │   │
│  │         │                  │                │                   │   │
│  │  ┌──────v──────────────────v────────────────v────────┐         │   │
│  │  │  WeightEvolutionChart (NEW)  useWeightData (NEW) │         │   │
│  │  └──────┬───────────────────────────────────────────┘         │   │
│  └─────────┼──────────────────────────────────────────────────────┘   │
│            │                                                           │
│  ┌─────────v──────────────────────────────────────────────────────┐   │
│  │  🎯 CONTEXT LAYER - Global State                               │   │
│  │  ┌────────────────┐          ┌──────────────────┐              │   │
│  │  │  AuthContext   │◄────────►│  DataContext     │              │   │
│  │  │  • user        │          │  • horses[]      │              │   │
│  │  │  • deviceId    │          │  • nutrition[]   │              │   │
│  │  │  • syncState   │          │  • events[]      │              │   │
│  │  └────────────────┘          └──────────────────┘              │   │
│  └─────────┬────────────────────────────────────────────────────┬─┘   │
│            │                                                    │       │
│  ┌─────────v───────────┐                              ┌────────v────┐ │
│  │ 🔧 SERVICES LAYER   │                              │ 💾 Cache    │ │
│  ├─────────────────────┤                              │             │ │
│  │                     │                              │ IndexedDB   │ │
│  │ firestoreService    │                              │ + TTL mgmt  │ │
│  │ ├─ setDoc()         │                              └─────────────┘ │
│  │ ├─ getDoc()         │                                              │
│  │ ├─ listenToDoc()    │                              ┌─────────────┐ │
│  │ ├─ batch()          │                              │ Offline     │ │
│  │ ├─ Offline Queue    │                              │ Sync Queue  │ │
│  │ └─ Retry logic      │                              └─────────────┘ │
│  │                     │                                              │
│  │ syncService         │                              ┌─────────────┐ │
│  │ ├─ initSync()       │                              │ Notification
│  │ ├─ Multi-device     │                              │ Service     │ │
│  │ ├─ Conflict resolve │                              │ • Reminders │ │
│  │ └─ Sync state       │                              │ • Web Push  │ │
│  │                     │                              └─────────────┘ │
│  │ notificationService │                                              │
│  │ cacheStrategy       │                                              │
│  └─────────┬───────────┘                                              │
│            │                                                           │
└────────────┼───────────────────────────────────────────────────────────┘
             │
             │ HTTP/WebSocket
             │
┌────────────v───────────────────────────────────────────────────────────┐
│              ☁️  GOOGLE CLOUD INFRASTRUCTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │  Firebase/Firestore Database                                 │    │
│  │  ┌────────────────────────────────────────────────────────┐  │    │
│  │  │                                                        │  │    │
│  │  │  Collection Structure:                                │  │    │
│  │  │  ┌──────────────────────────────────────────────────┐ │  │    │
│  │  │  │ users/{userId}/                                 │ │  │    │
│  │  │  │ ├─ profile                                       │ │  │    │
│  │  │  │ └─ settings/notifications                        │ │  │    │
│  │  │  │                                                  │ │  │    │
│  │  │  │ horses/{userId}/{horseId}/                       │ │  │    │
│  │  │  │ ├─ details                                       │ │  │    │
│  │  │  │ ├─ measurements[]                                │ │  │    │
│  │  │  │ ├─ photos[]                                      │ │  │    │
│  │  │  │ └─ health[]                                      │ │  │    │
│  │  │  │                                                  │ │  │    │
│  │  │  │ nutrition/{userId}/{planId}/                     │ │  │    │
│  │  │  │ events/{userId}/{eventId}                        │ │  │    │
│  │  │  │ settings/{userId}/notifications                 │ │  │    │
│  │  │  │                                                  │ │  │    │
│  │  │  └──────────────────────────────────────────────────┘ │  │    │
│  │  └────────────────────────────────────────────────────────┘  │    │
│  │                                                               │    │
│  │  Indexes (for performance):                                  │    │
│  │  • (userId, updatedAt) DESC                                  │    │
│  │  • (userId, horseId, date)                                   │    │
│  │  • (userId, type, date)                                      │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │  Cloud Storage (for photos)                                   │    │
│  │  gs://bucket/users/{userId}/horses/{horseId}/photos/         │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │  Security Rules (enforced on Firestore)                       │    │
│  │  • User data isolation (match userId)                         │    │
│  │  • Multi-device support (same userId from any device)         │    │
│  │  • Admin/test overrides                                       │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### 🔴 Real-Time Listener Flow

```
                    Component mounts
                          │
                          v
        useWeightData(userId, horseId)
                          │
                          ├─ firestoreService.listenToDoc()
                          │         │
                          │         v
                          │    Firestore WebSocket connection
                          │         │
                          │         v
                          │    Document changes detected
                          │         │
                          │         v
                          │    Callback triggered
                          │         │
                          │         v
                    Update local state
                          │
                          v
                    Component re-renders
                          │
                          v
                    User sees update
```

### 📤 Save with Offline Support

```
User saves data
     │
     v
firestoreService.setDoc()
     │
     ├─ Is online?
     │
     ├─ YES              ├─ NO
     │   │               │
     │   v               v
     │ Send to FS    Add to queue (localStorage)
     │   │               │
     │   v               v
     │ Retry×3       Wait for online
     │   │               │
     │   ├─Success   User reconnects
     │   │   │           │
     │   │   v           v
     │   │ Saved ✨   syncOfflineQueue()
     │   │   │           │
     │   └─►Return       v
     │                 Retry queue items
     │                   │
     │                   v
     │                 Saved ✨
     │
     └─► Return {offline: false/true}
```

### 🔄 Multi-Device Sync

```
Device A: User edits "Horse Name" → Saves to Firestore
               │
               ├─ Firestore updates
               │       │
               v       v
            Device A  Device B (listening)
              ✓        │
                       ├─ Detects change
                       │
                       ├─ Check timestamp
                       │   - Remote newer? Use remote
                       │   - Local newer? Conflict!
                       │
                       v
                   Auto-merge or
                   Notify user
                       │
                       v
               Both devices synced ✨
```

---

## Component Dependency Tree

```
App.jsx
├─ AuthProvider
│  ├─ useAuth()
│  └─ syncService.initSync()
│     └─ setupDeviceListener()
│        ├─ firestoreService.listenToDoc()
│        └─ syncService.subscribeSyncState()
│
├─ cacheStrategy.init()
│  └─ IndexedDB initialization
│
└─ Pages
   ├─ HorseDetailPage
   │  ├─ useAuth()
   │  ├─ useWeightData(userId, horseId)
   │  │  ├─ firestoreService.listenToDoc()
   │  │  ├─ calculateStats()
   │  │  └─ prepareChartData()
   │  │
   │  └─ WeightEvolutionChart
   │     ├─ Recharts LineChart
   │     ├─ Real-time updates
   │     └─ Responsive layout
   │
   ├─ SettingsPage
   │  ├─ notificationService.getPreferences()
   │  └─ notificationService.updatePreferences()
   │
   └─ Other Pages
      └─ firestoreService
         ├─ setDoc()
         ├─ getDoc()
         └─ Offline Queue
```

---

## State Management Flow

```
                    ┌─────────────────────┐
                    │   Browser Storage   │
                    │   (localStorage)    │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                v              v              v
          Auth Data      User Profile    Preferences
                │              │              │
                └──────────────┼──────────────┘
                               │
                    ┌──────────v──────────┐
                    │  Firestore Sync     │
                    │  (Primary source)   │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────────┐
            │                  │                      │
            v                  v                      v
       Real-time           Offline Queue         Multi-device
       Listeners           (IndexedDB)            Sync
            │                  │                      │
            └──────────┬───────┴──────────┬───────────┘
                       │                  │
                       v                  v
                 AuthContext          DataContext
                       │                  │
                       └──────┬───────────┘
                              │
                              v
                         Component Props
                              │
                              v
                         UI Renders
```

---

## Services Interaction Matrix

```
                 Firestore  Sync   Notification  Cache   Others
                 ──────────────────────────────────────────────
Firestore Service   ✓ Core   ✓       ✓          ✓      
Sync Service        ✓        ✓ Core  ✓          ✓
Notification        ✓        ✓       ✓ Core              
Cache Service       ✓                ✓          ✓ Core
Components          ✓        ✓       ✓          ✓
Hooks               ✓        ✓       ✓          ✓

Legend:
✓ Core   = Central service
✓        = Uses/depends on
∅        = Does not interact
```

---

## Performance Optimization Paths

```
1. Data Load Path:
   Component Mount
   └─ Check IndexedDB Cache (fast: 50ms)
      ├─ HIT  → Return cached → Update from Firestore
      └─ MISS → Fetch from Firestore (200ms) → Cache it

2. Save Path:
   User Action
   └─ Save to Firestore
      ├─ Online    → Direct save (200ms)
      └─ Offline   → Queue in localStorage (instant)
                     └─ Retry on reconnect

3. List Render Path:
   Component Mount
   └─ firestoreService.listenToCollection()
      └─ Firestore WebSocket
         └─ Real-time updates (0ms latency)

4. Chart Render Path:
   useWeightData hook
   └─ Calculate stats in memory (10ms)
   └─ Format for Recharts (5ms)
   └─ Recharts renders (100ms on large mobile)
```

---

## Security Layers

```
Browser Layer:
     │
     ├─ No API keys in code ✓
     ├─ localStorage not used for secrets ✓
     └─ HTTPS only ✓
     
Network Layer:
     │
     ├─ Firebase auth tokens ✓
     ├─ Encrypted WebSocket ✓
     └─ CORS headers ✓
     
Database Layer:
     │
     ├─ Firestore Security Rules
     │  ├─ User data isolation ✓
     │  ├─ Multi-device support ✓
     │  ├─ Read/Write restrictions ✓
     │  └─ No public access ✓
     
     └─ Firebase Auth
        ├─ Email/password ✓
        ├─ Session management ✓
        └─ Token refresh ✓
```

---

## Offline-First Architecture

```
    Offline Mode
        │
        ├─ Read from IndexedDB cache
        │  └─ Return items if available
        │
        ├─ Write to offline queue
        │  ├─ Store in localStorage (firestore_offline_queue)
        │  └─ Store in IndexedDB for backup
        │
        └─ Service Worker
           ├─ Cache static assets
           ├─ Intercept fetch requests
           └─ Return cached responses
    
    Online Mode
        │
        ├─ Real-time listeners active
        │
        ├─ Firestore in sync
        │
        ├─ Process offline queue
        │  ├─ Read from localStorage
        │  ├─ Retry failed ops
        │  └─ Update cloud
        │
        ├─ Sync complete
        │  ├─ Clear offline queue
        │  └─ Update IndexedDB cache
        │
        └─ Back to real-time
```

---

## Cache Lifecycle

```
App Start
   │
   ├─ cacheStrategy.init()
   │  ├─ Check version
   │  │  ├─ Same? → Use existing cache
   │  │  └─ New? → Clear & start fresh
   │  │
   │  └─ IndexedDB setup
   │     └─ Create object stores
   │
   └─ Cache Ready
      │
      ├─ Horse Data: 7-day TTL
      │
      ├─ Photos: 30-day TTL
      │
      ├─ Offline Queue: Never expires
      │
      └─ Periodic cleanup
         └─ Every 6 hours
            └─ Remove expired entries
   
   
User Updates App
   │
   └─ New version deployed
      │
      ├─ cacheStrategy.checkVersion()
      │  └─ Version changed!
      │
      ├─ cacheStrategy.clearOnVersionChange()
      │  ├─ Clear photos cache
      │  ├─ Clear horse data
      │  ├─ Keep offline queue
      │  └─ Keep settings
      │
      └─ restart() → Load fresh data
```

---

## Deployment Pipeline

```
Development
   │
   ├─ Feature branch
   │  └─ Services implemented
   │
Staging
   │
   ├─ All tests passing
   │  ├─ Unit tests
   │  ├─ Integration tests
   │  └─ E2E tests
   │
   ├─ Firebase rules tested
   │
   ├─ Performance checked
   │
   └─ Ready for canary
   
Production Canary (10% users)
   │
   ├─ Monitor 24h
   │  ├─ Error rates
   │  ├─ Sync success rate
   │  ├─ User reports
   │  └─ Firestore costs
   │
   ├─ Success? → Continue rollout
   │
   └─ Problem? → Rollback & debug
   
Production Gradual Rollout
   │
   ├─ 25% users → Monitor 12h
   │
   ├─ 50% users → Monitor 12h
   │
   ├─ 100% users → Monitor 1 week
   │
   └─ Stable → Archive old code
```

---

## Metrics & Monitoring

```
Key Performance Indicators:

1. Firestore Operations
   ├─ Daily reads: < 50K per 100 users
   ├─ Daily writes: < 10K per 100 users
   ├─ Latency p95: < 500ms
   └─ Storage: < 10MB per 100 users

2. App Performance
   ├─ Initial load: < 2000ms
   ├─ Chart render: < 1000ms
   ├─ Sync time: < 5000ms
   └─ Offline success: > 95%

3. User Experience
   ├─ Crash rate: < 0.1%
   ├─ Error rate: < 0.5%
   ├─ Sync success: > 99%
   └─ User satisfaction: > 4.5/5

4. Cache Effectiveness
   ├─ Hit rate: > 80%
   ├─ Storage used: < 50MB per device
   └─ Load time from cache: < 100ms
```

---

**Architecture designed for**:
- ✅ Scalability (millions of users)
- ✅ Offline-first (works anywhere)
- ✅ Real-time (instant updates)
- ✅ Multi-device (synced across devices)
- ✅ Performance (< 2s load time)
- ✅ Security (encrypted, isolated)
- ✅ Reliability (auto-retry, fallbacks)

---

**Last Updated**: 16/02/2026
