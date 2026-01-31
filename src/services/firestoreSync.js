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
    'ai_training_plans',
    'weather_coords',
    'appHorse_register_movements',
    'appHorse_register_establishment',
    'equinox_assistant_history', // Chat History
    'user_name', // Profile data backup
    'user_logo',
    'user_role',
    'subscriptionPlan'
];

/**
 * Sauvegarde les données utilisateur dans Firestore
 * @param {string} userId - UID de l'utilisateur
 */
export async function saveUserDataToFirestore(userId) {
    if (!db || !userId) {
        console.warn('⚠️ Firestore non disponible ou userId manquant');
        return;
    }

    try {
        console.log('💾 Sauvegarde des données utilisateur dans Firestore...');

        const userData = {};

        // Collecter toutes les données depuis localStorage
        SYNC_KEYS.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    // Essayer de parser en JSON, sinon garder en string
                    userData[key] = JSON.parse(value);
                } catch {
                    userData[key] = value;
                }
            }
        });

        // Ajouter timestamp
        userData.lastSync = new Date().toISOString();

        // Sauvegarder dans Firestore
        const userDataRef = doc(db, 'userData', userId);
        await setDoc(userDataRef, userData, { merge: true });

        console.log('✅ Données sauvegardées dans Firestore');
        return true;
    } catch (error) {
        console.error('❌ Erreur sauvegarde Firestore:', error);
        return false;
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

        const userDataRef = doc(db, 'userData', userId);
        const userDataDoc = await getDoc(userDataRef);

        if (!userDataDoc.exists()) {
            console.log('ℹ️ Aucune donnée cloud trouvée pour cet utilisateur');
            return;
        }

        const userData = userDataDoc.data();
        let restoredCount = 0;

        // Restaurer chaque clé dans localStorage
        SYNC_KEYS.forEach(key => {
            if (userData[key]) {
                const value = typeof userData[key] === 'object'
                    ? JSON.stringify(userData[key])
                    : userData[key];

                localStorage.setItem(key, value);
                restoredCount++;
            }
        });

        console.log(`✅ ${restoredCount} clés restaurées depuis Firestore`);
        console.log(`📅 Dernière sync: ${userData.lastSync || 'Inconnue'}`);

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
