import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { User, Phone, Mail, Plus, Trash2, Heart, Shield, FileText, MapPin, MessageCircle, DollarSign, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ClientsManagement = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Default Clients Mock - Cleared
    const defaultClients = [];

    const [clients, setClients] = useState(() => {
        const saved = localStorage.getItem('appHorse_clients_v2');
        return saved ? JSON.parse(saved) : defaultClients;
    });

    const [availableHorses, setAvailableHorses] = useState(() => {
        const savedHorses = localStorage.getItem('my_horses_v4');
        return savedHorses ? JSON.parse(savedHorses) : [];
    });

    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', address: '', horses: '', _selected: [] });
    const [horseSearch, setHorseSearch] = useState('');

    useEffect(() => {
        localStorage.setItem('appHorse_clients_v2', JSON.stringify(clients));
    }, [clients]);

    const handleAddClient = (e) => {
        e.preventDefault();
        const clientToAdd = {
            id: Date.now(),
            ...newClient,
            role: 'Propriétaire',
            horses: newClient.horses.split(',').map(h => h.trim()).filter(h => h),
            color: '#1890ff'
        };
        setClients([...clients, clientToAdd]);
        setShowModal(false);
        setNewClient({ name: '', phone: '', email: '', address: '', horses: '' });
    };

    const handleDelete = (id) => {
        if (window.confirm(t('team_page.alerts.delete_confirm'))) { // Reuse or add specific
            const updatedClients = clients.filter(c => c.id !== id);
            setClients(updatedClients);
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.horses.some(h => h.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="animate-fade-in">
            {/* Header / Controls */}
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} size={18} />
                    <input
                        placeholder={t('clients_page.search_placeholder')}
                        style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus size={18} /> {t('clients_page.new_client_btn')}
                </Button>
            </div>

            {/* Grid - Identical style to Team.jsx */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {filteredClients.map(client => (
                    <Card key={client.id} style={{ position: 'relative' }}>
                        {/* Color Strip */}
                        <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px',
                            background: client.color
                        }} />

                        <div style={{ paddingLeft: '1rem' }}>
                            {/* Header Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{client.name}</h3>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                        fontSize: '0.8rem', fontWeight: 600,
                                        color: client.color, background: client.color + '1a',
                                        padding: '0.2rem 0.6rem', borderRadius: '12px', marginTop: '0.4rem'
                                    }}>
                                        <User size={14} /> {client.role}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleDelete(client.id)}
                                    style={{
                                        background: '#fee2e2', // Light red bg
                                        color: '#ef4444',
                                        border: 'none',
                                        borderRadius: '8px',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        flexShrink: 0
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#ef4444';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#fee2e2';
                                        e.currentTarget.style.color = '#ef4444';
                                    }}
                                    title={t('clients_page.delete_tooltip')}
                                >
                                    <Trash2 size={20} style={{ pointerEvents: 'none' }} />
                                </button>
                            </div>

                            {/* Details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                                {client.horses && client.horses.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <Heart size={14} color="#eb2f96" />
                                        <span>{client.horses.join(', ')}</span>
                                    </div>
                                )}
                                {client.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <Phone size={14} /> {client.phone}
                                    </div>
                                )}
                                {client.email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <Mail size={14} /> {client.email}
                                    </div>
                                )}
                                {client.address && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <MapPin size={14} /> {client.address}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                <Button variant="secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem' }} onClick={() => navigate('/billing')}>
                                    <FileText size={14} /> {t('clients_page.invoice_btn')}
                                </Button>
                                <Button variant="secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem' }} onClick={() => window.open(`tel:${client.phone}`)}>
                                    {t('clients_page.call_btn')}
                                </Button>
                                <Button variant="secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem' }} onClick={() => window.open(`mailto:${client.email}`)}>
                                    {t('clients_page.email_btn')}
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Modal - Standard High Z-Index Popup - Portal Fixed Viewport */}
            {showModal && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100dvh', // Modern viewport unit
                    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
                    zIndex: 2147483647,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start', // Align to top but centered horizontally
                    paddingTop: '10vh', // Push down from top
                    paddingLeft: '16px',
                    paddingRight: '16px'
                }} onClick={() => setShowModal(false)}>

                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            width: '100%',
                            maxWidth: '500px',
                            maxHeight: '90vh', // Increased max height
                            // marginTop removed for perfect centering
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            position: 'relative',
                            animation: 'fade-in 0.2s ease-out'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #f0f0f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'white',
                            zIndex: 10
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#111' }}>{t('clients_page.modal.title')}</h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#666'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{
                            padding: '20px',
                            overflowY: 'auto', // Internal scroll
                            flex: 1,
                            WebkitOverflowScrolling: 'touch'
                        }}>
                            <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Name */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>{t('clients_page.modal.name_label')}</label>
                                    <input
                                        required
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', color: '#333', backgroundColor: '#fff' }}
                                        value={newClient.name}
                                        onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                                        placeholder={t('clients_page.modal.placeholders.name')}
                                    />
                                </div>
                                {/* Phone */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>{t('clients_page.modal.phone_label')}</label>
                                    <input
                                        type="tel"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', color: '#333', backgroundColor: '#fff' }}
                                        value={newClient.phone}
                                        onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                                        placeholder={t('clients_page.modal.placeholders.phone')}
                                    />
                                </div>
                                {/* Email */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>{t('clients_page.modal.email_label')}</label>
                                    <input
                                        type="email"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', color: '#333', backgroundColor: '#fff' }}
                                        value={newClient.email}
                                        onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                                        placeholder={t('clients_page.modal.placeholders.email')}
                                    />
                                </div>
                                {/* Address */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>{t('clients_page.modal.address_label')}</label>
                                    <input
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', color: '#333', backgroundColor: '#fff' }}
                                        value={newClient.address}
                                        onChange={e => setNewClient({ ...newClient, address: e.target.value })}
                                        placeholder={t('clients_page.modal.placeholders.address')}
                                    />
                                </div>

                                {/* Horses */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>{t('clients_page.modal.horses_label')}</label>
                                    <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', backgroundColor: '#f9fafb' }}>
                                        <div style={{ position: 'relative', marginBottom: '10px' }}>
                                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                            <input
                                                placeholder={t('clients_page.search_placeholder')}
                                                value={horseSearch}
                                                onChange={e => setHorseSearch(e.target.value)}
                                                style={{ width: '100%', padding: '8px 8px 8px 32px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '0.9rem', color: '#333', backgroundColor: '#fff' }}
                                                onClick={e => e.stopPropagation()}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                                            {availableHorses.filter(h => h.name.toLowerCase().includes(horseSearch.toLowerCase())).map(h => {
                                                const isSelected = (newClient._selected || []).includes(h.name);
                                                return (
                                                    <div
                                                        key={h.id}
                                                        onClick={() => {
                                                            const currentSelected = newClient._selected || [];
                                                            let newSelected = isSelected ? currentSelected.filter(n => n !== h.name) : [...currentSelected, h.name];
                                                            setNewClient({ ...newClient, horses: newSelected.join(', '), _selected: newSelected });
                                                        }}
                                                        style={{
                                                            padding: '4px 10px', borderRadius: '14px', fontSize: '0.8rem', cursor: 'pointer',
                                                            background: isSelected ? '#3b82f6' : 'white', color: isSelected ? 'white' : '#4b5563', border: '1px solid #d1d5db'
                                                        }}
                                                    >
                                                        {h.name}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {newClient._selected?.length > 0 && (
                                            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {newClient._selected.map(n => <span key={n} style={{ fontSize: '0.75rem', background: '#e0e7ff', padding: '2px 6px', borderRadius: '4px' }}>{n}</span>)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: '#e5e7eb', color: '#1f2937', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>{t('clients_page.modal.cancel_btn')}</button>
                                    <button type="submit" style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600 }}>{t('clients_page.modal.submit_btn')}</button>
                                </div>
                                {/* Bottom safety spacer inside the scrollable area */}
                                <div style={{ height: '40px' }}></div>
                            </form>
                        </div>
                    </div>
                </div>
                , document.body)}
        </div>
    );
};

export default ClientsManagement;
