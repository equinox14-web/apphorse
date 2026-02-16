/**
 * Service Firestore centralisé
 * Remplace firestoreSync et gérer tous les accès Firestore
 * Inclut retry logic, offline queuing, real-time listeners
 */

import { db } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms
const OFFLINE_QUEUE_KEY = 'firestore_offline_queue';
const REAL_TIME_LISTENERS = new Map(); // Track active listeners

// ============================================================================
// OFFLINE QUEUE MANAGEMENT
// ============================================================================

class OfflineQueue {
  constructor() {
    this.queue = this.loadQueue();
  }

  loadQueue() {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('❌ Erreur lecture offline queue:', e);
      return [];
    }
  }

  saveQueue() {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
  }

  add(operation) {
    this.queue.push({
      ...operation,
      timestamp: Date.now(),
      id: `${Date.now()}_${Math.random()}`,
    });
    this.saveQueue();
    console.log(`📝 Opération mise en queue (${this.queue.length} total)`);
  }

  getAll() {
    return [...this.queue];
  }

  remove(operationId) {
    this.queue = this.queue.filter((op) => op.id !== operationId);
    this.saveQueue();
  }

  clear() {
    this.queue = [];
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }
}

const offlineQueue = new OfflineQueue();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sanitize data for Firestore
 */
function sanitizeForFirestore(data) {
  if (data === null || data === undefined) return null;
  if (typeof data === 'number' && (!isFinite(data) || isNaN(data))) return null;
  if (typeof data === 'function') return null;

  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore).filter((item) => item !== null);
  }

  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      const sanitizedValue = sanitizeForFirestore(value);
      if (sanitizedValue !== null && sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue;
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Retry with exponential backoff
 */
async function withRetry(fn, retries = MAX_RETRIES) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries - 1) {
        const delay = RETRY_DELAY * Math.pow(2, i);
        console.log(`⏳ Retry ${i + 1}/${retries} après ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export const firestoreService = {
  /**
   * Savoir si nous sommes en ligne
   */
  isOnline: () => navigator.onLine,

  // ========================================================================
  // WRITE OPERATIONS
  // ========================================================================

  /**
   * Sauvegarder un document
   * @param {string} collectionPath - e.g., 'users/userId/horses'
   * @param {string} docId - e.g., 'horse_123'
   * @param {Object} data - Document data
   * @param {Object} options - {merge, offline}
   */
  setDoc: async (collectionPath, docId, data, options = {}) => {
    const { merge = false, offline = true } = options;
    const cleanData = sanitizeForFirestore(data);
    cleanData.updatedAt = serverTimestamp();

    try {
      if (!navigator.onLine && offline) {
        offlineQueue.add({
          type: 'setDoc',
          collectionPath,
          docId,
          data: cleanData,
          merge,
        });
        return { success: true, offline: true };
      }

      await withRetry(async () => {
        const docRef = doc(db, collectionPath, docId);
        await setDoc(docRef, cleanData, { merge });
      });

      console.log(`✅ Document sauvegardé: ${collectionPath}/${docId}`);
      return { success: true, offline: false };
    } catch (error) {
      console.error(`❌ Erreur setDoc ${collectionPath}/${docId}:`, error);
      if (offline) {
        offlineQueue.add({
          type: 'setDoc',
          collectionPath,
          docId,
          data: cleanData,
          merge,
        });
        return { success: true, offline: true };
      }
      throw error;
    }
  },

  /**
   * Mettre à jour un document (merge)
   */
  updateDoc: async (collectionPath, docId, updates) => {
    const cleanUpdates = sanitizeForFirestore(updates);
    cleanUpdates.updatedAt = serverTimestamp();

    try {
      if (!navigator.onLine) {
        offlineQueue.add({
          type: 'updateDoc',
          collectionPath,
          docId,
          data: cleanUpdates,
        });
        return { success: true, offline: true };
      }

      await withRetry(async () => {
        const docRef = doc(db, collectionPath, docId);
        await updateDoc(docRef, cleanUpdates);
      });

      console.log(`✅ Document mis à jour: ${collectionPath}/${docId}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Erreur updateDoc:`, error);
      if (navigator.isOnline) {
        offlineQueue.add({
          type: 'updateDoc',
          collectionPath,
          docId,
          data: cleanUpdates,
        });
        return { success: true, offline: true };
      }
      throw error;
    }
  },

  /**
   * Ajouter un élément à un array (atomic)
   */
  addArrayElement: async (collectionPath, docId, arrayField, element) => {
    try {
      if (!navigator.onLine) {
        offlineQueue.add({
          type: 'addArrayElement',
          collectionPath,
          docId,
          arrayField,
          element,
        });
        return { success: true, offline: true };
      }

      const docRef = doc(db, collectionPath, docId);
      await updateDoc(docRef, {
        [arrayField]: arrayUnion(element),
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Élément ajouté au array: ${arrayField}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Erreur addArrayElement:`, error);
      throw error;
    }
  },

  /**
   * Supprimer un élément d'un array (atomic)
   */
  removeArrayElement: async (collectionPath, docId, arrayField, element) => {
    try {
      const docRef = doc(db, collectionPath, docId);
      await updateDoc(docRef, {
        [arrayField]: arrayRemove(element),
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error(`❌ Erreur removeArrayElement:`, error);
      throw error;
    }
  },

  /**
   * Supprimer un document
   */
  deleteDoc: async (collectionPath, docId) => {
    try {
      if (!navigator.onLine) {
        offlineQueue.add({
          type: 'deleteDoc',
          collectionPath,
          docId,
        });
        return { success: true, offline: true };
      }

      await withRetry(async () => {
        const docRef = doc(db, collectionPath, docId);
        await deleteDoc(docRef);
      });

      console.log(`✅ Document supprimé: ${collectionPath}/${docId}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Erreur deleteDoc:`, error);
      throw error;
    }
  },

  /**
   * Opération batch (jusqu'à 500 docs)
   */
  batch: async (operations) => {
    try {
      if (!navigator.onLine) {
        offlineQueue.add({
          type: 'batch',
          operations,
        });
        return { success: true, offline: true };
      }

      const batch = writeBatch(db);

      for (const op of operations) {
        const docRef = doc(db, op.collectionPath, op.docId);
        if (op.type === 'set') {
          batch.set(docRef, sanitizeForFirestore(op.data));
        } else if (op.type === 'update') {
          batch.update(docRef, sanitizeForFirestore(op.data));
        } else if (op.type === 'delete') {
          batch.delete(docRef);
        }
      }

      await batch.commit();
      console.log(`✅ Batch de ${operations.length} opérations complété`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Erreur batch:`, error);
      throw error;
    }
  },

  // ========================================================================
  // READ OPERATIONS
  // ========================================================================

  /**
   * Lire un document
   */
  getDoc: async (collectionPath, docId) => {
    try {
      const docRef = doc(db, collectionPath, docId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        console.warn(`⚠️ Document non trouvé: ${collectionPath}/${docId}`);
        return null;
      }

      return { id: snapshot.id, ...snapshot.data() };
    } catch (error) {
      console.error(`❌ Erreur getDoc:`, error);
      throw error;
    }
  },

  /**
   * Requête avec filtres
   * @param {string} collectionPath
   * @param {Array} constraints - [where, where, ...]
   */
  query: async (collectionPath, constraints = []) => {
    try {
      const collectionRef = collection(db, collectionPath);
      const q = query(collectionRef, ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error(`❌ Erreur query:`, error);
      throw error;
    }
  },

  /**
   * Récupérer tous les documents d'une collection
   */
  getAll: async (collectionPath) => {
    try {
      const collectionRef = collection(db, collectionPath);
      const snapshot = await getDocs(collectionRef);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error(`❌ Erreur getAll:`, error);
      throw error;
    }
  },

  // ========================================================================
  // REAL-TIME LISTENERS
  // ========================================================================

  /**
   * Setup real-time listener sur un document
   * @returns {Function} unsubscribe function
   */
  listenToDoc: (collectionPath, docId, callback) => {
    try {
      const docRef = doc(db, collectionPath, docId);
      const listenerKey = `${collectionPath}/${docId}`;

      // Unsubscribe si listener existe déjà
      if (REAL_TIME_LISTENERS.has(listenerKey)) {
        REAL_TIME_LISTENERS.get(listenerKey)();
      }

      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            callback({ id: snapshot.id, ...snapshot.data() });
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error(`❌ Erreur listener ${listenerKey}:`, error);
          // Fallback: poll sur offline ou temporal disconnect
        }
      );

      REAL_TIME_LISTENERS.set(listenerKey, unsubscribe);
      console.log(`🔴 Listener attaché: ${listenerKey}`);

      return unsubscribe;
    } catch (error) {
      console.error(`❌ Erreur listenToDoc:`, error);
      throw error;
    }
  },

  /**
   * Setup real-time listener sur une collection
   */
  listenToCollection: (collectionPath, constraints = [], callback) => {
    try {
      const collectionRef = collection(db, collectionPath);
      const q = query(collectionRef, ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          callback(docs);
        },
        (error) => {
          console.error(`❌ Erreur listener collection:`, error);
        }
      );

      REAL_TIME_LISTENERS.set(collectionPath, unsubscribe);
      console.log(`🔴 Collection listener: ${collectionPath}`);

      return unsubscribe;
    } catch (error) {
      console.error(`❌ Erreur listenToCollection:`, error);
      throw error;
    }
  },

  /**
   * Détacher tous les listeners
   */
  unsubscribeAll: () => {
    REAL_TIME_LISTENERS.forEach((unsubscribe) => unsubscribe());
    REAL_TIME_LISTENERS.clear();
    console.log('🔵 Tous les listeners détachés');
  },

  /**
   * Détacher un listener spécifique
   */
  unsubscribe: (listenerKey) => {
    if (REAL_TIME_LISTENERS.has(listenerKey)) {
      REAL_TIME_LISTENERS.get(listenerKey)();
      REAL_TIME_LISTENERS.delete(listenerKey);
      console.log(`🔵 Listener détaché: ${listenerKey}`);
    }
  },

  // ========================================================================
  // OFFLINE QUEUE
  // ========================================================================

  /**
   * Synchroniser la queue offline
   */
  syncOfflineQueue: async () => {
    const operations = offlineQueue.getAll();
    if (operations.length === 0) {
      console.log('✅ Queue offline vide');
      return { synced: 0, failed: 0 };
    }

    console.log(`⏳ Synchronisation de ${operations.length} opérations...`);

    let synced = 0;
    let failed = 0;

    for (const op of operations) {
      try {
        if (!navigator.onLine) {
          console.log('⚠️ Retour en mode offline, sync annulée');
          break;
        }

        switch (op.type) {
          case 'setDoc':
            await firestoreService.setDoc(op.collectionPath, op.docId, op.data, {
              merge: op.merge,
              offline: false,
            });
            break;
          case 'updateDoc':
            await firestoreService.updateDoc(op.collectionPath, op.docId, op.data);
            break;
          case 'deleteDoc':
            await firestoreService.deleteDoc(op.collectionPath, op.docId);
            break;
          case 'addArrayElement':
            await firestoreService.addArrayElement(
              op.collectionPath,
              op.docId,
              op.arrayField,
              op.element
            );
            break;
          case 'batch':
            await firestoreService.batch(op.operations);
            break;
        }

        offlineQueue.remove(op.id);
        synced++;
      } catch (error) {
        console.error(`❌ Erreur sync opération:`, error);
        failed++;
      }
    }

    console.log(`✅ Sync complète: ${synced} réussies, ${failed} échouées`);
    return { synced, failed };
  },

  /**
   * Récupérer la queue offline
   */
  getOfflineQueue: () => offlineQueue.getAll(),

  /**
   * Effacer la queue offline
   */
  clearOfflineQueue: () => offlineQueue.clear(),

  /**
   * Nombre d'opérations en attente
   */
  getPendingOperationsCount: () => offlineQueue.queue.length,
};

export default firestoreService;
