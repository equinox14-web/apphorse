import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { ArrowLeft, Plus, Activity, Calendar, FileText, CheckCircle, AlertCircle, Upload, Camera, Trash2, Printer } from 'lucide-react';

// ... (rest of imports)

// ...


const BreedingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // 1. Load Mare Data
    const [mare, setMare] = useState(null);
    const [events, setEvents] = useState([]);

    // Add delete handler inside component
    const handleDeleteEvent = (eventId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
            setEvents(events.filter(e => e.id !== eventId));
        }
    };
    const [isHoveringImage, setIsHoveringImage] = useState(false);

    useEffect(() => {
        const savedMares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');
        const foundMare = savedMares.find(m => m.id.toString() === id);
        if (foundMare) {
            setMare(foundMare);
            // Load Events for this mare
            let savedEvents = JSON.parse(localStorage.getItem(`appHorse_breeding_events_${id}`) || '[]');

            // CLEANUP: Remove Vaccins if present
            const hasVaccines = savedEvents.some(e => e.type === 'Vaccin');
            // MIGRATION: Fix Typo 'Poulainage' -> 'Poulinage'
            const hasTypo = savedEvents.some(e => e.type === 'Poulainage');

            if (hasVaccines || hasTypo) {
                savedEvents = savedEvents
                    .filter(e => e.type !== 'Vaccin')
                    .map(e => e.type === 'Poulainage' ? { ...e, type: 'Poulinage' } : e);

                localStorage.setItem(`appHorse_breeding_events_${id}`, JSON.stringify(savedEvents));
            }

            setEvents(savedEvents);
        }
    }, [id]);

    const handleImageUpdate = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2000000) {
                alert("Image trop lourde (Max 2Mo)");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const newImage = reader.result;
                setMare(prev => ({ ...prev, image: newImage }));

                // Update Global Storage
                const savedMares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');
                const updatedMares = savedMares.map(m =>
                    m.id.toString() === id ? { ...m, image: newImage } : m
                );
                localStorage.setItem('appHorse_breeding_v2', JSON.stringify(updatedMares));
            };
            reader.readAsDataURL(file);
        }
    };

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newEvent, setNewEvent] = useState({ type: 'Echographie', date: '', note: '' });

    // Save Events
    useEffect(() => {
        if (mare) {
            localStorage.setItem(`appHorse_breeding_events_${id}`, JSON.stringify(events));
        }
    }, [events, mare, id]);

    const handleAddEvent = (e) => {
        e.preventDefault();

        let updatedEvents;

        if (editingId) {
            // EDIT MODE
            updatedEvents = events.map(evt =>
                evt.id === editingId
                    ? { ...evt, ...newEvent, status: 'done' } // Update and mark as Done
                    : evt
            );
        } else {
            // CREATE MODE
            const evt = {
                id: Date.now(),
                ...newEvent,
                status: 'done'
            };
            updatedEvents = [...events, evt];
        }

        // 2. Create Next Event if Scheduled (Common for both modes)
        let nextEvt = null;
        if (newEvent.nextDate && newEvent.nextType) {
            nextEvt = {
                id: Date.now() + 1,
                type: newEvent.nextType,
                date: newEvent.nextDate,
                note: 'Rappel programmé',
                status: 'todo'
            };
            updatedEvents.push(nextEvt);
        }

        // Sort events
        updatedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(updatedEvents);

        // 3. AUTOMATION: Update Mare Status based on Diagnosis
        const noteLower = newEvent.note ? newEvent.note.toLowerCase() : '';

        const isPositive = newEvent.type.startsWith('DG') && (
            newEvent.note.includes('+') ||
            noteLower.includes('positif') ||
            noteLower.includes('ok')
        );

        const isNegative = (newEvent.type.startsWith('DG') || newEvent.type === 'Echographie') && (
            newEvent.note.includes('-') ||
            noteLower.includes('vide') ||
            noteLower.includes('négatif') ||
            noteLower.includes('avortée') ||
            noteLower.includes('coulée')
        );

        if (isPositive) {
            // Find the last reproduction event (IA or Saillie) BEFORE this DG
            const lastBreeding = updatedEvents
                .filter(e =>
                    (e.type.includes('Insemination') || e.type.includes('Saillie')) &&
                    new Date(e.date) <= new Date(newEvent.date)
                )
                .pop(); // Get last one

            if (lastBreeding) {
                const breedingDate = new Date(lastBreeding.date);
                const termDate = new Date(breedingDate);
                termDate.setDate(breedingDate.getDate() + 340); // +11 months approx

                const daysGestation = Math.floor((new Date() - breedingDate) / (1000 * 60 * 60 * 24));

                const updatedMare = {
                    ...mare,
                    status: 'Gestante',
                    lastBreedingDate: lastBreeding.date,
                    termDate: termDate.toISOString().split('T')[0],
                    daysGestation: daysGestation > 0 ? daysGestation : 0
                };

                setMare(updatedMare);

                // Update LocalStorage
                const savedMares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');
                const newMaresList = savedMares.map(m => m.id.toString() === id ? updatedMare : m);
                localStorage.setItem('appHorse_breeding_v2', JSON.stringify(newMaresList));

                alert(`Félicitations ! La jument est passée 'Gestante'.\nTerme calculé : ${termDate.toLocaleDateString()}`);
            } else {
                alert("Impossible de calculer le terme : Aucune IA ou Saillie trouvée avant ce diagnostic.");
            }
        } else if (isNegative) {
            // Reset to Empty
            const updatedMare = {
                ...mare,
                status: 'Vide',
                termDate: '-',
                daysGestation: 0
            };
            setMare(updatedMare);

            // Update LocalStorage
            const savedMares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');
            const newMaresList = savedMares.map(m => m.id.toString() === id ? updatedMare : m);
            localStorage.setItem('appHorse_breeding_v2', JSON.stringify(newMaresList));

            alert(`Mise à jour : La jument est repassée 'Vide'.`);
        }

        setShowModal(false);
        setNewEvent({ type: 'Echographie', date: '', note: '' }); // Reset
        setEditingId(null);
    };

    if (!mare) return <div style={{ padding: '2rem' }}>Poulinière non trouvée...</div>;

    const gestationProgress = mare.status === 'Gestante' ? Math.min(100, Math.max(0, (mare.daysGestation / 340) * 100)) : 0;

    const getEventColor = (type) => {
        if (!type) return '#8c8c8c';
        // Reproduction (IA, Saillie) -> Blue
        if (type.includes('Insemination') || type.includes('Saillie')) return '#1890ff';
        // Diagnosis (Echo, DG, Palpation) -> Purple
        if (type.includes('DG') || type === 'Echographie' || type === 'Palpation') return '#722ed1';
        // Medical / Intervention -> Orange
        if (['Lavage', 'Prélèvement', 'Vulvoplastie', 'Induction', 'Transfert'].some(t => type.includes(t))) return '#faad14';
        // Birth -> Pink
        if (type === 'Poulinage') return '#eb2f96';

        return '#8c8c8c'; // Default Grey
    };

    return (
        <div className="animate-fade-in">
            <div className="responsive-row" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="secondary" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }} className="no-print">
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="no-print">
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Suivi : {mare.name}</h2>
                        <span style={{ color: mare.status === 'Gestante' ? '#52c41a' : '#666', fontWeight: mare.status === 'Gestante' ? 600 : 400 }}>
                            <span style={{ background: '#eee', color: '#333', padding: '2px 6px', borderRadius: '4px', marginRight: '8px', fontSize: '0.8em' }}>{mare.role || 'Poulinière'}</span>
                            {mare.status === 'Gestante' ? `Pleine (Terme : ${new Date(mare.termDate).toLocaleDateString()})` : mare.status}
                        </span>
                    </div>
                </div>
                <Button variant="secondary" onClick={() => window.print()} className="no-print">
                    <Printer size={18} /> Exporter / Imprimer
                </Button>
            </div>

            <style>{`
                .print-only { display: none; }
                @media print {
                    .no-print, .screen-only { display: none !important; }
                    .print-only { display: block !important; }
                    .animate-fade-in { animation: none !important; }
                    
                    /* Reset Page/Body Layout to prevent extra pages */
                    html, body, #root, .app-layout { 
                        height: auto !important; 
                        min-height: 0 !important; 
                        margin: 0 !important; 
                        padding: 0 !important;
                        overflow: visible !important;
                        display: block !important; /* Disable flex full height */
                    }

                    body { 
                        font-family: 'Times New Roman', serif; 
                        padding: 2cm !important; /* Only padding on body for content margin */
                    }
                    
                    @page { 
                        margin: 0; 
                        size: A4; 
                    }
                    
                    /* Reset Main Layout Margins */
                    .layout-content { 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        height: auto !important;
                        min-height: 0 !important;
                        display: block !important;
                    }
                    main { padding: 0 !important; margin: 0 !important; }
                }
            `}</style>

            {/* PRINT LAYOUT (Hidden on Screen) */}
            <div className="print-only">
                {/* TITLE & MARE INFO */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '24pt', fontWeight: 'bold', color: '#2c3e50', margin: '0 0 0.5rem 0' }}>{mare.name}</h1>
                        <div style={{ fontSize: '14pt', color: '#666', marginBottom: '1rem' }}>
                            {mare.role || 'Poulinière'} — Saison {new Date().getFullYear()}
                        </div>

                        {mare.sire && (
                            <div style={{ fontSize: '12pt', color: '#444' }}>
                                {mare.role === 'Porteuse' ? 'Père Bio.' : 'Etalon'} : <strong>{mare.sire}</strong>
                            </div>
                        )}
                        {mare.geneticDam && (
                            <div style={{ fontSize: '12pt', color: '#444' }}>
                                Mère Bio. : <strong>{mare.geneticDam}</strong>
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        {localStorage.getItem('user_logo') && (
                            <img src={localStorage.getItem('user_logo')} alt="Logo" style={{ height: '100px', objectFit: 'contain' }} />
                        )}
                    </div>
                </div>

                {/* TABLE */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: '2rem' }}>
                    <thead>
                        <tr style={{ background: '#2c3e50', color: 'white' }}>
                            <th style={{ padding: '12px', textAlign: 'left', width: '120px' }}>DATE</th>
                            <th style={{ padding: '12px', textAlign: 'left', width: '200px' }}>ACTE</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>NOTES & RÉSULTATS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.filter(e => e.status !== 'todo' && e.type !== 'Vaccin').map((evt, idx) => (
                            <tr key={evt.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                                <td style={{ padding: '12px' }}>{new Date(evt.date).toLocaleDateString('fr-FR')}</td>
                                <td style={{ padding: '12px', fontWeight: 'bold', color: '#2c3e50' }}>{evt.type}</td>
                                <td style={{ padding: '12px', color: '#555' }}>
                                    {evt.note}
                                    {(evt.og || evt.od || evt.uterus) && (
                                        <div style={{ fontSize: '9pt', color: '#666', marginTop: '4px', fontStyle: 'italic' }}>
                                            {[
                                                evt.og && `OG: ${evt.og}mm`,
                                                evt.od && `OD: ${evt.od}mm`,
                                                evt.uterus && `Utérus: ${evt.uterus}`
                                            ].filter(Boolean).join(' • ')}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* FOOTER */}
                <div style={{ position: 'fixed', bottom: '1cm', left: 0, right: 0, textAlign: 'center', fontSize: '8pt', color: '#aaa', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                    Haras de la Vallée - 123 Route des Étalons - 75000 Paris<br />
                    SIRET: 123 456 789 00012 - Document généré via AppHorse
                </div>
            </div>

            {/* SCREEN LAYOUT */}
            <div className="screen-only responsive-grid">

                {/* Main Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Card title="Suivi Gynéco & Reproduction">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }} className="no-print">
                            <Button onClick={() => {
                                setEditingId(null);
                                setNewEvent({ type: 'Echographie', date: new Date().toISOString().split('T')[0], note: '' });
                                setShowModal(true);
                            }} style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                                <Plus size={16} /> Ajouter un événement
                            </Button>
                        </div>

                        <div style={{ position: 'relative', paddingLeft: '1rem' }}>
                            {/* Vertical Line */}
                            <div style={{ position: 'absolute', left: '19px', top: '10px', bottom: '10px', width: '2px', background: '#f0f0f0' }}></div>

                            {events.filter(e => e.type !== 'Vaccin').map((evt, idx) => (
                                <div key={evt.id} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', position: 'relative' }}>
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '50%',
                                        background: getEventColor(evt.type),
                                        border: `2px solid ${getEventColor(evt.type)}`,
                                        boxShadow: '0 0 0 3px white', // White ring to separate from line
                                        marginTop: '4px',
                                        zIndex: 1
                                    }} />

                                    <div style={{ flex: 1, background: '#f9f9f9', padding: '0.8rem', borderRadius: '8px', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                                            <strong style={{ color: evt.status === 'todo' ? '#666' : '#000', fontSize: '1rem' }}>{evt.type}</strong>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#888' }}>{new Date(evt.date).toLocaleDateString()}</span>
                                                <button
                                                    className="no-print"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteEvent(evt.id);
                                                    }}
                                                    style={{
                                                        color: '#999',
                                                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                                                        transition: 'color 0.2s', display: 'flex'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.color = '#ff4d4f'}
                                                    onMouseLeave={e => e.currentTarget.style.color = '#999'}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ color: '#555', fontSize: '0.95rem' }}>
                                            {(evt.og || evt.od || evt.uterus) && (
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                                    {evt.og && <span style={{ background: '#e6f7ff', color: '#096dd9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>OG: {evt.og}mm</span>}
                                                    {evt.od && <span style={{ background: '#e6f7ff', color: '#096dd9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>OD: {evt.od}mm</span>}
                                                    {evt.uterus && <span style={{ background: '#fff7e6', color: '#d46b08', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>{evt.uterus}</span>}
                                                </div>
                                            )}
                                            {evt.note}
                                        </div>
                                        {evt.status === 'todo' && (
                                            <button
                                                className="no-print"
                                                onClick={() => {
                                                    setNewEvent(evt);
                                                    setEditingId(evt.id);
                                                    setShowModal(true);
                                                }}
                                                style={{
                                                    marginTop: '0.5rem', fontSize: '0.9rem', color: 'white',
                                                    background: '#1890ff', border: 'none', cursor: 'pointer', fontWeight: 600,
                                                    padding: '0.5rem 1rem', borderRadius: '6px', width: '100%'
                                                }}
                                            >
                                                Remplir le rapport / Valider
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="no-print">
                    <Card style={{ textAlign: 'center', padding: 0, overflow: 'hidden' }}>
                        <div
                            style={{ height: '200px', background: '#f0f0f0', position: 'relative' }}
                            onMouseEnter={() => setIsHoveringImage(true)}
                            onMouseLeave={() => setIsHoveringImage(false)}
                        >
                            {mare.image ? (
                                <img src={mare.image} alt={mare.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '4rem' }}>🐴</div>
                            )}

                            {/* Upload Controls */}
                            <input id="mare-upload" type="file" accept="image/*" onChange={handleImageUpdate} style={{ display: 'none' }} />
                            <input id="mare-cam" type="file" accept="image/*" capture="environment" onChange={handleImageUpdate} style={{ display: 'none' }} />

                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                                opacity: isHoveringImage ? 1 : 0, transition: 'opacity 0.2s'
                            }}>
                                <label htmlFor="mare-upload" className="glass-panel" style={{ cursor: 'pointer', padding: '0.8rem', borderRadius: '50%', background: 'white', color: '#1890ff' }} title="Galerie">
                                    <Upload size={20} />
                                </label>
                                <label htmlFor="mare-cam" className="glass-panel" style={{ cursor: 'pointer', padding: '0.8rem', borderRadius: '50%', background: 'white', color: '#52c41a' }} title="Caméra">
                                    <Camera size={20} />
                                </label>
                            </div>
                        </div>

                        <div style={{ padding: '1rem' }}>
                            <h3>{mare.status}</h3>
                            {mare.status === 'Gestante' && (
                                <div style={{ marginTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                                        <span>Progression</span>
                                        <span>{mare.daysGestation} jours</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${gestationProgress}%`, height: '100%', background: '#52c41a' }}></div>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>Terme : {new Date(mare.termDate).toLocaleDateString()}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card title="Notes">
                        <textarea
                            placeholder="Notes libres sur la jument..."
                            style={{ width: '100%', height: '100px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        ></textarea>
                    </Card>
                </div>
            </div>

            {/* Modal */}
            {
                showModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0)', zIndex: 1000,
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                        paddingTop: '2vh',
                        pointerEvents: 'auto',
                        overflowY: 'auto'
                    }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setShowModal(false);
                            }
                        }}
                    >
                        <Card style={{ width: '90%', maxWidth: '400px', pointerEvents: 'auto', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{editingId ? 'Compléter / Modifier' : 'Ajouter un événement'}</h3>
                            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Type</label>
                                    <select
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white' }}
                                        value={newEvent.type}
                                        onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                                    >
                                        <option value="Echographie">Echographie</option>
                                        <option value="DG 14j">DG 14j (Premier constat)</option>
                                        <option value="DG 30j">DG 30j (Confirmation)</option>
                                        <option value="DG 45j">DG 45j (Sexage)</option>
                                        <option value="DG 90j">DG 90j+ (Automne)</option>
                                        <option value="Palpation">Palpation</option>
                                        <option value="Insemination">Insemination (IA)</option>
                                        <option value="Saillie">Saillie (Naturelle)</option>
                                        <option value="Lavage">Lavage Utérin</option>
                                        <option value="Prélèvement">Prélèvement / Bactério</option>
                                        <option value="Vulvoplastie">Vulvoplastie (Caslick)</option>
                                        <option value="Induction">Induction Ovulation</option>
                                        <option value="Transfert">Transfert d'embryon</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Date</label>
                                    <input
                                        type="date"
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                        value={newEvent.date}
                                        onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Note / Résultat Global</label>
                                    {newEvent.type.startsWith('DG') ? (
                                        <select
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white' }}
                                            value={newEvent.note}
                                            onChange={e => setNewEvent({ ...newEvent, note: e.target.value })}
                                        >
                                            <option value="">-- Résultat --</option>
                                            <option value="DG+">DG+ (Positif)</option>
                                            <option value="DG++">DG++ (Jumeaux)</option>
                                            <option value="DG-">DG- (Vide / Négatif)</option>
                                            <option value="DG?">DG? (A recontrôler)</option>
                                            <option value="Avortée">Avortée</option>
                                            <option value="Coulée">Coulée</option>
                                        </select>
                                    ) : (
                                        <input
                                            placeholder="Ex: Positif, Jumeaux..."
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                            value={newEvent.note}
                                            onChange={e => setNewEvent({ ...newEvent, note: e.target.value })}
                                        />
                                    )}
                                </div>

                                {(newEvent.type === 'Echographie') && (
                                    <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', border: '1px dashed #bae6fd' }}>
                                        <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '1rem', color: '#0284c7' }}>Détails Gynéco</h4>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666' }}>Ovaire Gauche (mm)</label>
                                                <input
                                                    placeholder="Ex: 35"
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                                    value={newEvent.og || ''}
                                                    onChange={e => setNewEvent({ ...newEvent, og: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666' }}>Ovaire Droit (mm)</label>
                                                <input
                                                    placeholder="Ex: 40"
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                                    value={newEvent.od || ''}
                                                    onChange={e => setNewEvent({ ...newEvent, od: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666' }}>Utérus / Col</label>
                                            <input
                                                placeholder="Ex: Tonique, Oedème..."
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                                value={newEvent.uterus || ''}
                                                onChange={e => setNewEvent({ ...newEvent, uterus: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <Button variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Annuler</Button>
                                    <Button type="submit" style={{ flex: 1 }}>Ajouter</Button>
                                </div>


                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee', position: 'relative', zIndex: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#1890ff' }}>
                                        <Calendar size={16} /> Programmer la suite ?
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', position: 'relative', zIndex: 10 }}>
                                        <select
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                borderRadius: '6px',
                                                border: '1px solid #ddd',
                                                fontSize: '0.85rem',
                                                position: 'relative',
                                                zIndex: 10,
                                                cursor: 'pointer',
                                                backgroundColor: 'white'
                                            }}
                                            value={newEvent.nextType || ''}
                                            onChange={e => setNewEvent({ ...newEvent, nextType: e.target.value })}
                                        >
                                            <option value="">-- Type --</option>
                                            <option value="Echographie">Echographie</option>
                                            <option value="DG 14j">DG 14j</option>
                                            <option value="DG 30j">DG 30j</option>
                                            <option value="Insemination">Insemination</option>
                                            <option value="Poulinage">Poulinage</option>
                                            <option value="DG 45j">DG 45j</option>
                                            <option value="Sexage">Sexage</option>
                                            <option value="Contrôle Placenta">Contrôle Placenta</option>
                                            <option value="Autre">Autre</option>
                                        </select>
                                        <input
                                            type="date"
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                borderRadius: '6px',
                                                border: '1px solid #ddd',
                                                fontSize: '0.85rem',
                                                position: 'relative',
                                                zIndex: 10,
                                                cursor: 'pointer',
                                                backgroundColor: 'white'
                                            }}
                                            value={newEvent.nextDate || ''}
                                            onChange={e => setNewEvent({ ...newEvent, nextDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </form>
                        </Card>
                    </div>
                )
            }
        </div >
    );
};

export default BreedingDetail;
