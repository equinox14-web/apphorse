import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { canAccess } from '../utils/permissions';
import Card from '../components/Card';
import Button from '../components/Button';
import { Syringe, Stethoscope, Calendar, AlertCircle, CheckCircle, Plus, ArrowLeft, Pencil, Trash2 } from 'lucide-react';

import { useTranslation, Trans } from 'react-i18next';

const Care = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('vaccins');



    const tabs = [
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

    React.useEffect(() => {
        const teamData = JSON.parse(localStorage.getItem('appHorse_team_v2') || '[]');
        const clientData = JSON.parse(localStorage.getItem('appHorse_clients_v2') || '[]');

        // Load Horses for Selector
        const savedHorses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const savedMares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');
        setHorsesList([...savedHorses, ...savedMares]);

        // Split Team into Staff and Partners
        setTeamMembers(teamData.filter(m => !m.isExternal));
        setPartners(teamData.filter(m => m.isExternal));

        setExternalContacts(clientData);
    }, []);

    // Save to localStorage whenever items change
    React.useEffect(() => {
        localStorage.setItem('appHorse_careItems_v3', JSON.stringify(items));
    }, [items]);

    const [showModal, setShowModal] = useState(false);
    // lastDate is the primary input now
    const [newItem, setNewItem] = useState({ id: null, type: 'vaccins', subtype: '', lastDate: '', date: '', notes: '', practitioner: '', horseId: '' });

    // Filter Items
    const filteredItems = items.filter(item => {
        const typeMatch = item.type === activeTab;
        const horseMatch = id ? item.horseId === id : true;
        return typeMatch && horseMatch;
    });
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
                const isSameType = i.type === activeTab;
                const isSameName = i.name === (newItem.subtype || newItem.type);
                return !(isSameHorse && isSameType && isSameName);
            });

            const itemToAdd = {
                id: Date.now(),
                type: activeTab,
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
        setNewItem({ id: null, type: activeTab, subtype: '', lastDate: '', date: '', notes: '' });
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

    return (
        <div className="animate-fade-in">

            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {id && (
                        <Button variant="secondary" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
                            <ArrowLeft size={20} />
                        </Button>
                    )}
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>{title}</h2>
                </div>
                <Button onClick={openAddModal}>
                    <Plus size={18} />
                    {t('care_page.add_button')}
                </Button>
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="care-layout">
                <style>{`
                    @media (min-width: 768px) {
                        .care-layout {
                            grid-template-columns: 1fr 2fr !important;
                        }
                    }
                `}</style>

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
                        <Card key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

                            {/* Type Selection */}
                            {activeTab === 'vaccins' ? (
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
                                        {activeTab === 'vermifuges' ? t('care_page.modal.wormer_label') : t('care_page.modal.label_label')}
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
                                        {activeTab === 'marechal' && ["Parage", "Ferrure"].map(v => <option key={v} value={v}>{v}</option>)}
                                        {activeTab === 'vermifuges' && vermifugeTypes.map(v => <option key={v} value={v}>{v}</option>)}
                                        {activeTab === 'osteo' && ["Ostéo", "Dentiste"].map(v => <option key={v} value={v}>{v}</option>)}
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
                                    {activeTab === 'marechal' ? t('care_page.modal.interval_std', { days: 45 }) : (activeTab === 'vermifuges' ? t('care_page.modal.interval_std', { days: 90 }) : t('care_page.modal.interval_std', { days: 365 }))}
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
        </div>
    );
};

export default Care;
