import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { ArrowLeft, Activity, Dna, Calendar, User, FileText, QrCode, Upload, Camera, Edit2, Save, X, ScanLine, Trash2, Utensils, MapPin, Image as ImageIcon, Scale } from 'lucide-react';
import { canEdit, canManageHorses } from '../utils/permissions';

// Helper to resize images
const resizeImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_WIDTH = 1024; // Largeur max raisonnable
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
            callback(canvas.toDataURL('image/jpeg', 0.8)); // Compression JPEG 80%
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

const HorseProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // In a real app, fetch horse by ID
    // For now, we mock data or retrieve from localStorage
    const [horse, setHorse] = useState(null);
    const [isHoveringImage, setIsHoveringImage] = useState(false);

    useEffect(() => {
        const savedHorses = localStorage.getItem('my_horses_v4');
        if (savedHorses) {
            const horses = JSON.parse(savedHorses);
            const found = horses.find(h => h.id.toString() === id);
            if (found) {
                // Use stored data only
                setHorse({
                    ...found,
                    // Provide empty defaults if missing
                    sire: found.sire || '-',
                    ueln: found.ueln || '-',
                    microchip: found.microchip || '-',
                    breeder: found.breeder || '-',
                    location: found.location || 'Écurie Principale',
                    owner: localStorage.getItem('user_name') || 'Cavalier',
                    birthDate: found.birthDate || '-',
                    height: found.height || '-',
                    pedigree: found.pedigree || { sire: '-', dam: '-', ss: '-', sd: '-', ds: '-', dd: '-' },
                    ration: found.ration || { morning: '', noon: '', evening: '', supplements: '', hay: '' }
                });
                return;
            }
        }
        // Fallback or mock if not found in list (e.g. direct url access to mock id 999)
        setHorse({
            id: id,
            name: 'Cheval Inconnu',
            breed: 'Inconnu',
            age: '?',
            color: '?',
            gender: '?',
            location: 'Écurie Principale',
            sire: '?',
            ueln: '?',
            microchip: '?',
            image: null,
            pedigree: { sire: '?', dam: '?', ss: '?', sd: '?', ds: '?', dd: '?' },
            ration: { morning: '', noon: '', evening: '', supplements: '', hay: '' }
        });
    }, [id]);

    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);

    useEffect(() => {
        if (!id) return;

        // Custom Events
        const custom = JSON.parse(localStorage.getItem('appHorse_customEvents') || '[]');

        // Care Items (checking v2 as per Calendar)
        const care = JSON.parse(localStorage.getItem('appHorse_careItems_v2') || '[]');

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Upcoming
        const myEvents = custom
            .filter(e => String(e.horseId) === String(id) && !e.completed)
            .map(e => ({ ...e, source: 'planning', dateObj: new Date(e.dateStr) }));

        // History
        const myHistoryEvents = custom
            .filter(e => String(e.horseId) === String(id) && (e.completed || new Date(e.dateStr) < now))
            .map(e => ({ ...e, source: 'planning', dateObj: new Date(e.dateStr) }));

        const myCare = care
            .filter(c => String(c.horseId) === String(id))
            .map(c => ({
                id: `care-${c.id}`,
                title: c.name || c.type,
                dateStr: c.date,
                dateObj: new Date(c.date),
                type: 'care',
                source: 'veterinary'
            }));

        // Filter Care into Upcoming vs History
        const upcomingCare = myCare.filter(c => c.dateObj >= now);
        const historyCare = myCare.filter(c => c.dateObj < now);

        const allUpcoming = [...myEvents.filter(e => e.dateObj >= now), ...upcomingCare]
            .sort((a, b) => a.dateObj - b.dateObj);

        const allHistory = [...myHistoryEvents, ...historyCare]
            .sort((a, b) => b.dateObj - a.dateObj); // Newest first

        setUpcomingEvents(allUpcoming);
        setPastEvents(allHistory);
    }, [id]);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    // Sync Edit Form when horse data loads
    useEffect(() => {
        if (horse) {
            setEditForm(horse);
        }
    }, [horse]);

    const handleImageUpdate = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Utilisation de resizeImage pour compresser et redimensionner
            resizeImage(file, (resizedDataUrl) => {
                const newImage = resizedDataUrl;
                // Update Local State
                const updatedHorse = { ...horse, image: newImage };
                setHorse(updatedHorse);
                setEditForm(prev => ({ ...prev, image: newImage }));

                // Update Local Storage Global List
                const savedHorses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
                const updatedHorses = savedHorses.map(h =>
                    h.id.toString() === id ? updatedHorse : h
                );
                localStorage.setItem('my_horses_v4', JSON.stringify(updatedHorses));
            });
        }
    };

    const handleSave = () => {
        // Auto-Register: Detect Location Change
        if (horse && editForm.location && horse.location !== editForm.location) {
            const newMovement = {
                id: Date.now(),
                date: new Date().toISOString(), // Register DATE
                type: 'MOUVEMENT', // Or TRANSFERT
                horseName: editForm.name,
                reason: 'Changement de Lieu',
                origin: `De ${horse.location} vers ${editForm.location}`
            };

            const existingMovements = JSON.parse(localStorage.getItem('appHorse_register_movements') || '[]');
            localStorage.setItem('appHorse_register_movements', JSON.stringify([newMovement, ...existingMovements]));

            // Optional: User feedback? "Mouvement enregistré dans le registre"
        }

        // Save to State
        setHorse(editForm);

        // Save to LocalStorage
        const savedHorses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const exists = savedHorses.find(h => h.id.toString() === id);

        let updatedHorses;
        if (exists) {
            updatedHorses = savedHorses.map(h => h.id.toString() === id ? editForm : h);
        } else {
            // Create new if not exists (unlikely in this flow but good for robustness)
            updatedHorses = [...savedHorses, editForm];
        }

        localStorage.setItem('my_horses_v4', JSON.stringify(updatedHorses));
        setIsEditing(false);
        // Toast/Feedback could go here
    };

    const [showScanningCamera, setShowScanningCamera] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const videoRef = React.useRef(null);

    const startScanning = () => {
        setShowScanningCamera(true);
        setCameraError(null);
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
                    setCameraError("Impossible d'accéder à la caméra. Vérifiez les autorisations.");
                });
        }
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [showScanningCamera]);

    const captureAndProcess = () => {
        if (!videoRef.current) return;

        // Flash animation or effect could go here

        // Mock processing delay
        stopScanning();
        alert("Analyse de la photo en cours...");

        setTimeout(() => {
            setEditForm(prev => ({
                ...prev,
                ueln: '250001' + Math.floor(Math.random() * 1000000000),
                microchip: '981' + Math.floor(Math.random() * 1000000000000),
                sire: Math.floor(Math.random() * 100000) + 'X',
                color: 'Bai',
                gender: 'H'
            }));
            alert("Données extraites avec succès !");
        }, 1000);
    };

    const handleDelete = () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce cheval ? Cette action est irréversible.")) {
            const savedHorses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
            const updatedHorses = savedHorses.filter(h => h.id.toString() !== id);
            localStorage.setItem('my_horses_v4', JSON.stringify(updatedHorses));
            navigate('/horses');
        }
    };

    if (!horse) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>

            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <Button variant="secondary" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>
                        {isEditing ? 'Modification' : 'Livret du Cheval'}
                    </h2>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {isEditing ? (
                        <>
                            <Button onClick={startScanning} className="gap-2 bg-purple-100 text-purple-700 hover:bg-purple-200">
                                <ScanLine size={18} /> Scanner Photo
                            </Button>

                            <Button variant="secondary" onClick={() => { setIsEditing(false); setEditForm(horse); }}>
                                <X size={18} /> Annuler
                            </Button>
                            <Button onClick={handleSave} className="bg-green-500 hover:bg-green-600">
                                <Save size={18} /> Enregistrer
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="secondary" onClick={() => navigate(`/horses/${id}/weight`)}>
                                <Scale size={18} style={{ marginRight: '6px' }} /> Suivi du Poids
                            </Button>
                            <Button variant="secondary" onClick={() => navigate(`/horses/${id}/nutrition`)}>
                                <Utensils size={18} style={{ marginRight: '6px' }} /> Calculateur de Ration
                            </Button>
                            <Button variant="secondary" onClick={() => navigate(`/horse/${id}/media`)}>
                                <ImageIcon size={18} style={{ marginRight: '6px' }} /> Galerie
                            </Button>
                            {canEdit('horse_profile') && (
                                <Button onClick={() => setIsEditing(true)}>
                                    <Edit2 size={18} /> Modifier
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="horse-profile-layout">
                <style>{`
                    @media (min-width: 768px) {
                        .horse-profile-layout {
                            grid-template-columns: 1fr 2fr !important;
                        }
                    }
                `}</style>

                {/* Left Column: Image & Key Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card style={{ padding: 0, overflow: 'hidden' }}>
                        <div
                            style={{ height: '300px', background: '#f0f0f0', position: 'relative' }}
                            onMouseEnter={() => setIsHoveringImage(true)}
                            onMouseLeave={() => setIsHoveringImage(false)}
                        >
                            {horse.image ? (
                                <img src={horse.image} alt={horse.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '4rem' }}>🐴</div>
                            )}

                            {/* Inputs */}
                            <input id="profile-upload" type="file" accept="image/*" onChange={handleImageUpdate} style={{ display: 'none' }} />
                            <input id="profile-cam" type="file" accept="image/*" capture="environment" onChange={handleImageUpdate} style={{ display: 'none' }} />

                            {/* Overlay */}
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                                opacity: isHoveringImage ? 1 : 0, transition: 'opacity 0.2s'
                            }}>
                                <label htmlFor="profile-upload" className="glass-panel" style={{ cursor: 'pointer', padding: '1rem', borderRadius: '50%', background: 'white', color: '#1890ff' }} title="Galerie">
                                    <Upload size={24} />
                                </label>
                                <label htmlFor="profile-cam" className="glass-panel" style={{ cursor: 'pointer', padding: '1rem', borderRadius: '50%', background: 'white', color: '#52c41a' }} title="Caméra">
                                    <Camera size={24} />
                                </label>
                            </div>
                        </div>
                        <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                            {isEditing ? (
                                <div className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <input
                                        style={{
                                            width: '100%', padding: '0.8rem', borderRadius: '12px',
                                            border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)',
                                            backdropFilter: 'blur(5px)', fontSize: '1.5rem', outline: 'none',
                                            fontFamily: 'var(--font-main)', fontWeight: '700', textAlign: 'center'
                                        }}
                                        onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = 'var(--color-primary)'; }}
                                        onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                                        value={editForm.name || ''}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        placeholder="Nom du cheval"
                                    />
                                    <input
                                        style={{
                                            width: '100%', padding: '0.6rem', borderRadius: '12px',
                                            border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)',
                                            backdropFilter: 'blur(5px)', fontSize: '1rem', outline: 'none',
                                            fontFamily: 'var(--font-main)', fontWeight: '600', textAlign: 'center', margin: '0 auto'
                                        }}
                                        onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = 'var(--color-primary)'; }}
                                        onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                                        value={editForm.breed || ''}
                                        onChange={e => setEditForm({ ...editForm, breed: e.target.value })}
                                        placeholder="Race"
                                    />
                                </div>
                            ) : (
                                <>
                                    <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{horse.name}</h3>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.25rem 0.75rem',
                                        background: 'rgba(0,122,255,0.1)',
                                        color: 'var(--color-primary)',
                                        borderRadius: '20px',
                                        fontWeight: 600
                                    }}>
                                        {horse.breed}
                                    </span>
                                </>
                            )}
                        </div>
                    </Card>

                    <Card title="Propriété">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <User size={24} color="var(--color-text-muted)" />
                                <div className="w-full">
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: isEditing ? '0.4rem' : '0' }}>Propriétaire</div>
                                    {isEditing ? (
                                        <input
                                            style={{
                                                width: '100%', padding: '0.8rem', borderRadius: '12px',
                                                border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)',
                                                backdropFilter: 'blur(5px)', fontSize: '1rem', outline: 'none',
                                                fontFamily: 'var(--font-main)'
                                            }}
                                            onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = 'var(--color-primary)'; }}
                                            onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                                            value={editForm.owner || ''}
                                            onChange={e => setEditForm({ ...editForm, owner: e.target.value })}
                                        />
                                    ) : (
                                        <div style={{ fontWeight: 600 }}>{horse.owner}</div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Activity size={24} color="var(--color-text-muted)" />
                                <div className="w-full">
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: isEditing ? '0.4rem' : '0' }}>Naisseur</div>
                                    {isEditing ? (
                                        <input
                                            style={{
                                                width: '100%', padding: '0.8rem', borderRadius: '12px',
                                                border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)',
                                                backdropFilter: 'blur(5px)', fontSize: '1rem', outline: 'none',
                                                fontFamily: 'var(--font-main)'
                                            }}
                                            onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = 'var(--color-primary)'; }}
                                            onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                                            value={editForm.breeder || ''}
                                            onChange={e => setEditForm({ ...editForm, breeder: e.target.value })}
                                        />
                                    ) : (
                                        <div style={{ fontWeight: 600 }}>{horse.breeder}</div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f0f0f0', gridColumn: '1 / -1' }}>
                                <MapPin size={24} color="var(--color-primary)" />
                                <div className="w-full">
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: isEditing ? '0.4rem' : '0' }}>Lieu de Détention</div>
                                    {isEditing ? (
                                        <input
                                            style={{
                                                width: '100%', padding: '0.8rem', borderRadius: '12px',
                                                border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)',
                                                backdropFilter: 'blur(5px)', fontSize: '1rem', outline: 'none',
                                                fontFamily: 'var(--font-main)'
                                            }}
                                            onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = 'var(--color-primary)'; }}
                                            onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                                            value={editForm.location || ''}
                                            onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                            placeholder="Ex: Écurie Principale, Pré des Saules..."
                                        />
                                    ) : (
                                        <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{horse.location || 'Non renseigné'}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {isEditing && canManageHorses() && (
                        <Button
                            onClick={handleDelete}
                            style={{
                                width: '100%',
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                                marginTop: '0.5rem'
                            }}
                        >
                            <Trash2 size={18} /> Supprimer le cheval
                        </Button>
                    )}
                </div>

                {/* Right Column: Detailed Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Upcoming Events */}
                    <Card title="Planning & Soins à venir" icon={Calendar}>
                        {upcomingEvents.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {upcomingEvents.map((e, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '0.8rem', background: '#f9fafb', borderRadius: '8px',
                                        borderLeft: `4px solid ${e.type === 'care' ? '#ef4444' : '#3b82f6'}`
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '50px' }}>
                                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#374151' }}>
                                                {e.dateObj.getDate()}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>
                                                {e.dateObj.toLocaleString('default', { month: 'short' })}
                                            </span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#111' }}>{e.title}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#666', display: 'flex', gap: '10px' }}>
                                                <span>{e.dateObj.getHours()}h{String(e.dateObj.getMinutes()).padStart(2, '0')}</span>
                                                {e.rider && <span>• {e.rider}</span>}
                                                {e.details && <span>• {e.details}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ fontStyle: 'italic', color: '#999', textAlign: 'center', padding: '1rem' }}>
                                Aucun événement programmé.
                            </div>
                        )}
                    </Card>

                    {/* History Card */}
                    <Card title="Historique & Journal" icon={FileText}>
                        {pastEvents.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto' }}>
                                {pastEvents.map((e, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '0.8rem', background: '#f9fafb', borderRadius: '8px',
                                        borderLeft: `4px solid ${e.type === 'care' ? '#ccc' : '#e5e7eb'}`,
                                        opacity: 0.8
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '50px' }}>
                                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#6b7280' }}>
                                                {e.dateObj.getDate()}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af' }}>
                                                {e.dateObj.toLocaleString('default', { month: 'short' })}
                                            </span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#374151' }}>{e.title}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'flex', gap: '10px' }}>
                                                {e.dateObj.getFullYear() !== new Date().getFullYear() && <span>{e.dateObj.getFullYear()}</span>}
                                                {e.rider && <span>• {e.rider}</span>}
                                                {e.details && <span>• {e.details}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ fontStyle: 'italic', color: '#999', textAlign: 'center', padding: '1rem' }}>
                                Aucun historique disponible.
                            </div>
                        )}
                    </Card>

                    {/* Rationing Card (Protected) */}
                    {(canEdit('horse_profile') || (horse.owner === (localStorage.getItem('user_name') || 'Cavalier'))) && (
                        <Card title="Alimentation & Rationnement" icon={Utensils}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {['morning', 'noon', 'evening', 'supplements'].map((key) => (
                                    <div key={key}>
                                        <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                                            {{ morning: 'Matin', noon: 'Midi', evening: 'Soir', supplements: 'Compléments' }[key]}
                                        </label>
                                        {isEditing ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {(Array.isArray(editForm.ration?.[key]) ? editForm.ration[key] : (editForm.ration?.[key] ? [editForm.ration[key]] : []))
                                                    .map((item, idx) => (
                                                        <div key={idx} style={{ display: 'flex', gap: '6px' }}>
                                                            <input
                                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px', color: '#333', backgroundColor: '#fff' }}
                                                                value={item}
                                                                onChange={e => {
                                                                    const oldVal = Array.isArray(editForm.ration?.[key]) ? editForm.ration[key] : (editForm.ration?.[key] ? [editForm.ration[key]] : []);
                                                                    const newVal = [...oldVal];
                                                                    newVal[idx] = e.target.value;
                                                                    setEditForm(prev => ({ ...prev, ration: { ...prev.ration, [key]: newVal } }));
                                                                }}
                                                                placeholder="Produit & Quantité..."
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const oldVal = Array.isArray(editForm.ration?.[key]) ? editForm.ration[key] : (editForm.ration?.[key] ? [editForm.ration[key]] : []);
                                                                    const newVal = oldVal.filter((_, i) => i !== idx);
                                                                    setEditForm(prev => ({ ...prev, ration: { ...prev.ration, [key]: newVal } }));
                                                                }}
                                                                style={{ padding: '0 8px', color: '#ef4444', border: '1px solid #fee2e2', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                <button
                                                    onClick={() => {
                                                        const oldVal = Array.isArray(editForm.ration?.[key]) ? editForm.ration[key] : (editForm.ration?.[key] ? [editForm.ration[key]] : []);
                                                        setEditForm(prev => ({ ...prev, ration: { ...prev.ration, [key]: [...oldVal, ''] } }));
                                                    }}
                                                    style={{ fontSize: '0.8rem', color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <Plus size={14} /> Ajouter un produit
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ fontWeight: 600 }}>
                                                {(Array.isArray(horse.ration?.[key]) ? horse.ration[key] : (horse.ration?.[key] ? [horse.ration[key]] : []))
                                                    .map((line, i) => (
                                                        <div key={i}>{line}</div>
                                                    ))}
                                                {(!horse.ration?.[key] || horse.ration[key].length === 0) && '-'}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Fourrage / Foin</label>
                                    {isEditing ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {(Array.isArray(editForm.ration?.hay) ? editForm.ration.hay : (editForm.ration?.hay ? [editForm.ration.hay] : []))
                                                .map((item, idx) => (
                                                    <div key={idx} style={{ display: 'flex', gap: '6px' }}>
                                                        <input
                                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px', color: '#333', backgroundColor: '#fff' }}
                                                            value={item}
                                                            onChange={e => {
                                                                const oldVal = Array.isArray(editForm.ration?.hay) ? editForm.ration.hay : (editForm.ration?.hay ? [editForm.ration.hay] : []);
                                                                const newVal = [...oldVal];
                                                                newVal[idx] = e.target.value;
                                                                setEditForm(prev => ({ ...prev, ration: { ...prev.ration, hay: newVal } }));
                                                            }}
                                                            placeholder="Ex: Foin à volonté"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const oldVal = Array.isArray(editForm.ration?.hay) ? editForm.ration.hay : (editForm.ration?.hay ? [editForm.ration.hay] : []);
                                                                const newVal = oldVal.filter((_, i) => i !== idx);
                                                                setEditForm(prev => ({ ...prev, ration: { ...prev.ration, hay: newVal } }));
                                                            }}
                                                            style={{ padding: '0 8px', color: '#ef4444', border: '1px solid #fee2e2', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            <button
                                                onClick={() => {
                                                    const oldVal = Array.isArray(editForm.ration?.hay) ? editForm.ration.hay : (editForm.ration?.hay ? [editForm.ration.hay] : []);
                                                    setEditForm(prev => ({ ...prev, ration: { ...prev.ration, hay: [...oldVal, ''] } }));
                                                }}
                                                style={{ fontSize: '0.8rem', color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Plus size={14} /> Ajouter
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ fontWeight: 600 }}>
                                            {(Array.isArray(horse.ration?.hay) ? horse.ration.hay : (horse.ration?.hay ? [horse.ration.hay] : []))
                                                .map((line, i) => (
                                                    <div key={i}>{line}</div>
                                                ))}
                                            {(!horse.ration?.hay || horse.ration.hay.length === 0) && '-'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Identity Card */}
                    <Card title="Signalement">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>

                            <div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Sexe</div>
                                {isEditing ? (
                                    <select
                                        style={{
                                            width: '100%', padding: '0.8rem', borderRadius: '12px',
                                            border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)',
                                            backdropFilter: 'blur(5px)', fontSize: '1rem', outline: 'none',
                                            fontFamily: 'var(--font-main)', cursor: 'pointer'
                                        }}
                                        onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = 'var(--color-primary)'; }}
                                        onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                                        value={editForm.gender || 'H'}
                                        onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                                    >
                                        <option value="H">Hongre</option>
                                        <option value="M">Mâle</option>
                                        <option value="F">Femelle</option>
                                    </select>
                                ) : (
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                        {horse.gender === 'F' ? 'Femelle' : (horse.gender === 'H' ? 'Hongre' : 'Mâle')}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Robe</div>
                                {isEditing ? (
                                    <input
                                        style={{
                                            width: '100%', padding: '0.8rem', borderRadius: '12px',
                                            border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)',
                                            backdropFilter: 'blur(5px)', fontSize: '1rem', outline: 'none',
                                            fontFamily: 'var(--font-main)'
                                        }}
                                        onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = 'var(--color-primary)'; }}
                                        onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                                        value={editForm.color || ''}
                                        onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                                    />
                                ) : (
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{horse.color}</div>
                                )}
                            </div>

                            <div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Taille</div>
                                {isEditing ? (
                                    <input
                                        style={{
                                            width: '100%', padding: '0.8rem', borderRadius: '12px',
                                            border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)',
                                            backdropFilter: 'blur(5px)', fontSize: '1rem', outline: 'none',
                                            fontFamily: 'var(--font-main)'
                                        }}
                                        onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = 'var(--color-primary)'; }}
                                        onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                                        value={editForm.height || ''}
                                        onChange={e => setEditForm({ ...editForm, height: e.target.value })}
                                        placeholder="ex: 1m65"
                                    />
                                ) : (
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{horse.height}</div>
                                )}
                            </div>

                            <div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Date de Naissance</div>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        style={{
                                            width: '100%', padding: '0.8rem', borderRadius: '12px',
                                            border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)',
                                            backdropFilter: 'blur(5px)', fontSize: '1rem', outline: 'none',
                                            fontFamily: 'var(--font-main)'
                                        }}
                                        onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = 'var(--color-primary)'; }}
                                        onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                                        value={editForm.birthDate || ''}
                                        onChange={e => setEditForm({ ...editForm, birthDate: e.target.value })}
                                    />
                                ) : (
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={18} /> {horse.birthDate} ({horse.age} ans)
                                    </div>
                                )}
                            </div>

                        </div>
                    </Card>

                    {/* Official Numbers (Moved UP) */}
                    <Card title="Identification Officielle">
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileText size={16} /> Numéro SIRE
                                </label>
                                {isEditing ? (
                                    <input
                                        style={{
                                            width: '100%', padding: '0.8rem', borderRadius: '12px',
                                            border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)',
                                            backdropFilter: 'blur(5px)', fontSize: '1rem', outline: 'none',
                                            fontFamily: 'monospace', fontWeight: '600'
                                        }}
                                        onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = 'var(--color-primary)'; }}
                                        onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                                        value={editForm.sire || ''}
                                        onChange={e => setEditForm({ ...editForm, sire: e.target.value })}
                                    />
                                ) : (
                                    <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem' }}>{horse.sireNumber || '-'}</span>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Dna size={16} /> UELN
                                </label>
                                {isEditing ? (
                                    <input
                                        style={{
                                            width: '100%', padding: '0.8rem', borderRadius: '12px',
                                            border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)',
                                            backdropFilter: 'blur(5px)', fontSize: '1rem', outline: 'none',
                                            fontFamily: 'monospace', fontWeight: '600'
                                        }}
                                        onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = 'var(--color-primary)'; }}
                                        onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                                        value={editForm.ueln || ''}
                                        onChange={e => setEditForm({ ...editForm, ueln: e.target.value })}
                                    />
                                ) : (
                                    <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem' }}>{horse.ueln}</span>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Genealogy Section (Moved DOWN) */}
                    <Card title="Généalogie (Pedigree)">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Sire Side */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <div style={{ width: '80px', fontWeight: 700, color: '#1890ff', fontSize: '1.1rem' }}>Père</div>
                                <div style={{ flex: 1 }}>
                                    {isEditing ? (
                                        <>
                                            <input
                                                className="w-full font-bold mb-1 border-b px-1" placeholder="Père"
                                                value={editForm.pedigree?.sire || ''}
                                                onChange={e => setEditForm({ ...editForm, pedigree: { ...editForm.pedigree, sire: e.target.value } })}
                                            />
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <input className="text-xs border rounded p-1" placeholder="Grand-Père P." value={editForm.pedigree?.ss || ''} onChange={e => setEditForm({ ...editForm, pedigree: { ...editForm.pedigree, ss: e.target.value } })} />
                                                <input className="text-xs border rounded p-1" placeholder="Grand-Mère P." value={editForm.pedigree?.sd || ''} onChange={e => setEditForm({ ...editForm, pedigree: { ...editForm.pedigree, sd: e.target.value } })} />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.25rem' }}>{horse.pedigree?.sire || 'Grand Chef'}</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.5 }}>Père</span> {horse.pedigree?.ss || 'Inconnu'}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.5 }}>Mère</span> {horse.pedigree?.sd || 'Inconnu'}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Dam Side */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '80px', fontWeight: 700, color: '#eb2f96', fontSize: '1.1rem' }}>Mère</div>
                                <div style={{ flex: 1 }}>
                                    {isEditing ? (
                                        <>
                                            <input
                                                className="w-full font-bold mb-1 border-b px-1" placeholder="Mère"
                                                value={editForm.pedigree?.dam || ''}
                                                onChange={e => setEditForm({ ...editForm, pedigree: { ...editForm.pedigree, dam: e.target.value } })}
                                            />
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <input className="text-xs border rounded p-1" placeholder="Grand-Père M." value={editForm.pedigree?.ds || ''} onChange={e => setEditForm({ ...editForm, pedigree: { ...editForm.pedigree, ds: e.target.value } })} />
                                                <input className="text-xs border rounded p-1" placeholder="Grand-Mère M." value={editForm.pedigree?.dd || ''} onChange={e => setEditForm({ ...editForm, pedigree: { ...editForm.pedigree, dd: e.target.value } })} />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.25rem' }}>{horse.pedigree?.dam || 'Belle Étoile'}</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.5 }}>Père</span> {horse.pedigree?.ds || 'Inconnu'}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.5 }}>Mère</span> {horse.pedigree?.dd || 'Inconnu'}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Note Placeholder */}
                    <Card title="Notes">
                        <textarea
                            placeholder="Ajouter des notes sur le signalement (balzanes, épis...)"
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                padding: '1rem',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '1rem',
                                resize: 'none'
                            }}
                        ></textarea>
                    </Card>
                </div>
            </div>

            {
                showScanningCamera && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'black', zIndex: 9999,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
                            <Button variant="secondary" onClick={stopScanning} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}>
                                <X size={24} />
                            </Button>
                        </div>

                        {cameraError ? (
                            <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>
                                <p className="text-xl mb-4 text-red-400">{cameraError}</p>
                                <Button onClick={stopScanning} variant="secondary">Fermer</Button>
                            </div>
                        ) : (
                            <>
                                <div style={{
                                    width: '100%', height: '100%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden', position: 'relative'
                                }}>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {/* Scanning Frame Overlay */}
                                    <div style={{
                                        position: 'absolute',
                                        border: '2px solid rgba(255,255,255,0.5)',
                                        borderRadius: '20px',
                                        width: '80%', height: '50%',
                                        boxShadow: '0 0 0 9999px rgba(0,0,0,0)'
                                    }}>
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white -mt-1 -ml-1 rounded-tl-lg"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white -mt-1 -mr-1 rounded-tr-lg"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white -mb-1 -ml-1 rounded-bl-lg"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white -mb-1 -mr-1 rounded-br-lg"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <p className="text-white text-opacity-80 font-medium bg-black/50 px-3 py-1 rounded-full">Placez le livret ici</p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                                    <button
                                        onClick={captureAndProcess}
                                        style={{
                                            width: '80px', height: '80px',
                                            borderRadius: '50%',
                                            background: 'white',
                                            border: '4px solid rgba(255,255,255,0.3)',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                            transition: 'transform 0.2s'
                                        }}
                                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid black' }}></div>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )
            }
        </div >
    );
};

export default HorseProfile;
