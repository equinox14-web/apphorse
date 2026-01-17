import { db, auth } from '../firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

// ⚠️ IMPORTANT : La clé publique est chargée depuis le fichier .env
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

let stripePromise;
export const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
    }
    return stripePromise;
};

/**
 * Lance une session de paiement Stripe pour un abonnement donné.
 * @param {string} priceId - L'ID du prix Stripe (ex: price_1Pxyz...)
 */
export const startCheckoutSession = async (priceId, successPath = '/dashboard') => {
    const user = auth.currentUser;
    if (!user) {
        alert("Vous devez être connecté pour vous abonner.");
        return;
    }

    console.log("Création de la session de paiement pour :", priceId);

    try {
        // 1. Création du document checkout_sessions dans Firestore
        // L'extension Firebase "Run Payments with Stripe" écoute cette collection
        const sessionsRef = collection(db, "customers", user.uid, "checkout_sessions");
        const docRef = await addDoc(sessionsRef, {
            price: priceId,
            success_url: window.location.origin + successPath + "?session_id={CHECKOUT_SESSION_ID}&payment=success",
            cancel_url: window.location.origin + "/settings?payment=cancel",
            mode: 'subscription', // 'payment' pour un paiement unique, 'subscription' pour un abo
            allow_promotion_codes: true,
        });

        console.log("Session initiée, ID:", docRef.id);

        // 2. Écoute des changements sur ce document
        // L'extension va ajouter un champ 'url' ou 'error' une fois la session Stripe créée
        const unsubscribe = onSnapshot(docRef, (snap) => {
            const data = snap.data();

            if (!data) return;

            if (data.error) {
                console.error("Erreur Stripe:", data.error.message);
                alert(`Erreur de paiement: ${data.error.message}`);
                unsubscribe();
            }

            if (data.url) {
                console.log("Redirection vers Stripe:", data.url);
                // On redirige l'utilisateur vers la page de paiement sécurisée Stripe
                window.location.assign(data.url);
                unsubscribe();
            }
        });

    } catch (error) {
        console.error("Erreur lors de l'initialisation du paiement:", error);
        alert("Impossible de lancer le paiement. Vérifiez votre connexion.");
    }
};

/**
 * Redirige l'utilisateur vers le portail client Stripe pour gérer son abonnement.
 */
export const redirectToCustomerPortal = async () => {
    const user = auth.currentUser;
    if (!user) {
        alert("Vous devez être connecté.");
        return;
    }

    try {
        const createPortalLink = httpsCallable(functions, 'ext-firestore-stripe-payments-createPortalLink');
        const { data } = await createPortalLink({
            returnUrl: window.location.origin + '/settings'
        });

        if (data.url) {
            window.location.assign(data.url);
            return true;
        } else {
            throw new Error("Pas d'URL renvoyée.");
        }
    } catch (error) {
        console.error("Erreur portail client:", error);
        // alert("Impossible d'accéder au portail. Vérifiez que vous avez un abonnement actif.");
        return false;
    }
};

/**
 * Change l'abonnement via Cloud Function (sans redirection).
 * @param {string} newPriceId 
 */
export const changeSubscriptionPlan = async (newPriceId) => {
    try {
        const updateSub = httpsCallable(functions, 'updateUserSubscription');
        const result = await updateSub({ newPriceId });
        console.log("Résultat changement offre:", result.data);
        return { success: true };
    } catch (error) {
        console.error("Erreur changement offre:", error);
        // Si erreur 'failed-precondition' (pas d'abo actif), on renvoie false pour déclencher le fallback (Redirection)
        if (error.code === 'failed-precondition' || error.message.includes("Pas d'abonnement actif")) {
            return { success: false, reason: 'no_active_subscription' };
        }
        throw error;
    }
};
/**
 * Finalise la connexion Stripe Connect en échangeant le code d'auth.
 * @param {string} code 
 */
export const connectStripeAccount = async (code) => {
    try {
        const resolve = httpsCallable(functions, 'resolveStripeConnect');
        const result = await resolve({ code });
        return { success: true, accountId: result.data.accountId };
    } catch (error) {
        console.error("Erreur connexion compte Stripe:", error);
        return { success: false, error: error.message };
    }
};
