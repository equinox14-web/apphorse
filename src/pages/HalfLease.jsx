import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Users, Calendar, DollarSign, Plus, UserCheck, CalendarCheck, Stethoscope, Edit2, ArrowRight, Upload, Camera, Trash2, Key, Mail, Lock, Unlock, CheckSquare, X } from 'lucide-react';

const HalfLease = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Mock Data - Cleared
    const defaultHorses = [];

    const [horses, setHorses] = useState(() => {
        const saved = localStorage.getItem('appHorse_leases_v3');
        return saved ? JSON.parse(saved) : defaultHorses;
    });

    const [showModal, setShowModal] = useState(false);
    const [newLease, setNewLease] = useState({ horseName: '', rider: '', email: '', price: '', days: [] });

    // Task Management State
    const [newTaskText, setNewTaskText] = useState('');
    const [addingTaskForHorseId, setAddingTaskForHorseId] = useState(null);

    const [editingContract, setEditingContract] = useState(null);
    const [hoveredHorseId, setHoveredHorseId] = useState(null);
    const [availableHorses, setAvailableHorses] = useState([]);
    const [invitationData, setInvitationData] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [contractToDelete, setContractToDelete] = useState(null);

    useEffect(() => {
        const myHorses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        setAvailableHorses(myHorses);
    }, []);

    useEffect(() => {
        localStorage.setItem('appHorse_leases_v3', JSON.stringify(horses));
    }, [horses]);

    // ... (Existing Functions: generateCode, handleAddLease, etc.) ...
    const generateCode = () => {
        return 'DP-' + Math.floor(1000 + Math.random() * 9000);
    };

    const handleAddLease = (e) => {
        e.preventDefault();
        const trimmedName = newLease.horseName.trim();
        const accessCode = generateCode();

        const existingHorseIndex = horses.findIndex(h => h.name.toLowerCase() === trimmedName.toLowerCase());

        const newContract = {
            id: Date.now(),
            rider: newLease.rider,
            email: newLease.email,
            price: newLease.price,
            days: newLease.days,
            paid: false,
            accessCode: accessCode,
            canEdit: false
        };

        if (existingHorseIndex >= 0) {
            const updatedHorses = [...horses];
            updatedHorses[existingHorseIndex].contracts.push(newContract);
            setHorses(updatedHorses);
        } else {
            const newHorse = {
                id: Date.now(),
                name: trimmedName,
                image: null,
                contracts: [newContract],
                tasks: [] // Initialize tasks
            };
            setHorses([...horses, newHorse]);
        }

        const messageBody = `Bonjour ${newLease.rider},\n\n` +
            `Je t'invite à rejoindre la gestion de ${trimmedName} sur l'application Equinox.\n` +
            `Voici les détails pour te connecter :\n\n` +
            `🔐 TON CODE DE SÉCURITÉ : ${accessCode}\n\n` +
            `Ton niveau d'accès actuel : LECTURE SEULE (Agenda & Santé).\n\n` +
            `📲 Télécharge l'application ici : https://equinox-app.com/download`;

        if (newLease.email) {
            const subject = encodeURIComponent("Invitation Demi-Pension Equinox");
            const body = encodeURIComponent(messageBody);
            // Try to open mail client, but don't rely on it
            setTimeout(() => {
                window.location.href = `mailto:${newLease.email}?subject=${subject}&body=${body}`;
            }, 100);
        }

        // Show success modal with copyable info
        setInvitationData({
            rider: newLease.rider,
            email: newLease.email,
            code: accessCode,
            message: messageBody
        });

        setShowModal(false);
        setNewLease({ horseName: '', rider: '', email: '', price: '', days: [] });
    };

    const togglePermission = (horseId, contractId) => {
        const updatedHorses = horses.map(h => {
            if (h.id === horseId) {
                return {
                    ...h,
                    contracts: h.contracts.map(c => c.id === contractId ? { ...c, canEdit: !c.canEdit } : c)
                };
            }
            return h;
        });
        setHorses(updatedHorses);
    };

    const toggleDay = (day, target = 'NEW') => {
        if (target === 'NEW') {
            if (newLease.days.includes(day)) {
                setNewLease({ ...newLease, days: newLease.days.filter(d => d !== day) });
            } else {
                setNewLease({ ...newLease, days: [...newLease.days, day] });
            }
        } else if (target === 'EDIT' && editingContract) {
            const updatedDays = editingContract.contract.days.includes(day)
                ? editingContract.contract.days.filter(d => d !== day)
                : [...editingContract.contract.days, day];

            setEditingContract({
                ...editingContract,
                contract: { ...editingContract.contract, days: updatedDays }
            });
        }
    };

    const saveEditedContract = () => {
        if (!editingContract) return;
        const updatedHorses = horses.map(h => {
            if (h.id === editingContract.horseId) {
                return {
                    ...h,
                    contracts: h.contracts.map(c => c.id === editingContract.contract.id ? editingContract.contract : c)
                };
            }
            return h;
        });
        setHorses(updatedHorses);
        setEditingContract(null);
    };

    const togglePaidStatus = (horseId, contractId) => {
        const updatedHorses = horses.map(h => {
            if (h.id === horseId) {
                return {
                    ...h,
                    contracts: h.contracts.map(c => c.id === contractId ? { ...c, paid: !c.paid } : c)
                };
            }
            return h;
        });
        setHorses(updatedHorses);
    };

    const deleteContract = (horseId, contractId) => {
        setContractToDelete({ horseId, contractId });
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!contractToDelete) return;
        const { horseId, contractId } = contractToDelete;

        const updatedHorses = horses.map(h => {
            if (h.id === horseId) {
                return {
                    ...h,
                    contracts: h.contracts.filter(c => c.id !== contractId)
                };
            }
            return h;
        }).filter(h => h.contracts.length > 0);
        setHorses(updatedHorses);
        setShowDeleteModal(false);
        setContractToDelete(null);
    };

    const handleImageUpdate = (e, horseId) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const updatedHorses = horses.map(h =>
                    h.id === horseId ? { ...h, image: reader.result } : h
                );
                setHorses(updatedHorses);
            };
            reader.readAsDataURL(file);
        }
    };

    // --- Task Logic ---
    const addTask = (horseId) => {
        if (!newTaskText.trim()) return;
        const updatedHorses = horses.map(h => {
            if (h.id === horseId) {
                return { ...h, tasks: [...(h.tasks || []), { id: Date.now(), text: newTaskText, done: false }] };
            }
            return h;
        });
        setHorses(updatedHorses);
        setNewTaskText('');
        setAddingTaskForHorseId(null);
    };

    const toggleTask = (horseId, taskId) => {
        const updatedHorses = horses.map(h => {
            if (h.id === horseId) {
                return {
                    ...h,
                    tasks: h.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
                };
            }
            return h;
        });
        setHorses(updatedHorses);
    };

    const removeTask = (horseId, taskId) => {
        const updatedHorses = horses.map(h => {
            if (h.id === horseId) {
                return {
                    ...h,
                    tasks: h.tasks.filter(t => t.id !== taskId)
                };
            }
            return h;
        });
        setHorses(updatedHorses);
    };


    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Button onClick={() => setShowModal(true)}>
                    <Plus size={18} /> {t('half_lease_page.new_contract_btn')}
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                {horses.map(horse => (
                    <div key={horse.id} style={{
                        background: 'white', borderRadius: '16px', overflow: 'hidden',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column'
                    }}>
                        {/* Header Image (Simulated) */}
                        <div
                            style={{ height: '200px', background: '#f3f4f6', position: 'relative' }}
                            onMouseEnter={() => setHoveredHorseId(horse.id)}
                            onMouseLeave={() => setHoveredHorseId(null)}
                        >
                            {horse.image ? (
                                <img src={horse.image} alt={horse.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '4rem', color: '#d1d5db' }}>🐴</div>
                            )}
                            {/* ... Image Controls ... */}
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                                opacity: hoveredHorseId === horse.id ? 1 : 0, transition: 'opacity 0.2s'
                            }}>
                                <input id={`upload-${horse.id}`} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpdate(e, horse.id)} />
                                <label htmlFor={`upload-${horse.id}`} style={{ cursor: 'pointer', background: 'white', padding: '0.8rem', borderRadius: '50%', display: 'flex', color: '#1f2937' }}>
                                    <Upload size={20} />
                                </label>

                                <input id={`cam-${horse.id}`} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handleImageUpdate(e, horse.id)} />
                                <label htmlFor={`cam-${horse.id}`} style={{ cursor: 'pointer', background: 'white', padding: '0.8rem', borderRadius: '50%', display: 'flex', color: '#1f2937' }}>
                                    <Camera size={20} />
                                </label>
                            </div>

                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                padding: '1rem', color: 'white'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{horse.name}</h3>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{horse.contracts.length} Demi-pensionnaire{horse.contracts.length > 1 ? 's' : ''}</div>
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Tasks List */}
                            <div style={{ background: '#fff7ed', padding: '1rem', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <CheckSquare size={16} /> {t('half_lease_page.tasks_title')}
                                    </h4>
                                    <button
                                        onClick={() => setAddingTaskForHorseId(horse.id)}
                                        style={{ background: 'none', border: 'none', color: '#ea580c', cursor: 'pointer', fontWeight: 600, fontSize: '1.2rem' }}
                                    >
                                        +
                                    </button>
                                </div>

                                {/* Task Input */}
                                {addingTaskForHorseId === horse.id && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input
                                            autoFocus
                                            value={newTaskText}
                                            onChange={(e) => setNewTaskText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addTask(horse.id)}
                                            placeholder={t('half_lease_page.task_placeholder')}
                                            style={{ flex: 1, padding: '0.4rem', borderRadius: '4px', border: '1px solid #ea580c', fontSize: '0.85rem' }}
                                        />
                                        <button onClick={() => addTask(horse.id)} style={{ background: '#ea580c', color: 'white', border: 'none', borderRadius: '4px', padding: '0 0.5rem' }}>{t('half_lease_page.ok_btn')}</button>
                                    </div>
                                )}

                                {/* List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {(horse.tasks || []).length === 0 && <p style={{ fontSize: '0.8rem', color: '#fdba74', margin: 0, fontStyle: 'italic' }}>{t('half_lease_page.no_tasks')}</p>}
                                    {(horse.tasks || []).map(task => (
                                        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#431407' }}>
                                            <input
                                                type="checkbox"
                                                checked={task.done}
                                                onChange={() => toggleTask(horse.id, task.id)}
                                                style={{ cursor: 'pointer', accentColor: '#ea580c' }}
                                            />
                                            <span style={{ flex: 1, textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.6 : 1 }}>{task.text}</span>
                                            <button onClick={() => removeTask(horse.id, task.id)} style={{ border: 'none', background: 'none', color: '#fdba74', cursor: 'pointer', padding: 0 }}><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Contracts List */}
                            {horse.contracts.map(contract => (
                                <div key={contract.id} style={{
                                    borderBottom: '1px solid #e5e7eb', paddingBottom: '1.5rem',
                                    display: 'flex', flexDirection: 'column', gap: '1rem'
                                }}>
                                    {/* ... Existing Contract Header, Permissions, Schedules ... */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '1.1rem' }}>
                                            <UserCheck size={18} color="#4b5563" /> {contract.rider}
                                        </div>
                                        <div
                                            onClick={() => togglePaidStatus(horse.id, contract.id)}
                                            style={{
                                                cursor: 'pointer', padding: '4px 12px', borderRadius: '20px',
                                                background: contract.paid ? '#dcfce7' : '#fee2e2',
                                                color: contract.paid ? '#166534' : '#991b1b',
                                                fontSize: '0.8rem', fontWeight: 700
                                            }}
                                        >
                                            {contract.paid ? t('half_lease_page.paid_status') : t('half_lease_page.pending_status')} • {contract.price} €
                                        </div>
                                    </div>

                                    {/* Permission Toggle */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                                        <button
                                            onClick={() => togglePermission(horse.id, contract.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                border: 'none', background: 'transparent', cursor: 'pointer',
                                                color: contract.canEdit ? '#166534' : '#9ca3af',
                                                fontSize: '0.85rem'
                                            }}
                                            title={contract.canEdit ? "Accès Complet : Modification Autorisée" : "Restreint : Lecture Seule"}
                                        >
                                            {contract.canEdit ? <Unlock size={14} /> : <Lock size={14} />}
                                            {contract.canEdit ? <span style={{ fontWeight: 600 }}>{t('half_lease_page.edit_allowed')}</span> : <span>{t('half_lease_page.read_only')}</span>}
                                        </button>
                                        <div style={{ width: '1px', height: '14px', background: '#e5e7eb' }}></div>
                                        <div style={{ fontSize: '0.8rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Key size={14} /> {t('half_lease_page.access_code')} : <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{contract.accessCode || '---'}</span>
                                        </div>
                                    </div>

                                    {/* Schedule */}
                                    <div
                                        onClick={() => setEditingContract({ horseId: horse.id, contract })}
                                        style={{
                                            background: '#f9fafb', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer',
                                            border: '1px dashed #e5e7eb',
                                            transition: 'border-color 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                                    >
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CalendarCheck size={14} /> {t('half_lease_page.assigned_days')}</span>
                                            <Edit2 size={12} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.4rem', pointerEvents: 'none' }}>
                                            {weekDays.map(day => (
                                                <span key={day} style={{
                                                    fontSize: '0.75rem', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    borderRadius: '50%',
                                                    background: contract.days.includes(day) ? '#3b82f6' : '#e5e7eb',
                                                    color: contract.days.includes(day) ? 'white' : '#9ca3af',
                                                    fontWeight: 600
                                                }}>
                                                    {day.charAt(0)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => window.location.href = `mailto:${contract.email}`}
                                            style={{ border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'pointer', padding: '5px' }}
                                        >
                                            <Mail size={16} />
                                        </button>
                                        <button
                                            onClick={() => deleteContract(horse.id, contract.id)}
                                            style={{ border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'pointer', padding: '5px' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Horse Actions Footer */}
                            <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '2px dashed #f3f4f6', display: 'flex', gap: '0.5rem' }}>
                                <Button variant="secondary" style={{ flex: 1, fontSize: '0.9rem' }} onClick={() => navigate('/care')}>
                                    <Stethoscope size={16} /> {t('half_lease_page.health_btn')}
                                </Button>
                                <Button variant="secondary" style={{ flex: 1, fontSize: '0.9rem' }} onClick={() => setShowModal(true)}>
                                    <Plus size={16} /> {t('half_lease_page.add_contract_btn')}
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showModal && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 9999, // Dark overlay & High Z-Index
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: '10vh' // Positioned higher up
                }}>
                    <Card style={{ width: '90%', maxWidth: '400px' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{t('half_lease_page.modal.title')}</h3>
                        <form onSubmit={handleAddLease} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('half_lease_page.modal.horse_name')}</label>
                                <select
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#333' }}
                                    value={newLease.horseName}
                                    onChange={e => setNewLease({ ...newLease, horseName: e.target.value })}
                                >
                                    <option value="" disabled>{t('half_lease_page.modal.select_horse')}</option>
                                    {availableHorses.map(h => (
                                        <option key={h.id} value={h.name}>{h.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('half_lease_page.modal.rider')}</label>
                                <input
                                    required
                                    placeholder={t('half_lease_page.modal.rider_placeholder')}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', color: '#333', backgroundColor: '#fff' }}
                                    value={newLease.rider}
                                    onChange={e => setNewLease({ ...newLease, rider: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('half_lease_page.modal.email')}</label>
                                <input
                                    type="email"
                                    placeholder={t('half_lease_page.modal.email_placeholder')}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', color: '#333', backgroundColor: '#fff' }}
                                    value={newLease.email}
                                    onChange={e => setNewLease({ ...newLease, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('half_lease_page.modal.price')}</label>
                                <input
                                    required
                                    type="number"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', color: '#333', backgroundColor: '#fff' }}
                                    value={newLease.price}
                                    onChange={e => setNewLease({ ...newLease, price: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('half_lease_page.modal.fixed_days')}</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {weekDays.map(day => (
                                        <button
                                            type="button"
                                            key={day}
                                            onClick={() => toggleDay(day, 'NEW')}
                                            style={{
                                                padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid #d1d5db',
                                                background: newLease.days.includes(day) ? '#3b82f6' : 'white',
                                                color: newLease.days.includes(day) ? 'white' : '#4b5563',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button type="button" variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>{t('half_lease_page.modal.cancel_btn')}</Button>
                                <Button type="submit" style={{ flex: 1 }}>{t('half_lease_page.modal.invite_btn')}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
                , document.body)}

            {/* Edit Schedule Modal */}
            {editingContract && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0)', zIndex: 1000,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: '5vh'
                }}>
                    <Card style={{ width: '90%', maxWidth: '400px' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>{t('half_lease_page.edit_modal.title', { rider: editingContract.contract.rider })}</h3>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('half_lease_page.edit_modal.modify_days')}</label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {weekDays.map(day => (
                                    <button
                                        type="button"
                                        key={day}
                                        onClick={() => toggleDay(day, 'EDIT')}
                                        style={{
                                            padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid #d1d5db',
                                            background: editingContract.contract.days.includes(day) ? '#3b82f6' : 'white',
                                            color: editingContract.contract.days.includes(day) ? 'white' : '#4b5563',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #bfdbfe' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1d4ed8', fontSize: '1rem' }}>{t('half_lease_page.edit_modal.organize_work')}</h4>
                            <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '1rem' }}>
                                {t('half_lease_page.edit_modal.organize_desc', { rider: editingContract.contract.rider })}
                            </p>
                            <Button onClick={() => navigate('/calendar')} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                <Calendar size={18} /> {t('half_lease_page.edit_modal.open_calendar')}
                            </Button>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button variant="secondary" onClick={() => setEditingContract(null)} style={{ flex: 1 }}>{t('half_lease_page.edit_modal.close_btn')}</Button>
                            <Button onClick={saveEditedContract} style={{ flex: 1 }}>{t('half_lease_page.edit_modal.save_btn')}</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Invitation Success Modal */}
            {invitationData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0)', zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ width: '90%', maxWidth: '450px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ width: '60px', height: '60px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <CheckSquare size={32} color="#16a34a" />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', margin: 0, color: '#166534' }}>{t('half_lease_page.success_modal.title')}</h3>
                            <p style={{ color: '#666' }}>{t('half_lease_page.success_modal.subtitle')}</p>
                        </div>

                        <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#4b5563', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{t('half_lease_page.success_modal.message_label')}</label>
                            <textarea
                                readOnly
                                value={invitationData.message}
                                style={{ width: '100%', minHeight: '150px', padding: '0.5rem', border: 'none', background: 'transparent', resize: 'none', fontSize: '0.9rem', color: '#1f2937' }}
                                onClick={(e) => e.target.select()}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button variant="secondary" onClick={() => setInvitationData(null)} style={{ flex: 1 }}>{t('half_lease_page.success_modal.close_btn')}</Button>
                            <Button onClick={() => {
                                navigator.clipboard.writeText(invitationData.message);
                                alert(t('half_lease_page.success_modal.copied_alert'));
                            }} style={{ flex: 1, background: '#1890ff' }}>
                                {t('half_lease_page.success_modal.copy_btn')}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0)', zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ width: '90%', maxWidth: '350px', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 1rem 0' }}>{t('half_lease_page.delete_modal.title')}</h3>
                        <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('half_lease_page.delete_modal.subtitle')}</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} style={{ flex: 1 }}>{t('half_lease_page.delete_modal.cancel_btn')}</Button>
                            <Button onClick={confirmDelete} style={{ flex: 1, background: '#ef4444' }}>{t('half_lease_page.delete_modal.delete_btn')}</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default HalfLease;
