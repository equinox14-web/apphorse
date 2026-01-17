import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import SEO from '../components/SEO';
import Card from '../components/Card';
import Button from '../components/Button';
import { Heart, Calendar, Baby, Activity, Plus, ChevronRight, AlertCircle, CheckCircle, GitMerge, Trash2, Edit2, User } from 'lucide-react';
import { canAccess, getMaxMares, getUserPlanIds, canManageHorses } from '../utils/permissions';


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
            const todoEvents = mareEvents.filter(e => e.status === 'todo' && e.type !== 'Vaccin');
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
        <div className="animate-fade-in">
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <Card style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1890ff' }}>{mares.length}</div>
                    <div style={{ color: '#666' }}>{t('breeding_page.stats.mares')}</div>
                </Card>
                <Card style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#52c41a' }}>{mares.filter(m => m.status === 'Gestante').length}</div>
                    <div style={{ color: '#666' }}>{t('breeding_page.stats.pregnant')}</div>
                </Card>
                <Card style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#eb2f96' }}>{planning.filter(e => e.type === 'Poulinage' && new Date(e.date).getFullYear() === 2025).length}</div>
                    <div style={{ color: '#666' }}>{t('breeding_page.stats.foals_expected')}</div>
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
                            <div key={evt.id} onClick={() => navigate(`/breeding/${evt.mareId}`)} style={{
                                minWidth: '200px', background: 'white', padding: '1rem', borderRadius: '12px',
                                border: '1px solid #eee', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                borderLeft: `4px solid ${evt.type.includes('Insemination') ? '#1890ff' :
                                    evt.type.includes('DG') || evt.type === 'Echographie' ? '#722ed1' :
                                        evt.type === 'Poulinage' ? '#eb2f96' : '#faad14'
                                    }`
                            }}>
                                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.25rem' }}>
                                    {new Date(evt.date).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })}
                                </div>
                                <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: '#333' }}>
                                    {evt.mareName} {evt.mareInternalNumber && <span style={{ color: '#eb2f96', fontWeight: 600 }}>#{evt.mareInternalNumber}</span>}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#555' }}>
                                    {evt.type}
                                </div>
                                {evt.note && <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.2rem', fontStyle: 'italic' }}>{evt.note}</div>}
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

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', wordBreak: 'break-word' }}>
                                        {mare.name} {mare.internalNumber && <span style={{ fontSize: '0.9rem', color: '#eb2f96', background: '#fff0f6', padding: '2px 6px', borderRadius: '12px', marginLeft: '4px' }}>#{mare.internalNumber}</span>}
                                    </h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                        <span style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, color: '#333' }}>
                                            {mare.role === 'Poulinière' ? t('breeding_page.modal.roles.mare') : mare.role === 'Donneuse' ? t('breeding_page.modal.roles.donor') : mare.role === 'Porteuse' ? t('breeding_page.modal.roles.recipient') : mare.role}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#666' }}>
                                            <Activity size={12} /> <strong style={{ color: getStatusColor(mare.status) }}>
                                                {mare.status === 'Vide' ? t('breeding_page.status.empty') :
                                                    mare.status === 'Inseminée' ? t('breeding_page.status.inseminated') :
                                                        mare.status === 'Gestante' ? t('breeding_page.status.pregnant') :
                                                            mare.status === 'Poulinage' ? t('breeding_page.status.foaling') : mare.status}
                                            </strong>
                                        </span>
                                    </div>
                                    {(mare.sire || mare.geneticDam) && (
                                        <div style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: '#666' }}>
                                            {mare.sire && <span style={{ marginRight: '0.5rem' }}><strong style={{ color: '#999' }}>P:</strong> {mare.sire}</span>}
                                            {mare.geneticDam && <span><strong style={{ color: '#999' }}>M:</strong> {mare.geneticDam}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Term Date (if exists) */}
                            {mare.termDate !== '-' && (
                                <div style={{ background: '#f9fafb', padding: '0.5rem 0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '2px' }}>{t('breeding_page.term_date')}</div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{new Date(mare.termDate).toLocaleDateString(i18n.language)}</div>
                                </div>
                            )}

                            {/* Actions - Responsive Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
                                <Button variant="secondary" style={{ fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => navigate(`/horses/${mare.id}`)} title={t('breeding_page.actions.profile')}>
                                    <User size={16} /> <span className="hide-on-mobile">{t('breeding_page.actions.profile')}</span>
                                </Button>
                                <Button variant="secondary" style={{ fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => navigate(`/horses/${mare.id}/care`)} title={t('breeding_page.actions.health')}>
                                    <Heart size={16} /> <span className="hide-on-mobile">{t('breeding_page.actions.health')}</span>
                                </Button>
                                <Button style={{ fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => navigate(`/breeding/${mare.id}`)} title={t('breeding_page.actions.tracking')}>
                                    <Activity size={16} /> <span className="hide-on-mobile">{t('breeding_page.actions.tracking')}</span>
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
                    background: 'rgba(0,0,0,0)', zIndex: 1000,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: '5vh'
                }}>
                    <Card style={{ width: '90%', maxWidth: '400px' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{editingId ? t('breeding_page.modal.title_edit') : t('breeding_page.modal.title_add')}</h3>
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
                                <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                            {newMare.role === 'Porteuse' ? t('breeding_page.modal.bio_sire_label') : t('breeding_page.modal.sire_label')}
                                        </label>
                                        <input
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                            value={newMare.sire}
                                            onChange={e => setNewMare({ ...newMare, sire: e.target.value })}
                                            placeholder={newMare.role === 'Porteuse' ? "Ex: Chacco Blue" : "Ex: Baloubet du Rouet"}
                                        />
                                    </div>

                                    {newMare.role === 'Porteuse' && (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('breeding_page.modal.bio_dam_label')}</label>
                                            <input
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                                value={newMare.geneticDam || ''}
                                                onChange={e => setNewMare({ ...newMare, geneticDam: e.target.value })}
                                                placeholder="Ex: Gatoucha"
                                            />
                                        </div>
                                    )}

                                    {newMare.status !== 'Vide' && (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('breeding_page.modal.term_date_label')}</label>
                                            <input
                                                type="date"
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
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
