# 🏗️ Firestore Schema Documentation

## Collection Structure Complète

### Root Level Collections

```
Firestore Database
├── users/
├── horses/
├── nutrition/
├── events/
├── photos/
├── settings/
├── reminders/
└── measurements/
```

---

## 1️⃣ users/{userId}

**Documents**: `profile`, `settings`

### users/{userId}/profile

Informations de l'utilisateur connecté

```javascript
{
  // Basic info
  id: "user_123",
  email: "user@example.com",
  name: "John Doe",
  logo: "data:image/png;base64,...",
  
  // Preferences
  theme: "light" | "dark",
  language: "fr" | "en",
  role: "owner" | "coach" | "admin",
  
  // Subscription
  subscriptionPlan: ["decouverte", "eleveur", "elite"],
  subscriptionStart: Timestamp(2025-01-15),
  subscriptionExpiry: Timestamp(2026-01-15),
  
  // Metadata
  createdAt: Timestamp(2025-01-01),
  updatedAt: Timestamp(2025-02-16),
  lastLogin: Timestamp(2025-02-16),
}
```

---

## 2️⃣ horses/{userId}/{horseId}

**Main collection for all horse data**

```javascript
{
  // Basic info
  id: "horse_123",
  name: "Elegant Star",
  breed: "Pur-sang anglais",
  birthDate: Timestamp(2015-03-20),
  gender: "female" | "male" | "foal",
  microchip: "123456789",
  
  // Current info
  age: 9,
  color: "bay",
  height: 1.65,
  targetWeight: 550, // kg
  
  // Health & measurements
  measurements: [
    {
      id: "m_1705334400000",
      timestamp: Timestamp(2025-01-15),
      weight: 548, // kg
      height: 1.65, // m
      bcs: 5.5, // Body Condition Score (1-9 scale)
      girth: 190, // cm
      notes: "Post-training session"
    },
    {
      id: "m_1705420800000",
      timestamp: Timestamp(2025-01-16),
      weight: 549,
      bcs: 5.5
    }
  ],
  
  // Photos
  photos: [
    {
      id: "photo_1",
      cloudPath: "gs://bucket/users/user_123/photos/photo_1.jpg",
      url: "https://firebasestorage.googleapis.com/...",
      uploadedAt: Timestamp(2025-02-01),
      capturedAt: Timestamp(2025-02-01),
      metadata: {
        width: 1920,
        height: 1080,
        size: 2500000, // bytes
        mimeType: "image/jpeg"
      }
    }
  ],
  
  // Health records
  health: [
    {
      id: "health_1",
      date: Timestamp(2025-01-10),
      type: "vaccination" | "treatment" | "exam" | "surgery",
      description: "Annual vaccination",
      veterinarian: "Dr. Smith",
      notes: "Normal reaction",
      nextAction: Timestamp(2026-01-10) // for reminders
    }
  ],
  
  // Performance/Competition data
  competitions: [
    {
      id: "comp_1",
      date: Timestamp(2025-02-15),
      name: "Regional Show Jumping",
      discipline: "show_jumping" | "dressage" | "eventing",
      result: "1st place",
      score: 85
    }
  ],
  
  // Metadata
  createdAt: Timestamp(2025-01-01),
  updatedAt: Timestamp(2025-02-16),
  lastMeasurementDate: Timestamp(2025-02-16),
  daysSinceMeasurement: 1
}
```

---

## 3️⃣ nutrition/{userId}/{planId}

**AI Ration calculations**

```javascript
{
  id: "plan_123",
  horseId: "horse_123",
  horseName: "Elegant Star",
  
  // Input parameters
  parameters: {
    weight: 550, // kg
    age: 9,
    activity: "moderate" | "light" | "intense",
    goal: "maintenance" | "gain" | "loss",
    breed: "Pur-sang",
    metabolicState: "normal" | "workload_increase" | "recovery"
  },
  
  // INRA Calculations
  calculations: {
    // Besoins énergétiques (Kcal/day)
    energyRequirement: 24500,
    ufl: 12.5, // Unité Fourragère Lait
    uc: 10.2, // Unité de Cellulose
    
    // Protéines
    proteinRequirement: 750, // grams/day
    lysine: 32,
    methionine: 18,
    
    // Minéraux
    calcium: 45000, // mg
    phosphorus: 30000,
    magnesium: 12000,
    potassium: 60000,
    sodium: 30000,
    
    // Vitamins
    vitaminA: 30000, // IU
    vitaminD: 5000,
    vitaminE: 500,
  },
  
  // Recommended feed
  recommendedFeed: [
    {
      id: "feed_1",
      name: "Alfalfa pellets",
      type: "hay" | "concentrate" | "supplement",
      percentage: 60, // % of daily ration
      quantity: 15, // kg/day
      energyContent: {
        uc: 0.8,
        ufl: 0.9
      },
      proteinContent: {
        total: 180, // g/kg
        digestible: 150
      }
    },
    {
      id: "feed_2",
      name: "Oats + supplement mix",
      type: "concentrate",
      percentage: 40,
      quantity: 10,
      energyContent: {
        uc: 1.2,
        ufl: 1.4
      }
    }
  ],
  
  // Timeline of modifications
  history: [
    {
      timestamp: Timestamp(2025-02-01),
      modification: "Initial plan creation",
      author: "user_123"
    },
    {
      timestamp: Timestamp(2025-02-10),
      modification: "Adjusted protein +10%",
      reason: "Increased training intensity",
      author: "user_123"
    }
  ],
  
  // Metadata
  createdAt: Timestamp(2025-02-01),
  updatedAt: Timestamp(2025-02-10),
  validUntil: Timestamp(2025-03-10) // auto-archive after
}
```

---

## 4️⃣ events/{userId}/{eventId}

**Calendar events, reminders**

```javascript
{
  id: "event_123",
  horseId: "horse_123",
  horseName: "Elegant Star",
  
  // Event details
  date: Timestamp(2025-03-01),
  time: "14:30",
  type: "weighing" | "care" | "breeding" | "competition" | "training",
  name: "Monthly weighing",
  description: "Regular weight check",
  location: "Home",
  
  // Reminder settings
  reminder: {
    enabled: true,
    offset_minutes: 1440, // 24 hours before
    sentAt: null // Timestamp when sent
  },
  
  // Specific fields by type
  
  // For weighing events
  ...(type === 'weighing' && {
    expectedWeight: 550,
    weightHistory: [548, 549]
  }),
  
  // For care events
  ...(type === 'care' && {
    caretaker: "user_456",
    instructions: "Apply ointment to leg",
    veterinarian: "Dr. Smith"
  }),
  
  // For breeding events
  ...(type === 'breeding' && {
    maleId: "horse_456",
    maleName: "Stallion Name",
    expectedFoalDate: Timestamp(2026-03-01),
    breedingResult: "success" | "failed" | "pending"
  }),
  
  // Status
  status: "scheduled" | "completed" | "cancelled",
  completedAt: Timestamp(2025-03-01),
  notes: "Completed successfully",
  
  // Metadata
  createdAt: Timestamp(2025-02-15),
  updatedAt: Timestamp(2025-03-01)
}
```

---

## 5️⃣ photos/{userId}/{photoId}

**Cloud photo references and metadata**

```javascript
{
  id: "photo_123",
  
  // Owner info
  horseId: "horse_123",
  horseName: "Elegant Star",
  
  // Storage references
  cloudPath: "gs://bucket/users/user_123/horses/horse_123/photo_123.jpg",
  url: "https://firebasestorage.googleapis.com/v0/b/...",
  thumbnailUrl: "https://firebasestorage.googleapis.com/v0/b/.../thumb.jpg",
  
  // Dates
  capturedAt: Timestamp(2025-02-15),
  uploadedAt: Timestamp(2025-02-15),
  
  // Metadata
  metadata: {
    fileName: "photo_123.jpg",
    mimeType: "image/jpeg",
    size: 2500000, // bytes
    width: 1920,
    height: 1080,
    quality: "high" | "normal" | "low" // compression level
  },
  
  // Associated data snapshot
  horseDataSnapshot: {
    weight: 548,
    bcs: 5.5,
    age: 9,
    height: 1.65
  },
  
  // Local backup flag
  hasLocalBackup: true,
  lastSyncedAt: Timestamp(2025-02-15),
  
  // Tags/categories
  tags: ["training", "summer"]
}
```

---

## 6️⃣ settings/{userId}

**User settings and preferences**

### settings/{userId}/notifications

```javascript
{
  weighing: {
    enabled: true,
    frequency: "daily" | "weekly" | "biweekly" | "monthly",
    dayOfWeek: 1, // 0=Sun, 1=Mon, etc
    time: "09:00",
    horseIds: ["horse_1", "horse_2"], // which horses
    lastSentAt: Timestamp(2025-02-10)
  },
  
  care: {
    enabled: false,
    offsetMinutes: 1440 // 24h before event
  },
  
  breeding: {
    enabled: true,
    offsetMinutes: 604800 // 7 days before
  },
  
  updatedAt: Timestamp(2025-02-16)
}
```

### settings/{userId}/preferences

```javascript
{
  theme: "light" | "dark",
  language: "fr" | "en" | "es",
  timezone: "Europe/Paris",
  
  // Data sharing
  shareData: false,
  analytics: true,
  
  // Display preferences
  units: {
    weight: "kg" | "lbs",
    height: "m" | "ft",
    distance: "km" | "miles"
  },
  
  updatedAt: Timestamp(2025-02-16)
}
```

---

## 7️⃣ reminders/{userId}/{reminderId}

**Scheduled reminders**

```javascript
{
  id: "reminder_123",
  
  // Type and target
  type: "weighing" | "care" | "breeding",
  horseId: "horse_123",
  
  // Schedule
  reminderDate: Timestamp(2025-03-01),
  reminderTime: "14:30",
  frequency: "once" | "daily" | "weekly" | "monthly",
  
  // Content
  title: "Monthly weighing",
  body: "Time to weigh Elegant Star",
  
  // Status
  status: "active" | "sent" | "snooze" | "dismissed",
  sentAt: Timestamp(2025-03-01),
  snoozedUntil: null,
  
  // Metadata
  createdAt: Timestamp(2025-02-16),
  updatedAt: Timestamp(2025-02-16)
}
```

---

## 8️⃣ measurements/{userId}

**Aggregated measurement history** (Optional, for analytics)

```javascript
{
  // Compound index for quick queries
  horseId: "horse_123",
  month: "2025-02",
  
  measurements: [
    {
      date: "2025-02-01",
      weight: 548,
      bcs: 5.5
    },
    {
      date: "2025-02-08",
      weight: 549,
      bcs: 5.5
    }
  ],
  
  stats: {
    averageWeight: 548.5,
    minWeight: 548,
    maxWeight: 549,
    trend: 0.5 // kg/week
  }
}
```

---

## 🔍 Indexes à Créer

Pour optimiser les requêtes:

```javascript
// horses collection
- Index: (userId, updatedAt) DESC
- Index: (userId, lastMeasurementDate) DESC

// events collection
- Index: (userId, type, date) ASC
- Index: (userId, horseId, date)

// measurements (if created)
- Index: (userId, horseId, month)

// photos
- Index: (userId, uploadedAt) DESC
```

---

## 📊 Firestore Rules Template

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Private user data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /settings/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Horses (owned by user)
    match /horses/{userId}/{horseId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Nutrition plans
    match /nutrition/{userId}/{planId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Events/Reminders
    match /events/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /reminders/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Photos
    match /photos/{userId}/{photoId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Measurements
    match /measurements/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## 💾 Migration from localStorage

**Old localStorage keys → New Firestore paths:**

```
my_horses_v4
  → horses/{userId}/{horseId}/details

horse_media_{horseId}
  → horses/{userId}/{horseId}/photos[]
  → photos/{userId}/{photoId}

horse_measurements_{horseId}
  → horses/{userId}/{horseId}/measurements[]

appHorse_nutrition_*
  → nutrition/{userId}/{planId}

appHorse_customEvents
  → events/{userId}/{eventId}

user_profile
  → users/{userId}/profile

app_theme, app_mode
  → settings/{userId}/preferences
```

---

## ⚡ Performance Tips

1. **Batching**: Group multiple writes with batch API (max 500 ops)
2. **Indexing**: Create composite indexes for common queries
3. **Pagination**: Use `limit()` and `startAfter()` for large collections
4. **Caching**: Use IndexedDB for offline-first strategy
5. **Subcollections**: Keep data flat when possible, avoid deep nesting

---

## 📈 Estimated Usage

```
Users: ~1,000
Documents per user: ~150 (horses, events, photos, etc)
Average document size: ~5 KB
Daily reads estimate: ~50,000
Daily writes estimate: ~10,000

Estimated monthly cost (US):
- Storage: ~$0.18/GB × 0.75GB = $0.14
- Reads: ~1.5M × $0.06/$1M = $0.09
- Writes: ~300k × $0.18/$1M = $0.05
- Total: ~$0.28/month
```

---

**Last updated**: 16/02/2026
