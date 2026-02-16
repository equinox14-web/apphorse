/**
 * Service de Cache Mobile Optimisé
 * Gère le nettoyage automatique des caches sur les versions nouvelles
 * Stratégie IndexedDB pour l'offline-first
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const APP_VERSION_KEY = 'app_version';
const CACHE_MANIFEST_KEY = 'cache_manifest';
const INDEXEDDB_NAME = 'AppHorse_Cache';
const INDEXEDDB_VERSION = 1;

const CACHE_STORES = {
  HORSE_DATA: 'horse_data',
  PHOTOS: 'photos',
  NUTRITION: 'nutrition',
  OFFLINE_QUEUE: 'offline_queue',
};

const CACHE_EXPIRY = {
  HORSE_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days
  PHOTOS: 30 * 24 * 60 * 60 * 1000, // 30 days
  NUTRITION: 7 * 24 * 60 * 60 * 1000, // 7 days
  PROFILES: 1 * 24 * 60 * 60 * 1000, // 1 day
};

// ============================================================================
// INDEXEDDB HELPER
// ============================================================================

class CacheDB {
  constructor() {
    this.db = null;
  }

  /**
   * Initialiser la base de données
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(INDEXEDDB_NAME, INDEXEDDB_VERSION);

      request.onerror = () => {
        console.error('❌ Erreur IndexedDB open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Créer les object stores
        for (const storeName of Object.values(CACHE_STORES)) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'key' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('expiry', 'expiry', { unique: false });
            console.log(`📦 Object store créé: ${storeName}`);
          }
        }
      };
    });
  }

  /**
   * Sauvegarder dans IndexedDB
   */
  async set(storeName, key, data, expiresIn = CACHE_EXPIRY.HORSE_DATA) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const record = {
        key,
        data,
        timestamp: Date.now(),
        expiry: Date.now() + expiresIn,
      };

      const request = store.put(record);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`💾 Cached: ${storeName}/${key}`);
        resolve(record);
      };
    });
  }

  /**
   * Récupérer depuis IndexedDB
   */
  async get(storeName, key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const record = request.result;

        if (!record) {
          resolve(null);
          return;
        }

        // Vérifier l'expiration
        if (record.expiry && Date.now() > record.expiry) {
          console.log(`⏳ Cache expiré: ${key}`);
          store.delete(key);
          resolve(null);
        } else {
          resolve(record.data);
        }
      };
    });
  }

  /**
   * Supprimer une entrée
   */
  async delete(storeName, key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`🗑️ Deleted: ${storeName}/${key}`);
        resolve();
      };
    });
  }

  /**
   * Vider un store
   */
  async clear(storeName) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`🧹 Cleared: ${storeName}`);
        resolve();
      };
    });
  }

  /**
   * Supprimer les entrées expirées
   */
  async clearExpired(storeName) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const index = store.index('expiry');
      const range = IDBKeyRange.upperBound(Date.now());
      const request = index.openCursor(range);

      let deleted = 0;

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          deleted++;
          cursor.continue();
        } else {
          if (deleted > 0) {
            console.log(`🧹 Cleared ${deleted} expired entries from ${storeName}`);
          }
          resolve(deleted);
        }
      };
    });
  }

  /**
   * Récupérer tous les enregistrements
   */
  async getAll(storeName) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const records = request.result.filter((r) => {
          if (r.expiry && Date.now() > r.expiry) {
            store.delete(r.key);
            return false;
          }
          return true;
        });
        resolve(records);
      };
    });
  }
}

const cacheDB = new CacheDB();

// ============================================================================
// MAIN SERVICE
// ============================================================================

export const cacheStrategy = {
  APP_VERSION: '1.3.0',

  /**
   * Initialiser le service de cache
   */
  init: async () => {
    try {
      console.log('🔄 Initialisation du cache strategy...');

      // Initialiser IndexedDB
      await cacheDB.init();

      // Vérifier la version
      await cacheStrategy.checkVersion();

      // Nettoyer les caches expirés
      await cacheStrategy.cleanupExpired();

      console.log('✅ Cache strategy initialisé');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur init cache:', error);
      return { success: false };
    }
  },

  /**
   * Vérifier la version et nettoyer si nécessaire
   */
  checkVersion: async () => {
    try {
      const storedVersion = localStorage.getItem(APP_VERSION_KEY);
      const currentVersion = cacheStrategy.APP_VERSION;

      if (storedVersion !== currentVersion) {
        console.log(
          `📦 Version change: ${storedVersion || 'unknown'} → ${currentVersion}`
        );
        await cacheStrategy.clearOnVersionChange();
        localStorage.setItem(APP_VERSION_KEY, currentVersion);
      }
    } catch (error) {
      console.error('❌ Erreur checkVersion:', error);
    }
  },

  /**
   * Nettoyer les caches lors d'une mise à jour
   */
  clearOnVersionChange: async () => {
    try {
      console.log('🧹 Nettoyage des caches suite à mise à jour...');

      // Garder: offline queue, settings, preferences
      const keepStores = [CACHE_STORES.OFFLINE_QUEUE];

      // Vider les autres
      for (const storeName of Object.values(CACHE_STORES)) {
        if (!keepStores.includes(storeName)) {
          await cacheDB.clear(storeName);
        }
      }

      // Vider les Service Worker caches si disponibles
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          // Ne vider que les caches de photos/assets, pas le cache critique
          if (
            cacheName.includes('photos') ||
            cacheName.includes('images')
          ) {
            await caches.delete(cacheName);
            console.log(`🗑️ Cache deleted: ${cacheName}`);
          }
        }
      }

      console.log('✅ Caches nettoyés');
    } catch (error) {
      console.error('❌ Erreur clearOnVersionChange:', error);
    }
  },

  /**
   * Nettoyer les entrées expirées
   */
  cleanupExpired: async () => {
    try {
      console.log('🧹 Nettoyage des caches expirés...');

      let totalDeleted = 0;
      for (const storeName of Object.values(CACHE_STORES)) {
        const deleted = await cacheDB.clearExpired(storeName);
        totalDeleted += deleted;
      }

      if (totalDeleted > 0) {
        console.log(`✅ ${totalDeleted} entrées expirées supprimées`);
      }

      return totalDeleted;
    } catch (error) {
      console.error('❌ Erreur cleanupExpired:', error);
      return 0;
    }
  },

  /**
   * Sauvegarder les données des chevaux
   */
  cacheHorseData: async (horseId, data) => {
    try {
      await cacheDB.set(
        CACHE_STORES.HORSE_DATA,
        horseId,
        data,
        CACHE_EXPIRY.HORSE_DATA
      );
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur cacheHorseData:', error);
      return { success: false };
    }
  },

  /**
   * Récupérer les données des chevaux depuis le cache
   */
  getHorseData: async (horseId) => {
    try {
      return await cacheDB.get(CACHE_STORES.HORSE_DATA, horseId);
    } catch (error) {
      console.error('❌ Erreur getHorseData:', error);
      return null;
    }
  },

  /**
   * Sauvegarder une photo
   */
  cachePhoto: async (photoId, photoData) => {
    try {
      // Compresser si possible
      const compressed = cacheStrategy.compressPhoto(photoData);
      await cacheDB.set(
        CACHE_STORES.PHOTOS,
        photoId,
        compressed,
        CACHE_EXPIRY.PHOTOS
      );
      return { success: true, size: JSON.stringify(compressed).length };
    } catch (error) {
      console.error('❌ Erreur cachePhoto:', error);
      return { success: false };
    }
  },

  /**
   * Récupérer une photo du cache
   */
  getPhoto: async (photoId) => {
    try {
      return await cacheDB.get(CACHE_STORES.PHOTOS, photoId);
    } catch (error) {
      console.error('❌ Erreur getPhoto:', error);
      return null;
    }
  },

  /**
   * Sauvegarder l'offline queue
   */
  saveOfflineQueue: async (operations) => {
    try {
      await cacheDB.set(
        CACHE_STORES.OFFLINE_QUEUE,
        'queue',
        operations,
        Infinity // N'expire jamais
      );
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur saveOfflineQueue:', error);
      return { success: false };
    }
  },

  /**
   * Récupérer l'offline queue
   */
  getOfflineQueue: async () => {
    try {
      return (await cacheDB.get(CACHE_STORES.OFFLINE_QUEUE, 'queue')) || [];
    } catch (error) {
      console.error('❌ Erreur getOfflineQueue:', error);
      return [];
    }
  },

  /**
   * Compresser une photo simple (réduire la qualité)
   */
  compressPhoto: (photoData) => {
    // Si c'est un Data URL, réduire la qualité
    if (typeof photoData === 'string' && photoData.startsWith('data:')) {
      // Implémenter la compression avec Canvas si nécessaire
      // Pour l'instant, garder tel quel
      return photoData;
    }
    return photoData;
  },

  /**
   * Récupérer les statistiques du cache
   */
  getStats: async () => {
    try {
      const stats = {};
      for (const storeName of Object.values(CACHE_STORES)) {
        const records = await cacheDB.getAll(storeName);
        const size = JSON.stringify(records).length;
        stats[storeName] = {
          count: records.length,
          sizeKB: Math.round(size / 1024),
        };
      }

      // Storage estimate si disponible
      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        stats.total = {
          usedMB: Math.round(estimate.usage / (1024 * 1024)),
          quotaMB: Math.round(estimate.quota / (1024 * 1024)),
        };
      }

      return stats;
    } catch (error) {
      console.error('❌ Erreur getStats:', error);
      return {};
    }
  },

  /**
   * Forcer le nettoyage complet (debug)
   */
  clearAll: async () => {
    try {
      console.log('🗑️ Nettoyage complet du cache...');

      for (const storeName of Object.values(CACHE_STORES)) {
        await cacheDB.clear(storeName);
      }

      // Vider aussi les SW caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }

      console.log('✅ Cache complètement vidé');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur clearAll:', error);
      return { success: false };
    }
  },

  // Export constants
  CACHE_STORES,
  CACHE_EXPIRY,
};

export default cacheStrategy;
