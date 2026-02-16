/**
 * Service de Synchronisation Multi-Device
 * Gère la cohérence des données entre les appareils d'un même utilisateur
 * Détecte et résout les conflits, gère l'état de sync
 */

import firestoreService from './firestoreService';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

const DEVICE_ID_KEY = 'device_id';
const SYNC_STATE_KEY = 'sync_state';
const LAST_SYNC_KEY = 'last_sync_timestamp';

const SYNC_STATES = {
  SYNCED: 'synced',
  SYNCING: 'syncing',
  OFFLINE: 'offline',
  ERROR: 'error',
  CONFLICT: 'conflict',
};

const CONFLICT_STRATEGIES = {
  REMOTE_WINS: 'remote', // Remote overwrites local
  LOCAL_WINS: 'local', // Keep local data
  MERGE: 'merge', // Intelligent merge
  MANUAL: 'manual', // Notify user
};

// ============================================================================
// DEVICE IDENTIFICATION
// ============================================================================

/**
 * Générer ou récupérer un ID unique pour ce device
 */
function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

// ============================================================================
// SYNC STATE MANAGEMENT
// ============================================================================

class SyncStateManager {
  constructor() {
    this.callbacks = [];
  }

  setState(newState) {
    const current = this.getState();
    if (current !== newState) {
      localStorage.setItem(SYNC_STATE_KEY, newState);
      this.notify(newState);
      console.log(`📡 Sync state: ${current} → ${newState}`);
    }
  }

  getState() {
    return localStorage.getItem(SYNC_STATE_KEY) || SYNC_STATES.OFFLINE;
  }

  subscribe(callback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  notify(state) {
    this.callbacks.forEach((cb) => cb(state));
  }

  isOnline() {
    return this.getState() !== SYNC_STATES.OFFLINE;
  }
}

const syncStateManager = new SyncStateManager();

// ============================================================================
// MAIN SERVICE
// ============================================================================

export const syncService = {
  /**
   * Initialiser la synchronisation pour un utilisateur
   */
  initSync: async (userId) => {
    try {
      const deviceId = getOrCreateDeviceId();
      console.log(`📱 Device ID: ${deviceId}`);
      console.log(`👤 User ID: ${userId}`);

      // Setup listener sur le device de l'utilisateur
      syncService.setupDeviceListener(userId, deviceId);

      // Sync la queue offline
      await syncService.syncOfflineQueue(userId);

      // Setter l'état à synced
      syncStateManager.setState(SYNC_STATES.SYNCED);

      return { success: true, deviceId };
    } catch (error) {
      console.error('❌ Erreur initSync:', error);
      syncStateManager.setState(SYNC_STATES.ERROR);
      throw error;
    }
  },

  /**
   * Setup listener sur les données cloud pour détecte les changements
   * depuis d'autres appareils
   */
  setupDeviceListener: (userId, deviceId) => {
    // Écouter les modifications sur le profil utilisateur
    firestoreService.listenToDoc(`users/${userId}`, 'profile', (remoteProfile) => {
      if (!remoteProfile) return;

      const localProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');

      // Vérifier si une syncronisation est nécessaire
      if (remoteProfile.updatedAt && localProfile.updatedAt) {
        const remoteTm = new Date(remoteProfile.updatedAt).getTime();
        const localTm = new Date(localProfile.updatedAt).getTime();

        if (remoteTm > localTm) {
          syncService.handleRemoteUpdate('profile', remoteProfile, deviceId);
        }
      }
    });

    // Écouter les modifications sur les chevaux
    firestoreService.listenToCollection(
      `horses/${userId}`,
      [],
      (remoteHorses) => {
        syncService.syncHorsesData(remoteHorses, deviceId);
      }
    );

    console.log('🔴 Multi-device listeners activés');
  },

  /**
   * Traiter une mise à jour distante
   */
  handleRemoteUpdate: (dataType, remoteData, deviceId) => {
    const localKey = `appHorse_${dataType}_v1`;
    const localData = JSON.parse(localStorage.getItem(localKey) || '{}');

    // Vérifier pour les conflits
    const conflict = syncService.detectConflict(localData, remoteData);

    if (conflict) {
      console.log(`⚠️ Conflit détecté pour ${dataType}`);
      syncStateManager.setState(SYNC_STATES.CONFLICT);

      // Résoudre le conflit
      const resolved = syncService.resolveConflict(
        localData,
        remoteData,
        CONFLICT_STRATEGIES.REMOTE_WINS // Par défaut: remote gagne
      );

      localStorage.setItem(localKey, JSON.stringify(resolved));
      console.log(`✅ Conflit résolu (remote wins)`);
    } else {
      // Pas de conflit, mettre à jour local
      localStorage.setItem(localKey, JSON.stringify(remoteData));
      console.log(`✅ Local mis à jour depuis le cloud`);
    }

    syncStateManager.setState(SYNC_STATES.SYNCED);
  },

  /**
   * Synchroniser les données des chevaux
   */
  syncHorsesData: (remoteHorses, deviceId) => {
    try {
      const localKey = 'my_horses_v4';
      const localHorses = JSON.parse(localStorage.getItem(localKey) || '[]');

      // Map remote horses by ID
      const remoteMap = new Map(remoteHorses.map((h) => [h.id, h]));
      const localMap = new Map(localHorses.map((h) => [h.id, h]));

      // Détecter les changes
      let hasChanges = false;

      // Check pour les chevaux supprimés à distance
      for (const [id, _] of localMap) {
        if (!remoteMap.has(id)) {
          console.log(`🗑️ Cheval supprimé sur device: ${id}`);
          localHorses = localHorses.filter((h) => h.id !== id);
          hasChanges = true;
        }
      }

      // Check pour les nouveaux chevaux ou mises à jour
      for (const [id, remoteHorse] of remoteMap) {
        const localHorse = localMap.get(id);

        if (!localHorse) {
          // Nouveau cheval
          localHorses.push(remoteHorse);
          hasChanges = true;
          console.log(`✨ Nouveau cheval syncé: ${remoteHorse.name}`);
        } else {
          // Vérifier les timestamp pour voir qui gagne
          const remoteTm = new Date(remoteHorse.updatedAt || 0).getTime();
          const localTm = new Date(localHorse.updatedAt || 0).getTime();

          if (remoteTm > localTm) {
            // Remote est plus récent
            const idx = localHorses.findIndex((h) => h.id === id);
            localHorses[idx] = remoteHorse;
            hasChanges = true;
            console.log(`🔄 Cheval mis à jour: ${remoteHorse.name}`);
          }
        }
      }

      if (hasChanges) {
        localStorage.setItem(localKey, JSON.stringify(localHorses));
        syncStateManager.setState(SYNC_STATES.SYNCED);
      }
    } catch (error) {
      console.error('❌ Erreur syncHorsesData:', error);
    }
  },

  /**
   * Détecter un conflit entre données locales et distantes
   */
  detectConflict: (localData, remoteData) => {
    // Hashes simples pour comparaison rapide
    const localHash = JSON.stringify(localData);
    const remoteHash = JSON.stringify(remoteData);

    if (localHash !== remoteHash) {
      // Vérifier si c'est juste un changement d'ordre ou de structure
      // vs. une vraie modification de données
      return syncService.isConflictingChange(localData, remoteData);
    }

    return false;
  },

  /**
   * Déterminer si le changement est un vrai conflit
   */
  isConflictingChange: (local, remote) => {
    // Si local a des changements plus récents que remote: conflit
    if (local.updatedAt && remote.updatedAt) {
      const localTm = new Date(local.updatedAt).getTime();
      const remoteTm = new Date(remote.updatedAt).getTime();

      // Conflit si local est plus récent mais != remote (user a modifié)
      if (localTm > remoteTm) {
        return true;
      }
    }

    return false;
  },

  /**
   * Résoudre un conflit selon la stratégie choisie
   */
  resolveConflict: (localData, remoteData, strategy = CONFLICT_STRATEGIES.REMOTE_WINS) => {
    switch (strategy) {
      case CONFLICT_STRATEGIES.REMOTE_WINS:
        return remoteData;

      case CONFLICT_STRATEGIES.LOCAL_WINS:
        return localData;

      case CONFLICT_STRATEGIES.MERGE:
        // Merge intelligent: garder les champs les plus à jour
        return syncService.mergeConflict(localData, remoteData);

      case CONFLICT_STRATEGIES.MANUAL:
        // Retourner un objet avec les deux versions
        return {
          local: localData,
          remote: remoteData,
          needsManualResolve: true,
        };

      default:
        return remoteData;
    }
  },

  /**
   * Merge intelligent de données conflictuelles
   */
  mergeConflict: (localData, remoteData) => {
    const merged = { ...remoteData };

    for (const key in localData) {
      if (typeof localData[key] === 'object' && localData[key] !== null) {
        // Pour les objets imbriqués, prendre la version la plus récente
        if (localData[key].updatedAt && remoteData[key]?.updatedAt) {
          const localTm = new Date(localData[key].updatedAt).getTime();
          const remoteTm = new Date(remoteData[key].updatedAt).getTime();
          if (localTm > remoteTm) {
            merged[key] = localData[key];
          }
        }
      }
    }

    merged.mergedFrom = { local: localData, remote: remoteData };
    return merged;
  },

  /**
   * Synchroniser la queue offline
   */
  syncOfflineQueue: async (userId) => {
    if (!navigator.onLine) {
      console.log('⚠️ Hors ligne, sync annulée');
      syncStateManager.setState(SYNC_STATES.OFFLINE);
      return { synced: 0, failed: 0 };
    }

    syncStateManager.setState(SYNC_STATES.SYNCING);

    try {
      const result = await firestoreService.syncOfflineQueue();
      syncStateManager.setState(SYNC_STATES.SYNCED);
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      return result;
    } catch (error) {
      console.error('❌ Erreur syncOfflineQueue:', error);
      syncStateManager.setState(SYNC_STATES.ERROR);
      throw error;
    }
  },

  /**
   * Sauvegarder les données locales vers Firestore
   */
  saveToCloud: async (userId, dataType, data) => {
    try {
      syncStateManager.setState(SYNC_STATES.SYNCING);

      await firestoreService.setDoc(
        `users/${userId}/${dataType}`,
        'data',
        {
          ...data,
          deviceId: getOrCreateDeviceId(),
          syncedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      syncStateManager.setState(SYNC_STATES.SYNCED);
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      console.log(`✅ ${dataType} sauvegardé dans le cloud`);

      return { success: true };
    } catch (error) {
      console.error(`❌ Erreur saveToCloud ${dataType}:`, error);
      syncStateManager.setState(SYNC_STATES.ERROR);
      throw error;
    }
  },

  /**
   * Charger les données du cloud
   */
  loadFromCloud: async (userId, dataType) => {
    try {
      syncStateManager.setState(SYNC_STATES.SYNCING);

      const data = await firestoreService.getDoc(
        `users/${userId}/${dataType}`,
        'data'
      );

      syncStateManager.setState(SYNC_STATES.SYNCED);
      return data;
    } catch (error) {
      console.error(`❌ Erreur loadFromCloud ${dataType}:`, error);
      syncStateManager.setState(SYNC_STATES.ERROR);
      throw error;
    }
  },

  /**
   * Subscribe aux changements de l'état de sync
   */
  subscribeSyncState: (callback) => {
    return syncStateManager.subscribe(callback);
  },

  /**
   * Récupérer l'état de sync actuel
   */
  getSyncState: () => syncStateManager.getState(),

  /**
   * Vérifier si online
   */
  isOnline: () => syncStateManager.isOnline(),

  /**
   * Timestamp du dernier sync
   */
  getLastSyncTime: () => {
    const tm = localStorage.getItem(LAST_SYNC_KEY);
    return tm ? parseInt(tm) : null;
  },

  /**
   * Nombre d'opérations en attente
   */
  getPendingOperations: () => {
    return firestoreService.getPendingOperationsCount();
  },

  // Constants export
  SYNC_STATES,
  CONFLICT_STRATEGIES,
};

export default syncService;
