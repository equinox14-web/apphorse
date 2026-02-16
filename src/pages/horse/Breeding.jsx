import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import SEO from '../../components/common/SEO';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Heart, Calendar, Baby, Activity, Plus, ChevronRight, AlertCircle, CheckCircle, GitMerge, Trash2, Edit2, User, FileText, Stethoscope, Dna, ScanLine, Upload, Camera, X } from 'lucide-react';
import { canAccess, getMaxMares, getUserPlanIds, canManageHorses } from '../../utils/permissions';
import { extractMareDataFromImage } from '../../services/geminiService';

// Custom Spermatozoid Icon
const SpermIcon = ({ size = 24, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <ellipse cx="7" cy="12" rx="4" ry="3.5" />
        <path d="M11 12c2 0 4-2 7-2s4 4 4 4" />
    </svg>
);

const Breeding = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    // Mock Breeding Data - Cleared
    const defaultMares = [];

    const [mares, setMares] = useState(() => {
        const saved = localStorage.getItem('appHorse_breeding_v2');
        return saved ? JSON.parse(saved) : defaultMares;
    });

    const [showModal, setShowModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [mareToDelete, setMareToDelete] = useState(null); // Custom Delete Modal
    const [editingId, setEditingId] = useState(null);
    const [newMare, setNewMare] = useState({ name: '', internalNumber: '', role: 'Poulinière', status: 'Vide', sire: '', geneticDam: '', termDate: '' });
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState({ price: '', type: '' });

    // Scanning Logic
    const [showScanningCamera, setShowScanningCamera] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const videoRef = React.useRef(null);

    const startScanning = () => {
        setShowScanningCamera(true);
    };

    const stopScanning = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        setShowScanningCamera(false);
    };

    useEffect(() => {
        let stream = null;
        if (showScanningCamera) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(s => {
                    stream = s;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play();
                    }
                })
                .catch(err => {
                    console.error("Camera Error:", err);
                    alert("Impossible d'accéder à la caméra. Vérifiez les permissions.");
                    setShowScanningCamera(false);
                });
        }
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [showScanningCamera]);

    const processImageWithAI = async (imageBase64) => {
        setIsAnalyzing(true);
        try {
            // Retirer le préfixe data:image/jpeg;base64, si présent
            const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
            const mimeType = imageBase64.includes(':') ? imageBase64.split(';')[0].split(':')[1] : 'image/jpeg';

            const result = await extractMareDataFromImage({ imageBase64: base64Data, mimeType });

            if (result.success && result.data) {
                const data = result.data;
                setNewMare(prev => ({
                    ...prev,
                    name: data.name || prev.name,
                    internalNumber: prev.internalNumber, // Manuel
                    sire: data.sire || prev.sire, // Père
                    geneticDam: data.dam || prev.geneticDam, // Mère génétique
                    dam: data.dam || prev.dam, // Mère (info sup)

                    // Champs d'identification officiels (sauvegardés même si non affichés dans le form court)
                    sireNumber: data.sireNumber || prev.sireNumber,
                    ueln: data.ueln || prev.ueln,
                    birthDate: data.birthDate || prev.birthDate,
                    sex: data.sex || prev.sex || 'Femelle', // Par défaut Femelle pour une poulinière
                    breed: data.breed || prev.breed
                }));
                alert(`Document analysé ! Jument identifiée : ${data.name || 'Inconnue'}`);
                stopScanning(); // Close camera if open
            } else {
                alert("L'IA n'a pas pu lire les informations. Essayez une photo plus nette.");
            }
        } catch (error) {
            console.error("AI Error:", error);
            alert("Erreur lors de l'analyse IA.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const captureAndProcess = () => {
        if (videoRef.current) {
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
            const imageBase64 = canvas.toDataURL("image/jpeg");
            processImageWithAI(imageBase64);
        }
    };

    const handleFileScan = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                processImageWithAI(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        localStorage.setItem('appHorse_breeding_v2', JSON.stringify(mares));
    }, [mares]);

    const handleAddMare = (e) => {
        e.preventDefault();

        if (editingId) {
            // EDIT MODE
            const updatedMares = mares.map(m => m.id === editingId ? { ...m, ...newMare } : m);
            setMares(updatedMares);
            setEditingId(null);
        } else {
            // CREATE MODE
            const mareToAdd = {
                id: Date.now(),
                ...newMare,
                lastEcho: 'N/A',
                daysGestation: 0 // Mock calc
            };
            setMares([...mares, mareToAdd]);
        }

        setShowModal(false);
        setNewMare({ name: '', internalNumber: '', role: 'Poulinière', status: 'Vide', sire: '', geneticDam: '', termDate: '' });
    };

    const requestDeleteMare = (mare) => {
        setMareToDelete(mare);
    };

    const confirmDeleteMare = () => {
        if (!mareToDelete) return;
        // Remove from list
        const updatedMares = mares.filter(m => m.id !== mareToDelete.id);
        setMares(updatedMares);

        // Clean up specific events storage
        localStorage.removeItem(`appHorse_breeding_events_${mareToDelete.id}`);
        setMareToDelete(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Gestante': return '#52c41a'; // Green
            case 'Inseminée': return '#1890ff'; // Blue
            case 'Vide': return '#ff4d4f';      // Red
            case 'Poulinage': return '#722ed1'; // Purple
            default: return '#faad14';
        }
    };



    // ... (useEffect remains same)

    const handleOpenModal = () => {
        const max = getMaxMares();
        if (mares.length >= max) {
            const plans = getUserPlanIds();

            // Free Plan (Decouverte) -> Upgrade to Passion Elevage (Custom Modal)
            if (plans.includes('decouverte') && plans.length === 1) {
                setShowUpgradeModal(true);
                return;
            }

            // Paid Plans (Passion Elevage or others) -> Propose Add-on
            const isPassionElevage = plans.includes('eleveur_amateur_paid');
            const price = isPassionElevage ? "2,00 €" : "4,99 €";
            const type = isPassionElevage ? t('breeding_page.payment_modal.lifetime_payment') : t('breeding_page.payment_modal.one_time_payment');

            setPaymentDetails({ price, type });
            setShowPaymentModal(true);
            return;
        }
        setShowModal(true);
    };

    const handlePaymentSuccess = () => {
        // Mock Payment Success
        alert(t('breeding_page.payment_modal.success_alert'));
        const currentExtra = parseInt(localStorage.getItem('extraMares') || '0');
        localStorage.setItem('extraMares', currentExtra + 1);
        setShowPaymentModal(false);
        setShowModal(true); // Open the add form immediately after
    };

    // Load Planning
    const [planning, setPlanning] = useState([]);

    useEffect(() => {
        const allEvents = [];
        mares.forEach(mare => {
            const mareEvents = JSON.parse(localStorage.getItem(`appHorse_breeding_events_${mare.id}`) || '[]');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todoEvents = mareEvents.filter(e => new Date(e.date) >= today);
            todoEvents.forEach(evt => {
                allEvents.push({
                    ...evt,
                    mareName: mare.name,
                    mareInternalNumber: mare.internalNumber, // Pass internal number
                    mareId: mare.id
                });
            });
        });
        setPlanning(allEvents.sort((a, b) => new Date(a.date) - new Date(b.date)));
    }, [mares]);

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px', minHeight: '120vh' }}>
            <SEO title={t('breeding_page.seo_title')} description={t('breeding_page.seo_desc')} />
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="secondary" onClick={() => navigate('/calendar')} title={t('breeding_page.calendar_btn')}>
                        <Calendar size={18} /> <span className="hide-on-mobile">{t('breeding_page.calendar_btn')}</span>
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            if (canAccess('breeding_advice')) navigate('/breeding/advice');
                            else alert(t('breeding_page.advice_locked_alert'));
                        }}
                        style={{ opacity: canAccess('breeding_advice') ? 1 : 0.7 }}
                        title={t('breeding_page.advice_btn')}
                    >
                        <GitMerge size={18} /> <span className="hide-on-mobile">{t('breeding_page.advice_btn')}</span> {!canAccess('breeding_advice') && '🔒'}
                    </Button>
                    <Button onClick={handleOpenModal} title={t('breeding_page.add_mare_btn')}>
                        <Plus size={18} /> <span className="hide-on-mobile">{t('breeding_page.add_mare_btn')}</span>
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <Card className="text-center p-6 bg-white dark:bg-slate-800">
                    <div className="text-3xl font-bold text-blue-500 mb-1">{mares.length}</div>
                    <div className="text-gray-500 dark:text-gray-400">{t('breeding_page.stats.mares')}</div>
                </Card>
                <Card className="text-center p-6 bg-white dark:bg-slate-800">
                    <div className="text-3xl font-bold text-green-500 mb-1">{mares.filter(m => m.status === 'Gestante').length}</div>
                    <div className="text-gray-500 dark:text-gray-400">{t('breeding_page.stats.pregnant')}</div>
                </Card>
                <Card className="text-center p-6 bg-white dark:bg-slate-800">
                    <div className="text-3xl font-bold text-pink-500 mb-1">
                        {mares.filter(m => m.status === 'Gestante' && m.termDate && new Date(m.termDate).getFullYear() === new Date().getFullYear()).length}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">{t('breeding_page.stats.foals_expected')} {new Date().getFullYear()}</div>
                </Card>
            </div>

            {/* Planning Section */}
            {planning.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={20} color="#1890ff" /> {t('breeding_page.planning_title')}
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {planning.map(evt => (
                            <div key={evt.id} onClick={() => navigate(`/breeding/${evt.mareId}`)} className="min-w-[200px] p-4 rounded-xl cursor-pointer bg-white dark:bg-slate-800 border-l-4 shadow-sm border border-gray-100 dark:border-gray-700" style={{
                                borderLeftColor: evt.type.includes('Insemination') ? '#1890ff' :
                                    evt.type.includes('DG') || evt.type === 'Echographie' ? '#722ed1' :
                                        evt.type === 'Poulinage' ? '#eb2f96' : '#faad14'
                            }}>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    {new Date(evt.date).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })}
                                </div>
                                <div className="font-bold text-gray-900 dark:text-white mb-1">
                                    {evt.mareName} {evt.mareInternalNumber && <span className="text-pink-500 text-xs">#{evt.mareInternalNumber}</span>}
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    {evt.type}
                                </div>
                                {evt.note && <div className="text-xs text-gray-400 mt-1 italic">{evt.note}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {mares.map(mare => (
                    <Card key={mare.id} style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Header Section */}
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
                                    background: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    border: `3px solid ${getStatusColor(mare.status)}`
                                }}>
                                    <Heart size={24} color={getStatusColor(mare.status)} fill={getStatusColor(mare.status)} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="m-0 text-xl font-bold text-gray-900 dark:text-white break-words flex items-center gap-2">
                                        {mare.name} {mare.internalNumber && <span className="text-sm text-pink-500 bg-pink-50 dark:bg-pink-900/20 px-2 py-0.5 rounded-full">#{mare.internalNumber}</span>}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mt-2 text-sm">
                                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-medium">
                                            {mare.role === 'Poulinière' ? t('breeding_page.modal.roles.mare') : mare.role === 'Donneuse' ? t('breeding_page.modal.roles.donor') : mare.role === 'Porteuse' ? t('breeding_page.modal.roles.recipient') : mare.role}
                                        </span>
                                        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                            <Activity size={14} className="text-current" /> <strong style={{ color: getStatusColor(mare.status) }}>
                                                {mare.status === 'Vide' ? t('breeding_page.status.empty') :
                                                    mare.status === 'Inseminée' ? t('breeding_page.status.inseminated') :
                                                        mare.status === 'Gestante' ? t('breeding_page.status.pregnant') :
                                                            mare.status === 'Poulinage' ? t('breeding_page.status.foaling') : mare.status}
                                            </strong>
                                        </span>
                                    </div>
                                    {(mare.sire || mare.geneticDam) && (
                                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            {mare.sire && <span className="mr-3"><strong className="text-gray-400 dark:text-gray-500">P:</strong> {mare.sire}</span>}
                                            {mare.geneticDam && <span><strong className="text-gray-400 dark:text-gray-500">M:</strong> {mare.geneticDam}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Term Date (if exists) */}
                            {mare.termDate !== '-' && (
                                <div className="bg-gray-50 dark:bg-white/5 rounded-lg py-3 px-4 text-center mt-2 border border-gray-100 dark:border-white/10">
                                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('breeding_page.term_date')}</div>
                                    <div className="font-bold text-lg text-gray-800 dark:text-white">{new Date(mare.termDate).toLocaleDateString(i18n.language)}</div>
                                </div>
                            )}

                            {/* Actions - Responsive Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
                                <Button variant="secondary" style={{ fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => navigate(`/horses/${mare.id}`)} title={t('breeding_page.actions.profile')}>
                                    <FileText size={16} /> <span className="hide-on-mobile">{t('breeding_page.actions.profile')}</span>
                                </Button>
                                <Button variant="secondary" style={{ fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => navigate(`/horses/${mare.id}/care`)} title={t('breeding_page.actions.health')}>
                                    <Stethoscope size={16} /> <span className="hide-on-mobile">{t('breeding_page.actions.health')}</span>
                                </Button>
                                <Button style={{ fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => navigate(`/breeding/${mare.id}`)} title={t('breeding_page.actions.tracking')}>
                                    <SpermIcon size={18} /> <span className="hide-on-mobile">{t('breeding_page.actions.tracking')}</span>
                                </Button>
                                {canManageHorses() && (
                                    <Button
                                        variant="secondary"
                                        onClick={() => requestDeleteMare(mare)}
                                        style={{ padding: '0.5rem', color: '#ff4d4f', borderColor: '#ffccc7' }}
                                        title={t('breeding_page.actions.delete_tooltip')}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                )}
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setNewMare(mare);
                                        setEditingId(mare.id);
                                        setShowModal(true);
                                    }}
                                    style={{ padding: '0.5rem', color: '#1890ff', borderColor: '#91d5ff' }}
                                    title={t('breeding_page.actions.edit_tooltip')}
                                >
                                    <Edit2 size={16} />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Payment Modal (Add-on) */}
            {showPaymentModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ width: '90%', maxWidth: '400px', padding: '2rem', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} className="animate-fade-in-up">
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <Plus size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#1f2937' }}>
                            {t('breeding_page.payment_modal.title')}
                        </h3>
                        <p style={{ color: '#4b5563', marginBottom: '1.5rem', fontSize: '1rem' }}>
                            {t('breeding_page.payment_modal.limit_reached')}
                        </p>
                        <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>{t('breeding_page.payment_modal.add_one_mare')}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#4f46e5' }}>{paymentDetails.price}</div>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>{paymentDetails.type}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <Button
                                onClick={handlePaymentSuccess}
                                style={{
                                    background: '#4f46e5',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem',
                                    fontWeight: 700,
                                    fontSize: '1rem'
                                }}
                            >
                                {t('breeding_page.payment_modal.pay_btn')} {paymentDetails.price}
                            </Button>
                            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                                {t('breeding_page.payment_modal.cancel')}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}


            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.01)', // Quasi invisible mais présent pour intercepter les clics
                    backdropFilter: 'none',
                    zIndex: 1000,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', // Alignement haut avec marge
                    paddingTop: '20px' // Descend la pop-up à ~12% du haut de l'écran
                }}>
                    <Card style={{
                        width: '90%', maxWidth: '500px',
                        maxHeight: 'calc(100vh - 40px)', // Un peu moins haut vue la marge en haut
                        overflowY: 'auto', // Scroll DANS la fenêtre si nécessaire
                        margin: '0 auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', // Grosse ombre pour bien détacher
                        border: '1px solid rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{editingId ? t('breeding_page.modal.title_edit') : t('breeding_page.modal.title_add')}</h3>

                        {/* Camera Overlay */}
                        {showScanningCamera && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'black', zIndex: 1100, display: 'flex', flexDirection: 'column' }}>
                                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay playsInline />
                                <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                                    <Button variant="secondary" onClick={stopScanning} disabled={isAnalyzing}>
                                        <X size={32} />
                                    </Button>
                                    <Button onClick={captureAndProcess} disabled={isAnalyzing} style={{ width: '80px', height: '80px', borderRadius: '50%', background: isAnalyzing ? '#ccc' : 'white', border: '4px solid rgba(255,255,255,0.5)', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {isAnalyzing && <Activity className="animate-spin" color="#333" />}
                                    </Button>
                                </div>
                                <div style={{ position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '20%', border: isAnalyzing ? '2px solid yellow' : '2px dashed rgba(255,255,255,0.7)', borderRadius: '12px', pointerEvents: 'none' }}>
                                    <div style={{ position: 'absolute', top: '-30px', width: '100%', textAlign: 'center', color: 'white', fontWeight: 600 }}>{isAnalyzing ? "Analyse IA en cours..." : "Cadrer le carnet / page SIRE"}</div>
                                </div>
                            </div>
                        )}

                        {/* Loading Overlay Global */}
                        {isAnalyzing && !showScanningCamera && (
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(255,255,255,0.8)', zIndex: 10,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Activity className="animate-spin" size={48} color="#4f46e5" />
                                <div style={{ marginTop: '1rem', fontWeight: 600, color: '#4f46e5' }}>Lecture du document via IA...</div>
                            </div>
                        )}

                        {/* Boutons d'ajout rapide par scan - Uniquement en création */}
                        {!editingId && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', opacity: isAnalyzing ? 0.5 : 1, pointerEvents: isAnalyzing ? 'none' : 'auto' }}>
                                <Button variant="secondary" onClick={startScanning} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', gap: '0.5rem', height: 'auto' }}>
                                    <ScanLine size={32} color="#8b5cf6" />
                                    <span>Scanner Carnet</span>
                                </Button>
                                <label htmlFor="upload-carnet" className="btn-secondary" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', gap: '0.5rem', height: 'auto', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', background: 'white', justifyContent: 'center' }}>
                                    <Upload size={32} color="#10b981" />
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Importer Photo</span>
                                    <input type="file" id="upload-carnet" accept="image/*" style={{ display: 'none' }} onChange={handleFileScan} disabled={isAnalyzing} />
                                </label>
                            </div>
                        )}

                        <form onSubmit={handleAddMare} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('breeding_page.modal.role_label')}</label>
                                <select
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white', color: '#333' }}
                                    value={newMare.role || 'Poulinière'}
                                    onChange={e => setNewMare({ ...newMare, role: e.target.value })}
                                >
                                    <option value="Poulinière">{t('breeding_page.modal.roles.mare')}</option>
                                    <option value="Porteuse">{t('breeding_page.modal.roles.recipient')}</option>
                                    <option value="Donneuse">{t('breeding_page.modal.roles.donor')}</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('breeding_page.modal.name_label')}</label>
                                <input
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                    value={newMare.name}
                                    onChange={e => setNewMare({ ...newMare, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('breeding_page.modal.internal_number_label')}</label>
                                <input
                                    placeholder="Ex: 12"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                    value={newMare.internalNumber}
                                    onChange={e => setNewMare({ ...newMare, internalNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('breeding_page.modal.status_label')}</label>
                                <select
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white', color: '#333' }}
                                    value={newMare.status}
                                    onChange={e => setNewMare({ ...newMare, status: e.target.value })}
                                >
                                    <option value="Vide">{t('breeding_page.modal.statuses.empty')}</option>
                                    <option value="Inseminée">{t('breeding_page.modal.statuses.inseminated')}</option>
                                    <option value="Gestante">{t('breeding_page.modal.statuses.pregnant')}</option>
                                    <option value="Poulinage">{t('breeding_page.modal.statuses.foaling')}</option>
                                </select>
                            </div>

                            {/* Genetics: Show for Pregnant/Insem OR if Recipient (Porteuse) */}
                            {(newMare.status !== 'Vide' || newMare.role === 'Porteuse') && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex flex-col gap-4 border border-gray-100 dark:border-gray-700">
                                    <div>
                                        <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
                                            {newMare.role === 'Porteuse' ? t('breeding_page.modal.bio_sire_label') : t('breeding_page.modal.sire_label')}
                                        </label>
                                        <input
                                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                                            value={newMare.sire}
                                            onChange={e => setNewMare({ ...newMare, sire: e.target.value })}
                                            placeholder={newMare.role === 'Porteuse' ? "Ex: Chacco Blue" : "Ex: Baloubet du Rouet"}
                                        />
                                    </div>

                                    {newMare.role === 'Porteuse' && (
                                        <div>
                                            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">{t('breeding_page.modal.bio_dam_label')}</label>
                                            <input
                                                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                                                value={newMare.geneticDam || ''}
                                                onChange={e => setNewMare({ ...newMare, geneticDam: e.target.value })}
                                                placeholder="Ex: Gatoucha"
                                            />
                                        </div>
                                    )}

                                    {newMare.status !== 'Vide' && (
                                        <div>
                                            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">{t('breeding_page.modal.term_date_label')}</label>
                                            <input
                                                type="date"
                                                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                                                value={newMare.termDate}
                                                onChange={e => setNewMare({ ...newMare, termDate: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="secondary" onClick={() => { setShowModal(false); setEditingId(null); setNewMare({ name: '', internalNumber: '', role: 'Poulinière', status: 'Vide', sire: '', geneticDam: '', termDate: '' }); }} style={{ flex: 1 }}>{t('breeding_page.modal.cancel')}</Button>
                                <Button type="submit" style={{ flex: 1 }}>{editingId ? t('breeding_page.modal.save') : t('breeding_page.modal.add')}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ width: '90%', maxWidth: '450px', padding: '2rem', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <Activity size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#1f2937' }}>
                            {t('breeding_page.upgrade_modal.title')}
                        </h3>
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                            <Trans i18nKey="breeding_page.upgrade_modal.limit_desc" components={{ strong: <strong /> }} />
                        </p>
                        <p style={{ color: '#4b5563', marginBottom: '2rem', fontSize: '0.95rem' }}>
                            <Trans i18nKey="breeding_page.upgrade_modal.benefits_desc" components={{ strong: <strong /> }} />
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Button
                                onClick={() => navigate('/settings')}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white', border: 'none', padding: '0.8rem',
                                    fontWeight: 600, fontSize: '1rem'
                                }}
                            >
                                {t('breeding_page.upgrade_modal.cta_button')}
                            </Button>
                            <Button variant="secondary" onClick={() => setShowUpgradeModal(false)}>
                                {t('breeding_page.upgrade_modal.cancel_button')}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {mareToDelete && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ width: '90%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <Trash2 size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#1f2937' }}>{t('breeding_page.delete_modal.title')}</h3>
                        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                            <Trans i18nKey="breeding_page.delete_modal.confirm_text" values={{ name: mareToDelete.name }} components={{ strong: <strong /> }} /><br />
                            {t('breeding_page.delete_modal.warning_text')}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button variant="secondary" onClick={() => setMareToDelete(null)} style={{ flex: 1 }}>
                                {t('breeding_page.delete_modal.cancel')}
                            </Button>
                            <Button
                                onClick={confirmDeleteMare}
                                style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none' }}
                            >
                                {t('breeding_page.delete_modal.confirm')}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Breeding;
