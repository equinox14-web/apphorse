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
                scoopWeight: data.scoop_weight || 0, // In grams
                dailyDoseG: data.daily_dose_g || 0, // In grams
                cellulose: data.cellulose || 0,
                mat: data.mat || 0,
                starch: data.starch || 0,
                sugar: data.sugar || 0,

                // Minerals
                calcium: data.calcium || 0,
                phosphore: data.phosphorus || 0, // Fix key mismatch for display
                phosphorus: data.phosphorus || 0,
                magnesium: data.magnesium || 0,
                sodium: data.sodium || 0,
                zinc: data.zinc || 0,
                copper: data.copper || 0,
                selenium: data.selenium || 0,
                lysine: data.lysine || 0,

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
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white',
                width: '90%', maxWidth: '550px',
                maxHeight: '85vh',
                borderRadius: '20px',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f8fafc'
                }}>
                    <h2 style={{ color: '#1e293b', margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Camera size={20} color="#6366f1" /> Scanner Étiquette
                    </h2>
                    <button
                        onClick={() => {
                            stopCamera();
                            onClose();
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex', alignItems: 'center'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '1.5rem', position: 'relative' }}>
                    {step === 'capture' && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1.5rem',
                        }}>
                            {isCameraOpen ? (
                                <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', background: 'black', aspectRatio: '4/3' }}>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                                        <Button onClick={stopCamera} variant="secondary" style={{ background: 'rgba(255,255,255,0.9)', color: '#333', fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                                            Stop
                                        </Button>
                                        <Button onClick={capturePhoto} variant="primary" style={{ borderRadius: '50%', width: '60px', height: '60px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid rgba(255,255,255,0.5)' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'white' }} />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                capturedImages.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1', width: '100%' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
                                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>Analyses & Ingrédients</h3>
                                        <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '300px', margin: '0 auto' }}>
                                            Prenez en photo l'étiquette de composition de l'aliment pour importer ses valeurs.
                                        </p>
                                    </div>
                                )
                            )}

                            {/* Gallery Preview */}
                            {capturedImages.length > 0 && !isCameraOpen && (
                                <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', maxWidth: '100%', padding: '0.5rem 0' }}>
                                    {capturedImages.map((img, idx) => (
                                        <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                                            <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`scan-${idx}`} />
                                            <button
                                                onClick={() => handleRemoveImage(idx)}
                                                style={{
                                                    position: 'absolute', top: 2, right: 2, background: 'rgba(239, 68, 68, 0.9)', color: 'white',
                                                    borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer'
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isCameraOpen && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <Button
                                            onClick={startCamera}
                                            variant="secondary"
                                            style={{ justifyContent: 'center', padding: '1rem' }}
                                        >
                                            <Camera size={20} style={{ marginRight: '0.5rem' }} />
                                            Prendre Photo
                                        </Button>

                                        <Button
                                            onClick={() => fileInputRef.current.click()}
                                            variant="secondary"
                                            style={{ justifyContent: 'center', padding: '1rem' }}
                                        >
                                            <Upload size={20} style={{ marginRight: '0.5rem' }} />
                                            Importer
                                        </Button>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        style={{ display: 'none' }}
                                    />

                                    {capturedImages.length > 0 && (
                                        <Button
                                            onClick={handleStartAnalysis}
                                            variant="primary"
                                            style={{ padding: '1rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' }}
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
                            padding: '3rem 0',
                            gap: '1.5rem',
                        }}>
                            <div style={{ fontSize: '4rem', animation: 'bounce 1s infinite' }}>🧠</div>
                            <h3 style={{ fontSize: '1.3rem', color: '#1e293b', margin: 0 }}>Analyse IA en cours...</h3>

                            <div style={{ width: '80%', background: '#e2e8f0', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${progress}%`,
                                    height: '100%',
                                    background: '#6366f1',
                                    transition: 'width 0.3s',
                                }} />
                            </div>
                            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                Extraction des valeurs nutritionnelles...
                            </p>
                        </div>
                    )}

                    {step === 'result' && scannedFeed && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                        }}>
                            <div style={{
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                textAlign: 'center'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                    <div style={{ padding: '1rem', background: '#dcfce7', borderRadius: '50%', color: '#16a34a' }}>
                                        <CheckCircle size={32} />
                                    </div>
                                </div>
                                <h3 style={{ color: '#15803d', margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>{scannedFeed.brand}</h3>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>
                                    {scannedFeed.name}
                                </div>
                                {scannedFeed.isEstimated && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#0ea5e9', display: 'inline-block', background: '#e0f2fe', padding: '2px 8px', borderRadius: '12px' }}>
                                        Valeurs Estimées
                                    </div>
                                )}
                            </div>

                            <div style={{
                                background: '#f8fafc',
                                borderRadius: '12px',
                                padding: '1rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Valeurs Nutritionnelles
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    {[
                                        { label: 'UFC', value: scannedFeed.ufc, unit: 'UFC/kg', key: true },
                                        { label: 'MADC', value: scannedFeed.madc, unit: 'g/kg', key: true },
                                        { label: 'Cellulose', value: scannedFeed.cellulose, unit: '%', key: true },
                                        { label: 'Protéines', value: scannedFeed.mat, unit: '%', key: true },
                                        { label: 'Amidon', value: scannedFeed.starch, unit: '%' },
                                        { label: 'Sucre', value: scannedFeed.sugar, unit: '%' },
                                        { label: 'Calcium', value: scannedFeed.calcium, unit: 'g/kg', key: true },
                                        { label: 'Phosphore', value: scannedFeed.phosphore, unit: 'g/kg', key: true },
                                        { label: 'Magnésium', value: scannedFeed.magnesium, unit: 'g/kg' },
                                        { label: 'Sodium', value: scannedFeed.sodium, unit: 'g/kg' },
                                        { label: 'Zinc', value: scannedFeed.zinc, unit: 'mg/kg' },
                                        { label: 'Cuivre', value: scannedFeed.copper, unit: 'mg/kg' },
                                        { label: 'Sélénium', value: scannedFeed.selenium, unit: 'mg/kg' },
                                        { label: 'Lysine', value: scannedFeed.lysine, unit: 'g/kg' },
                                    ].filter(item => item.key || (item.value && item.value > 0)).map((item, i) => (
                                        <div key={i} style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.label}</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#334155' }}>
                                                {item.value || '-'} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>{item.unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'error' && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: '2rem 1rem',
                            gap: '1.5rem',
                        }}>
                            <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '50%', color: '#dc2626' }}>
                                <AlertCircle size={48} />
                            </div>
                            <div>
                                <h3 style={{ color: '#991b1b', marginTop: 0 }}>Erreur de Lecture</h3>
                                <p style={{ color: '#ef4444', fontWeight: '500' }}>{error}</p>
                            </div>
                            <div style={{ background: '#fff7ed', padding: '1rem', borderRadius: '8px', border: '1px solid #ffedd5', fontSize: '0.9rem', color: '#9a3412', textAlign: 'left' }}>
                                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Conseils :</p>
                                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                    <li>Prenez la photo de plus près</li>
                                    <li>Évitez les reflets (flash)</li>
                                    <li>Cadrez bien le tableau des valeurs</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer (Actions) */}
                <div style={{
                    padding: '1rem 1.5rem',
                    background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'flex-end',
                }}>
                    {step === 'result' ? (
                        <>
                            <Button onClick={handleRetry} variant="secondary">
                                Scanner un autre
                            </Button>
                            <Button onClick={handleValidate} variant="primary" style={{ background: '#16a34a' }}>
                                <CheckCircle size={18} style={{ marginRight: '0.5rem' }} />
                                Valider
                            </Button>
                        </>
                    ) : step === 'error' ? (
                        <Button onClick={handleRetry} variant="primary">
                            Réessayer
                        </Button>
                    ) : (
                        <Button onClick={onClose} variant="text" style={{ color: '#64748b' }}>
                            Fermer
                        </Button>
                    )}
                </div>
            </div >
        </div>
    );
}

export default LabelScanner;
