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

    isSaving = true;

    try {
        console.log('💾 Sauvegarde des données utilisateur dans Firestore...');

        const userData = {};

        // Check if user is admin/tester (to avoid overwriting test plans)
        const isAdminBypass = localStorage.getItem('user_simulated') === 'true' ||
            JSON.parse(localStorage.getItem('subscriptionPlan') || '["decouverte"]').includes('eleveur') ||
            JSON.parse(localStorage.getItem('subscriptionPlan') || '["decouverte"]').includes('elite');

        // Collecter toutes les données depuis localStorage
        SYNC_KEYS.forEach(key => {
            // Skip subscriptionPlan for admin/testers to avoid overwriting test plans
            if (key === 'subscriptionPlan' && isAdminBypass) {
                console.log('⏭️ Skip auto-save subscriptionPlan (Admin/Tester mode)');
                return;
            }

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
        console.error('❌ Erreur sauvegarde Firestore (Détails):', error);
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

        const userDataRef = doc(db, 'userData', userId);
        const userDataDoc = await getDoc(userDataRef);

        if (!userDataDoc.exists()) {
            console.log('ℹ️ Aucune donnée cloud trouvée pour cet utilisateur');
            return;
        }

        const userData = userDataDoc.data();
        let restoredCount = 0;

        // Check if user is admin/tester (to avoid overwriting current active plan)
        const currentLocalPlan = localStorage.getItem('subscriptionPlan');
        const isAdminBypass = currentLocalPlan &&
            (JSON.parse(currentLocalPlan).includes('eleveur') ||
                JSON.parse(currentLocalPlan).includes('elite'));

        // Restaurer chaque clé dans localStorage
        SYNC_KEYS.forEach(key => {
            // Skip subscriptionPlan for admin/testers to avoid overwriting active plan
            if (key === 'subscriptionPlan' && isAdminBypass) {
                console.log('⏭️ Skip loading subscriptionPlan from Firestore (Admin/Tester mode - keeping current plan)');
                return;
            }

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

    // Debounce: attendre 5 secondes après la dernière modification
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
        saveUserDataToFirestore(userId);
    }, 5000);
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
