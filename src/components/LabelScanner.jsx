import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import Button from './Button';
import { scanFeedLabel } from '../utils/labelOCR';

function LabelScanner({ onFeedScanned, onClose }) {
    const [step, setStep] = useState('capture'); // 'capture', 'processing', 'result', 'error'
    const [capturedImage, setCapturedImage] = useState(null);
    const [scannedFeed, setScannedFeed] = useState(null);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const img = new Image();
        const url = URL.createObjectURL(file);
        img.src = url;

        img.onload = () => {
            setCapturedImage(url);
            processImage(file);
        };
    };

    const processImage = async (imageFile) => {
        setStep('processing');
        setError(null);
        setProgress(0);

        try {
            // Simuler progression (Tesseract fournit sa propre progression)
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const feed = await scanFeedLabel(imageFile);

            clearInterval(progressInterval);
            setProgress(100);

            setScannedFeed(feed);
            setStep('result');
        } catch (err) {
            console.error('Erreur scan:', err);
            setError(err.message || 'Erreur lors du scan de l\'étiquette');
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
        setCapturedImage(null);
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
                        <Camera size={64} color="white" style={{ opacity: 0.5 }} />
                        <p style={{ color: 'white', fontSize: '1.1rem', textAlign: 'center', maxWidth: '500px' }}>
                            Photographiez la section <strong>"Analyse Garantie"</strong> de l'étiquette de votre aliment
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <label htmlFor="upload-label" style={{ flex: '1 1 200px', maxWidth: '300px' }}>
                                <Button
                                    as="div"
                                    variant="primary"
                                    style={{ width: '100%', cursor: 'pointer', textAlign: 'center' }}
                                >
                                    <Upload size={20} style={{ marginRight: '0.5rem' }} />
                                    Choisir une image
                                </Button>
                            </label>
                            <input
                                id="upload-label"
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {capturedImage && (
                            <img
                                src={capturedImage}
                                alt="Étiquette"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    borderRadius: '12px',
                                    marginTop: '1rem',
                                }}
                            />
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
                        {capturedImage && (
                            <img
                                src={capturedImage}
                                alt="Scan en cours"
                                style={{
                                    maxWidth: '400px',
                                    maxHeight: '300px',
                                    borderRadius: '12px',
                                    opacity: 0.5,
                                }}
                            />
                        )}

                        <Loader size={48} className="animate-spin" />
                        <p style={{ fontSize: '1.2rem' }}>Analyse en cours...</p>
                        <div style={{ width: '300px', background: '#333', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: 'var(--color-primary)',
                                transition: 'width 0.3s',
                            }} />
                        </div>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                            Extraction des valeurs nutritionnelles...
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
                        {capturedImage && (
                            <img
                                src={capturedImage}
                                alt="Scan réussi"
                                style={{
                                    width: '100%',
                                    maxHeight: '200px',
                                    objectFit: 'contain',
                                    borderRadius: '12px',
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
        </div>
    );
}

export default LabelScanner;
