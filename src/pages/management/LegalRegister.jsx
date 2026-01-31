import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FileText, Download, Plus, Filter, Search, ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';

const LegalRegister = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [movements, setMovements] = useState([]);
    const [filterType, setFilterType] = useState('ALL'); // ALL, ENTRÉE, SORTIE, NAISSANCE, DÉCÈS
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('appHorse_register_movements');
        if (saved) {
            setMovements(JSON.parse(saved));
        }
    }, []);

    const filteredMovements = movements.filter(m => {
        const matchesType = filterType === 'ALL' || m.type === filterType;
        const matchesSearch = m.horseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.reason && m.reason.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesType && matchesSearch;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Registre d'Élevage - Mouvements", 14, 22);
        doc.setFontSize(11);
        doc.text(`Édité le ${new Date().toLocaleDateString()}`, 14, 30);

        const tableColumn = ["Date", "Type", "Cheval", "Raison", "Lieu / Détails"];
        const tableRows = filteredMovements.map(m => [
            new Date(m.date).toLocaleDateString(),
            m.type,
            m.horseName,
            m.reason,
            m.origin || '-'
        ]);

        doc.autoTable({
            startY: 40,
            head: [tableColumn],
            body: tableRows,
        });

        doc.save("registre_elevage.pdf");
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
            <div className="responsive-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '12px', background: '#e0e7ff', borderRadius: '12px', color: '#4338ca' }}>
                    <FileText size={32} />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#312e81' }}>Registre Légal</h2>
                    <p style={{ color: '#6b7280' }}>Suivi des mouvements et registre d'élevage obligatoire.</p>
                </div>
            </div>

            {/* Responsive Styles */}
            <style>{`
                @media (max-width: 768px) {
                    .desktop-table { display: none !important; }
                    .mobile-cards { display: flex !important; flexDirection: column; gap: 1rem; }
                    .search-container { min-width: 100% !important; flex-direction: column; }
                    .search-input-wrapper { width: 100%; }
                    .filter-select { width: 100%; }
                }
                @media (min-width: 769px) {
                    .desktop-table { display: block !important; }
                    .mobile-cards { display: none !important; }
                    .search-container { min-width: 300px; }
                }
            `}</style>

            <Card className="mb-6">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="search-container" style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                        <div className="search-input-wrapper" style={{ position: 'relative', flex: 1 }}>
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
                        <select
                            className="filter-select"
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        >
                            <option value="ALL">Tout</option>
                            <option value="ENTRÉE">Entrées</option>
                            <option value="SORTIE">Sorties</option>
                            <option value="NAISSANCE">Naissances</option>
                            <option value="DÉCÈS">Décès</option>
                        </select>
                    </div>

                    <Button onClick={exportPDF} variant="secondary" style={{ width: '100%', maxWidth: '200px' }}>
                        <Download size={18} style={{ marginRight: '8px' }} />
                        PDF
                    </Button>
                </div>
            </Card>

            {/* Desktop Table View */}
            <Card style={{ padding: 0, overflow: 'hidden' }} className="desktop-table">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Date</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Type</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Cheval</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Raison</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Lieu / Origine</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMovements.length > 0 ? (
                                filteredMovements.map((move, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                                            {new Date(move.date).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                                background: move.type === 'ENTRÉE' ? '#dcfce7' : (move.type === 'SORTIE' ? '#fee2e2' : '#f3f4f6'),
                                                color: move.type === 'ENTRÉE' ? '#166534' : (move.type === 'SORTIE' ? '#991b1b' : '#374151')
                                            }}>
                                                {move.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{move.horseName}</td>
                                        <td style={{ padding: '1rem', color: '#4b5563' }}>{move.reason}</td>
                                        <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>{move.origin || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                                        Aucun mouvement enregistré.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Mobile Card View */}
            <div className="mobile-cards">
                {filteredMovements.length > 0 ? (
                    filteredMovements.map((move, idx) => (
                        <Card key={idx} style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{move.horseName}</h4>
                                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{new Date(move.date).toLocaleDateString()}</div>
                                </div>
                                <span style={{
                                    padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600,
                                    background: move.type === 'ENTRÉE' ? '#dcfce7' : (move.type === 'SORTIE' ? '#fee2e2' : '#f3f4f6'),
                                    color: move.type === 'ENTRÉE' ? '#166534' : (move.type === 'SORTIE' ? '#991b1b' : '#374151')
                                }}>
                                    {move.type}
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, color: '#374151' }}>Raison:</span>
                                    <span style={{ color: '#4b5563' }}>{move.reason}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, color: '#374151' }}>{move.type === 'ENTRÉE' ? 'Provenance:' : 'Destination:'}</span>
                                    <span style={{ color: '#4b5563' }}>{move.origin || '-'}</span>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', background: '#f9fafb', borderRadius: '8px' }}>
                        Aucun mouvement enregistré.
                    </div>
                )}
            </div>
        </div>
    );
};

export default LegalRegister;
