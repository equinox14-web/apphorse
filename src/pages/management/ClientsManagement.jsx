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
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden relative animate-fade-in"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-slate-800 z-10">
                            <h3 className="m-0 text-xl font-bold text-gray-900 dark:text-white">{t('clients_page.modal.title')}</h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
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
                                    <label className="block mb-1.5 font-semibold text-sm text-gray-700 dark:text-gray-300">{t('clients_page.modal.name_label')}</label>
                                    <input
                                        required
                                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-base text-gray-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500/50 outline-none"
                                        value={newClient.name}
                                        onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                                        placeholder={t('clients_page.modal.placeholders.name')}
                                    />
                                </div>
                                {/* Phone */}
                                <div>
                                    <label className="block mb-1.5 font-semibold text-sm text-gray-700 dark:text-gray-300">{t('clients_page.modal.phone_label')}</label>
                                    <input
                                        type="tel"
                                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-base text-gray-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500/50 outline-none"
                                        value={newClient.phone}
                                        onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                                        placeholder={t('clients_page.modal.placeholders.phone')}
                                    />
                                </div>
                                {/* Email */}
                                <div>
                                    <label className="block mb-1.5 font-semibold text-sm text-gray-700 dark:text-gray-300">{t('clients_page.modal.email_label')}</label>
                                    <input
                                        type="email"
                                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-base text-gray-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500/50 outline-none"
                                        value={newClient.email}
                                        onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                                        placeholder={t('clients_page.modal.placeholders.email')}
                                    />
                                </div>
                                {/* Address */}
                                <div>
                                    <label className="block mb-1.5 font-semibold text-sm text-gray-700 dark:text-gray-300">{t('clients_page.modal.address_label')}</label>
                                    <input
                                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-base text-gray-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500/50 outline-none"
                                        value={newClient.address}
                                        onChange={e => setNewClient({ ...newClient, address: e.target.value })}
                                        placeholder={t('clients_page.modal.placeholders.address')}
                                    />
                                </div>

                                {/* Horses */}
                                <div>
                                    <label className="block mb-1.5 font-semibold text-sm text-gray-700 dark:text-gray-300">{t('clients_page.modal.horses_label')}</label>
                                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-slate-700/50">
                                        <div className="relative mb-2.5">
                                            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                placeholder={t('clients_page.search_placeholder')}
                                                value={horseSearch}
                                                onChange={e => setHorseSearch(e.target.value)}
                                                className="w-full py-2 pl-8 pr-2 rounded-md border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-white bg-white dark:bg-slate-700 focus:outline-none focus:border-blue-500"
                                                onClick={e => e.stopPropagation()}
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
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
                                                        className={`px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-colors ${isSelected
                                                                ? 'bg-blue-500 border-blue-600 text-white'
                                                                : 'bg-white dark:bg-slate-600 border-gray-200 dark:border-gray-500 text-gray-600 dark:text-gray-200 hover:border-blue-400'
                                                            }`}
                                                    >
                                                        {h.name}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {newClient._selected?.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {newClient._selected.map(n => <span key={n} className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">{n}</span>)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-2.5 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-slate-600 transition">{t('clients_page.modal.cancel_btn')}</button>
                                    <button type="submit" className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">{t('clients_page.modal.submit_btn')}</button>
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
