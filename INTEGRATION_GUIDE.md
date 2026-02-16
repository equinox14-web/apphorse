# 🚀 Guide Intégration - Migration Firestore & Nouvelles Fonctionnalités

## 📌 Quick Start

### 1. Initialisation au Startup (App.jsx)

```javascript
import { useEffect } from 'react';
import cacheStrategy from './services/cacheStrategy';

function App() {
  useEffect(() => {
    const initApp = async () => {
      // Initialiser le cache intelligemment
      const cacheInit = await cacheStrategy.init();
      console.log('Cache initialized:', cacheInit);
    };
    
    initApp();
  }, []);

  return (
    <YourAppStructure>
      {/* Contexts will handle sync, notifications, etc */}
    </YourAppStructure>
  );
}
```

---

## 🔐 AuthContext - Integration Points

### Ajouter après le login réussi:

```javascript
import firestoreService from './services/firestoreService';
import syncService from './services/syncService';
import notificationService from './services/notificationService';

const handleLogin = async (email, password) => {
  try {
    // ... Firebase auth logic ...
    const user = auth.currentUser;
    
    // 1. Initialiser Firestore sync
    const { deviceId } = await syncService.initSync(user.uid);
    console.log('Multi-device sync initialized on:', deviceId);
    
    // 2. Initialiser les notifications
    const { enabled } = await notificationService.init(user.uid);
    console.log('Notifications enabled:', enabled);
    
    // 3. Charger le profil utilisateur depuis Firestore
    const userProfile = await firestoreService.getDoc(
      `users/${user.uid}`,
      'profile'
    );
    
    // 4. Sync la queue offline (données non synchronisées)
    const { synced, failed } = await syncService.syncOfflineQueue(user.uid);
    if (synced > 0) {
      console.log(`Synced ${synced} offline operations`);
    }
    
    // Mettre à jour le contexte
    setUser({...user, deviceId, profile: userProfile});
    
  } catch (error) {
    console.error('Login error:', error);
  }
};

// À l'logout, nettoyer les listeners
const handleLogout = () => {
  firestoreService.unsubscribeAll();
  syncService.stopPeriodicCheck(auth.currentUser.uid);
  notificationService.stopPeriodicCheck(auth.currentUser.uid);
  // ... autres cleanup ...
};
```

---

## 📊 Utiliser WeightEvolutionChart

### 1. Ajouter le composant à une page:

```jsx
import WeightEvolutionChart from './components/Charts/WeightEvolutionChart';
import { useUserContext } from './context/AuthContext';
import { useParams } from 'react-router-dom';

export function HorseDetailPage() {
  const { user } = useUserContext();
  const { horseId } = useParams();
  
  return (
    <div className="p-4">
      <h1>Détail Cheval</h1>
      
      <WeightEvolutionChart 
        userId={user.id}
        horseId={horseId}
        targetWeight={550} // kg
        showBCS={true}
        showTrendline={true}
        compact={false} // false = full layout, true = mobile
      />
      
      {/* Ajouter une nouvelle pesée */}
      <AddWeightForm horseId={horseId} />
    </div>
  );
}

function AddWeightForm({ horseId }) {
  const { user } = useUserContext();
  const { addMeasurement, loading } = useWeightData(user.id, horseId);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    await addMeasurement({
      weight: parseFloat(formData.get('weight')),
      bcs: formData.get('bcs') ? parseFloat(formData.get('bcs')) : undefined,
      notes: formData.get('notes')
    });
    
    e.target.reset();
  };
  
  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 border rounded">
      <input type="number" name="weight" placeholder="Poids (kg)" required />
      <input type="number" name="bcs" placeholder="BCS (5.5)" step="0.5" />
      <textarea name="notes" placeholder="Notes..."></textarea>
      <button type="submit" disabled={loading}>
        {loading ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
}
```

---

## 🔔 Utiliser les Notifications

### 1. Configuration dans Settings:

```jsx
import { useState, useEffect } from 'react';
import { notificationService } from './services/notificationService';
import { useUserContext } from './context/AuthContext';

export function NotificationSettings() {
  const { user } = useUserContext();
  const [prefs, setPrefs] = useState({});
  
  useEffect(() => {
    const loadPrefs = async () => {
      const preferences = await notificationService.getPreferences(user.id);
      setPrefs(preferences);
    };
    loadPrefs();
  }, [user.id]);
  
  const handleChange = (type, field, value) => {
    const newPrefs = {
      ...prefs,
      [type]: {...(prefs[type] || {}), [field]: value}
    };
    setPrefs(newPrefs);
  };
  
  const handleSave = async () => {
    await notificationService.updatePreferences(user.id, prefs);
    alert('Préférences sauvegardées!');
  };
  
  return (
    <div className="settings-panel">
      <h2>Notifications</h2>
      
      <div className="setting">
        <label>
          <input 
            type="checkbox"
            checked={prefs.weighing?.enabled || false}
            onChange={(e) => handleChange('weighing', 'enabled', e.target.checked)}
          />
          Rappels de pesée
        </label>
        
        {prefs.weighing?.enabled && (
          <select 
            value={prefs.weighing?.frequency || 'weekly'}
            onChange={(e) => handleChange('weighing', 'frequency', e.target.value)}
          >
            <option value="daily">Quotidien</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="biweekly">Bi-hebdomadaire</option>
            <option value="monthly">Mensuel</option>
          </select>
        )}
      </div>
      
      <div className="setting">
        <label>
          <input 
            type="checkbox"
            checked={prefs.care?.enabled || false}
            onChange={(e) => handleChange('care', 'enabled', e.target.checked)}
          />
          Rappels soins
        </label>
      </div>
      
      <button onClick={handleSave}>Sauvegarder</button>
    </div>
  );
}
```

---

## 💾 Sauvegarder les Données Chevaux

### Côté Component:

```javascript
import { useEffect, useState } from 'react';
import { firestoreService } from './services/firestoreService';
import { syncService } from './services/syncService';

function HorseForm({ userId, horseId }) {
  const [horse, setHorse] = useState({});
  const [saveStatus, setSaveStatus] = useState('');

  // Charger
  useEffect(() => {
    const loadHorse = async () => {
      try {
        const data = await firestoreService.getDoc(
          `horses/${userId}`,
          horseId
        );
        setHorse(data);
      } catch (error) {
        console.error('Erreur load:', error);
        // Fallback localStorage
        const local = JSON.parse(
          localStorage.getItem(`horse_${horseId}`) || '{}'
        );
        setHorse(local);
      }
    };
    
    if (userId && horseId) loadHorse();
  }, [userId, horseId]);

  // Sauvegarder
  const handleSave = async (updatedData) => {
    setSaveStatus('Enregistrement...');
    
    try {
      const result = await firestoreService.setDoc(
        `horses/${userId}`,
        horseId,
        {
          ...horse,
          ...updatedData,
          name: updatedData.name,
          age: parseInt(updatedData.age),
          breed: updatedData.breed,
          targetWeight: parseFloat(updatedData.targetWeight),
        },
        { merge: true }
      );
      
      if (result.offline) {
        setSaveStatus('✅ Enregistré localement (sera synced)');
      } else {
        setSaveStatus('✅ Enregistré dans le cloud');
      }
      
      // Mettre à jour local
      setHorse({...horse, ...updatedData});
      
      // Re-sync si offline queue exists
      const pending = firestoreService.getPendingOperationsCount();
      if (pending > 0 && navigator.onLine) {
        await syncService.syncOfflineQueue(userId);
      }
      
    } catch (error) {
      setSaveStatus(`❌ Erreur: ${error.message}`);
      console.error('Save error:', error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSave(horse);
    }}>
      {/* Form fields */}
      <input 
        value={horse.name || ''}
        onChange={(e) => setHorse({...horse, name: e.target.value})}
        placeholder="Nom du cheval"
      />
      {/* ... */}
      <button type="submit">Sauvegarder</button>
      {saveStatus && <p>{saveStatus}</p>}
    </form>
  );
}
```

---

## 📱 Gérer le Cache Mobile

### Espace disque:

```javascript
import { cacheStrategy } from './services/cacheStrategy';

async function CacheStats() {
  const stats = await cacheStrategy.getStats();
  
  return (
    <div>
      <h3>Espace utilisé</h3>
      {stats.total && (
        <p>
          {stats.total.usedMB} MB / {stats.total.quotaMB} MB
          ({Math.round((stats.total.usedMB / stats.total.quotaMB) * 100)}%)
        </p>
      )}
      
      <h4>par store:</h4>
      {Object.entries(stats).map(([store, data]) => (
        store !== 'total' && (
          <p key={store}>
            {store}: {data.count} items, {data.sizeKB} KB
          </p>
        )
      ))}
      
      <button onClick={() => cacheStrategy.clearAll()}>
        Vider le cache (debug)
      </button>
    </div>
  );
}
```

---

## 🔄 Real-time Listeners

### Écouter les chevaux en temps réel:

```javascript
import { useEffect, useState } from 'react';
import { firestoreService } from './services/firestoreService';

function HorseList({ userId }) {
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!userId) return;
    
    setLoading(true);
    
    // Real-time listener sur la collection
    const unsubscribe = firestoreService.listenToCollection(
      `horses/${userId}`,
      [], // no filters
      (data) => {
        setHorses(data);
        setLoading(false);
        console.log('Horses updated:', data.length);
      }
    );
    
    return () => unsubscribe(); // cleanup
  }, [userId]);
  
  if (loading) return <p>Chargement...</p>;
  
  return (
    <ul>
      {horses.map(horse => (
        <li key={horse.id}>{horse.name}</li>
      ))}
    </ul>
  );
}
```

---

## ⚡ Sync Indicator

### Montrer l'état de sync:

```jsx
import { useEffect, useState } from 'react';
import { syncService } from './services/syncService';
import { Wifi, WifiOff, Clock } from 'lucide-react';

function SyncIndicator() {
  const [syncState, setSyncState] = useState('offline');
  const [pending, setPending] = useState(0);
  
  useEffect(() => {
    // Subscribe au changement d'état
    const unsubscribe = syncService.subscribeSyncState((state) => {
      setSyncState(state);
    });
    
    // Check pending operations
    setPending(syncService.getPendingOperations());
    
    return unsubscribe;
  }, []);
  
  const statusConfig = {
    synced: {
      color: 'text-green-600',
      icon: <Wifi />,
      label: 'Synchronisé'
    },
    syncing: {
      color: 'text-blue-600',
      icon: <Clock className="animate-spin" />,
      label: 'Synchronisation...'
    },
    offline: {
      color: 'text-red-600',
      icon: <WifiOff />,
      label: 'Hors ligne'
    },
    error: {
      color: 'text-orange-600',
      icon: <WifiOff />,
      label: 'Erreur sync'
    }
  };
  
  const config = statusConfig[syncState];
  
  return (
    <div className={`flex items-center gap-2 ${config.color}`}>
      {config.icon}
      <span>{config.label}</span>
      {pending > 0 && <span className="text-xs">({pending} en attente)</span>}
    </div>
  );
}
```

---

## 🧪 Test Offline Mode

```javascript
// Dans les DevTools console:

// Simuler offline
navigator.onLine = false;

// Ajouter une donnée
await firestoreService.setDoc('horses/userId', 'horse1', {name: 'Test'});
// → Sera mise en queue

// Vérifier la queue
firestoreService.getOfflineQueue();
// → [{type: 'setDoc', ...}]

// Revenir online
navigator.onLine = true;

// Sync
await syncService.syncOfflineQueue('userId');
// → Synced!
```

---

## 🚨 Error Handling

```javascript
import { firestoreService } from './services/firestoreService';

async function safeOperation(operation) {
  try {
    const result = await operation();
    
    if (result.offline) {
      console.warn('⚠️ Operation queued offline');
      // Montrer toast: "Données sauvegardées localement"
    } else {
      console.log('✅ Operation synced to cloud');
    }
    
    return result;
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.error('Access denied - check Firestore rules');
    } else if (!navigator.onLine) {
      console.warn('Offline - retrying when online');
    } else {
      console.error('Unexpected error:', error);
    }
    
    // Fallback fallback: localStorage
    throw error;
  }
}
```

---

## 🔐 Firestore Security Rules

Ajouter à `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users data - private
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Horses - user specific
    match /horses/{userId}/{horseId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Events - user specific
    match /events/{userId}/{eventId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Settings - user specific
    match /settings/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## 📞 Troubleshooting

### "Firestore not initialized"
→ Vérifier `firebase.js` et imports

### "Real-time listener not working"
→ Vérifier Firestore Rules permissions
→ Checker la console pour les erreurs WebSocket

### "Cache not persisting"
→ Checker le quota de storage: `navigator.storage.estimate()`
→ Sur iOS: Safari Private Mode a un quota limité

### "Offline queue not syncing"
→ Vérifier `navigator.onLine` status
→ Vérifier les Security Rules
→ Check le localStorage pour `firestore_offline_queue`

---

## 📚 Références

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Real-time Listeners](https://firebase.google.com/docs/firestore/query-data/listen)
- [Offline Persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [Recharts](https://recharts.org/)
- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/notification)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

**Last updated**: 16/02/2026
**Author**: Auto-generated Integration Guide
