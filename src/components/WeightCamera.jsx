import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Button from './Button';
import { estimateWeightFromImage } from '../services/geminiService';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

/**
 * Composant de capture photo avec overlay pour l'estimation de poids
 */
function WeightCamera({ horse, onWeightEstimated, onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const detectionIntervalRef = useRef(null);
    const alignmentTimeoutRef = useRef(null);

    const [step, setStep] = useState('camera'); // 'camera', 'processing', 'result'
    const [capturedImage, setCapturedImage] = useState(null);
    const [estimation, setEstimation] = useState(null);
    const [error, setError] = useState(null);
    const [heightCm, setHeightCm] = useState(horse?.height || 165); // Taille au garrot
    const [manualWeight, setManualWeight] = useState('');
    const [isAligned, setIsAligned] = useState(false); // État d'alignement du cheval
    const [detectionModel, setDetectionModel] = useState(null); // Modèle coco-ssd

    // Démarrage de la caméra et chargement du modèle
    useEffect(() => {
        startCamera();
        loadDetectionModel();
        return () => {
            stopCamera();
            stopDetection();
        };
    }, []);

    // Chargement du modèle de détection
    const loadDetectionModel = async () => {
        try {
            console.log('🔄 Initialisation TensorFlow.js...');

            // Essayer d'initialiser le backend WebGL en priorité
            try {
                await tf.setBackend('webgl');
                await tf.ready();
                console.log('✅ Backend WebGL initialisé');
            } catch (webglError) {
                console.warn('⚠️ WebGL non disponible, passage au CPU:', webglError);
                await tf.setBackend('cpu');
                await tf.ready();
                console.log('✅ Backend CPU initialisé');
            }

            console.log('🔄 Backend actif:', tf.getBackend());
            console.log('🔄 Chargement du modèle coco-ssd...');

            const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
            setDetectionModel(model);
            console.log('✅ Modèle coco-ssd chargé avec succès');
        } catch (err) {
            console.error('❌ Erreur chargement modèle:', err);
            console.error('Détails:', err.message);
            // En cas d'erreur, continuer sans détection automatique
            // Ne pas afficher d'erreur à l'utilisateur, la capture manuelle reste possible
        }
    };

    // Démarrage de la détection en temps réel
    useEffect(() => {
        if (detectionModel && videoRef.current && step === 'camera') {
            startDetection();
        } else {
            stopDetection();
        }
        return () => stopDetection();
    }, [detectionModel, step]);

    const startDetection = () => {
        if (detectionIntervalRef.current) return;

        detectionIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || !detectionModel) return;

            try {
                const predictions = await detectionModel.detect(videoRef.current);
                const horsePrediction = predictions.find(p => p.class === 'horse');

                if (horsePrediction && horsePrediction.score > 0.60) {
                    // Vérifier si le cheval occupe au moins 50% du cadre central
                    const video = videoRef.current;
                    const [x, y, width, height] = horsePrediction.bbox;
                    const centerX = video.videoWidth / 2;
                    const centerY = video.videoHeight / 2;
                    const bboxCenterX = x + width / 2;
                    const bboxCenterY = y + height / 2;

                    // Check if bbox is reasonably centered and large enough
                    const isCentered = Math.abs(bboxCenterX - centerX) < video.videoWidth * 0.2 &&
                        Math.abs(bboxCenterY - centerY) < video.videoHeight * 0.2;
                    const isLargeEnough = (width * height) > (video.videoWidth * video.videoHeight * 0.3);

                    if (isCentered && isLargeEnough) {
                        if (!isAligned) {
                            setIsAligned(true);
                            // Déclencher auto-capture après 2 secondes
                            alignmentTimeoutRef.current = setTimeout(() => {
                                console.log('📸 Auto-capture déclenchée !');
                                capturePhoto();
                            }, 2000);
                        }
                    } else {
                        resetAlignment();
                    }
                } else {
                    resetAlignment();
                }
            } catch (err) {
                console.error('Erreur détection:', err);
            }
        }, 500); // Détection toutes les 500ms
    };

    const stopDetection = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        resetAlignment();
    };

    const resetAlignment = () => {
        if (isAligned) {
            setIsAligned(false);
        }
        if (alignmentTimeoutRef.current) {
            clearTimeout(alignmentTimeoutRef.current);
            alignmentTimeoutRef.current = null;
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Caméra arrière sur mobile
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        } catch (err) {
            console.error('Erreur caméra:', err);
            setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            setCapturedImage(img);
            processImage(img);
        };

        stopCamera();
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Ajuster le canvas à la taille de la vidéo
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convertir en image
        canvas.toBlob((blob) => {
            const img = new Image();
            img.src = URL.createObjectURL(blob);
            img.onload = () => {
                setCapturedImage(img);
                processImage(img);
            };
        }, 'image/jpeg', 0.9);

        stopCamera();
    };

    const processImage = async (image) => {
        setStep('processing');
        setError(null);

        try {
            // Convertir l'image en base64 pour Gemini
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            // Obtenir base64 sans le préfixe data:image/jpeg;base64,
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const base64Image = dataUrl.split(',')[1];

            // Appel à Gemini Vision pour estimation
            console.log('🤖 Appel Gemini Vision avec taille:', heightCm, 'cm');
            const result = await estimateWeightFromImage({
                imageBase64: base64Image,
                mimeType: 'image/jpeg',
                heightCm: heightCm,
                breed: horse?.breed || 'Non précisée'
            });

            if (!result.success) {
                throw new Error(result.error || 'Erreur d\'estimation');
            }

            // Formater les données pour l'affichage
            setEstimation({
                weight: result.data.estimatedWeight,
                morphologyType: result.data.morphologyType,
                bodyConditionScore: result.data.bodyConditionScore,
                confidence: result.data.confidence === 'Haute' ? 0.9 : result.data.confidence === 'Moyenne' ? 0.7 : 0.5,
                reasoning: result.data.reasoning,
                recommendations: result.data.recommendations
            });

            setManualWeight(result.data.estimatedWeight.toString());
            setStep('result');
        } catch (err) {
            console.error('Erreur traitement:', err);
            setError(err.message || 'Erreur lors de l\'analyse de l\'image. Réessayez.');
            setStep('camera');
            startCamera();
        }
    };

    const handleValidate = () => {
        const finalWeight = parseInt(manualWeight, 10);

        if (!finalWeight || finalWeight < 50 || finalWeight > 1500) {
            setError('Poids invalide (50-1500 kg)');
            return;
        }

        onWeightEstimated({
            value: finalWeight,
            source: 'GEMINI_VISION',
            bodyConditionScore: estimation?.bodyConditionScore || 3,
            confidence: estimation?.confidence || 0.7,
            morphologyType: estimation?.morphologyType,
            reasoning: estimation?.reasoning,
            recommendations: estimation?.recommendations,
            imageUrl: capturedImage ? capturedImage.src : null,
        });
    };

    const handleRetry = () => {
        setCapturedImage(null);
        setEstimation(null);
        setError(null);
        setManualWeight('');
        setStep('camera');
        startCamera();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Header - Optimisé mobile */}
            <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.5)',
            }}>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                    📸 Estimation de Poids
                </h2>
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        minWidth: '44px',
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <X size={22} />
                </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {step === 'camera' && (
                    <>
                        {/* Vidéo de la caméra */}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />

                        {/* Overlay gabarit - Cadre optimisé mobile */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '90%',
                            maxWidth: '500px',
                            height: '70%',
                            maxHeight: '400px',
                            border: isAligned ? '4px dashed #4ade80' : '4px dashed rgba(255, 255, 255, 0.7)',
                            borderRadius: '20px',
                            pointerEvents: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'border-color 0.3s ease',
                        }}>
                            {/* Indicateurs d'angles (Coins du viseur) */}
                            <svg
                                viewBox="0 0 100 80"
                                preserveAspectRatio="xMidYMid meet"
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    padding: '1rem',
                                    opacity: 0.8,
                                    pointerEvents: 'none',
                                    color: isAligned ? '#4ade80' : 'white',
                                    transition: 'color 0.3s ease',
                                }}
                            >
                                {/* Coins du viseur - Style caméra professionnelle */}
                                <path
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    d="M10,20 L10,10 L20,10 M80,10 L90,10 L90,20 M90,70 L90,80 L80,80 M20,80 L10,80 L10,70"
                                    opacity="0.8"
                                />
                            </svg>

                            {/* Instructions alignement - Optimisées mobile */}
                            <div style={{
                                position: 'absolute',
                                bottom: '-40px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: isAligned ? 'rgba(16, 185, 129, 0.95)' : 'rgba(0, 0, 0, 0.85)',
                                color: 'white',
                                padding: isAligned ? '0.75rem 1.5rem' : '0.6rem 1.2rem',
                                borderRadius: '16px',
                                fontSize: isAligned ? '0.95rem' : '0.8rem',
                                fontWeight: isAligned ? '600' : 'normal',
                                textAlign: 'center',
                                maxWidth: '85%',
                                whiteSpace: 'normal',
                                lineHeight: '1.3',
                                transition: 'all 0.3s ease',
                                boxShadow: isAligned ? '0 0 25px rgba(74, 222, 128, 0.7)' : '0 2px 8px rgba(0,0,0,0.3)',
                            }}>
                                {isAligned ? '✓ Parfait ! Ne bougez plus...' : 'Cadrez le cheval de profil'}
                            </div>

                            {/* Instructions distance - Mobile */}
                            <div style={{
                                position: 'absolute',
                                top: '-45px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(0, 0, 0, 0.8)',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                textAlign: 'center',
                                maxWidth: '80%',
                                whiteSpace: 'normal',
                                lineHeight: '1.2',
                            }}>
                                Distance : ~4 mètres
                            </div>
                        </div>

                        {/* Canvas caché pour capture */}
                        <canvas ref={canvasRef} style={{ display: 'none' }} />

                        {/* Panneau de taille - Compact mobile */}
                        <div style={{
                            position: 'absolute',
                            bottom: '15px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0, 0, 0, 0.9)',
                            padding: '0.75rem 1rem',
                            borderRadius: '16px',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            maxWidth: '90%',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        }}>
                            <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: '500' }}>
                                📏 Taille:
                            </div>
                            <input
                                type="number"
                                value={heightCm}
                                onChange={(e) => setHeightCm(parseInt(e.target.value, 10) || 165)}
                                min="50"
                                max="220"
                                style={{
                                    width: '70px',
                                    padding: '0.6rem',
                                    borderRadius: '8px',
                                    border: '2px solid rgba(255, 255, 255, 0.4)',
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                }}
                            />
                            <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem' }}>cm</span>
                        </div>
                    </>
                )}

                {step === 'processing' && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'white',
                    }}>
                        <Loader size={48} className="animate-spin" style={{ marginBottom: '1rem' }} />
                        <p style={{ fontSize: '1.2rem' }}>Analyse en cours...</p>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Estimation par IA Gemini Vision...</p>
                    </div>
                )}

                {step === 'result' && estimation && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        overflow: 'auto',
                        padding: '1rem',
                    }}>
                        {/* Image capturée */}
                        {capturedImage && (
                            <img
                                src={capturedImage.src}
                                alt="Capture"
                                style={{
                                    width: '100%',
                                    maxHeight: '300px',
                                    objectFit: 'contain',
                                    borderRadius: '12px',
                                    marginBottom: '1rem',
                                }}
                            />
                        )}

                        {/* Résultats */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginBottom: '1rem',
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '1rem',
                            }}>
                                <CheckCircle size={24} color="#10b981" />
                                <h3 style={{ color: 'white', margin: 0 }}>Estimation Réussie</h3>
                            </div>

                            <div style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '2px solid #10b981',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                textAlign: 'center',
                                marginBottom: '1rem',
                            }}>
                                <div style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                    Poids Estimé
                                </div>
                                <div style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
                                    {estimation.weight} kg
                                </div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                                    Confiance: {Math.round(estimation.confidence * 100)}%
                                </div>
                            </div>

                            {/* Détails de l'analyse Gemini */}
                            <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' }}>
                                {estimation.morphologyType && (
                                    <div style={{
                                        marginBottom: '0.75rem',
                                        padding: '0.75rem',
                                        background: 'rgba(124, 58, 237, 0.2)',
                                        borderRadius: '8px',
                                        borderLeft: '3px solid #7c3aed'
                                    }}>
                                        <strong>🐴 Morphologie :</strong> {estimation.morphologyType}
                                    </div>
                                )}

                                {estimation.bodyConditionScore && (
                                    <div style={{
                                        marginBottom: '0.75rem',
                                        padding: '0.75rem',
                                        background: 'rgba(59, 130, 246, 0.2)',
                                        borderRadius: '8px',
                                        borderLeft: '3px solid #3b82f6'
                                    }}>
                                        <strong>📊 Note Corporelle (BCS) :</strong> {estimation.bodyConditionScore}/5
                                    </div>
                                )}

                                {estimation.reasoning && (
                                    <div style={{
                                        marginBottom: '0.75rem',
                                        padding: '0.75rem',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        lineHeight: '1.5'
                                    }}>
                                        <strong>🤖 Analyse :</strong><br />
                                        {estimation.reasoning}
                                    </div>
                                )}

                                {estimation.recommendations && (
                                    <div style={{
                                        marginTop: '0.75rem',
                                        padding: '0.75rem',
                                        background: 'rgba(251, 191, 36, 0.15)',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        lineHeight: '1.5',
                                        borderLeft: '3px solid #fbbf24'
                                    }}>
                                        <strong>💡 Recommandations :</strong><br />
                                        {estimation.recommendations}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ajustement manuel */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '1rem',
                            marginBottom: '1rem',
                        }}>
                            <label style={{
                                display: 'block',
                                color: 'white',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                            }}>
                                Ajuster le poids (optionnel)
                            </label>
                            <input
                                type="number"
                                value={manualWeight}
                                onChange={(e) => setManualWeight(e.target.value)}
                                min="50"
                                max="1500"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    color: 'white',
                                    fontSize: '1.1rem',
                                }}
                            />
                        </div>

                        {/* Taille au garrot (utilisée par Gemini) */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '1rem',
                            marginBottom: '1rem',
                        }}>
                            <label style={{
                                display: 'block',
                                color: 'white',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                            }}>
                                📏 Taille au garrot (cm)
                            </label>
                            <input
                                type="number"
                                value={heightCm}
                                onChange={(e) => setHeightCm(parseInt(e.target.value, 10) || 165)}
                                min="50"
                                max="220"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    color: 'white',
                                    fontSize: '1.1rem',
                                }}
                            />
                            <div style={{
                                marginTop: '0.5rem',
                                fontSize: '0.75rem',
                                color: 'rgba(255, 255, 255, 0.6)'
                            }}>
                                Cette mesure sera utilisée par l'IA pour estimer le poids
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Buttons - Optimisés mobile */}
            <div style={{
                padding: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                gap: '0.75rem',
                background: 'rgba(0, 0, 0, 0.3)',
            }}>
                {step === 'camera' && (
                    <>
                        <Button
                            onClick={onClose}
                            variant="secondary"
                            style={{ flex: 1, minHeight: '52px', fontSize: '0.95rem' }}
                        >
                            ✕ Annuler
                        </Button>
                        <label htmlFor="upload-image" style={{ flex: 1 }}>
                            <Button
                                as="div"
                                variant="secondary"
                                style={{ width: '100%', cursor: 'pointer', textAlign: 'center', minHeight: '52px', fontSize: '0.95rem' }}
                            >
                                📁 Galerie
                            </Button>
                        </label>
                        <input
                            id="upload-image"
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                        <Button
                            onClick={capturePhoto}
                            variant="primary"
                            style={{ flex: 1.5, minHeight: '52px', fontSize: '1rem', fontWeight: 'bold' }}
                        >
                            <Camera size={22} style={{ marginRight: '0.5rem' }} />
                            Capturer
                        </Button>
                    </>
                )}

                {step === 'result' && (
                    <>
                        <Button
                            onClick={handleRetry}
                            variant="secondary"
                            style={{ flex: 1, minHeight: '52px', fontSize: '0.95rem' }}
                        >
                            ← Reprendre
                        </Button>
                        <Button
                            onClick={handleValidate}
                            variant="primary"
                            style={{ flex: 1.5, minHeight: '52px', fontSize: '1rem', fontWeight: 'bold' }}
                        >
                            <CheckCircle size={22} style={{ marginRight: '0.5rem' }} />
                            Valider
                        </Button>
                    </>
                )}
            </div>

            {/* Erreur */}
            {error && (
                <div style={{
                    position: 'absolute',
                    top: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#ef4444',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    maxWidth: '90%',
                    zIndex: 10001,
                }}>
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}
        </div>
    );
}

export default WeightCamera;
