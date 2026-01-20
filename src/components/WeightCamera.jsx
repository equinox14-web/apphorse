import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Button from './Button';
import { estimateWeightFromPhoto, MORPHOTYPES, BODY_CONDITION_SCORES } from '../utils/weightEstimation';

/**
 * Composant de capture photo avec overlay pour l'estimation de poids
 */
function WeightCamera({ horse, onWeightEstimated, onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [step, setStep] = useState('camera'); // 'camera', 'processing', 'result'
    const [capturedImage, setCapturedImage] = useState(null);
    const [estimation, setEstimation] = useState(null);
    const [error, setError] = useState(null);
    const [bodyConditionScore, setBodyConditionScore] = useState(3);
    const [manualWeight, setManualWeight] = useState('');

    // Démarrage de la caméra
    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

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
            // Estimation du poids via l'algorithme
            const result = await estimateWeightFromPhoto(image, horse, bodyConditionScore);

            setEstimation(result);
            setManualWeight(result.weight.toString());
            setStep('result');
        } catch (err) {
            console.error('Erreur traitement:', err);
            setError('Erreur lors de l\'analyse de l\'image. Réessayez.');
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
            source: 'PHOTO_ESTIMATION',
            bodyConditionScore,
            confidence: estimation?.confidence || 0.5,
            measurements: estimation?.measurements,
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
            {/* Header */}
            <div style={{
                padding: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>
                    📸 Estimation de Poids par Photo
                </h2>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '0.5rem',
                    }}
                >
                    <X size={24} />
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

                        {/* Overlay gabarit */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '80%',
                            maxWidth: '600px',
                            height: '60%',
                            border: '3px dashed rgba(255, 255, 255, 0.6)',
                            borderRadius: '16px',
                            pointerEvents: 'none',
                        }}>
                            {/* Silhouette de cheval (SVG simplifié) */}
                            <svg
                                viewBox="0 0 200 100"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0.3,
                                }}
                            >
                                <ellipse cx="100" cy="50" rx="80" ry="30" fill="white" />
                                <circle cx="60" cy="40" r="20" fill="white" />
                                <circle cx="140" cy="40" r="15" fill="white" />
                            </svg>

                            {/* Instructions */}
                            <div style={{
                                position: 'absolute',
                                top: '-50px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(0, 0, 0, 0.7)',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                            }}>
                                Placez le cheval de profil dans le cadre (~4m de distance)
                            </div>
                        </div>

                        {/* Canvas caché pour capture */}
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
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
                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Analyse haute précision (BodyPix) en cours...</p>
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

                            {/* Détails des mesures */}
                            <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem' }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    📏 Longueur: {estimation.measurements.realLength} cm
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    📐 Profondeur: {estimation.measurements.realDepth} cm
                                </div>
                                {estimation.measurements.detectedClass && (
                                    <div style={{
                                        marginTop: '0.75rem',
                                        padding: '0.5rem',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem'
                                    }}>
                                        🤖 IA : {estimation.measurements.detectedClass === 'horse' ? 'Cheval détecté' :
                                            estimation.measurements.detectedClass === 'fallback' ? 'Estimation par défaut' :
                                                `Détection: ${estimation.measurements.detectedClass}`}
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

                        {/* Body Condition Score */}
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
                                Note d'État Corporel (BCS)
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {BODY_CONDITION_SCORES.map((bcs) => (
                                    <button
                                        key={bcs.value}
                                        onClick={() => setBodyConditionScore(bcs.value)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            border: bodyConditionScore === bcs.value
                                                ? '2px solid #10b981'
                                                : '1px solid rgba(255, 255, 255, 0.2)',
                                            background: bodyConditionScore === bcs.value
                                                ? 'rgba(16, 185, 129, 0.2)'
                                                : 'rgba(0, 0, 0, 0.3)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                        }}
                                        title={bcs.description}
                                    >
                                        {bcs.value} - {bcs.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Buttons */}
            <div style={{
                padding: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                gap: '1rem',
            }}>
                {step === 'camera' && (
                    <>
                        <Button
                            onClick={onClose}
                            variant="secondary"
                            style={{ flex: 1 }}
                        >
                            Annuler
                        </Button>
                        <label htmlFor="upload-image" style={{ flex: 1 }}>
                            <Button
                                as="div"
                                variant="secondary"
                                style={{ width: '100%', cursor: 'pointer', textAlign: 'center' }}
                            >
                                📁 Importer
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
                            style={{ flex: 1 }}
                        >
                            <Camera size={20} style={{ marginRight: '0.5rem' }} />
                            Capturer
                        </Button>
                    </>
                )}

                {step === 'result' && (
                    <>
                        <Button
                            onClick={handleRetry}
                            variant="secondary"
                            style={{ flex: 1 }}
                        >
                            Reprendre
                        </Button>
                        <Button
                            onClick={handleValidate}
                            variant="primary"
                            style={{ flex: 1 }}
                        >
                            <CheckCircle size={20} style={{ marginRight: '0.5rem' }} />
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
