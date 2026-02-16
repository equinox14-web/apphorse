import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FileText, Download, Filter, Search, Stethoscope, Activity, ClipboardList, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const LegalRegister = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('movements'); // movements, sanitary, breeding
    const [searchTerm, setSearchTerm] = useState('');

    // Data States
    const [movements, setMovements] = useState([]);
    const [sanitaryMain, setSanitaryMain] = useState([]);
    const [breedingEvents, setBreedingEvents] = useState([]);

    // Filters
    const [movFilter, setMovFilter] = useState('ALL');

    useEffect(() => {
        // Load Movements
        const savedMov = localStorage.getItem('appHorse_register_movements');
        if (savedMov) setMovements(JSON.parse(savedMov));

        // Load Sanitary (Care Items)
        const savedCare = localStorage.getItem('appHorse_careItems_v3');
        if (savedCare) {
            // Sort by date desc
            const careList = JSON.parse(savedCare).sort((a, b) => new Date(b.date) - new Date(a.date));
            setSanitaryMain(careList);
        }

        // Load Breeding (Aggregate from visible horses + maybe orphaned if we could find them)
        // Currently limiting to visible horses for stability
        const savedHorses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const savedMares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');
        const allHorses = [...savedHorses, ...savedMares];

        let allBreeding = [];
        allHorses.forEach(h => {
            const bEvents = localStorage.getItem(`appHorse_breeding_events_${h.id}`);
            if (bEvents) {
                const events = JSON.parse(bEvents).map(e => ({ ...e, horseName: h.name }));
                allBreeding = [...allBreeding, ...events];
            }
        });
        allBreeding.sort((a, b) => new Date(b.date) - new Date(a.date));
        setBreedingEvents(allBreeding);

    }, []);

    // --- PDF EXPORT ---
    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);

        let title = "Registre Légal";
        if (activeTab === 'movements') title += " - Mouvements (Traçabilité)";
        else if (activeTab === 'sanitary') title += " - Sanitaire";
        else if (activeTab === 'breeding') title += " - Reproduction";

        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.text(`Édité le ${new Date().toLocaleDateString()}`, 14, 30);

        if (activeTab === 'movements') {
            const tableColumn = ["Date", "Type", "Cheval", "Raison", "Lieu / Origine"];
            const tableRows = movements.map(m => [
                new Date(m.date).toLocaleDateString(),
                m.type,
                m.horseName,
                m.reason,
                m.origin || '-'
            ]);
            doc.autoTable({ startY: 40, head: [tableColumn], body: tableRows });
        } else if (activeTab === 'sanitary') {
            const tableColumn = ["Date", "Cheval", "Acte", "Intervenant", "Lot / Délai"];
            const tableRows = sanitaryMain.map(s => [
                new Date(s.date).toLocaleDateString(),
                s.horse || 'Inconnu',
                `${s.name} (${s.type})`,
                s.practitioner || '-',
                `${s.batchNumber || '-'} / ${s.withdrawal || '-'}`
            ]);
            doc.autoTable({ startY: 40, head: [tableColumn], body: tableRows });
        } else if (activeTab === 'breeding') {
            const tableColumn = ["Date", "Jument", "Type", "Détails"];
            const tableRows = breedingEvents.map(b => [
                new Date(b.date).toLocaleDateString(),
                b.horseName,
                b.type,
                b.note || '-'
            ]);
            doc.autoTable({ startY: 40, head: [tableColumn], body: tableRows });
        }

        doc.save(`registre_${activeTab}.pdf`);
    };

    // --- RENDER HELPERS ---
    const renderMovements = () => {
        const filtered = movements.filter(m =>
            (movFilter === 'ALL' || m.type === movFilter) &&
            (m.horseName?.toLowerCase().includes(searchTerm.toLowerCase()) || m.reason?.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        return (
            <div style={{ overflowX: 'auto' }}>
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                    <select
                        value={movFilter}
                        onChange={e => setMovFilter(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
                    >
                        <option value="ALL">Tous les mouvements</option>
                        <option value="ENTRÉE">Entrées</option>
                        <option value="SORTIE">Sorties</option>
                        <option value="NAISSANCE">Naissances</option>
                        <option value="DÉCÈS">Décès</option>
                    </select>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px', fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Cheval</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Raison</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Lieu / Origine</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? filtered.map((m, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '1rem' }}>{new Date(m.date).toLocaleDateString()}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                        background: m.type === 'ENTRÉE' ? '#dcfce7' : (m.type === 'SORTIE' ? '#fee2e2' : '#f3f4f6'),
                                        color: m.type === 'ENTRÉE' ? '#166534' : (m.type === 'SORTIE' ? '#991b1b' : '#374151')
                                    }}>
                                        {m.type}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{m.horseName}</td>
                                <td style={{ padding: '1rem', color: '#4b5563' }}>{m.reason}</td>
                                <td style={{ padding: '1rem', color: '#6b7280' }}>{m.origin || '-'}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Aucun mouvement.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderSanitary = () => {
        const filtered = sanitaryMain.filter(item =>
            item.horse?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Cheval</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Acte / Produit</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Intervenant</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Lot / Délai</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Ord.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? filtered.map((s, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '1rem' }}>{new Date(s.date).toLocaleDateString()}</td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{s.horse}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 500 }}>{s.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{s.type}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>{s.practitioner || '-'}</td>
                                <td style={{ padding: '1rem', color: '#6b7280' }}>
                                    {s.batchNumber ? <div>Lot: {s.batchNumber}</div> : null}
                                    {s.withdrawal ? <div>Délai: {s.withdrawal}</div> : null}
                                    {!s.batchNumber && !s.withdrawal && '-'}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    {/* Placeholder for Prescription Link */}
                                    {s.hasPrescription ? <FileText size={16} color="#2563eb" /> : '-'}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Aucun acte sanitaire.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderBreeding = () => {
        const filtered = breedingEvents.filter(b =>
            b.horseName?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px', fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Jument</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Détails</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? filtered.map((b, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '1rem' }}>{new Date(b.date).toLocaleDateString()}</td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{b.horseName}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                        background: b.type === 'SAILLIE' ? '#fce7f3' : (b.type === 'ECHO' ? '#e0f2fe' : '#f3f4f6'),
                                        color: b.type === 'SAILLIE' ? '#be185d' : (b.type === 'ECHO' ? '#0369a1' : '#374151')
                                    }}>
                                        {b.type}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: '#4b5563' }}>{b.note || '-'}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Aucun événement de reproduction.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
            <div className="responsive-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '12px', background: '#e0e7ff', borderRadius: '12px', color: '#4338ca' }}>
                    <ClipboardList size={32} />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#312e81' }}>Registre Légal</h2>
                    <p style={{ color: '#6b7280' }}>Mouvements, Sanitaire et Reproduction (Obligations IFCE).</p>
                </div>
            </div>

            <Card className="mb-6">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            <input
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.4rem',
                                    borderRadius: '8px', border: '1px solid #ddd', outline: 'none'
                                }}
                            />
                        </div>
                    </div>
                    <Button onClick={exportPDF} variant="secondary" style={{ width: '100%', maxWidth: '200px' }}>
                        <Download size={18} style={{ marginRight: '8px' }} />
                        Exporter PDF
                    </Button>
                </div>

                {/* TABS */}
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #eee', marginTop: '1.5rem' }}>
                    <button
                        onClick={() => setActiveTab('movements')}
                        style={{
                            padding: '0.8rem 1rem', background: 'none', border: 'none',
                            borderBottom: activeTab === 'movements' ? '2px solid #4f46e5' : '2px solid transparent',
                            color: activeTab === 'movements' ? '#4f46e5' : '#6b7280',
                            fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Mouvements
                    </button>
                    <button
                        onClick={() => setActiveTab('sanitary')}
                        style={{
                            padding: '0.8rem 1rem', background: 'none', border: 'none',
                            borderBottom: activeTab === 'sanitary' ? '2px solid #4f46e5' : '2px solid transparent',
                            color: activeTab === 'sanitary' ? '#4f46e5' : '#6b7280',
                            fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Sanitaire
                    </button>
                    <button
                        onClick={() => setActiveTab('breeding')}
                        style={{
                            padding: '0.8rem 1rem', background: 'none', border: 'none',
                            borderBottom: activeTab === 'breeding' ? '2px solid #4f46e5' : '2px solid transparent',
                            color: activeTab === 'breeding' ? '#4f46e5' : '#6b7280',
                            fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Reproduction
                    </button>
                </div>
            </Card>

            <Card style={{ padding: 0, overflow: 'hidden' }}>
                {activeTab === 'movements' && renderMovements()}
                {activeTab === 'sanitary' && renderSanitary()}
                {activeTab === 'breeding' && renderBreeding()}
            </Card>
        </div>
    );
};

export default LegalRegister;
