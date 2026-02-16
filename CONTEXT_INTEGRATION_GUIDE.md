# 🔧 Integration Guide - AuthContext & DataContext

## 📍 Where to Integrate

### 1. AuthContext.jsx - Login Flow

**File**: `src/context/AuthContext.jsx`

```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
// NEW IMPORTS
import firestoreService from '../services/firestoreService';
import syncService from '../services/syncService';
import notificationService from '../services/notificationService';
import cacheStrategy from '../services/cacheStrategy';

const UserContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState('offline');

  // Handle login
  const login = async (email, password) => {
    try {
      console.log('🔐 Logging in...');
      
      // Firebase auth
      const result = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;
      
      // ==================== NEW CODE ====================
      
      // 1. Initialize sync service
      console.log('📱 Initializing multi-device sync...');
      const syncInit = await syncService.initSync(firebaseUser.uid);
      
      // 2. Initialize notifications
      console.log('🔔 Setting up notifications...');
      const notifInit = await notificationService.init(firebaseUser.uid);
      
      // 3. Load user profile from Firestore
      console.log('👤 Loading user profile...');
      let userProfile = null;
      try {
        userProfile = await firestoreService.getDoc(
          `users/${firebaseUser.uid}`,
          'profile'
        );
      } catch (err) {
        console.warn('⚠️ Profile load failed, using defaults');
        // Create default profile
        userProfile = {
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'User',
          createdAt: new Date().toISOString()
        };
        // Save it
        await firestoreService.setDoc(
          `users/${firebaseUser.uid}`,
          'profile',
          userProfile
        );
      }
      
      // 4. Sync offline queue
      console.log('⏳ Syncing offline operations...');
      try {
        const syncResult = await syncService.syncOfflineQueue(firebaseUser.uid);
        console.log(`✅ Synced: ${syncResult.synced}, Failed: ${syncResult.failed}`);
      } catch (err) {
        console.warn('⚠️ Offline queue sync failed (will retry later)');
      }
      
      // 5. Setup real-time listeners
      console.log('🔴 Setting up real-time listeners...');
      setupRealtimeListeners(firebaseUser.uid);
      
      // ===================================================
      
      // Update context
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        ...userProfile,
        deviceId: syncInit.deviceId,
        notificationsEnabled: notifInit.enabled,
        syncState: 'synced'
      });
      
      console.log('✅ Login successful');
      return true;
      
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  // Handle logout
  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      
      // ==================== NEW CODE ====================
      
      // Cleanup listeners
      firestoreService.unsubscribeAll();
      
      // Stop periodic checks
      if (user?.uid) {
        syncService.stopPeriodicCheck(user.uid);
        notificationService.stopPeriodicCheck(user.uid);
      }
      
      // Clear sync state
      localStorage.removeItem('device_id');
      localStorage.removeItem('sync_state');
      
      // ===================================================
      
      // Firebase logout
      await auth.signOut();
      setUser(null);
      
      console.log('✅ Logout successful');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  };

  // Setup real-time listeners
  const setupRealtimeListeners = (userId) => {
    // Listen to user profile changes
    firestoreService.listenToDoc(
      `users/${userId}`,
      'profile',
      (profile) => {
        setUser(prev => ({...prev, ...profile}));
        console.log('👤 Profile updated from cloud');
      }
    );

    // Listen to sync state changes
    const unsubscribe = syncService.subscribeSyncState((state) => {
      setSyncState(state);
      setUser(prev => ({...prev, syncState: state}));
      console.log(`📡 Sync state: ${state}`);
    });

    return unsubscribe;
  };

  // Check auth state on mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Initialize everything
        try {
          // Quick init without full login flow
          const syncInit = await syncService.initSync(firebaseUser.uid);
          await notificationService.init(firebaseUser.uid);
          
          // Load profile
          const userProfile = await firestoreService.getDoc(
            `users/${firebaseUser.uid}`,
            'profile'
          );
          
          // Setup listeners
          setupRealtimeListeners(firebaseUser.uid);
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...userProfile,
            deviceId: syncInit.deviceId,
            syncState: 'synced'
          });
        } catch (err) {
          console.error('❌ Auto-auth init failed:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      loading,
      syncState,
      login,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

### 2. App.jsx - Startup Initialization

**File**: `src/App.jsx`

```javascript
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
// NEW IMPORT
import cacheStrategy from './services/cacheStrategy';

function App() {
  const { user, loading } = useAuth();

  // Initialize cache on app startup
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('⚙️ Initializing AppHorse...');
        
        // 1. Initialize cache system
        console.log('💾 Setting up cache...');
        const cacheInit = await cacheStrategy.init();
        
        if (cacheInit.success) {
          console.log('✅ Cache initialized');
          
          // Check for cache stats
          const stats = await cacheStrategy.getStats();
          console.log('📊 Cache stats:', stats);
        }
        
        // 2. Other app initialization...
        // Analytics, feature flags, etc
        
        console.log('✅ App initialization complete');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        // App should still work, cache is optional
      }
    };

    initializeApp();
  }, []);

  if (loading) {
    return <div>Loading AppHorse...</div>;
  }

  return (
    <div className="app">
      {user ? (
        <AuthenticatedApp user={user} />
      ) : (
        <LoginPage />
      )}
    </div>
  );
}

export default App;
```

---

### 3. DataContext.jsx (NEW) - Centralized Data Management

**File**: `src/context/DataContext.jsx`

```javascript
/**
 * DataContext - Manages global app data with real-time Firestore sync
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import firestoreService from '../services/firestoreService';

const DataContext = createContext();

export function DataProvider({ children }) {
  const { user } = useAuth();
  
  // State
  const [horses, setHorses] = useState([]);
  const [nutrition, setNutrition] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Setup real-time listeners when user logs in
  useEffect(() => {
    if (!user?.uid) return;

    console.log('📡 Setting up data listeners...');
    const unsubscribers = [];

    try {
      // Listen to horses
      const unsubHorses = firestoreService.listenToCollection(
        `horses/${user.uid}`,
        [],
        (data) => {
          setHorses(data);
          console.log(`🐴 Horses updated: ${data.length} horses`);
        }
      );
      unsubscribers.push(unsubHorses);

      // Listen to nutrition plans
      const unsubNutrition = firestoreService.listenToCollection(
        `nutrition/${user.uid}`,
        [],
        (data) => {
          setNutrition(data);
          console.log(`🥕 Nutrition plans: ${data.length} plans`);
        }
      );
      unsubscribers.push(unsubNutrition);

      // Listen to events
      const unsubEvents = firestoreService.listenToCollection(
        `events/${user.uid}`,
        [],
        (data) => {
          setEvents(data);
          console.log(`📅 Events: ${data.length} events`);
        }
      );
      unsubscribers.push(unsubEvents);

    } catch (err) {
      console.error('❌ Error setting up listeners:', err);
      setError(err.message);
    }

    // Cleanup on unmount or user change
    return () => {
      unsubscribers.forEach(unsub => unsub());
      console.log('🔵 Listeners cleaned up');
    };

  }, [user?.uid]);

  // Helper functions
  const addHorse = async (horseData) => {
    try {
      const horseId = `horse_${Date.now()}`;
      await firestoreService.setDoc(
        `horses/${user.uid}`,
        horseId,
        {
          ...horseData,
          id: horseId,
          createdAt: new Date().toISOString()
        }
      );
      return { success: true, horseId };
    } catch (err) {
      console.error('❌ Error adding horse:', err);
      throw err;
    }
  };

  const updateHorse = async (horseId, updates) => {
    try {
      await firestoreService.updateDoc(
        `horses/${user.uid}`,
        horseId,
        updates
      );
      return { success: true };
    } catch (err) {
      console.error('❌ Error updating horse:', err);
      throw err;
    }
  };

  const deleteHorse = async (horseId) => {
    try {
      await firestoreService.deleteDoc(
        `horses/${user.uid}`,
        horseId
      );
      return { success: true };
    } catch (err) {
      console.error('❌ Error deleting horse:', err);
      throw err;
    }
  };

  return (
    <DataContext.Provider value={{
      horses,
      nutrition,
      events,
      loading,
      error,
      addHorse,
      updateHorse,
      deleteHorse
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
```

---

### 4. Root App Setup

**File**: `src/main.jsx`

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </AuthProvider>
  </React.StrictMode>,
)
```

---

## 🎯 Usage Examples

### In a Component

```jsx
import { useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';
import WeightEvolutionChart from './components/Charts/WeightEvolutionChart';

export function HorseDetailPage({ horseId }) {
  const { user, syncState } = useAuth();
  const { horses, updateHorse } = useData();
  const { addMeasurement } = useWeightData(user.uid, horseId);

  const horse = horses.find(h => h.id === horseId);

  if (!horse) return <div>Horse not found</div>;

  return (
    <div className="horse-detail">
      <h1>{horse.name}</h1>
      
      {/* Sync status indicator */}
      <div className="sync-status">
        Status: {syncState}
      </div>

      {/* Weight chart */}
      <WeightEvolutionChart
        userId={user.uid}
        horseId={horseId}
        targetWeight={horse.targetWeight}
      />

      {/* Add measurement form */}
      <form onSubmit={async (e) => {
        e.preventDefault();
        const weight = e.target.weight.value;
        await addMeasurement({weight: parseFloat(weight)});
        e.target.reset();
      }}>
        <input name="weight" type="number" placeholder="Weight (kg)" required />
        <button type="submit">Record Weight</button>
      </form>
    </div>
  );
}
```

---

## 🧪 Testing the Integration

```javascript
// In browser console after login:

// 1. Check user context
console.log('User:', window.__user);

// 2. Check sync status
console.log('Sync state:', window.__syncState);

// 3. Check offline queue
const queue = firestoreService.getOfflineQueue();
console.log('Pending operations:', queue.length);

// 4. Check cache stats
const stats = await cacheStrategy.getStats();
console.log('Cache stats:', stats);

// 5. Test offline mode
navigator.onLine = false;
// Try to add horse
// Should appear in offline queue

// 6. Go back online
navigator.onLine = true;
// Sync should happen automatically
```

---

## ⚠️ Common Issues

### Issue: "useAuth must be used within AuthProvider"
**Solution**: Wrap your component tree with `<AuthProvider>` in `main.jsx`

### Issue: Listeners keep resubscribing
**Solution**: Check cleanup is correct in useEffect return statement

### Issue: Slow login after migration
**Solution**: Profile load from Firestore might be slow, use IndexedDB cache

### Issue: Data not syncing
**Solution**: Check Firestore security rules allow read/write

---

## 🔄 Migration Checklist

- [ ] Create `DataContext.jsx`
- [ ] Import services in `AuthContext.jsx`
- [ ] Add initialization code to `login()` function
- [ ] Add cleanup code to `logout()` function
- [ ] Update `App.jsx` with cache initialization
- [ ] Wrap app with `<DataProvider>` in `main.jsx`
- [ ] Test login flow
- [ ] Test real-time updates
- [ ] Test offline mode
- [ ] Verify weight chart loads
- [ ] Test notifications
- [ ] Monitor Firestore operations

---

**Last Updated**: 16/02/2026
