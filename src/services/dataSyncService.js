import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, writeBatch, getDoc } from 'firebase/firestore';

/**
 * Service de synchronisation des données utilisateur (Firestore <-> LocalStorage)
 * Permet de garder les données (Chevaux, Calendrier, Chat) persistantes entre les sessions/appareils.
 */

// Sauvegarder les chevaux
export const syncHorsesToFirestore = async (userId, horses) => {
    if (!userId || !db) return;
    try {
        console.log('🔄 Sync Horses to Firestore...');
        const batch = writeBatch(db);
        const horsesRef = collection(db, 'users', userId, 'horses');

        // 1. Récupérer tous les IDs existants dans Firestore pour identifier ceux à supprimer
        const snapshot = await getDocs(horsesRef);
        const existingIds = snapshot.docs.map(doc => doc.id);
        const currentIds = horses.map(h => h.id.toString());

        // 2. Supprimer les chevaux qui ne sont plus dans la liste locale
        existingIds.forEach(id => {
            if (!currentIds.includes(id)) {
                const docRef = doc(horsesRef, id);
                batch.delete(docRef);
            }
        });

        // 3. Sauvegarder/Mettre à jour chaque cheval
        horses.forEach(horse => {
            const docRef = doc(horsesRef, horse.id.toString());
            batch.set(docRef, horse);
        });

        await batch.commit();
        console.log('✅ Chevaux sauvegardés (et nettoyés) sur le Cloud !');
    } catch (error) {
        console.error("Erreur sauvegarde chevaux:", error);
    }
};

// Charger les chevaux
export const fetchHorsesFromFirestore = async (userId) => {
    if (!userId || !db) return [];
    try {
        console.log('📥 Fetch Horses from Firestore...');
        const horsesRef = collection(db, 'users', userId, 'horses');
        const snapshot = await getDocs(horsesRef);

        const horses = snapshot.docs.map(doc => doc.data());
        console.log(`✅ ${horses.length} chevaux récupérés.`);
        return horses;
    } catch (error) {
        console.error("Erreur chargement chevaux:", error);
        return [];
    }
};

// Sauvegarder le calendrier (Custom Events + Care Events)
export const syncCalendarToFirestore = async (userId, customEvents, careEvents) => {
    if (!userId || !db) return;
    try {
        const calendarRef = doc(db, 'users', userId, 'user_data', 'calendar');
        await setDoc(calendarRef, {
            customEvents: customEvents || [],
            careEvents: careEvents || [],
            lastUpdated: new Date().toISOString()
        });
        console.log('✅ Calendrier synchronisé !');
    } catch (error) {
        console.error("Erreur sauvegarde calendrier:", error);
    }
};

// Charger le calendrier
export const fetchCalendarFromFirestore = async (userId) => {
    if (!userId || !db) return null;
    try {
        const calendarRef = doc(db, 'users', userId, 'user_data', 'calendar');
        const docSnap = await getDoc(calendarRef);

        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error("Erreur chargement calendrier:", error);
        return null;
    }
};

// Sauvegarder l'historique Chat IA
export const syncAIChatToFirestore = async (userId, messages) => {
    if (!userId || !db) return;
    try {
        // Limiter aux 50 derniers messages et assainir les dates
        const recentMessages = messages.slice(-50).map(msg => {
            let validDate;
            try {
                if (msg.timestamp instanceof Date && !isNaN(msg.timestamp)) {
                    validDate = msg.timestamp;
                } else if (msg.timestamp) {
                    const parsed = new Date(msg.timestamp);
                    validDate = isNaN(parsed) ? new Date() : parsed;
                } else {
                    validDate = new Date();
                }
            } catch (e) {
                validDate = new Date();
            }

            return {
                ...msg,
                timestamp: validDate.toISOString()
            };
        });

        const chatRef = doc(db, 'users', userId, 'user_data', 'ai_chat_history');
        await setDoc(chatRef, {
            messages: recentMessages,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error("Erreur sauvegarde chat:", error);
    }
};

// Charger l'historique Chat IA
export const fetchAIChatFromFirestore = async (userId) => {
    if (!userId || !db) return null;
    try {
        const chatRef = doc(db, 'users', userId, 'user_data', 'ai_chat_history');
        const docSnap = await getDoc(chatRef);

        if (docSnap.exists()) {
            return docSnap.data().messages;
        }
        return null;
    } catch (error) {
        console.error("Erreur chargement chat:", error);
        return null;
    }
};
