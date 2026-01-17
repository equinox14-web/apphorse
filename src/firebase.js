import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getMessaging } from "firebase/messaging";
import { getStorage } from "firebase/storage";
import { getAI } from "firebase/ai";

// Configuration Firebase
// Les valeurs sont chargées depuis le fichier .env
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Vérifier si Firebase est configuré (variables d'environnement présentes)
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined';

// Initialisation conditionnelle de Firebase
let app = null;
let auth = null;
let db = null;
let functions = null;
let messaging = null;
let storage = null;
let ai = null;

if (isFirebaseConfigured) {
    // Firebase is configured - initialize normally
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app, 'europe-west1');
    try {
        messaging = getMessaging(app);
    } catch (e) {
        console.warn('Firebase Messaging not available:', e.message);
    }
    storage = getStorage(app);
    ai = getAI(app);
} else {
    // Firebase NOT configured - demo mode (localStorage only)
    console.warn('⚠️ Firebase not configured. Running in DEMO mode with localStorage only.');
}

// Export des services (peuvent être null en mode demo)
export { auth, db, functions, messaging, storage, ai };
export default app;
