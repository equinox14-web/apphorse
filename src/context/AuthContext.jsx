import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { loadUserDataFromFirestore, saveUserDataToFirestore } from '../services/firestoreSync';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

// ... (imports restent les mêmes)

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fonction utilitaire pour synchroniser le profil utilisateur Firestore -> LocalState
    const syncUserProfile = async (user) => {
        // En mode démo (sans DB), on simule juste le profil
        if (!db) {
            console.log("[Auth] Demo Mode : Pas de synchronisation Firestore.");
            const demoProfile = {
                email: 'demo@equinox.com',
                name: localStorage.getItem('user_name') || 'Utilisateur Démo',
                role: 'Admin',
                plans: ['admin'],
                isDemo: true
            };
            setUserProfile(demoProfile);
            return;
        }

        if (!user) {
            setUserProfile(null);
            return;
        }

        const ADMIN_EMAILS = [
            'aurelie.jossic@gmail.com',
            'papy.gamers14@gmail.com',
            'horse-equinox@outlook.com',
            'admin@equinox.com',
            'dev@equinox.com'
        ];
        const isAdmin = ADMIN_EMAILS.includes(user.email);

        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                let data = userDoc.data();

                // Force Admin privileges if email matches whitelist AND not explicitly disabled for testing
                if (isAdmin && data.isAdminBypass !== false && (!data.role || data.role !== 'Admin' || !data.plans?.includes('admin'))) {
                    console.log("[Auth] Upgrading user to Admin based on email whitelist...");
                    data = { ...data, role: 'Admin', plans: ['admin'] };
                    // Update Firestore silently to persist this change
                    await setDoc(userDocRef, data, { merge: true });
                }

                setUserProfile(data);

                // --- SYNC LOCAL STORAGE FOR BACKWARD COMPATIBILITY ---
                // Le reste de l'application utilise localStorage pour les permissions
                // ONLY Sync LocalStorage if NOT in Simulation Mode (to preserve simulated identity)
                if (localStorage.getItem('is_simulation') !== 'true') {
                    if (data.name) localStorage.setItem('user_name', data.name);
                    if (data.role) localStorage.setItem('user_role', data.role);
                    if (data.role) localStorage.setItem('userType', data.role);
                    // Plans are usually stable property, so we might keep them or sync them.
                    // But if simulating, we probably want to keep the simulated state if we set it.
                    // However, Team simulation doesn't set plans. So we keep syncing plans or leave them alone?
                    // Safe to sync plans for now as Team members share the stable's plan capabilities mostly.
                    if (data.plans) localStorage.setItem('subscriptionPlan', JSON.stringify(data.plans));
                } else {
                    // In simulation, we DON'T overwrite name/role.
                    // But we might want to ensure subscriptionPlan is correct?
                    // For now, let's just NOT overwrite anything to be safe.
                }
                // -----------------------------------------------------
            } else {
                // Créer un profil par défaut si inexistant
                const defaultProfile = {
                    email: user.email,
                    name: user.displayName || 'Cavalier',
                    role: isAdmin ? 'Admin' : 'rider',
                    plans: isAdmin ? ['admin'] : ['decouverte'],
                    createdAt: new Date().toISOString()
                };
                await setDoc(userDocRef, defaultProfile);
                setUserProfile(defaultProfile);

                // Sync LocalStorage
                localStorage.setItem('user_name', defaultProfile.name);
                localStorage.setItem('subscriptionPlan', JSON.stringify(defaultProfile.plans));
                localStorage.setItem('user_role', defaultProfile.role);
                localStorage.setItem('userType', defaultProfile.role);
            }
        } catch (error) {
            console.error("Erreur lors de la récupération du profil:", error);
        }
    };

    useEffect(() => {
        let unsubscribeAuth = null;
        let unsubscribeSubs = null;

        // MODE DÉMO (Firebase non configuré)
        if (!auth) {
            console.warn("⚠️ AuthContext: Firebase Auth non disponible. Mode DÉMO activé.");

            // Simuler un utilisateur connecté automatiquement en mode démo
            const demoUser = {
                uid: 'demo-user-123',
                email: 'demo@equinox.com',
                displayName: 'Mode Démo',
                photoURL: null,
                isAnonymous: true
            };

            setCurrentUser(demoUser);
            // Charger un profil démo
            syncUserProfile(demoUser);

            setLoading(false);
            return;
        }

        // MODE NORMAL (Firebase configuré)
        unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                localStorage.setItem('auth', 'true');
                localStorage.setItem('user_email', user.email);

                // --- KNOWN ACCOUNTS TRACKING FOR SWITCHER ---
                try {
                    const known = JSON.parse(localStorage.getItem('known_accounts') || '[]');
                    const accountInfo = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || localStorage.getItem('user_name') || 'Utilisateur',
                        photoURL: user.photoURL || localStorage.getItem('user_logo') || null,
                        lastActive: Date.now()
                    };

                    // Remove existing entry for this uid to update it at the top
                    const filtered = known.filter(acc => acc.uid !== user.uid);
                    // Add current to top
                    const updatedKnown = [accountInfo, ...filtered].slice(0, 5); // Keep max 5
                    localStorage.setItem('known_accounts', JSON.stringify(updatedKnown));
                } catch (e) {
                    console.error("Error updating known_accounts", e);
                }
                // --------------------------------------------

                // 1. Fetch static profile data first
                await syncUserProfile(user);

                // 2. Charger les données utilisateur depuis Firestore
                await loadUserDataFromFirestore(user.uid);

                // 3. Real-time Subscription Listener (Strict Logic from Spec)
                // "Surveiller la collection customers/{uid}/subscriptions"
                if (db) { // Check if DB is available even if Auth is
                    const subsRef = collection(db, 'customers', user.uid, 'subscriptions');
                    const q = query(subsRef, where('status', 'in', ['active', 'trialing']));

                    unsubscribeSubs = onSnapshot(q, (snapshot) => {
                        // Default to 'decouverte' unless active sub found
                        // Preserve 'admin' if it was already set by syncUserProfile (special case)
                        let activePlan = ['decouverte'];
                        let activeRole = 'rider';

                        if (!snapshot.empty) {
                            const subDoc = snapshot.docs[0].data(); // Take the first active one
                            // "Vérifier le champ role (assigné via les métadonnées produit)"
                            if (subDoc.role) {
                                console.log("Abonnement détecté, Role:", subDoc.role);
                                activePlan = [subDoc.role]; // ex: ['pro'], ['elite']...
                                activeRole = subDoc.role;
                            }
                        }

                        // Check if we need to preserve Admin status from static profile
                        // (We can't easily access the latest userProfile state inside this callback without refs or deps, 
                        // but we can check the localStorage or previous logic. 
                        // Let's rely on a check: if the user is authorized as Admin via email in syncUserProfile, 
                        // we shouldn't downgrade them just because they lack a stripe sub.
                        // However, strictly following the Stripe spec for "Pro" features:

                        // Update State
                        setUserProfile(prev => {
                            // If previously admin, keep admin
                            if (prev?.role === 'Admin') return prev;

                            // PROTECTION: If user is in "Simulated" mode (Dev test) or has Admin Bypass, 
                            // DO NOT overwrite their plan with 'decouverte' just because they have no Stripe sub.
                            const isSimulated = prev?.simulated || prev?.isAdminBypass || localStorage.getItem('user_simulated') === 'true';

                            if (snapshot.empty && isSimulated) {
                                console.log("[Auth] Keeping simulated/bypass plan:", prev?.plans);
                                return prev || { ...prev, plans: JSON.parse(localStorage.getItem('subscriptionPlan') || "['decouverte']") };
                            }

                            const newProfile = {
                                ...prev,
                                plans: activePlan,
                                role: activeRole === 'rider' && prev?.role ? prev.role : activeRole
                            };

                            // Sync LocalStorage
                            if (localStorage.getItem('is_simulation') !== 'true') {
                                localStorage.setItem('subscriptionPlan', JSON.stringify(activePlan));
                                if (activeRole !== 'rider') localStorage.setItem('user_role', activeRole);
                            }
                            return newProfile;
                        });
                    }, (error) => {
                        console.error("Erreur écoute abonnements:", error);
                    });
                }

            } else {
                localStorage.removeItem('auth');
                // localStorage.removeItem('user_name'); // Keep user_name for switcher display? No, clearer to remove.
                // Actually keep it in known_accounts, but clear active session data.
                setUserProfile(null);
                if (unsubscribeSubs) unsubscribeSubs();
            }
            setLoading(false);
        });

        return () => {
            if (unsubscribeAuth) unsubscribeAuth();
            if (unsubscribeSubs) unsubscribeSubs();
        };
    }, []);

    const logout = async () => {
        try {
            // 1. Sauvegarder les données dans Firestore avant de partir
            if (currentUser?.uid) {
                await saveUserDataToFirestore(currentUser.uid);
            }

            // 2. Déconnexion Firebase
            if (auth) {
                await firebaseSignOut(auth);
            }

            // 3. Nettoyer UNIQUEMENT les données d'authentification
            // (Ne PAS effacer les données utilisateur qui sont maintenant dans Firestore)
            const keysToKeep = ['app_theme', 'app_mode', 'known_accounts'];
            const toKeep = {};
            keysToKeep.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) toKeep[key] = value;
            });

            localStorage.clear();

            // Restaurer les préférences
            Object.entries(toKeep).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });

            // Re-init theme defaults si absents
            if (!localStorage.getItem('app_theme')) localStorage.setItem('app_theme', 'slate');
            if (!localStorage.getItem('app_mode')) localStorage.setItem('app_mode', 'light');

            // In demo mode, redirect or just clear state
            if (!auth) {
                setCurrentUser(null);
                setUserProfile(null);
                window.location.reload(); // Force reload to reset
            }
        } catch (error) {
            console.error("Erreur déconnexion:", error);
        }
    };

    const value = {
        currentUser,
        userProfile,
        loading,
        logout,
        syncUserProfile // Expose if we need to force refresh
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
