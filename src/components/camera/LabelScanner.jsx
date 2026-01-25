import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, X, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../common/Button';
import { analyzeFeedLabel } from '../../services/aiNutritionService'; // Import Service AI

function LabelScanner({ onFeedScanned, onClose }) {
    const [step, setStep] = useState('capture'); // 'capture', 'processing', 'result', 'error'
    const [capturedImages, setCapturedImages] = useState([]); // Array of { url, file, type }
    const [scannedFeed, setScannedFeed] = useState(null);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);

    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Préférer la caméra arrière
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraOpen(true);
        } catch (err) {
            console.error("Erreur caméra:", err);
            alert("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    // Attacher le flux vidéo quand la caméra s'ouvre
    useEffect(() => {
        if (isCameraOpen && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraOpen]);

    const capturePhoto = () => {
        if (videoRef.current) {
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            // Add to gallery
            setCapturedImages(prev => [...prev, { url: dataUrl, type: 'image/jpeg', isBase64: true }]);
            // Do NOT stop camera, let user take more
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setCapturedImages(prev => [...prev, { url: url, file: file, type: file.type, isBase64: false }]);
        e.target.value = ''; // Reset input
    };

    const handleRemoveImage = (index) => {
        setCapturedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleStartAnalysis = async () => {
        if (capturedImages.length === 0) return;

        stopCamera();
        processImages();
    };

    const processImages = async () => {
        setStep('processing');
        setError(null);
        setProgress(0);

        try {
            // Simulation progression
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 5, 95));
            }, 300);

            // Prepare files for service
            // Service supports File objects. We need to convert base64 ones to Files.
            const filesPromise = capturedImages.map(async (img) => {
                if (!img.isBase64 && img.file) return img.file;

                // Convert base64 dataUrl to File
                const res = await fetch(img.url);
                const blob = await res.blob();
                return new File([blob], "capture.jpg", { type: img.type });
            });

            const files = await Promise.all(filesPromise);

            // Call Gemini Service with Array of Files
            const data = await analyzeFeedLabel(files);

            clearInterval(progressInterval);
            setProgress(100);

            if (!data) {
                throw new Error("No data returned from AI");
            }

            // Mapping vers format interne
            const feed = {
                id: `scanned-${Date.now()}`,
                brand: data.brand || 'Inconnue',
                name: data.name || 'Aliment Scanné',
                category: data.category || 'COMPLEMENT',
                // Important: map to calculator expected fields
                ufc: data.ufc || 0,
                madc: data.madc || 0,

                // Extra fields
                density: data.density || 0.65,
                cellulose: data.cellulose || 0,
                mat: data.mat || 0,

                scannedAt: new Date().toISOString(),
                isEstimated: false // Gemini provides intelligent estimates
            };

            setScannedFeed(feed);
            setStep('result');
        } catch (err) {
            console.error('Erreur scan:', err);
            setError("Lecture impossible. Essayez de bien éclairer l'étiquette et réessayez.");
            setStep('error');
        }
    };

    const handleValidate = () => {
        if (scannedFeed) {
            onFeedScanned(scannedFeed);
            onClose();
        }
    };

    const handleRetry = () => {
        setCapturedImages([]);
        setScannedFeed(null);
        setError(null);
        setStep('capture');
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
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
                    📸 Scanner Étiquette Aliment
                </h2>
                <button
                    onClick={() => {
                        stopCamera();
                        onClose();
                    }}
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: '1rem' }}>
                {step === 'capture' && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        gap: '2rem',
                    }}>
                        {isCameraOpen ? (
                            <div style={{ position: 'relative', width: '100%', maxWidth: '500px', borderRadius: '12px', overflow: 'hidden' }}>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    style={{ width: '100%', display: 'block' }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: '20px',
                                    left: 0,
                                    right: 0,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '1rem'
                                }}>
                                    <Button onClick={stopCamera} variant="secondary" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
                                        Fermer Caméra
                                    </Button>
                                    <Button onClick={capturePhoto} variant="primary" style={{ borderRadius: '50%', width: '64px', height: '64px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid white', backgroundColor: 'transparent' }} />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            capturedImages.length === 0 && (
                                <>
                                    <Camera size={64} color="white" style={{ opacity: 0.5 }} />
                                    <p style={{ color: 'white', fontSize: '1.1rem', textAlign: 'center', maxWidth: '500px' }}>
                                        Photographiez l'étiquette (Analyses + Ingrédients).<br />
                                        Vous pouvez prendre <strong>plusieurs photos</strong> !
                                    </p>
                                </>
                            )
                        )}

                        {/* Gallery Preview */}
                        {capturedImages.length > 0 && !isCameraOpen && (
                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', maxWidth: '100%', padding: '0.5rem' }}>
                                {capturedImages.map((img, idx) => (
                                    <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                                        <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} alt={`scan-${idx}`} />
                                        <button
                                            onClick={() => handleRemoveImage(idx)}
                                            style={{
                                                position: 'absolute', top: -5, right: -5, background: 'red', color: 'white',
                                                borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer'
                                            }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!isCameraOpen && (
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <Button
                                        onClick={startCamera}
                                        variant="secondary"
                                    >
                                        <Camera size={20} style={{ marginRight: '0.5rem' }} />
                                        Ajouter Photo
                                    </Button>

                                    <Button
                                        onClick={() => fileInputRef.current.click()}
                                        variant="secondary"
                                    >
                                        <Upload size={20} style={{ marginRight: '0.5rem' }} />
                                        Importer
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        style={{ display: 'none' }}
                                    />
                                </div>

                                {capturedImages.length > 0 && (
                                    <Button
                                        onClick={handleStartAnalysis}
                                        variant="primary"
                                        style={{ marginTop: '1rem', padding: '1rem 2rem', fontSize: '1.1rem', background: '#4f46e5' }}
                                    >
                                        🚀 Lancer l'analyse ({capturedImages.length})
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {step === 'processing' && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        color: 'white',
                        gap: '1.5rem',
                    }}>
                        <div style={{ fontSize: '4rem' }}>🧠</div>
                        <p style={{ fontSize: '1.2rem' }}>Analyse par IA en cours...</p>
                        <div style={{ width: '300px', background: '#333', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: '#6366f1', // Indigo
                                transition: 'width 0.3s',
                            }} />
                        </div>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                            Extraction des UFC, MADC et Densité...
                        </p>
                    </div>
                )}

                {step === 'result' && scannedFeed && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        maxWidth: '600px',
                        margin: '0 auto',
                    }}>
                        {capturedImages.length > 0 && (
                            <img
                                src={capturedImages[0].url}
                                alt="Scan en cours"
                                style={{
                                    maxWidth: '400px',
                                    maxHeight: '300px',
                                    borderRadius: '12px',
                                    opacity: 0.5,
                                }}
                            />
                        )}

                        <div style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '2px solid #10b981',
                            borderRadius: '12px',
                            padding: '1.5rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <CheckCircle size={24} color="#10b981" />
                                <h3 style={{ color: 'white', margin: 0 }}>Scan Réussi !</h3>
                            </div>

                            <div style={{ color: 'white', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    {scannedFeed.brand} {scannedFeed.name}
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '8px',
                                padding: '1rem',
                                color: 'white',
                            }}>
                                <h4 style={{ marginTop: 0, fontSize: '0.9rem', opacity: 0.8 }}>Valeurs Nutritionnelles</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                                    <div>
                                        <span style={{ opacity: 0.7 }}>UFC:</span> <strong>{scannedFeed.ufc}</strong> UFC/kg
                                        {scannedFeed.isEstimated && <span style={{ fontSize: '0.75rem', opacity: 0.6 }}> (estimé)</span>}
                                    </div>
                                    <div>
                                        <span style={{ opacity: 0.7 }}>MADC:</span> <strong>{scannedFeed.madc}g</strong>/kg
                                    </div>
                                    <div>
                                        <span style={{ opacity: 0.7 }}>Cellulose:</span> <strong>{scannedFeed.cellulose}%</strong>
                                    </div>
                                    <div>
                                        <span style={{ opacity: 0.7 }}>Cendres:</span> <strong>{scannedFeed.cendres}%</strong>
                                    </div>
                                    <div>
                                        <span style={{ opacity: 0.7 }}>Calcium:</span> <strong>{scannedFeed.calcium}g</strong>/kg
                                    </div>
                                    <div>
                                        <span style={{ opacity: 0.7 }}>Phosphore:</span> <strong>{scannedFeed.phosphore}g</strong>/kg
                                    </div>
                                </div>
                            </div>

                            {scannedFeed.isEstimated && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    color: '#93c5fd',
                                }}>
                                    💡 Les valeurs UFC/MADC ont été estimées par l'algorithme INRA car elles n'étaient pas sur l'étiquette.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 'error' && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        gap: '1.5rem',
                    }}>
                        <AlertCircle size={64} color="#ef4444" />
                        <div style={{ textAlign: 'center', color: 'white', maxWidth: '500px' }}>
                            <h3 style={{ color: '#ef4444', marginTop: 0 }}>Erreur de Scan</h3>
                            <p>{error}</p>
                            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '1rem' }}>
                                Assurez-vous que :
                            </p>
                            <ul style={{ textAlign: 'left', fontSize: '0.85rem', opacity: 0.8 }}>
                                <li>L'image est nette et bien éclairée</li>
                                <li>La section "Analyse Garantie" est visible</li>
                                <li>Le texte est lisible</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{
                padding: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
            }}>
                {step === 'result' && (
                    <>
                        <Button onClick={handleRetry} variant="secondary">
                            Scanner un autre
                        </Button>
                        <Button onClick={handleValidate} variant="primary">
                            <CheckCircle size={20} style={{ marginRight: '0.5rem' }} />
                            Utiliser cet aliment
                        </Button>
                    </>
                )}
                {step === 'error' && (
                    <Button onClick={handleRetry} variant="primary">
                        Réessayer
                    </Button>
                )}
            </div>
        </div >
    );
}

export default LabelScanner;
