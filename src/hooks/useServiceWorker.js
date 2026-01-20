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
                await updateSW(true); // Active le nouveau SW

                // Petit délai pour laisser le temps au SW de s'activer
                setTimeout(() => {
                    console.log('✅ Rechargement pour appliquer la mise à jour...');
                    window.location.reload();
                }, 500);
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
