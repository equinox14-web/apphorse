import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

/**
 * Script pour corriger isAdminBypass à true pour tous les admins
 * 
 * À exécuter dans la console Chrome pendant que vous êtes connecté :
 * 
 * 1. Ouvrir la console (F12)
 * 2. Copier-coller ce code
 * 3. Le statut sera corrigé immédiatement
 */

// Liste des emails admin
const ADMIN_EMAILS = [
    'admin@equinox.com',
    'dev@equinox.com',
    'aurelie.jossic@gmail.com',
    'papy.gamers14@gmail.com',
    'horse-equinox@outlook.com'
];

async function fixAdminBypass() {
    try {
        const auth = getAuth();
        const db = getFirestore();
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.error('❌ Vous devez être connecté pour exécuter ce script');
            return;
        }

        if (!ADMIN_EMAILS.includes(currentUser.email)) {
            console.warn('⚠️ Cet email n\'est pas dans la liste des admins');
            return;
        }

        console.log('🔧 Correction de isAdminBypass pour:', currentUser.email);

        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            isAdminBypass: true
        });

        console.log('✅ isAdminBypass a été défini à true !');
        console.log('🔄 Rechargement de la page...');

        setTimeout(() => {
            window.location.reload();
        }, 1000);

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour:', error);
    }
}

// Exécuter la correction
fixAdminBypass();
