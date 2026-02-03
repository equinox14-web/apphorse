import React, { useState, useRef, useEffect } from 'react';
import {
    Camera, X, CheckCircle, AlertCircle, Loader,
    Info, ArrowRight, RotateCw
} from 'lucide-react';
import Button from '../common/Button';
import { REFERENCE_OBJECTS, getDefaultReferenceObject } from '../../constants/referenceObjects';
import { useDeviceOrientation } from '../../hooks/useDeviceOrientation';
import { performBarymetricMeasurement } from '../../services/barymetricService';

/**
 * CAMÉRA BARYMÉTRIQUE GUIDÉE
 * Guide l'utilisateur pour prendre 2 photos parfaites (Profil + Dos)
 * avec auto-déclenchement basé sur critères temps réel
 */
export default function BarometricCamera({ horse, onMeasurementComplete, onClose }) {
    // ===== États principaux =====
    const [phase, setPhase] = useState('PREPARATION'); // PREPARATION, PROFILE, REAR, PROCESSING, RESULT
    const [selectedReferenceObject, setSelectedReferenceObject] = useState(getDefaultReferenceObject().id);

    // Images capturées
    const [profileImage, setProfileImage] = useState(null);
    const [rearImage, setRearImage] = useState(null);

    // État de la caméra
    const [stream, setStream] = useState(null);
    const [isCameraReady, setIsCameraReady] = useState(false);

    // Détection temps réel
    const [isHorseInFrame, setIsHorseInFrame] = useState(false);
    const [autoTriggerCountdown, setAutoTriggerCountdown] = useState(null);

    // Orientation du téléphone
    const { isStable, isHorizontal, isSupported: isOrientationSupported } = useDeviceOrientation();

    // Résultat de mesure
    const [measurementResult, setMeasurementResult] = useState(null);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectionIntervalRef = useRef(null);

    // ===== Démarrage de la caméra =====
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setIsCameraReady(true);
                    startDetection();
                };
            }
        } catch (err) {
            console.error('Erreur caméra:', err);
            setError('Impossible d\'accéder à la caméra');
        }
    };

    // ===== Arrêt de la caméra =====
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                console.log('Caméra arrêtée:', track.kind);
            });
            setStream(null);
        }

        // Nettoyer la source vidéo
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        stopDetection();
        setIsCameraReady(false);
    };

    // ===== Détection temps réel (simplifié) =====
    const startDetection = () => {
        // DÉSACTIVÉ pour éviter les faux positifs
        // Dans une vraie implémentation, utilisez TensorFlow.js COCO-SSD
        // avec filtrage spécifique pour la classe "horse"

        // Pour l'instant, l'utilisateur doit cadrer manuellement et appuyer sur le bouton
        // Les critères de stabilité (gyroscope) restent actifs
    };

    const stopDetection = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
    };

    // ===== Auto-déclenchement (DÉSACTIVÉ) =====
    // L'auto-trigger est désactivé car la détection "cheval dans le cadre" n'est pas encore implémentée
    // L'utilisateur doit capturer manuellement avec le bouton
    useEffect(() => {
        // DÉSACTIVÉ - Capture manuelle uniquement
        return;
    }, []);

    // Compte à rebours
    useEffect(() => {
        if (autoTriggerCountdown === null || autoTriggerCountdown === 0) return;

        const timer = setTimeout(() => {
            if (autoTriggerCountdown === 1) {
                // Déclencher la photo
                capturePhoto();
                setAutoTriggerCountdown(null);
            } else {
                setAutoTriggerCountdown(autoTriggerCountdown - 1);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [autoTriggerCountdown]);

    // ===== Capture de photo =====
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            const img = new Image();
            img.src = URL.createObjectURL(blob);

            img.onload = () => {
                if (phase === 'PROFILE') {
                    setProfileImage(img);
                    stopCamera();
                    // Passer à la phase DOS
                    setTimeout(() => {
                        setPhase('REAR');
                    }, 500);
                } else if (phase === 'REAR') {
                    setRearImage(img);
                    stopCamera();
                    // Lancer le traitement
                    processImages(profileImage, img);
                }
            };
        }, 'image/jpeg', 0.92);
    };

    // ===== Traitement des images =====
    const processImages = async (profImage, reImage) => {
        setPhase('PROCESSING');
        setIsProcessing(true);

        try {
            const result = await performBarymetricMeasurement({
                profileImage: profImage,
                rearImage: reImage,
                referenceObjectId: selectedReferenceObject
            });

            if (result.success) {
                setMeasurementResult(result.data);
                setPhase('RESULT');
            } else {
                setError(result.error);
                setPhase('RESULT');
            }
        } catch (err) {
            console.error('Erreur de traitement:', err);
            setError('Erreur lors de l\'analyse des images');
            setPhase('RESULT');
        } finally {
            setIsProcessing(false);
        }
    };

    // ===== Validation finale =====
    const handleValidate = () => {
        if (!measurementResult) return;

        const weightData = {
            weight: measurementResult.final_weight_calculation.estimated_weight_kg,
            confidence: measurementResult.final_weight_calculation.confidence_score,
            measurements: measurementResult.measurements,
            method: 'barymetric_ai',
            timestamp: new Date().toISOString()
        };

        onMeasurementComplete(weightData);
    };

    // ===== Recommencer =====
    const handleRetry = () => {
        setProfileImage(null);
        setRearImage(null);
        setMeasurementResult(null);
        setError(null);
        setAutoTriggerCountdown(null);
        setIsHorseInFrame(false);
        setPhase('PREPARATION');
    };

    // ===== Fermeture propre =====
    const handleClose = () => {
        console.log('🔴 Fermeture de la caméra barymétrique...');
        stopCamera(); // Arrêter la caméra AVANT de fermer
        onClose(); // Ensuite fermer le composant
    };

    // ===== Lifecycle =====
    useEffect(() => {
        if (phase === 'PROFILE' || phase === 'REAR') {
            startCamera();
        }

        return () => {
            stopCamera();
        };
    }, [phase]);

    // ===== Cleanup global au démontage =====
    useEffect(() => {
        // S'assurer que la caméra est toujours arrêtée quand le composant est démonté
        return () => {
            stopCamera();
        };
    }, []);

    // ===== Critères visuels (variable désactivée) =====
    // const allCriteriaOK = isHorseInFrame && isStable && isHorizontal;

    // ===== RENDU =====
    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
                <h2 className="text-white font-semibold">
                    {phase === 'PREPARATION' && 'Préparation'}
                    {phase === 'PROFILE' && 'Photo 1/2 : Profil'}
                    {phase === 'REAR' && 'Photo 2/2 : Dos'}
                    {phase === 'PROCESSING' && 'Analyse en cours...'}
                    {phase === 'RESULT' && 'Résultat'}
                </h2>
                <button onClick={handleClose} className="text-white" aria-label="Fermer">
                    <X size={24} />
                </button>
            </div>

            {/* PHASE PREPARATION */}
            {phase === 'PREPARATION' && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-900 text-white">
                    <Info size={64} className="text-blue-400 mb-6" />

                    <h3 className="text-2xl font-bold mb-4">Mesure Barymétrique</h3>

                    <div className="max-w-md space-y-4 mb-8">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">📋 Instructions</h4>
                            <p className="text-sm text-gray-300">
                                Pour une précision maximale, collez un repère visible sur le flanc du cheval
                                (côté profil, à mi-hauteur).
                            </p>
                        </div>

                        <div className="bg-gray-800 p-4 rounded-lg">
                            <label className="block font-semibold mb-2">
                                Type de repère utilisé :
                            </label>
                            <select
                                value={selectedReferenceObject}
                                onChange={(e) => setSelectedReferenceObject(e.target.value)}
                                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                            >
                                {REFERENCE_OBJECTS.map(obj => (
                                    <option key={obj.id} value={obj.id}>
                                        {obj.label} {obj.recommended && '⭐'}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-2">
                                ⭐ = Recommandé pour la meilleure précision
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => setPhase('PROFILE')}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        Commencer <ArrowRight size={20} className="ml-2" />
                    </Button>
                </div>
            )}

            {/* PHASE PROFILE ou REAR */}
            {(phase === 'PROFILE' || phase === 'REAR') && (
                <div className="flex-1 relative bg-black">
                    {/* Vidéo */}
                    <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        playsInline
                        muted
                    />

                    {/* Canvas caché */}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Overlay guide */}
                    <div className="absolute inset-0 border-4 border-white border-opacity-30">
                        {/* Silhouette guide */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-white text-opacity-50 text-6xl">
                                {phase === 'PROFILE' ? '🐴➡️' : '🐴'}
                            </div>
                        </div>
                    </div>

                    {/* Instructions overlay */}
                    <div className="absolute top-4 left-4 right-4 bg-black bg-opacity-70 p-4 rounded-lg text-white">
                        <h4 className="font-semibold mb-2">
                            {phase === 'PROFILE' ? '📸 Photo de Profil (1/2)' : '📸 Photo de Dos (2/2)'}
                        </h4>
                        <ul className="text-sm space-y-1 mb-3">
                            {phase === 'PROFILE' && (
                                <>
                                    <li>✓ Reculez à 6 mètres (8 pas)</li>
                                    <li>✓ Baissez-vous à hauteur du ventre</li>
                                    <li>✓ Cadrez le cheval entier de profil</li>
                                </>
                            )}
                            {phase === 'REAR' && (
                                <>
                                    <li>✓ Placez-vous derrière le cheval</li>
                                    <li>✓ Cadrez la croupe et le dos</li>
                                    <li>✓ Vérifiez que tout est visible</li>
                                </>
                            )}
                        </ul>
                        <div className="text-xs bg-purple-600 px-2 py-1 rounded inline-block">
                            👇 Appuyez sur le bouton pour capturer
                        </div>
                    </div>

                    {/* Indicateurs de critères (optionnels) */}
                    {isOrientationSupported && (
                        <div className="absolute bottom-20 left-4 right-4 space-y-2">
                            <div className={`flex items-center gap-2 px-3 py-2 rounded ${isStable ? 'bg-green-600' : 'bg-gray-600'
                                }`}>
                                {isStable ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <span className="text-sm font-medium text-white">
                                    Téléphone stable
                                </span>
                            </div>

                            <div className={`flex items-center gap-2 px-3 py-2 rounded ${isHorizontal ? 'bg-green-600' : 'bg-gray-600'
                                }`}>
                                {isHorizontal ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <span className="text-sm font-medium text-white">
                                    Téléphone horizontal
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Compte à rebours */}
                    {autoTriggerCountdown !== null && autoTriggerCountdown > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="text-white text-9xl font-bold animate-pulse">
                                {autoTriggerCountdown}
                            </div>
                        </div>
                    )}

                    {/* Bouton manuel de capture (fallback) */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                        <button
                            onClick={capturePhoto}
                            className="bg-white rounded-full p-4 shadow-lg"
                            disabled={!isCameraReady}
                        >
                            <Camera size={32} className="text-gray-800" />
                        </button>
                    </div>
                </div>
            )}

            {/* PHASE PROCESSING */}
            {phase === 'PROCESSING' && (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 text-white">
                    <Loader size={64} className="animate-spin text-purple-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Analyse IA en cours...</h3>
                    <p className="text-gray-400 text-sm">
                        Calcul barymétrique avec workflow agentic
                    </p>
                </div>
            )}

            {/* PHASE RESULT */}
            {phase === 'RESULT' && (
                <div className="flex-1 overflow-auto bg-gray-900 text-white p-6">
                    {error ? (
                        <div className="max-w-md mx-auto">
                            <AlertCircle size={64} className="text-red-400 mb-4 mx-auto" />
                            <h3 className="text-xl font-semibold mb-2 text-center">Erreur</h3>
                            <p className="text-gray-300 mb-6 text-center">{error}</p>

                            <div className="flex gap-3">
                                <Button onClick={handleRetry} variant="secondary" className="flex-1">
                                    <RotateCw size={20} className="mr-2" /> Recommencer
                                </Button>
                                <Button onClick={onClose} variant="outline" className="flex-1">
                                    Fermer
                                </Button>
                            </div>
                        </div>
                    ) : measurementResult ? (
                        <div className="max-w-md mx-auto">
                            <CheckCircle size={64} className="text-green-400 mb-4 mx-auto" />

                            <h3 className="text-3xl font-bold mb-6 text-center">
                                {measurementResult.final_weight_calculation.estimated_weight_kg} kg
                            </h3>

                            <div className="bg-gray-800 rounded-lg p-4 mb-4">
                                <h4 className="font-semibold mb-3">📊 Mesures détaillées</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Longueur corporelle</span>
                                        <span>{measurementResult.measurements.calculated_length_cm} cm</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Hauteur au garrot</span>
                                        <span>{measurementResult.measurements.calculated_height_cm} cm</span>
                                    </div>
                                    {measurementResult.measurements.calculated_girth_cm && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Périmètre thoracique</span>
                                            <span>{measurementResult.measurements.calculated_girth_cm} cm</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Morphologie</span>
                                        <span className="text-right text-xs">
                                            {measurementResult.measurements.morphology_type}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-800 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold">Confiance</span>
                                    <span className={`px-2 py-1 rounded text-xs ${measurementResult.final_weight_calculation.confidence_score === 'High'
                                        ? 'bg-green-600'
                                        : measurementResult.final_weight_calculation.confidence_score === 'Medium'
                                            ? 'bg-yellow-600'
                                            : 'bg-red-600'
                                        }`}>
                                        {measurementResult.final_weight_calculation.confidence_score}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400">
                                    Marge d'erreur : ± {measurementResult.final_weight_calculation.margin_of_error_kg} kg
                                </p>
                                {measurementResult.final_weight_calculation.reasoning && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        {measurementResult.final_weight_calculation.reasoning}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button onClick={handleValidate} className="flex-1 bg-green-600 hover:bg-green-700">
                                    Enregistrer
                                </Button>
                                <Button onClick={handleRetry} variant="secondary" className="flex-1">
                                    Recommencer
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
