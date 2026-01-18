// ════════════════════════════════════════════════════════════════════════
// EXEMPLES DE PERSONNALISATION - Système de Mise à Jour PWA
// ════════════════════════════════════════════════════════════════════════

/* ═══════════════════════════════════════════════════════════════════════
   1. MODIFIER LA FRÉQUENCE DE VÉRIFICATION DES MISES À JOUR
   ═══════════════════════════════════════════════════════════════════════
   
   Fichier: src/hooks/useServiceWorker.js
   Ligne: ~42
*/

// Option A: Vérifier toutes les 30 minutes
setInterval(() => {
    console.log('🔍 Vérification des mises à jour...');
    registration.update();
}, 30 * 60 * 1000); // 30 minutes

// Option B: Vérifier toutes les 5 minutes (dev/test uniquement)
setInterval(() => {
    console.log('🔍 Vérification des mises à jour...');
    registration.update();
}, 5 * 60 * 1000); // 5 minutes

// Option C: Vérifier toutes les 24 heures
setInterval(() => {
    console.log('🔍 Vérification des mises à jour...');
    registration.update();
}, 24 * 60 * 60 * 1000); // 24 heures


/* ═══════════════════════════════════════════════════════════════════════
   2. MODIFIER L'APPARENCE DU TOAST
   ═══════════════════════════════════════════════════════════════════════
   
   Fichier: src/components/UpdateNotification.jsx
*/

// ─────────────────────────────────────────────────────────────────────
// A. Changer la position (en haut au lieu d'en bas)
// ─────────────────────────────────────────────────────────────────────

// Remplacer ligne ~17
<div
    className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] animate-slide-down"
    role="alert"
    aria-live="assertive"
>

// Ajouter l'animation slide-down dans le style
    @keyframes slide-down {
        from {
        transform: translate(-50%, -100px);
    opacity: 0;
  }
    to {
        transform: translate(-50%, 0);
    opacity: 1;
  }
}

    .animate-slide-down {
        animation: slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}


    // ─────────────────────────────────────────────────────────────────────
    // B. Changer les couleurs (bleu au lieu de violet)
    // ─────────────────────────────────────────────────────────────────────

    // Remplacer ligne ~22
    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl shadow-2xl border border-blue-400/30 backdrop-blur-sm overflow-hidden min-w-[320px] max-w-[420px]">

        {/* Barre de progression animée */}
        <div className="h-1 bg-blue-400/30 relative overflow-hidden">


// ─────────────────────────────────────────────────────────────────────
            // C. Toast plus compact (mobile-friendly)
            // ─────────────────────────────────────────────────────────────────────

            <div className="p-3 flex items-center gap-3">
                {/* Icône plus petite */}
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-white" />
                    </div>
                </div>

                {/* Texte plus condensé */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                        Nouvelle version disponible
                    </p>
                </div>

                {/* Bouton compact */}
                <button
                    onClick={onUpdate}
                    className="px-3 py-1.5 bg-white text-violet-600 rounded-lg text-xs font-medium"
                >
                    Recharger
                </button>
            </div>


// ─────────────────────────────────────────────────────────────────────
            // D. Toast avec compte à rebours automatique (disparaît après 10s)
            // ─────────────────────────────────────────────────────────────────────

            import React, {useEffect, useState} from 'react';

            export default function UpdateNotification({needRefresh, onUpdate, onDismiss}) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (needRefresh && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
                onDismiss(); // Auto-fermer après 10s
    }
  }, [needRefresh, countdown, onDismiss]);

            if (!needRefresh) return null;

            return (
            // ... existing toast JSX
            <p className="text-sm text-violet-100">
                Mise à jour disponible (fermeture dans {countdown}s)
            </p>
            );
}


            /* ═══════════════════════════════════════════════════════════════════════
               3. MODIFIER LA STRATÉGIE DE CACHE
               ═══════════════════════════════════════════════════════════════════════
               
               Fichier: vite.config.js
            */

            // ─────────────────────────────────────────────────────────────────────
            // A. Cache plus agressif pour les images (90 jours)
            // ─────────────────────────────────────────────────────────────────────

            {
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
                cacheName: 'images-cache',
            expiration: {
                maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 90 // 90 jours
    }
  }
}


            // ─────────────────────────────────────────────────────────────────────
            // B. Stratégie NetworkFirst pour toutes les requêtes API
            // ─────────────────────────────────────────────────────────────────────

            {
                urlPattern: /^https:\/\/.*\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'api-cache',
            expiration: {
                maxEntries: 50,
            maxAgeSeconds: 60 * 60 // 1 heure
    },
            networkTimeoutSeconds: 5 // Timeout après 5s
  }
}


            // ─────────────────────────────────────────────────────────────────────
            // C. StaleWhileRevalidate pour équilibrer fraîcheur et performance
            // ─────────────────────────────────────────────────────────────────────

            {
                urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'static-resources',
            expiration: {
                maxEntries: 60,
            maxAgeSeconds: 60 * 60 * 24 * 7 // 7 jours
    }
  }
}


            /* ═══════════════════════════════════════════════════════════════════════
               4. FORCER LA MISE À JOUR AUTOMATIQUE (SANS PROMPT)
               ═══════════════════════════════════════════════════════════════════════
               
               Fichier: vite.config.js
            */

            // ⚠️ Attention : Cela recharge automatiquement l'app sans demander !
            VitePWA({
                registerType: 'autoUpdate', // Au lieu de 'prompt'
            workbox: {
                skipWaiting: true,
            clientsClaim: true
  }
})

            // Résultat : L'app se met à jour immédiatement dès qu'une nouvelle version
            // est détectée, SANS afficher le toast.


            /* ═══════════════════════════════════════════════════════════════════════
               5. AJOUTER UN BOUTON "METTRE À JOUR" DANS LES PARAMÈTRES
               ═══════════════════════════════════════════════════════════════════════
               
               Fichier: src/pages/Settings.jsx
            */

            import {useServiceWorker} from '../hooks/useServiceWorker';

            function Settings() {
  const {updateApp} = useServiceWorker();

            return (
            <div>
                {/* ... autres paramètres ... */}

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Mises à jour</h3>

                    <button
                        onClick={() => {
                            if (window.confirm('Recharger l\'application ?')) {
                                window.location.reload(true);
                            }
                        }}
                        className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                    >
                        Vérifier les mises à jour
                    </button>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Version actuelle : {import.meta.env.VITE_APP_VERSION || '1.0.0'}
                    </p>
                </div>
            </div>
            );
}


            /* ═══════════════════════════════════════════════════════════════════════
               6. TRACKING ANALYTICS DES MISES À JOUR
               ═══════════════════════════════════════════════════════════════════════
               
               Fichier: src/hooks/useServiceWorker.js
            */

            // Ajouter après la ligne onNeedRefresh()
            onNeedRefresh() {
                console.log('🔄 Nouvelle version disponible');
            setNeedRefresh(true);

            // Analytics: Tracker l'événement
            if (window.fbq) {
                window.fbq('track', 'PWAUpdateAvailable');
  }

            // Google Analytics (si installé)
            if (window.gtag) {
                window.gtag('event', 'pwa_update_available', {
                    event_category: 'PWA',
                    event_label: 'Update Detected'
                });
  }
}

// Ajouter dans handleUpdate()
const handleUpdate = useCallback(() => {
  if (updateSW) {
    // Track avant la mise à jour
    if (window.fbq) {
                window.fbq('track', 'PWAUpdateAccepted');
    }

            updateSW(true);
  }
}, [updateSW]);


/* ═══════════════════════════════════════════════════════════════════════
   7. NOTIFICATION SONORE À LA MISE À JOUR
   ═══════════════════════════════════════════════════════════════════════
   
   Fichier: src/components/UpdateNotification.jsx
*/

useEffect(() => {
  if (needRefresh) {
    // Jouer un son de notification
    const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.3;
    audio.play().catch(err => console.log('Autoplay blocked:', err));
  }
}, [needRefresh]);


            /* ═══════════════════════════════════════════════════════════════════════
               8. AFFICHER UN BADGE SUR L'ICÔNE DE NOTIFICATION
               ═══════════════════════════════════════════════════════════════════════
               
               Si vous avez un menu de notifications dans MainLayout
            */

            import {useServiceWorker} from '../hooks/useServiceWorker';

            function NotificationIcon() {
  const {needRefresh} = useServiceWorker();

            return (
            <div className="relative">
                <Bell className="w-6 h-6" />

                {needRefresh && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
            </div>
            );
}


            /* ═══════════════════════════════════════════════════════════════════════
               9. MODE DEBUG : LOGS DÉTAILLÉS
               ═══════════════════════════════════════════════════════════════════════
               
               Fichier: vite.config.js
            */

            VitePWA({
                registerType: 'prompt',

            devOptions: {
                enabled: true, // Activer en dev pour tester
            type: 'module',
            navigateFallback: 'index.html'
  },

            // Workbox avec logs détaillés
            workbox: {
                cleanupOutdatedCaches: true,
            sourcemap: true, // Activer les sourcemaps pour debug

            // Mode debug
            navigateFallbackDenylist: [/^\/api/],
  }
})


            /* ═══════════════════════════════════════════════════════════════════════
               10. DÉSACTIVER LE SERVICE WORKER (ROLLBACK)
               ═══════════════════════════════════════════════════════════════════════
               
               Si vous voulez temporairement désactiver
            */

            // Option A: Dans vite.config.js
            VitePWA({
                injectRegister: false, // Ne pas injecter le code d'enregistrement
})

            // Option B: Unregister programmatiquement
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        registration.unregister();
                        console.log('Service Worker unregistered');
                    });
                });
}


// ════════════════════════════════════════════════════════════════════════
// FIN DES EXEMPLES
//
// Pour plus d'informations :
// - Documentation vite-plugin-pwa : https://vite-pwa-org.netlify.app/
// - Workbox strategies : https://developer.chrome.com/docs/workbox/
// ════════════════════════════════════════════════════════════════════════
