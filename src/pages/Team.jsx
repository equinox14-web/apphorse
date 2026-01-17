import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { User, Phone, Mail, Plus, Trash2, Heart, Shield, Briefcase, MapPin, MessageCircle, Edit2, Stethoscope, Hammer, Smile, Calendar as CalIcon, X, Eye, Copy } from 'lucide-react';
import { getMaxTeam, canManageTeam, getUserPlanIds } from '../utils/permissions';

const Team = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // These should NOT count towards the team limit.
    const defaultPartners = [
        { id: 'ext-vet', name: t('team_page.default_partners.vet'), role: 'Vétérinaire', isExternal: true },
        { id: 'ext-mar', name: t('team_page.default_partners.farrier'), role: 'Maréchal', isExternal: true },
        { id: 'ext-ost', name: t('team_page.default_partners.osteo'), role: 'Ostéopathe', isExternal: true },
        { id: 'ext-dent', name: t('team_page.default_partners.dentist'), role: 'Dentiste', isExternal: true }
    ];

    const [members, setMembers] = useState(() => {
        const saved = localStorage.getItem('appHorse_team_v2');
        let initialmembers = saved ? JSON.parse(saved) : [];

        // Ensure default partners exist
        defaultPartners.forEach(partner => {
            // Check if a member with this role already exists (to avoid duplicates if user renamed them)
            // Actually, user wants them "automatically integrated".
            // If we use ID, we can track them.
            if (!initialmembers.find(m => m.id === partner.id) && !initialmembers.find(m => m.role === partner.role && m.isExternal)) {
                initialmembers.push(partner);
            }
        });

        return initialmembers;
    });

    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [planningMember, setPlanningMember] = useState(null); // New State for Planning Modal
    const [simulateMember, setSimulateMember] = useState(null); // New State for Simulation Modal
    const [formData, setFormData] = useState({ name: '', role: 'Cavalier', phone: '', email: '', isAdmin: false });

    const [allEvents, setAllEvents] = useState([]);

    useEffect(() => {
        localStorage.setItem('appHorse_team_v2', JSON.stringify(members));
    }, [members]);

    useEffect(() => {
        const events = JSON.parse(localStorage.getItem('appHorse_customEvents') || '[]');
        setAllEvents(events);
    }, []);

    const generateCode = () => {
        return 'H-' + Math.floor(1000 + Math.random() * 9000);
    };

    const handleOpenModal = (member = null) => {
        if (member) {
            setEditingMember(member);
            setFormData({ name: member.name, role: member.role, phone: member.phone || '', email: member.email || '', isAdmin: member.isAdmin || false });
        } else {
            setEditingMember(null);
            setFormData({ name: '', role: 'Cavalier', phone: '', email: '', isAdmin: false });
        }
        setShowModal(true);
    };

    // ... (handleSave logic - unchanged but uses updated formData)

    const handleSave = (e) => {
        e.preventDefault();

        if (editingMember) {
            // Edit existing
            setMembers(members.map(m => m.id === editingMember.id ? { ...m, ...formData, color: getRoleColor(formData.role) } : m));
        } else {
            // Create New (Check limit if not external)
            // Filter strictly: isExternal must be absent (undefined) OR exactly false.
            const staffCount = members.filter(m => m.isExternal !== true).length;
            const max = getMaxTeam();

            // STRICT Check for Team Limit
            if (max < 500 && staffCount >= max) {
                // Check if the NEW member is external (e.g. Vet)
                const isNewMemberExternal = ['Vétérinaire', 'Maréchal', 'Dentiste', 'Ostéopathe'].includes(formData.role);

                if (!isNewMemberExternal) {
                    alert(t('team_page.alerts.limit_reached', { max }));
                    return;
                }
            }

            const code = generateCode();
            const memberToAdd = {
                id: Date.now(),
                ...formData,
                color: getRoleColor(formData.role),
                accessCode: code,
                isExternal: ['Vétérinaire', 'Maréchal', 'Dentiste', 'Ostéopathe'].includes(formData.role) // Auto-detect external
            };

            setMembers([...members, memberToAdd]);
        }
        setShowModal(false);
    };

    // ... (handleDelete logic - unchanged)

    const handleDelete = (id) => {
        if (window.confirm(t('team_page.alerts.delete_confirm'))) {
            setMembers(members.filter(m => m.id !== id));
        }
    };

    const handleSimulate = (member) => {
        setSimulateMember(member);
    };

    const confirmSimulation = () => {
        if (!simulateMember) return;
        localStorage.setItem('user_role', simulateMember.role);
        localStorage.setItem('user_name', simulateMember.name);
        localStorage.setItem('user_is_admin', simulateMember.isAdmin ? 'true' : 'false');
        localStorage.setItem('is_simulation', 'true');
        window.location.href = '/';
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'Vétérinaire': return '#ff4d4f';
            case 'Maréchal': return '#faad14';
            case 'Groom Maison': return '#52c41a';
            case 'Groom Concours': return '#52c41a';
            case 'Palefrenier Soigneur': return '#52c41a';
            case 'Coach': return '#722ed1';
            case 'Ostéopathe': return '#13c2c2';
            case 'Dentiste': return '#13c2c2';
            case 'Demi-pensionnaire': return '#eb2f96';
            default: return '#1890ff';
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Vétérinaire': return <Heart size={16} />;
            case 'Maréchal': return <Hammer size={16} />;
            case 'Groom Maison': return <MapPin size={16} />;
            case 'Groom Concours': return <Briefcase size={16} />;
            case 'Palefrenier Soigneur': return <Heart size={16} />;
            case 'Coach': return <Shield size={16} />;
            case 'Dentiste': return <Smile size={16} />;
            case 'Ostéopathe': return <Stethoscope size={16} />;
            case 'Demi-pensionnaire': return <User size={16} />;
            default: return <User size={16} />;
        }
    };

    // Filter for display if we want to separate Staff vs Partners?
    // User didn't ask for separation, just integration without counting.
    // I will display them mixed or sorted? Mixed is fine.

    const getMemberDisplayName = (member) => {
        if (!member) return '';
        if (member.id === 'ext-vet') return t('team_page.default_partners.vet');
        if (member.id === 'ext-mar') return t('team_page.default_partners.farrier');
        if (member.id === 'ext-ost') return t('team_page.default_partners.osteo');
        if (member.id === 'ext-dent') return t('team_page.default_partners.dentist');
        return member.name;
    };

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    {/* Title moved to MainLayout header */}
                </div>

                {canManageTeam() && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>

                        <Button onClick={() => handleOpenModal()}>
                            <Plus size={18} /> {t('team_page.add_member_btn')}
                        </Button>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {members.map(member => (
                    <Card key={member.id} style={{ position: 'relative', overflow: 'hidden', borderLeft: `4px solid ${getRoleColor(member.role)}` }}>
                        <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                            background: getRoleColor(member.role) || member.color
                        }} />

                        <div style={{ paddingLeft: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {getMemberDisplayName(member)}
                                        {member.isExternal && <span style={{ fontSize: '0.6rem', border: `1px solid ${getRoleColor(member.role)}`, color: getRoleColor(member.role), padding: '1px 4px', borderRadius: '4px' }}>{t('team_page.card.ext_badge')}</span>}
                                        {member.isAdmin && <Shield size={16} fill="#1890ff" color="#1890ff" title={t('team_page.card.admin_badge')} />}
                                    </h3>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                        fontSize: '0.8rem', fontWeight: 600,
                                        color: getRoleColor(member.role), background: getRoleColor(member.role) + '1a',
                                        padding: '0.2rem 0.6rem', borderRadius: '12px', marginTop: '0.4rem'
                                    }}>
                                        {getRoleIcon(member.role)} {t(`team_page.modal.roles.${member.role}`, member.role)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {canManageTeam() && (
                                        <button
                                            onClick={() => handleSimulate(member)}
                                            style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                                            title={t('team_page.card.tooltips.simulate')}
                                        >
                                            <Eye size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setPlanningMember(member)}
                                        style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                                        title={t('team_page.card.tooltips.planning')}
                                    >
                                        <CalIcon size={16} />
                                    </button>
                                    {canManageTeam() && (
                                        <>
                                            <button
                                                onClick={() => handleOpenModal(member)}
                                                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(member.id)}
                                                style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                                {member.phone ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <Phone size={14} /> {member.phone}
                                    </div>
                                ) : <div style={{ fontStyle: 'italic', fontSize: '0.8rem', color: '#ccc' }}>{t('team_page.card.no_phone')}</div>}

                                {member.email ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <Mail size={14} /> {member.email}
                                    </div>
                                ) : <div style={{ fontStyle: 'italic', fontSize: '0.8rem', color: '#ccc' }}>{t('team_page.card.no_email')}</div>}

                                {member.accessCode && !member.isExternal && canManageTeam() && (
                                    <div style={{
                                        marginTop: '0.5rem',
                                        padding: '0.5rem',
                                        background: '#f0f5ff',
                                        borderRadius: '6px',
                                        fontSize: '0.85rem',
                                        color: '#1890ff',
                                        fontWeight: 600,
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Shield size={14} /> Code : <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '1px' }}>{member.accessCode}</span>
                                        </div>
                                        <button

                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(member.accessCode);
                                                // Simple toast or alert would be better but alert is fine for now
                                                alert(t('team_page.card.copied_alert', { code: member.accessCode }));
                                            }}
                                            title="Copier le code pour l'envoyer"
                                            style={{
                                                border: '1px solid #d6e4ff', background: 'white',
                                                padding: '4px 8px', borderRadius: '4px',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                                color: '#1890ff', fontSize: '0.75rem'
                                            }}
                                        >
                                            <Copy size={12} /> {t('team_page.card.copy_btn')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                <Button variant="secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem' }} onClick={() => window.open(`tel:${member.phone}`)} disabled={!member.phone}>
                                    <Phone size={14} /> {t('team_page.card.call_btn')}
                                </Button>
                                <Button variant="secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem' }}
                                    onClick={() => {
                                        if (canManageTeam() && member.accessCode && !member.isExternal) {
                                            const subject = t('team_page.email_template.subject');
                                            const body = t('team_page.email_template.body', { name: member.name, code: member.accessCode });
                                            window.open(`mailto:${member.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                                        } else {
                                            window.open(`mailto:${member.email}`);
                                        }
                                    }}
                                    disabled={!member.email}
                                >
                                    <Mail size={14} /> {t('team_page.card.email_btn')}
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0)', zIndex: 1000,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: '5vh'
                }}>
                    <Card style={{ width: '90%', maxWidth: '400px' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{editingMember ? t('team_page.modal.title_edit') : t('team_page.modal.title_add')}</h3>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('team_page.modal.name_label')}</label>
                                <input
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('team_page.modal.role_label')}</label>
                                <select
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white', color: '#333' }}
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="Cavalier">{t('team_page.modal.roles.Cavalier')}</option>
                                    <option value="Propriétaire">{t('team_page.modal.roles.Propriétaire')}</option>
                                    <option value="Demi-pensionnaire">{t('team_page.modal.roles.Demi-pensionnaire')}</option>
                                    <option value="Groom Maison">{t('team_page.modal.roles.Groom Maison')}</option>
                                    <option value="Groom Concours">{t('team_page.modal.roles.Groom Concours')}</option>
                                    <option value="Palefrenier Soigneur">{t('team_page.modal.roles.Palefrenier Soigneur')}</option>
                                    <option value="Coach">{t('team_page.modal.roles.Coach')}</option>
                                    <option value="Vétérinaire">{t('team_page.modal.roles.Vétérinaire')}</option>
                                    <option value="Maréchal">{t('team_page.modal.roles.Maréchal')}</option>
                                    <option value="Dentiste">{t('team_page.modal.roles.Dentiste')}</option>
                                    <option value="Ostéopathe">{t('team_page.modal.roles.Ostéopathe')}</option>
                                    <option value="Autre">{t('team_page.modal.roles.Autre')}</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('team_page.modal.phone_label')}</label>
                                <input
                                    type="tel"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    maxLength="10"
                                    pattern="[0-9]{10}"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('team_page.modal.email_label')}</label>
                                <input
                                    type="email"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            {/* Admin Rights Checkbox */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #eee' }}>
                                <input
                                    type="checkbox"
                                    id="isAdmin"
                                    checked={formData.isAdmin}
                                    onChange={e => setFormData({ ...formData, isAdmin: e.target.checked })}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <label htmlFor="isAdmin" style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#374151' }}>
                                    <strong>{t('team_page.modal.admin_label')}</strong> {t('team_page.modal.admin_hint')}
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>{t('team_page.modal.cancel')}</Button>
                                <Button type="submit" style={{ flex: 1 }}>{t('team_page.modal.save')}</Button>
                            </div>


                        </form>
                    </Card>
                </div>
            )}

            {/* Planning Modal */}
            {planningMember && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ width: '90%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Briefcase size={24} color="#1890ff" /> {t('team_page.planning_modal.title', { name: getMemberDisplayName(planningMember) })}
                            </h3>
                            <button onClick={() => setPlanningMember(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                            {(() => {
                                const now = new Date();
                                now.setHours(0, 0, 0, 0);

                                const myTasks = allEvents
                                    .filter(e => e.rider === planningMember.name && !e.completed)
                                    .map(e => ({ ...e, dateObj: new Date(e.dateStr) }))
                                    .filter(e => e.dateObj >= now)
                                    .sort((a, b) => a.dateObj - b.dateObj);

                                if (myTasks.length === 0) {
                                    return (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                                            <Smile size={48} color="#ddd" style={{ marginBottom: '1rem' }} />
                                            <p>{t('team_page.planning_modal.empty')}</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {myTasks.map((task, i) => (
                                            <div key={i} style={{
                                                padding: '1rem', background: '#f9fafb', borderRadius: '12px',
                                                borderLeft: `4px solid ${task.color || '#ccc'}`,
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                                                    <span style={{ fontWeight: 700, color: '#333', fontSize: '1.1rem' }}>
                                                        {task.dateObj.toLocaleDateString(t('language') === 'en' ? 'en-US' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                    </span>
                                                    <span style={{ fontWeight: 700, color: '#1890ff', background: '#e6f7ff', padding: '2px 8px', borderRadius: '4px' }}>
                                                        {task.time}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                                                    {task.title}
                                                </div>
                                                <div style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {task.details}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee', textAlign: 'right' }}>
                            <Button onClick={() => setPlanningMember(null)}>{t('team_page.planning_modal.close')}</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Simulation Confirmation Modal */}
            {simulateMember && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0)',
                    zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ width: '90%', maxWidth: '400px', padding: '2rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '50%',
                                background: '#eff6ff', color: '#1890ff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1rem auto'
                            }}>
                                <Eye size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{t('team_page.simulation_modal.title')}</h3>
                            <p style={{ color: '#666', lineHeight: '1.5' }}>
                                {t('team_page.simulation_modal.description')} <br />
                                <strong>{getMemberDisplayName(simulateMember)}</strong> ({simulateMember.role})
                            </p>
                        </div>

                        <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#876800' }}>
                            {t('team_page.simulation_modal.warning')}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button variant="secondary" onClick={() => setSimulateMember(null)} style={{ flex: 1 }}>{t('team_page.simulation_modal.cancel')}</Button>
                            <Button onClick={confirmSimulation} style={{ flex: 1, background: '#1890ff', color: 'white' }}>{t('team_page.simulation_modal.confirm')}</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Team;
