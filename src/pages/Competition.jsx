import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import Button from '../components/Button';
import { Trophy, Calendar as CalendarIcon, MapPin, Plus, DollarSign, Award, Clock, ChevronRight, User, Trash2 } from 'lucide-react';
import { canManageCompetition } from '../utils/permissions';

const Competition = () => {
    const { t } = useTranslation();
    // --- State ---
    const [competitions, setCompetitions] = useState(() => {
        const saved = localStorage.getItem('appHorse_competition_v1');
        return saved ? JSON.parse(saved) : [];
    });

    const [showModal, setShowModal] = useState(false);
    const [selectedComp, setSelectedComp] = useState(null); // For viewing/editing details

    // New Competition Form State
    const [newComp, setNewComp] = useState({ name: '', date: '', location: '', level: '' });

    // Entry Form State (inside detail view)
    const [newEntry, setNewEntry] = useState({ horse: '', rider: '', class: '', fee: '' });

    // --- User Type Check ---
    const [isTrotteur, setIsTrotteur] = useState(false);
    const [isGaloppeur, setIsGaloppeur] = useState(false);

    useEffect(() => {
        const activities = JSON.parse(localStorage.getItem('userActivities') || '[]');
        if (activities.includes("Chevaux de course (Trotteurs)")) {
            setIsTrotteur(true);
        }
        if (activities.includes("Chevaux de course (Galoppeurs)")) {
            setIsGaloppeur(true);
        }
    }, []);

    // --- Persistence ---
    useEffect(() => {
        localStorage.setItem('appHorse_competition_v1', JSON.stringify(competitions));
    }, [competitions]);

    // --- Helper Functions ---
    const getTotalEarnings = () => {
        let total = 0;
        competitions.forEach(c => {
            c.entries.forEach(e => total += (parseFloat(e.earnings) || 0));
        });
        return total;
    };

    const getSeasonStats = () => {
        let entriesCount = 0;
        let clearRounds = 0;
        let wins = 0;

        competitions.forEach(c => {
            c.entries.forEach(e => {
                entriesCount++;
                if (e.result === 'SF' || e.result === '0' || e.result === 'Clear') clearRounds++;
                if (e.rank === 1) wins++;
            });
        });

        return { entriesCount, clearRounds, wins };
    };

    const stats = getSeasonStats();

    // --- Actions ---
    const handleSaveCompetition = (e) => {
        e.preventDefault();
        const comp = {
            id: Date.now(),
            ...newComp,
            entries: [],
            finished: false
        };
        setCompetitions([comp, ...competitions]); // Newest first

        // --- AUTO-SYNC TO CALENDAR ---
        try {
            const existingEvents = JSON.parse(localStorage.getItem('appHorse_customEvents') || '[]');
            const calendarEvent = {
                id: Date.now() + 1, // distinct ID
                title: `🏆 ${newComp.name} (${newComp.level})`,
                dateStr: new Date(newComp.date).toISOString(),
                type: 'competition', // Special type
                color: '#d97706', // Gold/Amber
                details: `Lieu: ${newComp.location}`,
                horseId: '',
                rider: ''
            };
            localStorage.setItem('appHorse_customEvents', JSON.stringify([...existingEvents, calendarEvent]));
            // alert(t('competition_page.modal.sync_alert')); // Optional feedback
        } catch (err) {
            console.error("Sync error", err);
        }

        setShowModal(false);
        setNewComp({ name: '', date: '', location: '', level: '' });
    };

    const handleDeleteComp = (id) => {
        if (window.confirm(t('competition_page.details.delete_confirm'))) {
            setCompetitions(competitions.filter(c => c.id !== id));
            setSelectedComp(null);
        }
    };

    const handleAddEntry = (compId) => {
        if (!newEntry.horse || !newEntry.rider) return;
        const updatedCompetitions = competitions.map(c => {
            if (c.id === compId) {
                return {
                    ...c,
                    entries: [...c.entries, { id: Date.now(), ...newEntry, result: '-', rank: '-', earnings: 0 }]
                };
            }
            return c;
        });
        setCompetitions(updatedCompetitions);
        // Update selected view as well
        setSelectedComp(updatedCompetitions.find(c => c.id === compId));
        setNewEntry({ horse: '', rider: '', class: '', fee: '' });
    };

    const updateEntryResult = (compId, entryId, field, value) => {
        const updatedCompetitions = competitions.map(c => {
            if (c.id === compId) {
                return {
                    ...c,
                    entries: c.entries.map(e => e.id === entryId ? { ...e, [field]: value } : e)
                };
            }
            return c;
        });
        setCompetitions(updatedCompetitions);
        setSelectedComp(updatedCompetitions.find(c => c.id === compId));
    };

    // --- Render ---
    const isRacing = isTrotteur || isGaloppeur;

    return (
        <div className="animate-fade-in">
            {/* Header / Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/icons/coupe-du-trophee.png" alt="Gains" style={{ width: '24px', height: '24px' }} />
                    </div>
                    <div><div style={{ fontSize: '0.9rem', color: '#666' }}>{t('competition_page.stats.season_earnings')}</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{getTotalEarnings()} €</div></div>
                </Card>
                <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#dcfce7', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/icons/1er-prix.png" alt="Résultats" style={{ width: '24px', height: '24px' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>{isRacing ? t('competition_page.stats.results') : t('competition_page.stats.clear_rounds')}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                            {isRacing
                                ? `${stats.entriesCount ? Math.round((stats.wins / stats.entriesCount) * 100) : 0}% ${t('competition_page.stats.victories')}`
                                : `${stats.entriesCount ? Math.round((stats.clearRounds / stats.entriesCount) * 100) : 0}%`
                            }
                        </div>
                    </div>
                </Card>
                <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#e0f2fe', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/icons/calendrier.png" alt="Calendrier" style={{ width: '24px', height: '24px' }} />
                    </div>
                    <div><div style={{ fontSize: '0.9rem', color: '#666' }}>{isRacing ? t('competition_page.stats.races') : t('competition_page.stats.competitions')}</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{competitions.length}</div></div>
                </Card>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                {canManageCompetition() && (
                    <a
                        href={isGaloppeur ? "https://www.france-galop.com/" : (isTrotteur ? "https://infonet.letrot.com" : "https://ffecompet.ffe.com/")}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            textDecoration: 'none',
                            color: 'var(--color-primary)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-full)',
                            background: 'white',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}
                    >
                        {isGaloppeur ? "France Galop ↗" : (isTrotteur ? "Infonet ↗" : "FFE Compet ↗")}
                    </a>
                )}
                {canManageCompetition() && (
                    <Button onClick={() => setShowModal(true)}>
                        <Plus size={18} /> {t('competition_page.add_competition_btn')}
                    </Button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* List of Competitions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {competitions.map(comp => (
                        <div key={comp.id}
                            onClick={() => setSelectedComp(comp)}
                            style={{
                                background: 'white', borderRadius: '12px', padding: '1.5rem',
                                boxShadow: selectedComp?.id === comp.id ? '0 0 0 2px var(--color-primary)' : '0 4px 6px -1px rgba(0,0,0,0.1)',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{comp.name}</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#666', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarIcon size={14} /> {new Date(comp.date).toLocaleDateString('fr-FR')}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {comp.location}</div>
                                    </div>
                                </div>
                                <div style={{
                                    background: '#f3f4f6', padding: '4px 10px', borderRadius: '20px',
                                    fontSize: '0.8rem', fontWeight: 600, color: '#4b5563'
                                }}>
                                    {comp.level}
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem', color: '#666' }}>{comp.entries.length} {t('competition_page.competition_list.entries_count')}</span>
                                <ChevronRight size={18} color="#ccc" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Detail View */}
                <div>
                    {selectedComp ? (
                        <Card style={{ position: 'sticky', top: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{selectedComp.name}</h2>
                                    <div style={{ color: '#666' }}>{selectedComp.level} • {selectedComp.location}</div>
                                </div>
                                {canManageCompetition() && (
                                    <Button variant="secondary" onClick={() => handleDeleteComp(selectedComp.id)} style={{ color: '#ef4444', padding: '8px' }}>
                                        <Trash2 size={18} />
                                    </Button>
                                )}
                            </div>

                            {/* Entries List */}
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <User size={18} /> {t('competition_page.details.entries_results_title')}
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                {selectedComp.entries.length === 0 && <div style={{ color: '#999', fontStyle: 'italic' }}>{t('competition_page.details.no_entries')}</div>}
                                {selectedComp.entries.map(entry => (
                                    <div key={entry.id} style={{ background: '#f9fafb', borderRadius: '8px', padding: '1rem', border: '1px solid #eee' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <strong>{entry.rider}</strong>
                                            <span style={{ color: '#666' }}>{entry.horse}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', alignItems: 'center' }}>
                                            <div style={{ background: '#e5e7eb', padding: '2px 8px', borderRadius: '4px' }}>{t('competition_page.entry_item.class_prefix')} {entry.class}</div>
                                            <input
                                                placeholder="Résultat (ex: SF)"
                                                value={entry.result}
                                                onChange={(e) => updateEntryResult(selectedComp.id, entry.id, 'result', e.target.value)}
                                                style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '2px 5px', width: '80px', color: '#333', backgroundColor: '#fff' }}
                                            />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span>{t('competition_page.entry_item.earnings_label')}</span>
                                                <input
                                                    type="number"
                                                    value={entry.earnings}
                                                    onChange={(e) => updateEntryResult(selectedComp.id, entry.id, 'earnings', e.target.value)}
                                                    style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '2px 5px', width: '70px', color: '#333', backgroundColor: '#fff' }}
                                                />
                                                €
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Entry Form - Restricted */}
                            {canManageCompetition() && (
                                <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', border: '1px dashed #bae6fd' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: '#0284c7' }}>{t('competition_page.add_entry_form.title')}</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input placeholder={t('competition_page.add_entry_form.horse_placeholder')} value={newEntry.horse} onChange={e => setNewEntry({ ...newEntry, horse: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }} />
                                        <input placeholder={t('competition_page.add_entry_form.rider_placeholder')} value={newEntry.rider} onChange={e => setNewEntry({ ...newEntry, rider: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <input placeholder={t('competition_page.add_entry_form.class_placeholder')} value={newEntry.class} onChange={e => setNewEntry({ ...newEntry, class: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }} />
                                        <input type="number" placeholder={t('competition_page.add_entry_form.fee_placeholder')} value={newEntry.fee} onChange={e => setNewEntry({ ...newEntry, fee: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }} />
                                    </div>
                                    <Button onClick={() => handleAddEntry(selectedComp.id)} style={{ width: '100%', padding: '0.5rem' }}>{t('competition_page.add_entry_form.add_btn')}</Button>
                                </div>
                            )}

                        </Card>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', border: '2px dashed #eee', borderRadius: '12px', minHeight: '300px' }}>
                            {t('competition_page.details.select_hint')}
                        </div>
                    )}
                </div>
            </div>

            {/* New Competition Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0)', zIndex: 1000,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: '5vh'
                }}>
                    <Card style={{ width: '95%', maxWidth: '400px' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{t('competition_page.modal.title')}</h3>
                        <form onSubmit={handleSaveCompetition} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('competition_page.modal.name_label')}</label>
                                <input required placeholder={t('competition_page.modal.name_placeholder')} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                    value={newComp.name} onChange={e => setNewComp({ ...newComp, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('competition_page.modal.date_label')}</label>
                                <input type="date" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                    value={newComp.date} onChange={e => setNewComp({ ...newComp, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('competition_page.modal.location_label')}</label>
                                <input required placeholder={t('competition_page.modal.location_placeholder')} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                    value={newComp.location} onChange={e => setNewComp({ ...newComp, location: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('competition_page.modal.level_label')}</label>
                                <input placeholder={t('competition_page.modal.level_placeholder')} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                    value={newComp.level} onChange={e => setNewComp({ ...newComp, level: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>{t('competition_page.modal.cancel')}</Button>
                                <Button type="submit" style={{ flex: 1 }}>{t('competition_page.modal.create')}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Competition;
