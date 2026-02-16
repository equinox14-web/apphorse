import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import Button from '../common/Button';
import { analyzeForageDocs } from '../../services/aiNutritionService'; // Nouveau service

function ForageAnalysisScanner({ onAnalysisComplete, onClose }) {
    const [step, setStep] = useState('capture'); // 'capture', 'processing', 'result', 'error'
    const [capturedImages, setCapturedImages] = useState([]);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
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
            setCapturedImages(prev => [...prev, { url: dataUrl, type: 'image/jpeg', isBase64: true }]);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setCapturedImages(prev => [...prev, { url: url, file: file, type: file.type, isBase64: false }]);
        e.target.value = '';
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
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 5, 95));
            }, 300);

            const filesPromise = capturedImages.map(async (img) => {
                if (!img.isBase64 && img.file) return img.file;
                const res = await fetch(img.url);
                const blob = await res.blob();
                return new File([blob], "analysis_doc.jpg", { type: img.type });
            });

            const files = await Promise.all(filesPromise);

            // Appel au nouveau service d'analyse de fourrage
            const data = await analyzeForageDocs(files);

            clearInterval(progressInterval);
            setProgress(100);

            if (!data || !data.success) {
                throw new Error("L'IA n'a pas pu extraire les données correctement.");
            }

            setAnalysisResult(data);
            setStep('result');

        } catch (err) {
            console.error('Erreur scan:', err);
            setError("Lecture impossible. Assurez-vous que l'analyse est bien lisible.");
            setStep('error');
        }
    };

    const handleValidate = () => {
        if (analysisResult) {
            onAnalysisComplete(analysisResult);
            onClose();
        }
    };

    const handleRetry = () => {
        setCapturedImages([]);
        setAnalysisResult(null);
        setError(null);
        setStep('capture');
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)', zIndex: 10000,
            display: 'flex', flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={24} /> Scanner Analyse Foin
                </h2>
                <button onClick={() => { stopCamera(); onClose(); }} style={{ background: 'transparent', border: 'none', color: 'white' }}>
                    <X size={24} />
                </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column' }}>

                {step === 'capture' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                        {isCameraOpen ? (
                            <div style={{ position: 'relative', width: '100%', maxWidth: '500px', borderRadius: '12px', overflow: 'hidden' }}>
                                <video ref={videoRef} autoPlay playsInline style={{ width: '100%' }} />
                                <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                    <Button onClick={stopCamera} variant="secondary" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>Fermer</Button>
                                    <Button onClick={capturePhoto} variant="primary" style={{ borderRadius: '50%', width: '64px', height: '64px', padding: 0 }} />
                                </div>
                            </div>
                        ) : (
                            capturedImages.length === 0 && (
                                <div style={{ textAlign: 'center', color: 'white', opacity: 0.8 }}>
                                    <FileText size={64} style={{ marginBottom: '1rem' }} />
                                    <p>Prenez en photo votre rapport d'analyse (Reverdy, Eurofins...)</p>
                                </div>
                            )
                        )}

                        {/* Gallery */}
                        {capturedImages.length > 0 && !isCameraOpen && (
                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', maxWidth: '100%', padding: '0.5rem' }}>
                                {capturedImages.map((img, idx) => (
                                    <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                                        <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                        <button onClick={() => handleRemoveImage(idx)} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!isCameraOpen && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <Button onClick={startCamera} variant="secondary"><Camera size={20} style={{ marginRight: '0.5rem' }} /> Photo</Button>
                                    <Button onClick={() => fileInputRef.current.click()} variant="secondary"><Upload size={20} style={{ marginRight: '0.5rem' }} /> Importer</Button>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                                </div>
                                {capturedImages.length > 0 && (
                                    <Button onClick={handleStartAnalysis} variant="primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>🚀 Lancer l'Analyse</Button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {step === 'processing' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '1.5rem' }}>
                        <div style={{ fontSize: '4rem' }}>🧪</div>
                        <p style={{ fontSize: '1.2rem' }}>Extraction des données...</p>
                        <div style={{ width: '300px', background: '#333', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: '#10b981', transition: 'width 0.3s' }} />
                        </div>
                    </div>
                )}

                {step === 'result' && analysisResult && (
                    <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '12px', padding: '1.5rem', color: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <CheckCircle size={24} color="#10b981" />
                                <h3 style={{ margin: 0 }}>Analyse Réussie !</h3>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', opacity: 0.8 }}>Laboratoire / Date</h4>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                                    {analysisResult.lab_name || 'Non identifié'}
                                    {analysisResult.sample_date && <span style={{ fontSize: '0.9rem', opacity: 0.7, marginLeft: '0.5rem' }}>({analysisResult.sample_date})</span>}
                                </div>
                                <div style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#10b981' }}>
                                    "{analysisResult.forage_type || 'Fourrage'}"
                                </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Valeurs Nutritionnelles (sur MS)</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <span style={{ opacity: 0.7 }}>UFC:</span>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{analysisResult.ufc_per_kg_dm} <small>/kg MS</small></div>
                                    </div>
                                    <div>
                                        <span style={{ opacity: 0.7 }}>MADC:</span>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{analysisResult.madc_per_kg_dm}g <small>/kg MS</small></div>
                                    </div>
                                    <div>
                                        <span style={{ opacity: 0.7 }}>Matière Sèche:</span>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{analysisResult.dry_matter_percent}%</div>
                                    </div>
                                    <div>
                                        <span style={{ opacity: 0.7 }}>Calcium:</span>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{analysisResult.calcium_g_per_kg_dm || '?'}g</div>
                                    </div>
                                    <div>
                                        <span style={{ opacity: 0.7 }}>Phosphore:</span>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{analysisResult.phosphorus_g_per_kg_dm || '?'}g</div>
                                    </div>
                                    <div>
                                        <span style={{ opacity: 0.7 }}>Sucres:</span>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: (analysisResult.sugar_percent_dm > 10) ? '#ef4444' : 'white' }}>
                                            {analysisResult.sugar_percent_dm || '?'}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {analysisResult.quality_assessment && (
                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '0.9rem' }}>
                                    📝 {analysisResult.quality_assessment}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 'error' && (
                    <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
                        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ color: '#ef4444' }}>Erreur</h3>
                        <p>{error}</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                {step === 'result' && (
                    <>
                        <Button onClick={handleRetry} variant="secondary">Scanner autre</Button>
                        <Button onClick={handleValidate} variant="primary"><CheckCircle size={20} style={{ marginRight: '0.5rem' }} /> Valider</Button>
                    </>
                )}
                {step === 'error' && <Button onClick={handleRetry} variant="primary">Réessayer</Button>}
            </div>
        </div>
    );
}

export default ForageAnalysisScanner;
