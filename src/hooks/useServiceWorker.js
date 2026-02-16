import { useEffect, useState, useCallback } from 'react';

// Fonction pour vérifier si on est en production et si le module PWA est disponible
const isPWAAvailable = () => {
    return import.meta.env.PROD && 'serviceWorker' in navigator;
};

export function useServiceWorker() {
    const [needRefresh, setNeedRefresh] = useState(false);
    const [offlineReady, setOfflineReady] = useState(false);
    const [updateSW, setUpdateSW] = useState(null);

    useEffect(() => {
        // Ne pas enregistrer le Service Worker en mode développement
        if (!isPWAAvailable()) {
            console.log('⚠️ Service Worker désactivé en mode développement');
            return;
        }

        // Import dynamique du module PWA en production uniquement
        import('virtual:pwa-register')
            .then(({ registerSW }) => {
                const updateServiceWorker = registerSW({
                    immediate: true,
                    onNeedRefresh() {
                        console.log('🔄 Nouvelle version disponible');
                        setNeedRefresh(true);
                    },
                    onOfflineReady() {
                        console.log('✅ Application prête pour le mode hors ligne');
                        setOfflineReady(true);
                    },
                    onRegisteredSW(swUrl, registration) {
                        console.log('✅ Service Worker enregistré:', swUrl);

                        // Vérifier les mises à jour toutes les heures
                        if (registration) {
                            setInterval(() => {
                                console.log('🔍 Vérification des mises à jour...');
                                registration.update();
                            }, 60 * 60 * 1000); // 1 heure
                        }
                    },
                    onRegisterError(error) {
                        console.error('❌ Erreur d\'enregistrement du Service Worker:', error);
                    },
                });

                setUpdateSW(() => updateServiceWorker);
            })
            .catch((error) => {
                console.error('❌ Impossible de charger le module PWA:', error);
            });

        return () => {
            // Cleanup si nécessaire
        };
    }, []);

    const handleUpdate = useCallback(async () => {
        if (updateSW) {
            try {
                console.log('🔄 Activation de la nouvelle version...');

                // Mécanisme robuste : on attend que le nouveau SW prenne le contrôle
                let refreshing = false;

                if (navigator.serviceWorker) {
                    navigator.serviceWorker.addEventListener('controllerchange', () => {
                        if (!refreshing) {
                            refreshing = true;
                            console.log('✅ Nouveau SW actif -> Rechargement immédiat');
                            window.location.reload();
                        }
                    });
                }

                await updateSW(true); // Active le nouveau SW (skipWaiting)

                // Fallback de sécurité : si l'événement ne se déclenche pas après 2s, on force le reload
                setTimeout(() => {
                    if (!refreshing) {
                        refreshing = true;
                        console.log('⚠️ Délai dépassé -> Rechargement forcé');
                        window.location.reload();
                    }
                }, 2000);

            } catch (error) {
                console.error('❌ Erreur lors de la mise à jour:', error);
                window.location.reload();
            }
        } else {
            console.log('⚠️ updateSW non disponible, rechargement forcé');
            window.location.reload();
        }
    }, [updateSW]);

    const dismissUpdate = useCallback(() => {
        setNeedRefresh(false);
        setOfflineReady(false);
    }, []);

    return {
        needRefresh,
        offlineReady,
        updateApp: handleUpdate,
        dismissUpdate,
    };
}
