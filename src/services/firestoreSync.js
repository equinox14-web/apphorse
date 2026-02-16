/**
 * Service de synchronisation LocalStorage <-> Firestore
 * Sauvegarde et restaure les données utilisateur dans le cloud
 */

import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Liste des clés localStorage à synchroniser
const SYNC_KEYS = [
    'my_horses_v4',
    'appHorse_careItems_v3',
    'appHorse_breeding_v2',
    'appHorse_leases_v3',
    'appHorse_clients_v2',
    'appHorse_team_v2',
    'appHorse_billing_v1',
    'appHorse_billing_suppliers_v1',
    'appHorse_customEvents',
    'appHorse_budget',
    'appHorse_stock_v1',
    'appHorse_customFeeds', // Custom feed library
    'ai_training_plans',
    'weather_coords',
    'appHorse_register_movements',
    'appHorse_register_establishment',
    'equinox_assistant_history', // Chat History
    'user_name', // Profile data backup
    'user_logo',
    'user_role',
    'subscriptionPlan',
    'app_theme', // User preference: Theme
    'app_mode'   // User preference: Light/Dark mode
];

/**
 * Sanitize data for Firestore by removing invalid values
 * Firestore doesn't accept: undefined, NaN, Infinity, functions
 * @param {any} data - Data to sanitize
 * @returns {any} Sanitized data
 */
function sanitizeForFirestore(data) {
    if (data === null) return null;
    if (data === undefined) return null;
    if (typeof data === 'number' && (!isFinite(data) || isNaN(data))) return null;
    if (typeof data === 'function') return null;

    if (Array.isArray(data)) {
        return data.map(sanitizeForFirestore).filter(item => item !== null);
    }

    if (typeof data === 'object' && data !== null) {
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
 * Sauvegarde les données utilisateur dans Firestore
 * @param {string} userId - UID de l'utilisateur
 */
let isSaving = false;

export async function saveUserDataToFirestore(userId) {
    if (!db || !userId) {
        console.warn('⚠️ Firestore non disponible ou userId manquant');
        return;
    }

    if (isSaving) {
        console.log('⏳ Sauvegarde déjà en cours, ignorée.');
        return;
    }

    // PROTECTION RACE CONDITION LOGOUT
    // Si localStorage est vide (ex: après logout.clear()), ne SURTOUT PAS sauvegarder.
    if (!localStorage.getItem('auth') && !localStorage.getItem('user_email')) {
        console.warn('🛑 Sauvegarde annulée : Session locale vide ou déconnectée.');
        return;
    }

    isSaving = true;

    try {
        console.log('💾 Sauvegarde des données utilisateur dans Firestore...');

        const userData = {};

        // Check if user is admin/tester (to avoid overwriting test plans)
        const isAdminBypass = localStorage.getItem('user_simulated') === 'true' ||
            JSON.parse(localStorage.getItem('subscriptionPlan') || '["decouverte"]').includes('eleveur') ||
            JSON.parse(localStorage.getItem('subscriptionPlan') || '["decouverte"]').includes('elite');

        // Collecter toutes les données depuis localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            // Check if key is in SYNC_KEYS or starts with weightHistory_
            if (SYNC_KEYS.includes(key) || key.startsWith('weightHistory_')) {
                // Skip subscriptionPlan for admin/testers to avoid overwriting test plans
                if (key === 'subscriptionPlan' && isAdminBypass) {
                    continue;
                }

                const value = localStorage.getItem(key);
                if (value) {
                    try {
                        userData[key] = JSON.parse(value);
                    } catch {
                        userData[key] = value;
                    }
                }
            }
        }

        // Ajouter timestamp
        userData.lastSync = new Date().toISOString();

        // Sanitize data to remove invalid Firestore values (undefined, NaN, Infinity)
        const sanitizedData = sanitizeForFirestore(userData);

        // Sauvegarder dans Firestore
        // FIX: Utiliser une sous-collection de 'users' pour éviter les problèmes de permission sur la racine 'userData'
        const userDataRef = doc(db, 'users', userId, 'user_data', 'backup');
        await setDoc(userDataRef, sanitizedData, { merge: true });

        console.log('✅ Données sauvegardées dans Firestore (users/.../backup)');
        return true;
    } catch (error) {
        console.error('❌ Erreur sauvegarde Firestore (Détails):', error);
        if (error.code === 'permission-denied') {
            console.error("🚨 PERMISSION REFUSÉE. Vérifiez les règles Firestore pour /users/{uid}/user_data/backup");
            alert("Erreur de sauvegarde : Permissions insuffisantes.");
        }
        if (error.code === 'resource-exhausted') {
            console.warn("⚠️ Trop d'écritures. Augmentation du délai de pause.");
        }
        return false;
    } finally {
        isSaving = false;
    }
}

/**
 * Restaure les données utilisateur depuis Firestore
 * @param {string} userId - UID de l'utilisateur
 */
export async function loadUserDataFromFirestore(userId) {
    if (!db || !userId) {
        console.warn('⚠️ Firestore non disponible ou userId manquant');
        return;
    }

    try {
        console.log('📥 Chargement des données utilisateur depuis Firestore...');

        // 1. Essayer le nouveau chemin (users/.../backup)
        let userDataRef = doc(db, 'users', userId, 'user_data', 'backup');
        let userDataDoc = await getDoc(userDataRef);

        // 2. Si non trouvé, essayer l'ancien chemin (userData/...) pour migration
        if (!userDataDoc.exists()) {
            console.log('ℹ️ Pas de backup dans users/.../backup. Tentative chemin legacy (userData/)...');
            const legacyRef = doc(db, 'userData', userId);
            const legacyDoc = await getDoc(legacyRef);

            if (legacyDoc.exists()) {
                console.log('♻️ Migration : Données trouvées dans l\'ancien chemin. Utilisation et migration...');
                userDataDoc = legacyDoc;
                // On ne supprime pas l'ancien pour l'instant par sécurité, mais la prochaine save ira au bon endroit.
            }
        }

        if (!userDataDoc.exists()) {
            console.log('ℹ️ Aucune donnée cloud trouvée pour cet utilisateur (ni nouveau, ni ancien chemin)');
            return;
        }

        const userData = userDataDoc.data();
        let restoredCount = 0;

        // Check if user is admin/tester (to avoid overwriting current active plan)
        const currentLocalPlan = localStorage.getItem('subscriptionPlan');
        const isAdminBypass = currentLocalPlan &&
            (JSON.parse(currentLocalPlan).includes('eleveur') ||
                JSON.parse(currentLocalPlan).includes('elite'));

        // Restaurer chaque clé depuis Firestore
        Object.keys(userData).forEach(key => {
            // Only restore allowed keys (SYNC_KEYS or weightHistory_*)
            if (SYNC_KEYS.includes(key) || key.startsWith('weightHistory_')) {
                // Skip subscriptionPlan for admin/testers
                if (key === 'subscriptionPlan' && isAdminBypass) {
                    return;
                }

                const value = typeof userData[key] === 'object'
                    ? JSON.stringify(userData[key])
                    : userData[key];

                localStorage.setItem(key, value);
                restoredCount++;
            }
        });

        console.log(`✅ ${restoredCount} clés restaurées depuis Firestore`);
        console.log(`📅 Dernière sync: ${userData.lastSync || 'Inconnue'}`);

        // Dispatch event to notify components that data is ready
        window.dispatchEvent(new Event('equinox_data_refreshed'));

        return true;
    } catch (error) {
        console.error('❌ Erreur chargement Firestore:', error);
        return false;
    }
}

/**
 * Synchronisation automatique (debounced)
 * À appeler après chaque modification importante
 */
let syncTimeout = null;
export function scheduleSyncToFirestore(userId) {
    if (!userId) return;

    // Debounce: attendre 2 secondes après la dernière modification
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
        saveUserDataToFirestore(userId);
    }, 2000);
}

/**
 * Efface les données cloud d'un utilisateur
 * (Optionnel, pour RGPD / suppression de compte)
 */
export async function deleteUserDataFromFirestore(userId) {
    if (!db || !userId) return;

    try {
        const userDataRef = doc(db, 'userData', userId);
        await setDoc(userDataRef, {
            deleted: true,
            deletedAt: new Date().toISOString()
        });
        console.log('🗑️ Données utilisateur supprimées du cloud');
    } catch (error) {
        console.error('❌ Erreur suppression données cloud:', error);
    }
}
