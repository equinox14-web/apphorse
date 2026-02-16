import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { canAccess } from '../../utils/permissions';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Syringe, Stethoscope, Calendar, AlertCircle, CheckCircle, Plus, ArrowLeft, Pencil, Trash2, Camera, Loader2, ClipboardList, ScanLine, Upload, X } from 'lucide-react';
import { analyzePrescription } from '../../utils/geminiVision';
import { useAuth } from '../../context/AuthContext';
import { scheduleSyncToFirestore } from '../../services/firestoreSync';

import { useTranslation, Trans } from 'react-i18next';

const Care = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation(); // Pour lire les query params
    const [activeTab, setActiveTab] = useState('overview'); // Par défaut Vue d'ensemble
    // Scanner State
    // Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const [scannedData, setScannedData] = useState([]);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [showScanOptions, setShowScanOptions] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const fileInputRef = React.useRef(null);
    const videoRef = React.useRef(null);



    const tabs = [
        { id: 'overview', label: "Vue d'ensemble", icon: ClipboardList },
        { id: 'vaccins', label: t('care_page.tabs.vaccines'), icon: Syringe },
        { id: 'vermifuges', label: t('care_page.tabs.wormers'), icon: AlertCircle },
        { id: 'marechal', label: t('care_page.tabs.farrier'), icon: Calendar },
        { id: 'osteo', label: t('care_page.tabs.osteo'), icon: Stethoscope },
    ];

    // Veterinary Recommendations (Intervals in days)
    const CARE_INTERVALS = {
        // Vaccins
        "Grippe": 365,
        "Tétanos": 365,
        "Grippe + Tétanos": 365,
        "Rhinopneumonie": 180,
        "West Nile": 365,
        "Rage": 365,
        "Gourme": 365,
        "vaccins": 365, // Fallback for type

        // Vermifuges (Default ~3 months)
        "Vermifuge": 90,
        "vermifuges": 90, // Fallback for type key

        // Maréchal
        "Maréchal": 45,
        "marechal": 45, // Fallback
        "Ferrure": 45,
        "Parage": 50,

        // Ostéo
        "Ostéo": 365,
        "osteo": 365, // Fallback
        "Dentiste": 365
    };

    // State for Items (Load from localStorage if available)
    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem('appHorse_careItems_v3');
        if (saved) return JSON.parse(saved);
        return [];
    });

    const [horsesList, setHorsesList] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [externalContacts, setExternalContacts] = useState([]);
    const [partners, setPartners] = useState([]);

    // Resolve Horse Name from List
    const resolvedHorse = horsesList.find(h => String(h.id) === String(id));
    const title = resolvedHorse ? `${t('care_page.title')} - ${resolvedHorse.name}` : (id ? t('care_page.title') : 'Prophylaxie (Toute l\'écurie)');

    const loadData = () => {
        const teamData = JSON.parse(localStorage.getItem('appHorse_team_v2') || '[]');
        const clientData = JSON.parse(localStorage.getItem('appHorse_clients_v2') || '[]');

        // Load Horses for Selector
        const savedHorses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const savedMares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');
        const allHorses = [...savedHorses, ...savedMares];
        setHorsesList(allHorses);

        // --- ORPHAN DATA CLEANUP & STATUS REFRESH ---
        // Clean up care items for horses that no longer exist AND update dynamic status (daysLeft)
        let savedItems = JSON.parse(localStorage.getItem('appHorse_careItems_v3') || '[]');

        // Refresh Status based on TODAY
        const now = new Date();
        savedItems = savedItems.map(item => {
            const targetDate = new Date(item.date);
            const daysLeft = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));

            let status = 'ok';
            if (daysLeft < 0) status = 'urgent';
            else if (daysLeft <= 15) status = 'warning'; // Update to 15 days consistent with Dashboard

            return {
                ...item,
                daysLeft,
                status
            };
        });

        const validItems = savedItems.filter(item => {
            // 1. Keep generic items (no horseId)
            if (!item.horseId || item.horseId === '99') return true;

            // 2. Check if horse exists
            const found = allHorses.find(h => String(h.id) === String(item.horseId));

            if (found) return true; // Horse exists -> Keep

            // 3. Horse DELETED: 
            // Only remove if it's a FUTURE event (orphan task).
            // KEEP if it's PAST (Legal History).
            if (item.daysLeft <= 0) return true;

            return false; // Remove future orphan
        });

        // Check if we need to save (either due to cleanup OR status update)
        // Since we recalculated daysLeft, it likely changed since last save if day changed.
        // We always save to be safe and ensure fresh data in LS for Dashboard too.
        // But dashboard calculates on fly.
        // Let's check deep equality or just save. Saving is safer.

        const hasChanges = JSON.stringify(validItems) !== JSON.stringify(JSON.parse(localStorage.getItem('appHorse_careItems_v3') || '[]'));

        if (hasChanges) {
            console.log(`🧹 Care: Data refreshed/cleaned.`);
            localStorage.setItem('appHorse_careItems_v3', JSON.stringify(validItems));
            setItems(validItems);
            // Sync cleaned data
            if (currentUser) scheduleSyncToFirestore(currentUser.uid);
        } else {
            setItems(validItems);
        }

        // Split Team into Staff and Partners
        setTeamMembers(teamData.filter(m => !m.isExternal));
        setPartners(teamData.filter(m => m.isExternal));

        setExternalContacts(clientData);

        console.log("🔄 Care: Lists refreshed", { horses: savedHorses.length, team: teamData.length });
    };

    React.useEffect(() => {
        loadData();

        // Listen for global data refresh (after Firestore load)
        const handleDataRefresh = () => loadData();
        window.addEventListener('equinox_data_refreshed', handleDataRefresh);

        return () => {
            window.removeEventListener('equinox_data_refreshed', handleDataRefresh);
        };
    }, [currentUser]);

    // Handle URL Params for Tabs
    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'history') setActiveTab('overview'); // Compatibilité ancien lien
        else if (tab && tabs.find(t => t.id === tab)) setActiveTab(tab);
    }, [location]);

    // Save to localStorage whenever items change
    React.useEffect(() => {
        if (items.length > 0) { // Only save if there's something (avoid saving empty on initial load race condition?)
            localStorage.setItem('appHorse_careItems_v3', JSON.stringify(items));

            // Auto-save to Firestore if user is logged in
            if (currentUser) {
                console.log("🏥 Care Items changed -> Scheduling Sync...");
                scheduleSyncToFirestore(currentUser.uid);
            }
        } else {
            // If items is empty, we still might want to save if the user DELETED everything.
            // But we need to distinguish "Initial Load Empty" vs "User Deleted All".
            // For now, let's just save.
            localStorage.setItem('appHorse_careItems_v3', JSON.stringify(items));
            if (currentUser) scheduleSyncToFirestore(currentUser.uid);
        }
    }, [items, currentUser]);

    const [showModal, setShowModal] = useState(false);
    // lastDate is the primary input now
    const [newItem, setNewItem] = useState({ id: null, type: 'vaccins', subtype: '', lastDate: '', date: '', notes: '', practitioner: '', horseId: '' });

    // Filter Items
    const filteredItems = items.filter(item => {
        const typeMatch = activeTab === 'overview' ? true : item.type === activeTab;
        const horseMatch = id ? item.horseId === id : true;
        return typeMatch && horseMatch;
    }).sort((a, b) => new Date(a.date) - new Date(b.date)); // Toujours trier par date
    const handleSaveItem = (e) => {
        e.preventDefault();

        let finalDate = newItem.date;
        if (!finalDate && newItem.lastDate) {
            finalDate = calculateDueDate(newItem.subtype || newItem.type, newItem.lastDate);
        }

        const daysLeft = Math.ceil((new Date(finalDate) - new Date()) / (1000 * 60 * 60 * 24));
        let status = 'ok';
        if (daysLeft < 0) status = 'urgent';
        else if (daysLeft < 15) status = 'warning';

        // Determine Horse Name
        let targetHorseName = resolvedHorse ? resolvedHorse.name : 'Cheval Inconnu';
        let targetHorseId = id;

        if (!targetHorseId && newItem.horseId) {
            // Found from selector (Global Add)
            targetHorseId = newItem.horseId;
            const found = horsesList.find(h => String(h.id) === String(targetHorseId));
            targetHorseName = found ? found.name : 'Cheval Inconnu';
        }

        if (newItem.id) {
            // Edit Mode - Update logic
            setItems(items.map(item => item.id === newItem.id ? {
                ...item,
                name: newItem.subtype || newItem.type,
                date: finalDate,
                status: status,
                daysLeft: daysLeft,
                horse: targetHorseName || item.horse, // Update name if changed or use existing
                horseId: targetHorseId || item.horseId,
                practitioner: newItem.practitioner
            } : item));
        } else {
            // Add Mode
            const cleanItems = items.filter(i => {
                const isSameHorse = i.horseId === (targetHorseId || '99');
                const isSameType = i.type === (newItem.type || activeTab);
                const isSameName = i.name === (newItem.subtype || newItem.type);
                return !(isSameHorse && isSameType && isSameName);
            });

            const itemToAdd = {
                id: Date.now(),
                type: newItem.type || activeTab,
                horse: targetHorseName || 'Cheval Inconnu',
                horseId: targetHorseId || '99',
                name: newItem.subtype || newItem.type,
                date: finalDate,
                status: status,
                daysLeft: daysLeft,
                practitioner: newItem.practitioner
            };
            setItems([...cleanItems, itemToAdd]);
        }
        setShowModal(false);
        setNewItem({ id: null, type: 'vaccins', subtype: '', lastDate: '', date: '', notes: '', practitioner: '', horseId: '' });
    };

    const handleDelete = (itemId) => {
        if (window.confirm(t('care_page.delete_confirm'))) {
            setItems(items.filter(i => i.id !== itemId));
        }
    };

    const handleEdit = (item) => {
        setNewItem({
            id: item.id,
            type: item.type,
            subtype: item.name,
            lastDate: '',
            date: item.date,
            notes: '',
            practitioner: item.practitioner || '' // Load Practitioner
        });
        setShowModal(true);
    };

    const openAddModal = () => {
        setNewItem({
            id: null,
            type: activeTab === 'overview' ? 'vaccins' : activeTab,
            subtype: '', lastDate: '', date: '', notes: ''
        });
        setShowModal(true);
    };

    // Helper to calculate next date
    const calculateDueDate = (type, dateVal) => {
        if (!dateVal) return '';
        // Fallback to type key (e.g. 'vermifuges') if subtype not found
        // Better logic: try specific key, then try activeTab (type parameter), then fallback
        let days = CARE_INTERVALS[type];
        if (!days) {
            days = 90; // Hard fallback
            if (CARE_INTERVALS[type]) days = CARE_INTERVALS[type];
            else if (activeTab === 'marechal') days = 45;
            else if (activeTab === 'vaccins') days = 365;
            else if (activeTab === 'osteo') days = 365;
        }

        const d = new Date(dateVal);
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    };

    const vaccineTypes = [
        "Grippe", "Tétanos", "Grippe + Tétanos", "Rhinopneumonie", "West Nile", "Rage", "Gourme"
    ];

    const vermifugeTypes = [
        "Eqvalan / Eraquell (Ivermectine)",
        "Equest (Moxidectine)",
        "Panacur (Fenbendazole)",
        "Strongid (Pyrantel)",
        "Tenies (Praziquantel)",
        "Eqvalan Duo (Ivermectine + Praziquantel)",
        "Equest Pramox (Moxidectine + Praziquantel)",
        "Equimax (Ivermectine + Praziquantel)"
    ];

    // Seasonal Advice Logic
    const getSeasonVermifugeAdvice = () => {
        const month = new Date().getMonth() + 1; // 1-12
        if (month >= 11 || month <= 2) {
            return {
                season: "Hiver",
                text: "C'est le moment du 'Grand Nettoyage'. Visez les larves enkystées et les ténias.",
                rec: `${t('care_page.advice.recommended')} Moxidectine + Praziquantel (Ex: Equest Pramox ou Duo).`,
                color: "#e6f7ff",
                borderColor: "#1890ff"
            };
        } else if (month >= 3 && month <= 5) {
            return {
                season: "Printemps",
                text: "Reprise du pâturage. Ciblez les strongles.",
                rec: `${t('care_page.advice.recommended')} Ivermectine ou Moxidectine simple.`,
                color: "#f6ffed",
                borderColor: "#52c41a"
            };
        } else if (month >= 6 && month <= 8) {
            return {
                season: "Été",
                text: "Surveillance strongles et ténias. Une coproscopie est idéale avant de traiter.",
                rec: `${t('care_page.advice.recommended')} Ivermectine + Praziquantel (si besoin).`,
                color: "#fff7e6",
                borderColor: "#faad14"
            };
        } else {
            return {
                season: "Automne",
                text: "Avant l'hiver, ciblez les vers plats et rond.",
                rec: `${t('care_page.advice.recommended')} Ivermectine ou Fenbendazole.`,
                color: "#fff1f0",
                borderColor: "#ff4d4f"
            };
        }
    };
    const advice = getSeasonVermifugeAdvice();

    // --- SCANNER HANDLERS ---
    const [scanError, setScanError] = useState(null); // Local Error State

    const startCamera = () => {
        setShowScanOptions(false);
        setShowCamera(true);
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            })
            .catch(err => {
                console.error("Camera Error:", err);
                alert("Impossible d'accéder à la caméra.");
                setShowCamera(false);
            });
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        setShowCamera(false);
    };

    const base64ToFile = (base64, filename) => {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
            const imageBase64 = canvas.toDataURL("image/jpeg");
            const file = base64ToFile(imageBase64, "capture.jpg");
            stopCamera();
            processFile(file);
        }
    };

    const processFile = async (file) => {
        setIsScanning(true);
        setScanError(null);

        try {
            const results = await analyzePrescription(file);
            setScannedData(results); // Array of { name, dosage, frequency, duration, start_date, detectedHorse }
            setShowValidationModal(true);
        } catch (error) {
            console.error("Erreur Scanner:", error);
            setScanError("Erreur : " + error.message);
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setShowScanOptions(false);
        processFile(file);
    };

    const confirmPrescription = () => {
        const newItems = [];
        const baseId = Date.now();

        scannedData.forEach((med, index) => {
            // Fallback dates if missing or invalid
            let currentDay = new Date();
            if (med.start_date) {
                currentDay = new Date(med.start_date);
            }

            const duration = parseInt(med.duration) || 1;

            for (let i = 0; i < duration; i++) {
                // Clone date to avoid reference issues
                const d = new Date(currentDay);
                d.setDate(d.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];

                const daysLeft = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
                let status = 'ok';
                if (daysLeft < 0) status = 'urgent'; // Late
                else if (daysLeft < 2) status = 'warning'; // Soon

                // Use currently resolved horse or generic
                let targetHorseName = resolvedHorse ? resolvedHorse.name : 'Cheval Inconnu';
                let targetHorseId = id || '99';

                // Try to use detected horse from AI if not already on a specific horse profile
                if (!id && med.detectedHorse) {
                    const detectedName = med.detectedHorse.toLowerCase();
                    // Simple fuzzy match
                    const found = horsesList.find(h =>
                        h.name.toLowerCase().includes(detectedName) ||
                        detectedName.includes(h.name.toLowerCase())
                    );
                    if (found) {
                        targetHorseName = found.name;
                        targetHorseId = found.id;
                    } else {
                        // Keep detected name but mark ID as unknown if no match
                        // Or just use "Cheval Inconnu [DetectedName]"
                        targetHorseName = `${med.detectedHorse} (?)`;
                    }
                }

                newItems.push({
                    id: baseId + index + (i * 1000), // Unique ID
                    type: 'vaccins', // Store under Medical/Vaccines tab for now
                    horse: targetHorseName,
                    horseId: targetHorseId,
                    name: `${med.name} (${med.dosage})`,
                    date: dateStr,
                    status: status,
                    daysLeft: daysLeft,
                    practitioner: 'Vétérinaire (Ordonnance)',
                    notes: `Fréquence: ${med.frequency}`
                });
            }
        });

        setItems(prev => [...prev, ...newItems]);
        setShowValidationModal(false);
        setScannedData([]);
        alert(`${newItems.length} soins ajoutés au planning !`);
    };

    return (
        <div className="animate-fade-in">

            <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {id && (
                        <Button variant="secondary" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
                            <ArrowLeft size={20} />
                        </Button>
                    )}
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>{title}</h2>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <Button
                        variant="secondary"
                        onClick={() => setShowScanOptions(true)}
                        disabled={isScanning}
                    >
                        {isScanning ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                        <span className="hide-on-mobile">{isScanning ? 'Analyse...' : 'Scanner Ordonnance'}</span>
                        <span className="mobile-only" style={{ display: 'none' }}>Scan</span>
                    </Button>
                    <Button onClick={openAddModal}>
                        <Plus size={18} />
                        <span className="hide-on-mobile">{t('care_page.add_button')}</span>
                        <span className="mobile-only" style={{ display: 'none' }}>Ajout</span>
                    </Button>
                </div>
            </div>

            {scanError && (
                <div style={{
                    padding: '1rem',
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    color: '#ef4444',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    <AlertCircle size={20} />
                    <span>{scanError}</span>
                </div>
            )}


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

                {/* Sidebar Navigation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Card style={{ padding: '0.5rem' }}>
                        {tabs.map(tab => (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                                    color: activeTab === tab.id ? 'white' : 'var(--color-text)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <tab.icon size={20} />
                                <span style={{ fontWeight: 600 }}>{tab.label}</span>
                            </div>
                        ))}
                    </Card>

                    {/* Summary Card */}
                    <Card title={t('care_page.summary.title')} accent>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span>{t('care_page.summary.up_to_date')}</span>
                            <span style={{ fontWeight: 'bold', color: '#52c41a' }}>{filteredItems.filter(i => i.status === 'ok').length}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span>{t('care_page.summary.upcoming')}</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-accent)' }}>{filteredItems.filter(i => i.daysLeft > 0 && i.daysLeft <= 7).length}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>{t('care_page.summary.late')}</span>
                            <span style={{ fontWeight: 'bold', color: '#ff4d4f' }}>{filteredItems.filter(i => i.daysLeft < 0).length}</span>
                        </div>
                    </Card>
                </div>

                {/* Main Content List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Seasonal Advice Banner */}
                    {activeTab === 'vermifuges' && (
                        <div style={{
                            background: advice.color,
                            borderLeft: `5px solid ${advice.borderColor}`,
                            padding: '1rem',
                            borderRadius: '5px',
                            marginBottom: '0.5rem',
                            display: 'flex', gap: '1rem', alignItems: 'start'
                        }}>
                            <div style={{ color: advice.borderColor, marginTop: '2px' }}><Stethoscope size={24} /></div>
                            <div>
                                <h4 style={{ margin: 0, color: '#1f2937', fontWeight: 600 }}>{t('care_page.advice.title', { season: advice.season })}</h4>
                                <p style={{ margin: '0.3rem 0', fontSize: '0.95rem' }}>{advice.text}</p>
                                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>👉 {advice.rec}</p>
                            </div>
                        </div>
                    )}

                    {filteredItems.length > 0 ? filteredItems.map(item => (
                        <Card key={item.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: item.status === 'urgent' ? '#fff1f0' : (item.status === 'warning' ? '#fff7e6' : '#f6ffed'),
                                    color: item.status === 'urgent' ? '#ff4d4f' : (item.status === 'warning' ? '#faad14' : '#52c41a'),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {item.status === 'ok' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{item.name}</h4>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                        {item.horse} • {new Date(item.date).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold', color: item.status === 'urgent' ? '#ff4d4f' : (item.status === 'warning' ? '#faad14' : 'var(--color-text-muted)') }}>
                                    {canAccess('alerts') ? (
                                        item.daysLeft > 0 ? t('care_page.card.reminder_in', { days: item.daysLeft }) : (item.daysLeft < 0 ? t('care_page.card.late_by', { days: Math.abs(item.daysLeft) }) : t('care_page.card.reminder_today'))
                                    ) : (
                                        <span style={{ fontSize: '0.8rem', color: '#999', fontWeight: 400 }}>Rappels: <a href="/settings" style={{ color: 'var(--color-primary)' }}>Offre Passion</a></span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                    <Button
                                        variant="secondary"
                                        style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                                        onClick={() => handleEdit(item)}
                                    >
                                        <Pencil size={12} style={{ marginRight: '0.4rem' }} /> {t('care_page.card.edit')}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2' }}
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        <Trash2 size={12} style={{ marginRight: '0.4rem' }} /> {t('care_page.card.delete')}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)', background: 'white', borderRadius: '20px' }}>
                            <p>Aucun soin prévu pour cette catégorie.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0)', zIndex: 1000,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: '2vh',
                    overflowY: 'auto'
                }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowModal(false);
                        }
                    }}
                >
                    <Card style={{ width: '90%', maxWidth: '400px', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{newItem.id ? t('care_page.modal.edit_title', { type: tabs.find(t => t.id === activeTab)?.label }) : t('care_page.modal.add_title', { type: tabs.find(t => t.id === activeTab)?.label })}</h3>

                        <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            {/* Category Selection (Overview Only) */}
                            {activeTab === 'overview' && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Catégorie</label>
                                    <select
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white' }}
                                        value={newItem.type}
                                        onChange={e => setNewItem({ ...newItem, type: e.target.value, subtype: '' })}
                                    >
                                        <option value="vaccins">{t('care_page.tabs.vaccines')}</option>
                                        <option value="vermifuges">{t('care_page.tabs.wormers')}</option>
                                        <option value="marechal">{t('care_page.tabs.farrier')}</option>
                                        <option value="osteo">{t('care_page.tabs.osteo')}</option>
                                    </select>
                                </div>
                            )}

                            {/* Subtype Selection */}
                            {newItem.type === 'vaccins' ? (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('care_page.modal.type_label')}</label>
                                    <select
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white' }}
                                        value={newItem.subtype}
                                        onChange={e => {
                                            const sub = e.target.value;
                                            const nextDate = newItem.lastDate ? calculateDueDate(sub, newItem.lastDate) : newItem.date;
                                            setNewItem({ ...newItem, subtype: sub, date: nextDate });
                                        }}
                                    >
                                        <option value="">Sélectionner...</option>
                                        {vaccineTypes.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        {newItem.type === 'vermifuges' ? t('care_page.modal.wormer_label') : t('care_page.modal.label_label')}
                                    </label>
                                    <select
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white' }}
                                        value={newItem.subtype}
                                        onChange={e => {
                                            const sub = e.target.value;
                                            const nextDate = newItem.lastDate ? calculateDueDate(sub, newItem.lastDate) : newItem.date;
                                            setNewItem({ ...newItem, subtype: sub, date: nextDate });
                                        }}
                                    >
                                        <option value="">Sélectionner...</option>
                                        {newItem.type === 'marechal' && ["Parage", "Ferrure"].map(v => <option key={v} value={v}>{v}</option>)}
                                        {newItem.type === 'vermifuges' && vermifugeTypes.map(v => <option key={v} value={v}>{v}</option>)}
                                        {newItem.type === 'osteo' && ["Ostéo", "Dentiste"].map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Date of Execution (Primary Input) */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('care_page.modal.last_date')}</label>
                                <input
                                    type="date"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                                    value={newItem.lastDate}
                                    onChange={e => {
                                        const d = e.target.value;
                                        const next = calculateDueDate(newItem.subtype || newItem.type, d);
                                        setNewItem({ ...newItem, lastDate: d, date: next });
                                    }}
                                />
                            </div>

                            {/* Target Date (The one shown in Calendar) */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1d4ed8' }}>
                                    {t('care_page.modal.event_date')}
                                </label>
                                <input
                                    type="date"
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #93c5fd', background: '#eff6ff', fontWeight: 600, color: '#1e40af' }}
                                    value={newItem.date}
                                    onChange={e => setNewItem({ ...newItem, date: e.target.value })}
                                />
                                <div style={{ fontSize: '0.8rem', color: '#60a5fa', marginTop: '0.3rem' }}>
                                    {newItem.type === 'marechal' ? t('care_page.modal.interval_std', { days: 45 }) : (newItem.type === 'vermifuges' ? t('care_page.modal.interval_std', { days: 90 }) : t('care_page.modal.interval_std', { days: 365 }))}
                                </div>
                            </div>

                            {!newItem.date && <div style={{ fontSize: '0.9rem', color: '#888' }}>Sélectionnez un type et une date pour voir le rappel.</div>}

                            {/* Practitioner Selection */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('care_page.modal.practitioner')}</label>
                                <select
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white' }}
                                    value={newItem.practitioner || ''}
                                    onChange={e => setNewItem({ ...newItem, practitioner: e.target.value })}
                                >
                                    <option value="">{t('care_page.modal.select_practitioner')}</option>
                                    <optgroup label={t('care_page.modal.team')}>
                                        {teamMembers.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label={t('care_page.modal.partners')}>
                                        {partners.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label={t('care_page.modal.owners')}>
                                        {externalContacts.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.role || 'Client'})</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>


                            {!id && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Cheval concerné</label>
                                    <select
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white' }}
                                        value={newItem.horseId || ''}
                                        onChange={e => setNewItem({ ...newItem, horseId: e.target.value })}
                                    >
                                        <option value="">Sélectionner un cheval...</option>
                                        {horsesList.map(h => (
                                            <option key={h.id} value={h.id}>{h.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>{t('care_page.modal.cancel')}</Button>
                                <Button type="submit" style={{ flex: 1 }}>{t('care_page.modal.validate')}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Validation Modal for Scanner */}
            {showValidationModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle color="green" /> Analyse Terminée
                        </h3>
                        <p style={{ marginBottom: '1rem' }}>Voici les médicaments détectés sur l'ordonnance. Vous pouvez valider pour les ajouter au calendrier.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            {scannedData.map((med, idx) => (
                                <div key={idx} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{med.name}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                        <div><strong>Dosage:</strong> {med.dosage}</div>
                                        <div><strong>Fréquence:</strong> {med.frequency}</div>
                                        <div><strong>Durée:</strong> {med.duration} jours</div>
                                        <div><strong>Début:</strong> {med.start_date}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {scannedData.length === 0 && <p style={{ color: 'red' }}>Aucun médicament détecté.</p>}

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button variant="secondary" onClick={() => setShowValidationModal(false)} style={{ flex: 1 }}>Annuler</Button>
                            <Button onClick={confirmPrescription} style={{ flex: 1 }} disabled={scannedData.length === 0}>
                                Valider et Ajouter au Planning
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
            {/* Scan Options Modal */}
            {showScanOptions && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={(e) => { if (e.target === e.currentTarget) setShowScanOptions(false); }}>
                    <Card style={{ width: '90%', maxWidth: '350px', padding: '2rem', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>Scanner une ordonnance</h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <Button variant="secondary" onClick={startCamera} style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '0.5rem', height: 'auto', alignItems: 'center' }}>
                                <Camera size={32} color="#8b5cf6" />
                                <span>Prendre une photo</span>
                            </Button>
                            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '0.5rem', height: 'auto', alignItems: 'center' }}>
                                <Upload size={32} color="#10b981" />
                                <span>Importer un fichier</span>
                            </Button>
                        </div>
                        <Button variant="ghost" onClick={() => setShowScanOptions(false)} style={{ marginTop: '1rem' }}>Fermer</Button>
                    </Card>
                </div>
            )}

            {/* Camera Overlay */}
            {showCamera && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'black', zIndex: 1300, display: 'flex', flexDirection: 'column' }}>
                    <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay playsInline />
                    <div style={{ position: 'absolute', bottom: '3rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '2rem', alignItems: 'center' }}>
                        <Button variant="secondary" onClick={stopCamera} style={{ borderRadius: '50%', width: '50px', height: '50px', padding: 0 }}>
                            <X size={24} />
                        </Button>
                        <button onClick={capturePhoto} style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'white', border: '4px solid rgba(255,255,255,0.5)', cursor: 'pointer' }}></button>
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {isScanning && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.8)', zIndex: 1400,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Loader2 className="animate-spin" size={48} color="#4f46e5" />
                    <div style={{ marginTop: '1rem', fontWeight: 600, color: '#4f46e5' }}>Analyse de l'ordonnance et identification du cheval...</div>
                </div>
            )}
        </div>
    );
};

export default Care;
