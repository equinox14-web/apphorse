import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { FileText, Printer, ArrowLeft, TriangleAlert, Building, ShieldCheck, Calendar, Activity, Syringe, MapPin, User, Stethoscope, FileClock, Filter, Layers, Edit2, Save, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { scheduleSyncToFirestore } from '../services/firestoreSync';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to resize images (limit storage size)
const resizeImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_WIDTH = 300; // Smaller for logo
            const MAX_HEIGHT = 300;
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
            callback(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

const Register = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const { t, i18n } = useTranslation();
    const { currentUser } = useAuth();

    // --- DATA LOADING ---
    const [movements, setMovements] = useState(() => {
        const horses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const mares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');

        // Mock movements based on horses existing
        const allHorses = [
            ...horses.map(h => ({ ...h, type: 'Cheval Sport/Loisir' })),
            ...mares.map(m => ({ ...m, type: 'Élevage' }))
        ];

        const simulatedMovements = allHorses.map(h => ({
            id: h.id,
            date: new Date().toISOString().split('T')[0], // Default to today/recent if no date tracked
            type: 'ENTRÉE',
            horseName: h.name,
            reason: 'Arrivée / Pension',
            origin: 'Inconnue'
        }));

        // Load Real/Manual Movements from Storage (e.g. Location Changes)
        const storedMovements = JSON.parse(localStorage.getItem('appHorse_register_movements') || '[]');

        // Combine and Sort by Date (Newest first usually, but register often chronological)
        // Let's sort Newest First for UI
        return [...storedMovements, ...simulatedMovements].sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    const [interventions, setInterventions] = useState(() => {
        const horses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const mares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');

        const allHorses = [
            ...horses.map(h => ({ ...h, type: 'Cheval Sport/Loisir' })),
            ...mares.map(m => ({ ...m, type: 'Élevage' }))
        ];

        // 2. Load Sanitary Interventions (Vaccines, Deworming, Care)
        const careItems = JSON.parse(localStorage.getItem('appHorse_careItems_v3') || '[]');
        const contacts = JSON.parse(localStorage.getItem('appHorse_clients_v2') || '[]'); // Clients/Owners
        const team = JSON.parse(localStorage.getItem('appHorse_team_v2') || '[]'); // Team + Partners

        const getPractitionerName = (pIdOrName) => {
            if (!pIdOrName) return 'Détenteur / Vétérinaire'; // Default

            // Try matching with Team/Partners
            const member = team.find(t => String(t.id) === String(pIdOrName));
            if (member) return `${member.name} (${member.role})`;

            // Try matching with Clients
            const contact = contacts.find(c => String(c.id) === String(pIdOrName));
            if (contact) return `${contact.name} (${contact.role || 'Propriétaire'})`;

            return pIdOrName; // Fallback to original string if it was just a name or not found
        };

        return careItems.map(item => ({
            id: item.id,
            date: item.nextDate || item.date || new Date().toISOString(),
            type: item.type,
            horseName: item.horseId ? (allHorses.find(h => String(h.id) === String(item.horseId))?.name || 'Cheval inconnu') : 'Lot complet',
            details: item.product || item.notes || 'Soins courants',
            practitioner: getPractitionerName(item.practitioner) // Resolve Name
        })).sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    const [establishment, setEstablishment] = useState(() => {
        const defaultEst = {
            name: 'Mon Écurie',
            owner: 'Cavalier',
            vet: 'Dr. Vétérinaire (Non renseigné)',
            address: 'Adresse (Non renseignée)',
            logo: null
        };
        const savedEst = JSON.parse(localStorage.getItem('appHorse_register_establishment') || 'null');
        const profileName = localStorage.getItem('user_name'); // From Profile
        const profileLogo = localStorage.getItem('user_logo'); // From Profile
        const savedCompany = JSON.parse(localStorage.getItem('appHorse_company_details_v1') || '{}');

        return {
            ...defaultEst,
            ...(savedEst || {}), // Load saved address/vet from register
            owner: profileName || (savedEst && savedEst.owner) || defaultEst.owner, // Prefer Profile Name
            name: (savedEst && savedEst.name) || defaultEst.name,
            address: (savedCompany && savedCompany.address) || (savedEst && savedEst.address) || defaultEst.address, // Prefer Company Settings Address
            siret: (savedCompany && savedCompany.siret) || (savedEst && savedEst.siret) || '', // Load SIRET from Company Settings
            logo: profileLogo || (savedEst && savedEst.logo) || null // Prefer Profile Logo
        };
    });

    const handleSaveEstablishment = () => {
        // We save the EXTRA details (address, vet, custom name) specific to register
        // But we don't overwrite the Profile Name/Logo back to Profile from here for now, just local overrides.
        localStorage.setItem('appHorse_register_establishment', JSON.stringify(establishment));
        if (currentUser) {
            scheduleSyncToFirestore(currentUser.uid);
        }
        setIsEditing(false);
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // --- HEADER (First Page) ---
        // --- HEADER (First Page) ---
        doc.setFontSize(22);
        doc.text(t('register_page.title').toUpperCase(), pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`(${t('register_page.subtitle')})`, pageWidth / 2, 28, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text(`I. ${t('register_page.establishment.title').toUpperCase()}`, 14, 45);

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`${t('register_page.establishment.name')} : ${establishment.name || ''}`, 14, 55);
        doc.text(`${t('register_page.establishment.owner')} : ${establishment.owner || ''}`, 14, 62);
        doc.text(`${t('register_page.establishment.address')} : ${establishment.address || ''}`, 14, 69);
        doc.text(`${t('register_page.establishment.siret')} : ${establishment.siret || ''}`, 14, 76);
        doc.text(`${t('register_page.establishment.vet')} : ${establishment.vet || ''}`, 14, 83);

        // --- PDF LOGO ---
        if (establishment.logo) {
            try {
                // Add Image at (PageWidth - 50, 40) with size 40x40 (roughly)
                doc.addImage(establishment.logo, 'JPEG', pageWidth - 55, 40, 40, 40);
            } catch (err) {
                console.error("Error adding logo to PDF", err);
            }
        }

        // --- SECTION II: MOUVEMENTS ---
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text(`II. ${t('register_page.movements.title').toUpperCase()}`, 14, 95);

        const movementsRows = movements.map(m => [
            new Date(m.date).toLocaleDateString(i18n.language),
            m.type,
            m.horseName,
            m.reason,
            m.origin
        ]);

        autoTable(doc, {
            startY: 100,
            head: [[
                t('register_page.movements.columns.date'),
                t('register_page.movements.columns.movement'),
                t('register_page.movements.columns.horse'),
                t('register_page.movements.columns.reason'),
                t('register_page.movements.columns.origin_dest')
            ]],
            body: movementsRows,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] },
            styles: { fontSize: 10 },
            margin: { top: 100 }
        });

        // --- SECTION III: SANITAIRE ---
        // Add page if needed, or check Y position. autoTable handles page breaks for itself, 
        // but we want a clear separation for the new section.
        doc.addPage();

        let finalY = 20; // Start at top of new page
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text(`III. ${t('register_page.sanitary.title').toUpperCase()}`, 14, finalY);

        const sanitaryRows = interventions.map(act => [
            new Date(act.date).toLocaleDateString(i18n.language),
            act.horseName,
            act.type,
            act.details,
            act.practitioner
        ]);

        autoTable(doc, {
            startY: finalY + 10,
            head: [[
                t('register_page.sanitary.columns.date'),
                t('register_page.sanitary.columns.horse'),
                t('register_page.sanitary.columns.nature'),
                t('register_page.sanitary.columns.details'),
                t('register_page.sanitary.columns.practitioner')
            ]],
            body: sanitaryRows,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] }, // Distinct color for sanitary
            styles: { fontSize: 9 }
        });

        // --- FOOTER (All Pages) ---
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            // Footer text remains largely static as it's a specific legal reference, but we can translate "Page"
            doc.text(`Equinox - ${t('register_page.subtitle')} - Page ${i}/${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }

        // --- OPEN / DOWNLOAD ---
        window.open(doc.output('bloburl'), '_blank');
    };

    // Helper to Group Data
    const getGroupedData = (data) => {
        const groups = {};
        data.forEach(item => {
            if (!groups[item.horseName]) groups[item.horseName] = [];
            groups[item.horseName].push(item);
        });
        return groups;
    };

    const filterData = (data) => {
        if (!searchTerm) return data;
        const lowerTerm = searchTerm.toLowerCase();
        return data.filter(item =>
            item.horseName.toLowerCase().includes(lowerTerm) ||
            item.type.toLowerCase().includes(lowerTerm) ||
            (item.reason && item.reason.toLowerCase().includes(lowerTerm)) ||
            (item.details && item.details.toLowerCase().includes(lowerTerm)) ||
            (item.practitioner && item.practitioner.toLowerCase().includes(lowerTerm))
        );
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
            {/* Header (Screen Only) */}
            <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>

                {/* Top Row: Title & Back */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Button variant="secondary" onClick={() => navigate('/')} style={{ padding: '8px 12px', borderRadius: '12px' }}>
                            <ArrowLeft size={20} />
                        </Button>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-heading)' }}>{t('register_page.title')}</h2>
                            <div style={{ color: '#666', fontSize: '0.9rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ShieldCheck size={14} />
                                {t('register_page.subtitle')}
                            </div>
                        </div>
                    </div>

                    <Button onClick={handleDownloadPDF} style={{ background: '#111827', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                        <Printer size={18} />
                        <span>{t('register_page.pdf_btn')}</span>
                    </Button>
                </div>

                {/* Second Row: Search & Filters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    {/* Search Bar */}
                    <div style={{ position: 'relative', width: '100%' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                            placeholder={t('register_page.search_placeholder')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                borderRadius: '12px',
                                border: '1px solid #e5e7eb',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'all 0.2s',
                                backgroundColor: 'white',
                                color: '#333', // Dark text for readability
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                            onFocus={e => e.target.style.borderColor = '#3b82f6'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>

                    {/* View Switcher */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ background: '#f3f4f6', padding: '4px', borderRadius: '10px', display: 'inline-flex', gap: '4px' }}>
                            <button
                                onClick={() => setGroupByHorse(false)}
                                style={{
                                    padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                                    background: !groupByHorse ? 'white' : 'transparent',
                                    color: !groupByHorse ? '#2563eb' : '#6b7280',
                                    fontWeight: !groupByHorse ? 600 : 500,
                                    boxShadow: !groupByHorse ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    transition: 'all 0.2s',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <FileClock size={16} /> {t('register_page.view_all')}
                            </button>
                            <button
                                onClick={() => setGroupByHorse(true)}
                                style={{
                                    padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                                    background: groupByHorse ? 'white' : 'transparent',
                                    color: groupByHorse ? '#2563eb' : '#6b7280',
                                    fontWeight: groupByHorse ? 600 : 500,
                                    boxShadow: groupByHorse ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    transition: 'all 0.2s',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <Layers size={16} /> {t('register_page.view_by_horse')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABS Navigation */}
            <div className="no-print" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '30px',
                background: 'white',
                padding: '12px',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                border: '1px solid #f3f4f6'
            }}>
                <button
                    onClick={() => setActiveTab('sanitaire')}
                    style={{
                        padding: '12px',
                        background: activeTab === 'sanitaire' ? '#ecfdf5' : 'transparent',
                        border: activeTab === 'sanitaire' ? '1px solid #a7f3d0' : '1px solid transparent',
                        borderRadius: '10px',
                        color: activeTab === 'sanitaire' ? '#047857' : '#6b7280',
                        fontWeight: activeTab === 'sanitaire' ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    <Syringe size={24} color={activeTab === 'sanitaire' ? '#059669' : '#9ca3af'} />
                    <span>{t('register_page.tabs.sanitary')}</span>
                </button>
                <button
                    onClick={() => setActiveTab('mouvements')}
                    style={{
                        padding: '12px',
                        background: activeTab === 'mouvements' ? '#eff6ff' : 'transparent',
                        border: activeTab === 'mouvements' ? '1px solid #bfdbfe' : '1px solid transparent',
                        borderRadius: '10px',
                        color: activeTab === 'mouvements' ? '#1d4ed8' : '#6b7280',
                        fontWeight: activeTab === 'mouvements' ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    <FileClock size={24} color={activeTab === 'mouvements' ? '#2563eb' : '#9ca3af'} />
                    <span>{t('register_page.tabs.movements')}</span>
                </button>
                <button
                    onClick={() => setActiveTab('general')}
                    style={{
                        padding: '12px',
                        background: activeTab === 'general' ? '#f5f3ff' : 'transparent',
                        border: activeTab === 'general' ? '1px solid #ddd6fe' : '1px solid transparent',
                        borderRadius: '10px',
                        color: activeTab === 'general' ? '#7c3aed' : '#6b7280',
                        fontWeight: activeTab === 'general' ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    <Building size={24} color={activeTab === 'general' ? '#8b5cf6' : '#9ca3af'} />
                    <span>{t('register_page.tabs.establishment')}</span>
                </button>
            </div>

            {/* --- SCREEN & PRINTABLE CONTENT WRAPPER --- */}
            <div className="printable-register">

                {/* Header Document (Print Only) */}
                <div className="only-print" style={{ display: 'none', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid black' }}>
                    <h1 style={{ textAlign: 'center', textTransform: 'uppercase', fontSize: '24pt', marginBottom: '10px' }}>Registre d'Élevage</h1>
                    <div style={{ textAlign: 'center', fontStyle: 'italic' }}>Conforme à l'arrêté du 5 juin 2000</div>
                    {groupByHorse && <div style={{ textAlign: 'center', fontWeight: 'bold', marginTop: '10px' }}>Classement par Équidé</div>}
                </div>

                {/* 1. FICHE SIGNALETIQUE */}
                {activeTab === 'general' && (
                    <div className="register-section" style={{ marginBottom: '30px' }}>
                        <Card title={`I. ${t('register_page.establishment.title')}`} icon={Building} className="print-card-reset">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Layout Grid manually since we can't rely on tailwind grid */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '20px' }}>
                                        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div className="info-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.9rem', fontWeight: 500, marginBottom: '6px' }}><User size={14} /> {t('register_page.establishment.owner')}</label>
                                                {isEditing ? (
                                                    <input
                                                        style={{ width: '100%', padding: '10px', border: '1px solid #93c5fd', borderRadius: '8px', outline: 'none', fontSize: '1rem', color: '#333', backgroundColor: '#fff' }}
                                                        value={establishment.owner}
                                                        onChange={e => setEstablishment({ ...establishment, owner: e.target.value })}
                                                    />
                                                ) : (
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1f2937', padding: '6px 0' }}>{establishment.owner}</div>
                                                )}
                                            </div>
                                            <div className="info-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.9rem', fontWeight: 500, marginBottom: '6px' }}><Building size={14} /> {t('register_page.establishment.name')}</label>
                                                {isEditing ? (
                                                    <input
                                                        style={{ width: '100%', padding: '10px', border: '1px solid #93c5fd', borderRadius: '8px', outline: 'none', fontSize: '1rem', color: '#333', backgroundColor: '#fff' }}
                                                        value={establishment.name}
                                                        onChange={e => setEstablishment({ ...establishment, name: e.target.value })}
                                                    />
                                                ) : (
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1f2937', padding: '6px 0' }}>{establishment.name}</div>
                                                )}
                                            </div>
                                            <div className="info-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.9rem', fontWeight: 500, marginBottom: '6px' }}><MapPin size={14} /> {t('register_page.establishment.address')}</label>
                                                {isEditing ? (
                                                    <input
                                                        style={{ width: '100%', padding: '10px', border: '1px solid #93c5fd', borderRadius: '8px', outline: 'none', fontSize: '1rem', color: '#333', backgroundColor: '#fff' }}
                                                        value={establishment.address}
                                                        onChange={e => setEstablishment({ ...establishment, address: e.target.value })}
                                                    />
                                                ) : (
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1f2937', padding: '6px 0' }}>{establishment.address}</div>
                                                )}
                                            </div>
                                            <div className="info-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.9rem', fontWeight: 500, marginBottom: '6px' }}><Stethoscope size={14} /> {t('register_page.establishment.vet')}</label>
                                                {isEditing ? (
                                                    <input
                                                        style={{ width: '100%', padding: '10px', border: '1px solid #93c5fd', borderRadius: '8px', outline: 'none', fontSize: '1rem', color: '#333', backgroundColor: '#fff' }}
                                                        value={establishment.vet}
                                                        onChange={e => setEstablishment({ ...establishment, vet: e.target.value })}
                                                        placeholder={t('register_page.establishment.not_set')}
                                                    />
                                                ) : (
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1f2937', padding: '6px 0' }}>{establishment.vet}</div>
                                                )}
                                            </div>
                                            <div className="info-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.9rem', fontWeight: 500, marginBottom: '6px' }}><FileText size={14} /> {t('register_page.establishment.siret')}</label>
                                                {isEditing ? (
                                                    <input
                                                        style={{ width: '100%', padding: '10px', border: '1px solid #93c5fd', borderRadius: '8px', outline: 'none', fontSize: '1rem', color: '#333', backgroundColor: '#fff' }}
                                                        value={establishment.siret}
                                                        onChange={e => setEstablishment({ ...establishment, siret: e.target.value })}
                                                        placeholder={t('register_page.establishment.not_set')}
                                                    />
                                                ) : (
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1f2937', padding: '6px 0' }}>{establishment.siret || t('register_page.establishment.not_set')}</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* LOGO & ACTIONS */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', minWidth: '160px', alignSelf: 'start' }}>
                                            {establishment.logo && (
                                                <div style={{
                                                    width: '140px', height: '140px', borderRadius: '16px',
                                                    border: '2px dashed #e5e7eb',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    overflow: 'hidden', background: '#f9fafb'
                                                }}>
                                                    <img src={establishment.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                </div>
                                            )}
                                            <Button
                                                variant={isEditing ? "primary" : "secondary"}
                                                onClick={() => isEditing ? handleSaveEstablishment() : setIsEditing(true)}
                                                style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
                                            >
                                                {isEditing ? <><Save size={14} /> {t('register_page.establishment.save_btn')}</> : <><Edit2 size={14} /> {t('register_page.establishment.edit_btn')}</>}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* 2. MOUVEMENTS */}
                {activeTab === 'mouvements' && (
                    <div className="register-section" style={{ marginBottom: '30px' }}>
                        <Card title={`II. ${t('register_page.movements.title')} (${filterData(movements).length})`} icon={FileClock} className="print-card-reset">
                            {groupByHorse ? (
                                Object.entries(getGroupedData(filterData(movements))).map(([horseName, horseMovements]) => (
                                    <div key={horseName} style={{ marginBottom: '25px', breakInside: 'avoid' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e40af', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px', marginBottom: '15px' }}>{horseName}</h3>
                                        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px', fontSize: '0.9rem' }}>
                                                <thead>
                                                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                        <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>{t('register_page.movements.columns.date')}</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>{t('register_page.movements.columns.movement')}</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>{t('register_page.movements.columns.reason')}</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>{t('register_page.movements.columns.origin_dest')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {horseMovements.map((m, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: 'white' }}>
                                                            <td style={{ padding: '12px' }}>{new Date(m.date).toLocaleDateString(i18n.language)}</td>
                                                            <td style={{ padding: '12px' }}>
                                                                <span style={{
                                                                    padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700,
                                                                    background: m.type === 'ENTRÉE' ? '#dcfce7' : '#fee2e2',
                                                                    color: m.type === 'ENTRÉE' ? '#15803d' : '#b91c1c'
                                                                }}>{m.type}</span>
                                                            </td>
                                                            <td style={{ padding: '12px' }}>{m.reason}</td>
                                                            <td style={{ padding: '12px', color: '#6b7280' }}>{m.origin}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                <th style={{ padding: '16px', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>{t('register_page.movements.columns.date')}</th>
                                                <th style={{ padding: '16px', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>{t('register_page.movements.columns.movement')}</th>
                                                <th style={{ padding: '16px', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>{t('register_page.movements.columns.horse')}</th>
                                                <th style={{ padding: '16px', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>{t('register_page.movements.columns.reason')}</th>
                                                <th style={{ padding: '16px', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>{t('register_page.movements.columns.origin_dest')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filterData(movements).length > 0 ? filterData(movements).map((m, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: 'white' }}>
                                                    <td style={{ padding: '16px', fontWeight: 500 }}>{new Date(m.date).toLocaleDateString(i18n.language)}</td>
                                                    <td style={{ padding: '16px' }}>
                                                        <span style={{
                                                            padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                                                            background: m.type === 'ENTRÉE' ? '#dcfce7' : '#fee2e2',
                                                            color: m.type === 'ENTRÉE' ? '#166534' : '#991b1b',
                                                            display: 'inline-block'
                                                        }}>
                                                            {m.type}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px', fontWeight: 700, color: '#2563eb' }}>{m.horseName}</td>
                                                    <td style={{ padding: '16px' }}>{m.reason}</td>
                                                    <td style={{ padding: '16px', color: '#6b7280', fontStyle: 'italic' }}>{m.origin}</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>{t('register_page.movements.empty')}</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* 3. SANITAIRE */}
                {activeTab === 'sanitaire' && (
                    <div className="register-section" style={{ marginBottom: '30px' }}>
                        <Card title={`III. ${t('register_page.sanitary.title')} (${filterData(interventions).length})`} icon={Syringe} className="print-card-reset">
                            {groupByHorse ? (
                                Object.entries(getGroupedData(filterData(interventions))).map(([horseName, acts]) => (
                                    <div key={horseName} style={{ marginBottom: '25px', breakInside: 'avoid' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#15803d', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px', marginBottom: '15px' }}>{horseName}</h3>
                                        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px', fontSize: '0.9rem' }}>
                                                <thead>
                                                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                        <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>{t('register_page.sanitary.columns.date')}</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>{t('register_page.sanitary.columns.nature')}</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>{t('register_page.sanitary.columns.details')}</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>{t('register_page.sanitary.columns.practitioner')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {acts.map((act, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: 'white' }}>
                                                            <td style={{ padding: '12px' }}>{new Date(act.date).toLocaleDateString(i18n.language)}</td>
                                                            <td style={{ padding: '12px', fontWeight: 500 }}>{act.type}</td>
                                                            <td style={{ padding: '12px' }}>{act.details}</td>
                                                            <td style={{ padding: '12px', color: '#6b7280' }}>{act.practitioner}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                <th style={{ padding: '16px', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>{t('register_page.sanitary.columns.date')}</th>
                                                <th style={{ padding: '16px', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>{t('register_page.sanitary.columns.horse')}</th>
                                                <th style={{ padding: '16px', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>{t('register_page.sanitary.columns.nature')}</th>
                                                <th style={{ padding: '16px', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>{t('register_page.sanitary.columns.details')}</th>
                                                <th style={{ padding: '16px', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>{t('register_page.sanitary.columns.practitioner')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filterData(interventions).length > 0 ? filterData(interventions).map((act, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: 'white' }}>
                                                    <td style={{ padding: '16px', fontWeight: 500 }}>{new Date(act.date).toLocaleDateString(i18n.language)}</td>
                                                    <td style={{ padding: '16px', fontWeight: 700, color: '#15803d' }}>{act.horseName}</td>
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {act.type === 'Vaccin' && <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '4px', borderRadius: '4px' }}><Syringe size={14} /></span>}
                                                            {act.type === 'Vermifuge' && <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px', borderRadius: '4px' }}><Activity size={14} /></span>}
                                                            <span style={{ fontWeight: 500 }}>{act.type}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px', color: '#374151' }}>{act.details}</td>
                                                    <td style={{ padding: '16px', color: '#6b7280', fontStyle: 'italic' }}>{act.practitioner}</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>{t('register_page.sanitary.empty')}</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div style={{ marginTop: '20px', padding: '16px', background: '#fefce8', borderRadius: '12px', border: '1px solid #fde047', fontSize: '0.9rem', color: '#854d0e', display: 'flex', alignItems: 'start', gap: '12px', lineHeight: '1.5' }}>
                                <TriangleAlert size={20} className="flex-shrink-0" style={{ marginTop: '2px' }} />
                                <span>
                                    <strong>{t('register_page.sanitary.warning')}</strong>
                                </span>
                            </div>
                        </Card>
                    </div>
                )
                }

            </div >

            <style>{`
                /* Screen improvements */
                @media print {
                    .no-print { display: none !important; }
                    .only-print { display: block !important; }
                    
                    body { background: white; margin: 0; padding: 0cm; font-family: 'Times New Roman', serif; }
                    
                    /* Reset Card styles for print to be simple/black-white */
                    .print-card-reset { 
                        box-shadow: none !important; 
                        border: none !important; 
                        background: white !important;
                        padding: 0 !important;
                    }

                    /* Headers */
                    h2, h3 { color: black !important; }
                    
                    /* Table Borders for Print - STRICT LEGAL FORMAT */
                    table { border: 1px solid #000 !important; width: 100%; font-size: 11pt !important; }
                    th { border: 1px solid #000 !important; background: #eee !important; color: black !important; font-weight: bold; }
                    td { border: 1px solid #000 !important; color: black !important; }
                    tr { border: 1px solid #000 !important; page-break-inside: avoid; }

                    /* Badges reset to text */
                    span { background: transparent !important; color: black !important; padding: 0 !important; border-radius: 0 !important; }

                    .printable-register { display: block !important; width: 100%; }
                    .register-section { display: block !important; page-break-after: always; }
                    
                    @page { size: A4 landscape; margin: 1cm; }
                }
            `}</style>
        </div >
    );
};

export default Register;
