import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import Card from '../components/Card';
import Button from '../components/Button';
import { Plus, User, Activity, Heart, X, Upload, Camera, Search, Trash2, Zap } from 'lucide-react';
import { getMaxHorses, getUserPlanIds, canManageHorses } from '../utils/permissions';
import { startCheckoutSession } from '../utils/stripePayment';
import { useAuth } from '../context/AuthContext';
import { syncHorsesToFirestore, fetchHorsesFromFirestore } from '../services/dataSyncService';
import { useTranslation, Trans } from 'react-i18next';

// Helper to resize images
const resizeImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_WIDTH = 1024; // Reasonable max width for web
            const MAX_HEIGHT = 1024;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', 0.8)); // 80% quality JPEG
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

// Reusable Horse Card
const HorseCard = ({ horse, onUpdateImage, onUpdatePosition, onRequestDelete, navigate }) => {
    const { t } = useTranslation();
    const [isHovered, setIsHovered] = useState(false);
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [positionY, setPositionY] = useState(horse.imagePosition ? parseInt(horse.imagePosition.split(' ')[1]) : 50);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            resizeImage(file, (resizedDataUrl) => {
                onUpdateImage(horse.id, resizedDataUrl);
            });
        }
    };

    const handlePositionChange = (e) => {
        const newY = e.target.value;
        setPositionY(newY);
        if (onUpdatePosition) {
            onUpdatePosition(horse.id, `center ${newY}%`);
        }
    };

    return (
        <Card
            className="hover-card"
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '0',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {/* Header / Image Placeholder */}
            <div
                style={{
                    height: '200px',
                    background: '#f0f0f0',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => { setIsHovered(false); setIsAdjusting(false); }}
            >
                {/* Delete Button */}
                {!isAdjusting && canManageHorses() && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRequestDelete(horse);
                        }}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#ff4d4f',
                            zIndex: 20,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}
                        title={t('horses_page.delete')}
                    >
                        <Trash2 size={18} />
                    </button>
                )}
                {/* Hidden Inputs */}
                <input
                    id={`horse-file-${horse.id}`}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                />

                {/* Input for Camera (Mobile PWA feature) */}
                <input
                    id={`horse-cam-${horse.id}`}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                />

                <div style={{ width: '100%', height: '100%' }}>
                    {horse.image ? (
                        <img
                            src={horse.image}
                            alt={horse.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: horse.imagePosition || 'center 50%'
                            }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                            🐴
                        </div>
                    )}
                </div>

                {/* Adjustment Slider Overlay */}
                {isAdjusting && (
                    <div style={{
                        position: 'absolute', top: 0, bottom: 0, right: 0, width: '40px',
                        background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 20
                    }}>
                        <input
                            type="range" min="0" max="100"
                            orient="vertical" // Firefox
                            style={{
                                writingMode: 'bt-lr', /* IE */
                                WebkitAppearance: 'slider-vertical', /* WebKit */
                                width: '8px', height: '150px'
                            }}
                            value={positionY}
                            onChange={handlePositionChange}
                            title={t('horses_page.crop_center')}
                        />
                    </div>
                )}

                {/* Hover Overlay Buttons */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: isAdjusting ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '1rem',
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.2s',
                    pointerEvents: isHovered ? 'auto' : 'none',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <label
                            htmlFor={`horse-file-${horse.id}`}
                            className="glass-panel"
                            style={{
                                cursor: 'pointer',
                                padding: '0.8rem',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'white',
                                color: '#333',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                            title={t('horses_page.upload_photo')}
                        >
                            <Upload size={20} />
                        </label>

                        <label
                            htmlFor={`horse-cam-${horse.id}`}
                            className="glass-panel"
                            style={{
                                cursor: 'pointer',
                                padding: '0.8rem',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'white',
                                color: '#333',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                            title={t('horses_page.take_photo')}
                        >
                            <Camera size={20} />
                        </label>
                        <button
                            onClick={() => setIsAdjusting(true)}
                            className="glass-panel"
                            style={{ cursor: 'pointer', padding: '0.8rem', borderRadius: '50%', background: 'white', color: '#333', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                            title={t('horses_page.crop_center')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" /><polyline points="15 19 12 22 9 19" /><polyline points="19 15 22 12 19 9" /><circle cx="12" cy="12" r="3" /></svg>
                        </button>
                    </div>

                    <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{t('horses_page.edit_photo')}</span>
                </div>
            </div>

            {/* Card Content */}
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{horse.name}</h3>
                    <span style={{
                        background: horse.gender === 'F' ? '#fce7f3' : '#e0f2fe',
                        color: horse.gender === 'F' ? '#db2777' : '#0284c7',
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600
                    }}>
                        {horse.gender === 'F' ? t('horses_page.gender.mare') : (horse.gender === 'M' ? t('horses_page.gender.stallion') : t('horses_page.gender.gelding'))}
                    </span>
                </div>

                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {horse.breed} • {horse.age} ans • {horse.color}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <Button
                        variant="secondary"
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                        onClick={() => navigate(`/horses/${horse.id}`)}
                    >
                        <Activity size={16} /> {t('profile')}
                    </Button>
                    <Button
                        variant="secondary"
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                        onClick={() => navigate(`/horses/${horse.id}/care`)}
                    >
                        <Heart size={16} /> {t('care')}
                    </Button>
                </div>
            </div>
        </Card>
    );
};


const Horses = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { currentUser } = useAuth();

    // Default Data - Cleared for production feel / clean start
    const defaultHorses = [];

    const [horses, setHorses] = useState(() => {
        const saved = localStorage.getItem('my_horses_v4');
        return saved ? JSON.parse(saved) : defaultHorses;
    });

    // Chargement Cloud au démarrage si connecté (Hybride)
    useEffect(() => {
        if (currentUser) {
            fetchHorsesFromFirestore(currentUser.uid).then(cloudHorses => {
                // Stratégie simple : Le Cloud gagne s'il a des données, sinon on garde le local (ou on merge)
                // Pour l'instant, si Cloud > 0, on remplace le local.
                // Idéalement, on devrait merger par date de modif, mais restons simple.
                if (cloudHorses && cloudHorses.length > 0) {
                    console.log("📥 Mise à jour chevaux depuis le Cloud");
                    setHorses(cloudHorses);
                    // Update local storage too to keep sync
                    localStorage.setItem('my_horses_v4', JSON.stringify(cloudHorses));
                } else if (horses.length > 0) {
                    // Si Cloud vide mais Local plein -> C'est la première sync -> On pousse vers Cloud
                    console.log("📤 Première synchronisation vers le Cloud...");
                    syncHorsesToFirestore(currentUser.uid, horses);
                }
            });
        }
    }, [currentUser]); // Run once on user load

    const [showModal, setShowModal] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    // ... states ...

    // Reste des states existants (newHorse, preview, etc)
    const [newHorse, setNewHorse] = useState({
        name: '', breed: '', age: '', color: '', gender: 'H', image: null, origin: '', ueln: '', sireNumber: '',
        pedigree: { sire: '', dam: '', ss: '', sd: '', ds: '', dd: '' }
    });
    const [preview, setPreview] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [horseToDelete, setHorseToDelete] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showExtraSlotModal, setShowExtraSlotModal] = useState(false);
    const [upgradeType, setUpgradeType] = useState('passion');

    const filteredHorses = horses.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.breed && h.breed.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleRequestDelete = (horse) => {
        setHorseToDelete(horse);
    };

    const confirmDelete = () => {
        if (horseToDelete) {
            const updated = horses.filter(h => h.id !== horseToDelete.id);
            setHorses(updated);
            setHorseToDelete(null);
            // Sync immédiate lors d'une suppression
            if (currentUser) syncHorsesToFirestore(currentUser.uid, updated);
        }
    };

    // Sauvegarde automatique (Local + Cloud)
    useEffect(() => {
        localStorage.setItem('my_horses_v4', JSON.stringify(horses));
        if (currentUser && horses.length > 0) {
            // Debounce idéalement, mais ici direct pour simplicité (optimisation future possible)
            syncHorsesToFirestore(currentUser.uid, horses);
        }
    }, [horses, currentUser]);

    // Handle Extra Slot Payment Success
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('extra_slot') === 'success') {
            // Increment extra slot count locally
            const currentExtra = parseInt(localStorage.getItem('extraHorses') || '0');
            localStorage.setItem('extraHorses', (currentExtra + 1).toString());

            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);

            alert(t('horses_page.extra_slot_modal.success_alert'));
            // Reload to reflect permissions update
            window.location.reload();
        }
    }, []);

    const handleUpdateImage = (id, newImage) => {
        const updatedHorses = horses.map(h =>
            h.id === id ? { ...h, image: newImage } : h
        );
        setHorses(updatedHorses);
    };

    const handleUpdatePosition = (id, newPosition) => {
        const updatedHorses = horses.map(h =>
            h.id === id ? { ...h, imagePosition: newPosition } : h
        );
        setHorses(updatedHorses);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            resizeImage(file, (resizedDataUrl) => {
                setPreview(resizedDataUrl);
                setNewHorse({ ...newHorse, image: resizedDataUrl });
            });
        }
    };

    const handleAddHorse = (e) => {
        e.preventDefault();
        const horseToAdd = {
            id: Date.now(),
            ...newHorse,
            age: parseInt(newHorse.age) || 0
        };
        console.log('🐴 [Horses] Ajout d\'un nouveau cheval:', horseToAdd);
        console.log('🔍 [Horses] SIRE Number dans newHorse:', newHorse.sireNumber);
        console.log('🔍 [Horses] SIRE Number dans horseToAdd:', horseToAdd.sireNumber);
        setHorses([horseToAdd, ...horses]);

        // Auto-Register: Entry Movement
        if (newHorse.origin) {
            const newMovement = {
                id: Date.now() + 1,
                date: new Date().toISOString(),
                type: 'ENTRÉE',
                horseName: newHorse.name,
                reason: 'Arrivée / Nouveau',
                origin: newHorse.origin
            };
            const existingMovements = JSON.parse(localStorage.getItem('appHorse_register_movements') || '[]');
            localStorage.setItem('appHorse_register_movements', JSON.stringify([newMovement, ...existingMovements]));
        }

        // Auto-add to Breeding (Gyneco) if Mare and User is Breeder
        if (newHorse.gender === 'F') {
            const plans = getUserPlanIds();
            const isBreeder = plans.some(p => ['eleveur', 'eleveur_amateur_free', 'eleveur_amateur_paid'].includes(p));

            if (isBreeder) {
                try {
                    const breedingMares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');
                    // Avoid duplicates
                    if (!breedingMares.find(m => m.id === horseToAdd.id)) {
                        const newMare = {
                            ...horseToAdd,
                            status: 'pouliniere',
                            inFoal: false,
                            dueDate: null,
                            lastFoalDate: null,
                            sire: ''
                        };
                        localStorage.setItem('appHorse_breeding_v2', JSON.stringify([...breedingMares, newMare]));
                    }
                } catch (err) {
                    console.error("Auto-add to breeding failed", err);
                }
            }
        }

        setShowModal(false);
        setNewHorse({
            name: '', breed: '', age: '', color: '', gender: 'H', image: null, origin: '', ueln: '', sireNumber: '',
            pedigree: { sire: '', dam: '', ss: '', sd: '', ds: '', dd: '' }
        });
        setPreview(null);
        setPreview(null);
    };

    const handleOpenModal = () => {
        const max = getMaxHorses();
        if (horses.length >= max) {
            const plans = getUserPlanIds();

            // If on 'decouverte' (Free) plan -> Propose Upgrade to Passion
            if (plans.includes('decouverte') && plans.length === 1) {
                setUpgradeType('passion');
                setShowUpgradeModal(true);
                return;
            }

            // If on 'eleveur_amateur_free' -> Propose Upgrade to Passion Élevage
            if (plans.includes('eleveur_amateur_free') && plans.length === 1) {
                setUpgradeType('breeding');
                setShowUpgradeModal(true);
                return;
            }

            // If on 'start' or 'pro' -> Propose +1 Extra Slot for 2€
            if (plans.includes('start') || plans.includes('pro')) {
                setShowExtraSlotModal(true);
                return;
            }

            // Otherwise (Legacy / Unknown Limit) -> Redirect
            if (window.confirm(`${t('horses_page.limit_reached.title')}\n\n${t('horses_page.limit_reached.desc')}\n\n${t('horses_page.limit_reached.see_offers')}`)) {
                navigate('/settings');
            }
            return;
        }
        setShowModal(true);
    };

    const handleBuyExtraSlot = async () => {
        // TODO: Remplacer par le vrai Price ID de votre produit "Cheval Supplémentaire (2€)" dans Stripe
        // ex: const PRICE_ID = "price_1Qxxxxxxxxxxxx";
        const PRICE_ID = "price_UPDATE_ME_IN_CODE";

        if (PRICE_ID === "price_UPDATE_ME_IN_CODE") {
            // alert("Oups ! ...");
            // console.error("...");
            return;
        }

        // Trigger Checkout with specific success path
        await startCheckoutSession(PRICE_ID, '/horses?extra_slot=success');
    };

    // confirmExtraSlot removed

    return (
        <div className="animate-fade-in" style={{ position: 'relative' }}>
            <SEO title={`${t('page_titles.horses')} - Equinox`} description="Gérez votre écurie, fiches chevaux et documents administratifs sur Equinox." />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                    <input
                        placeholder={t('horses_page.search_placeholder')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.4rem',
                            borderRadius: '20px', border: '1px solid #ddd', outline: 'none',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
                {canManageHorses() && (
                    <Button onClick={handleOpenModal} title={t('horses_page.add_button')}>
                        <Plus size={18} /> <span className="hide-on-mobile">{t('horses_page.add_button')}</span>
                    </Button>
                )}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '2rem'
            }}>
                {filteredHorses.map(horse => (
                    <HorseCard
                        key={horse.id}
                        horse={horse}
                        onUpdateImage={handleUpdateImage}
                        onUpdatePosition={handleUpdatePosition}
                        onRequestDelete={handleRequestDelete}
                        navigate={navigate}
                    />
                ))}
                {filteredHorses.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#999' }}>
                        {t('horses_page.no_results', { query: searchTerm })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0)', zIndex: 9999,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: '2vh'
                }}>
                    <Card style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{t('horses_page.modal.title')}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* OCR Feature */}
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#e6f7ff', borderRadius: '12px', border: '1px dashed #1890ff', textAlign: 'center' }}>
                            <input
                                id="scan-doc"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                    if (e.target.files[0]) {
                                        setIsScanning(true);

                                        try {
                                            // Import dynamique de la fonction d'analyse
                                            const { analyzeHorseDocument, imageToBase64 } = await import('../utils/documentAnalysis');

                                            // Convertir l'image en base64
                                            const base64Image = await imageToBase64(e.target.files[0]);

                                            // Analyser le document avec Gemini
                                            const result = await analyzeHorseDocument(base64Image);

                                            setIsScanning(false);

                                            if (result.success && result.data) {
                                                // Appliquer les données extraites (uniquement si non-null)
                                                setNewHorse(prev => ({
                                                    ...prev,
                                                    name: result.data.name || prev.name,
                                                    breed: result.data.breed || prev.breed,
                                                    age: result.data.age || prev.age,
                                                    color: result.data.color || prev.color,
                                                    gender: result.data.gender || prev.gender,
                                                    ueln: result.data.ueln || prev.ueln,
                                                    sireNumber: result.data.sireNumber || prev.sireNumber,
                                                    pedigree: {
                                                        ...prev.pedigree,
                                                        sire: result.data.pedigree?.sire || prev.pedigree?.sire || '',
                                                        dam: result.data.pedigree?.dam || prev.pedigree?.dam || '',
                                                        ds: result.data.pedigree?.ds || prev.pedigree?.ds || ''
                                                    }
                                                }));

                                                // Compter les champs remplis
                                                const filledFields = Object.values(result.data).filter(v => v !== null).length;

                                                if (filledFields > 0) {
                                                    alert(`✅ Cortex Vision : ${filledFields} information${filledFields > 1 ? 's' : ''} extraite${filledFields > 1 ? 's' : ''} du livret !\n\nVérifiez et complétez les champs si nécessaire.`);
                                                } else {
                                                    alert("⚠️ Cortex Vision : Aucune information n'a pu être extraite.\n\nAssurez-vous que l'image est claire et montre bien le carnet d'identification.");
                                                }
                                            } else {
                                                alert(`❌ Erreur Cortex Vision :\n\n${result.error || "Impossible d'analyser le document."}\n\nVeuillez réessayer avec une meilleure photo.`);
                                            }
                                        } catch (error) {
                                            setIsScanning(false);
                                            console.error("Erreur lors de l'analyse:", error);
                                            alert(`❌ Erreur inattendue :\n\n${error.message}\n\nVeuillez réessayer ou saisir manuellement les informations.`);
                                        }

                                        // Réinitialiser l'input pour permettre de rescanner
                                        e.target.value = '';
                                    }
                                }}
                            />
                            <label htmlFor="scan-doc" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#0050b3' }}>
                                {isScanning ? (
                                    <>
                                        <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid #ccc', borderTopColor: '#007AFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                        <span style={{ fontWeight: 600 }}>{t('horses_page.modal.processing')}</span>
                                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                                    </>
                                ) : (
                                    <>
                                        <Camera size={32} />
                                        <span style={{ fontWeight: 600 }}>{t('horses_page.modal.scan_doc')}</span>
                                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{t('horses_page.modal.photo_label')}</span>
                                    </>
                                )}
                            </label>
                        </div>

                        <div style={{ padding: '0 0.5rem 1rem 0.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#888', fontWeight: 600 }}>
                            {t('horses_page.modal.or_manual')}
                        </div>

                        <form onSubmit={handleAddHorse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            {/* Image Upload */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                <input
                                    id="horse-img-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    style={{ display: 'none' }}
                                />
                                <label
                                    htmlFor="horse-img-upload"
                                    style={{
                                        width: '120px', height: '120px', borderRadius: '50%',
                                        background: '#f0f0f0', border: '2px dashed #ccc',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', overflow: 'hidden', position: 'relative'
                                    }}
                                >
                                    {preview ? (
                                        <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ textAlign: 'center', color: '#888' }}>
                                            <Upload size={24} />
                                            <div style={{ fontSize: '0.8rem' }}>{t('horses_page.modal.photo_label')}</div>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <input
                                placeholder={t('horses_page.modal.name_placeholder')}
                                required
                                value={newHorse.name}
                                onChange={e => setNewHorse({ ...newHorse, name: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                            />

                            <input
                                placeholder={t('horses_page.modal.origin_placeholder')}
                                value={newHorse.origin}
                                onChange={e => setNewHorse({ ...newHorse, origin: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                            />


                            <input
                                placeholder={t('horses_page.modal.breed_placeholder')}
                                value={newHorse.breed}
                                onChange={e => setNewHorse({ ...newHorse, breed: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                            />

                            <input
                                placeholder={t('horses_page.modal.color_placeholder')}
                                value={newHorse.color}
                                onChange={e => setNewHorse({ ...newHorse, color: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                            />

                            <input
                                placeholder={t('horses_page.modal.age_placeholder')}
                                type="number"
                                value={newHorse.age}
                                onChange={e => setNewHorse({ ...newHorse, age: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                            />

                            <input
                                placeholder="Numéro UELN (ex: 250259600123456)"
                                value={newHorse.ueln}
                                onChange={e => setNewHorse({ ...newHorse, ueln: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                maxLength="15"
                            />

                            <input
                                placeholder="Numéro SIRE (ex: 1234567A)"
                                value={newHorse.sireNumber}
                                onChange={e => setNewHorse({ ...newHorse, sireNumber: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                            />

                            <select
                                value={newHorse.gender}
                                onChange={e => setNewHorse({ ...newHorse, gender: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                            >
                                <option value="H">{t('horses_page.gender.gelding')}</option>
                                <option value="M">{t('horses_page.gender.stallion')}</option>
                                <option value="F">{t('horses_page.gender.mare')}</option>
                            </select>

                            <Button type="submit" style={{ marginTop: '1rem' }}>
                                {t('common.add')}
                            </Button>

                        </form>
                    </Card>
                </div>,
                document.body
            )}

            {/* Custom Delete Confirmation Modal */}
            {horseToDelete && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ width: '90%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <Trash2 size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#1f2937' }}>{t('horses_page.delete_confirm_title')}</h3>
                        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                            <Trans i18nKey="horses_page.delete_confirm_desc" values={{ name: horseToDelete.name }} components={{ strong: <strong /> }} />
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button variant="secondary" onClick={() => setHorseToDelete(null)} style={{ flex: 1 }}>
                                {t('horses_page.cancel')}
                            </Button>
                            <Button
                                onClick={confirmDelete}
                                style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none' }}
                            >
                                {t('horses_page.delete')}
                            </Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}



            {/* Upgrade Modal */}
            {showUpgradeModal && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ width: '90%', maxWidth: '450px', padding: '2rem', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <Activity size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#1f2937' }}>
                            {upgradeType === 'breeding' ? t('horses_page.upgrade_modal.title_breeding') : t('horses_page.upgrade_modal.title_general')}
                        </h3>
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                            <Trans i18nKey={upgradeType === 'breeding' ? "horses_page.upgrade_modal.desc_limited_breeding" : "horses_page.upgrade_modal.desc_limited_general"} components={{ strong: <strong /> }} />
                        </p>
                        <p style={{ color: '#4b5563', marginBottom: '2rem', fontSize: '0.95rem' }}>
                            {upgradeType === 'breeding'
                                ? t('horses_page.upgrade_modal.benefits_breeding')
                                : t('horses_page.upgrade_modal.benefits_general')
                            }
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
                                {t('horses_page.upgrade_modal.discover_btn', { plan: upgradeType === 'breeding' ? "Passion Élevage" : "Passion" })}
                            </Button>
                            <Button variant="secondary" onClick={() => setShowUpgradeModal(false)}>
                                {t('horses_page.upgrade_modal.no_thanks')}
                            </Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}

            {/* Extra Slot Modal (Start/Pro) */}
            {showExtraSlotModal && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ width: '90%', maxWidth: '450px', padding: '2rem', textAlign: 'center', position: 'relative' }}>
                        <button
                            onClick={() => setShowExtraSlotModal(false)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <X size={24} color="#999" />
                        </button>

                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <Zap size={32} fill="currentColor" />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#1f2937' }}>
                            {t('horses_page.extra_slot_modal.title')}
                        </h3>
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                            {t('horses_page.extra_slot_modal.desc')}
                        </p>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1ebbb4', margin: '0 0 0.5rem 0' }}>{t('horses_page.extra_slot_modal.option_title')}</h4>
                            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                                <Trans i18nKey="horses_page.extra_slot_modal.option_desc" components={{ strong: <strong /> }} />
                            </p>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
                                {t('horses_page.extra_slot_modal.price')} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#94a3b8' }}>{t('horses_page.extra_slot_modal.month')}</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleBuyExtraSlot}
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                background: '#2563eb',
                                padding: '1rem',
                                fontSize: '1.1rem'
                            }}
                        >
                            {t('horses_page.extra_slot_modal.btn')}
                        </Button>
                    </Card>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Horses;
