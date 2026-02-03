import { useState, useEffect } from 'react';

/**
 * Hook pour détecter l'orientation du téléphone (gyroscope)
 * Retourne si le téléphone est stable et horizontal
 */
export function useDeviceOrientation() {
    const [orientation, setOrientation] = useState({
        alpha: 0,  // Rotation Z (compass)
        beta: 0,   // Rotation X (tilt avant/arrière)
        gamma: 0,  // Rotation Y (tilt gauche/droite)
        isStable: false,
        isHorizontal: false
    });

    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        // Vérifier si l'API DeviceOrientation est supportée
        if (typeof DeviceOrientationEvent !== 'undefined') {
            setIsSupported(true);

            // Sur iOS 13+, demande de permission
            if (
                typeof DeviceOrientationEvent.requestPermission === 'function'
            ) {
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            attachListener();
                        }
                    })
                    .catch(console.error);
            } else {
                // Autres navigateurs
                attachListener();
            }
        }

        let previousValues = { alpha: 0, beta: 0, gamma: 0 };
        let stableCounter = 0;

        function attachListener() {
            const handleOrientation = (event) => {
                const { alpha, beta, gamma } = event;

                // Vérifier si le téléphone est stable (changement < 2 degrés)
                const deltaAlpha = Math.abs(alpha - previousValues.alpha);
                const deltaBeta = Math.abs(beta - previousValues.beta);
                const deltaGamma = Math.abs(gamma - previousValues.gamma);

                const isCurrentlyStable = deltaAlpha < 2 && deltaBeta < 2 && deltaGamma < 2;

                if (isCurrentlyStable) {
                    stableCounter++;
                } else {
                    stableCounter = 0;
                }

                // Considérer stable après 10 mesures consécutives (~0.5 sec)
                const isStable = stableCounter >= 10;

                // Vérifier si horizontal (beta proche de 90° = vertical, proche de 0° = horizontal)
                // Pour prendre une photo, on veut beta entre -15° et 15° (téléphone à l'horizontal)
                const isHorizontal = Math.abs(beta) < 15;

                setOrientation({
                    alpha: alpha || 0,
                    beta: beta || 0,
                    gamma: gamma || 0,
                    isStable,
                    isHorizontal
                });

                previousValues = { alpha, beta, gamma };
            };

            window.addEventListener('deviceorientation', handleOrientation, true);

            return () => {
                window.removeEventListener('deviceorientation', handleOrientation, true);
            };
        }

        return () => {
            // Cleanup
        };
    }, []);

    return {
        ...orientation,
        isSupported
    };
}
