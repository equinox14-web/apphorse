import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next'; // Import translation hook
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Users, Search, Plus, Phone, Mail, MapPin, Heart, ChevronRight, X, User, FileText } from 'lucide-react';

// Force refresh confirm
console.log("Clients Component Loaded v6FullMobile");

const Clients = () => {
    const { t } = useTranslation(); // Init translation hook
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [detailClient, setDetailClient] = useState(null);

    // Mock Data
    const [clients, setClients] = useState([
        {
            id: 1,
            name: 'Sophie Martin',
            email: 'sophie.martin@example.com',
            phone: '06 12 34 56 78',
            address: '15 Rue des Lilas, 75000 Paris',
            horses: ['Thunder', 'Eclair'],
            notes: 'Propriétaire depuis 2020. Préférence pour les cours du matin.'
        },
        {
            id: 2,
            name: 'Jean Dupont',
            email: 'jean.dup@example.com',
            phone: '06 98 76 54 32',
            address: '8 Avenue du Parc, 92000 Nanterre',
            horses: ['Bella'],
            notes: 'Paiement trimestriel.'
        },
        {
            id: 3,
            name: 'Marie Cura',
            email: 'marie.cura@example.com',
            phone: '07 55 44 33 22',
            address: 'Les Granges, 78000 Versailles',
            horses: ['Maximus'],
            notes: 'Vétérinaire de profession.'
        },
    ]);

    const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '', horses: '', notes: '' });

    const handleAddClient = (e) => {
        e.preventDefault();
        const client = {
            id: Math.floor(Math.random() * 1000),
            ...newClient,
            horses: newClient.horses.split(',').map(h => h.trim()).filter(h => h)
        };
        setClients([...clients, client]);
        setShowModal(false);
        setNewClient({ name: '', email: '', phone: '', address: '', horses: '', notes: '' });
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.horses.some(h => h.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="animate-fade-in">

            {/* Toolbar - Explicitly styled for separation */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 w-full gap-4">

                {/* LEFT: Search Bar - Larger and Floating */}
                <div className="relative w-full md:w-[400px]">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={22} />
                        <input
                            type="text"
                            placeholder={t('clients_page.search_placeholder')}
                            className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-700 text-lg placeholder-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT: Action Button */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    {/* Counter */}
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm text-sm font-medium text-gray-600">
                        <Users size={16} className="text-blue-500" />
                        {filteredClients.length}
                    </div>

                    {/* Add Button */}
                    <Button
                        onClick={() => setShowModal(true)}
                        className="shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transform hover:-translate-y-1 transition-all py-3 px-6 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={20} /> <span className="uppercase tracking-wide text-sm">{t('clients_page.new_client_btn')}</span>
                    </Button>
                </div>
            </div>

            {/* Grid */}
            <div className="responsive-card-grid">
                {filteredClients.map(client => (
                    <Card
                        key={client.id}
                        className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-transparent hover:border-blue-100 group"
                        onClick={() => setDetailClient(client)}
                    >
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center font-bold text-xl ring-4 ring-white shadow-sm">
                                        {client.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">{client.name}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <User size={12} /> {t('clients_page.client_id', { id: client.id })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Preview */}
                            <div className="space-y-2 mb-5 pl-2 border-l-2 border-gray-100">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Phone size={14} className="text-gray-400" /> {client.phone}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Mail size={14} className="text-gray-400" /> <span className="truncate">{client.email}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex flex-wrap gap-2">
                                    {client.horses.map((horse, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                                            <Heart size={10} className="fill-current" /> {horse}
                                        </span>
                                    ))}
                                    {client.horses.length === 0 && <span className="text-xs text-gray-400 italic px-2">{t('clients_page.no_horses')}</span>}
                                </div>
                                <div className="text-gray-300 group-hover:text-blue-500 transition-colors">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Modal Detail */}
            {detailClient && (
                <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setDetailClient(null)}>
                    <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl scale-100" onClick={e => e.stopPropagation()}>
                        <div className="p-0">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={120} /></div>
                                <button onClick={() => setDetailClient(null)} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>

                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="h-20 w-20 rounded-full bg-white text-blue-600 flex items-center justify-center text-3xl font-bold shadow-lg ring-4 ring-blue-500/30">
                                        {detailClient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold">{detailClient.name}</h2>
                                        <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-full bg-blue-800/50 backdrop-blur-sm text-sm border border-blue-400/30">
                                            <span className="w-2 h-2 rounded-full bg-green-400"></span> {t('clients_page.active_badge')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <a href={`tel:${detailClient.phone}`} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-all font-semibold border border-green-100 cursor-pointer">
                                        <div className="bg-white p-2 rounded-full shadow-sm"><Phone size={20} /></div> {t('clients_page.call_btn')}
                                    </a>
                                    <a href={`mailto:${detailClient.email}`} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all font-semibold border border-blue-100 cursor-pointer">
                                        <div className="bg-white p-2 rounded-full shadow-sm"><Mail size={20} /></div> {t('clients_page.email_btn')}
                                    </a>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">{t('clients_page.contact_details')}</h4>
                                    <div className="grid gap-4">
                                        <div className="flex gap-4 items-start">
                                            <MapPin className="text-gray-400 mt-1" size={18} />
                                            <div>
                                                <div className="text-gray-900 font-medium">{detailClient.address}</div>
                                                <div className="text-xs text-gray-500">{t('clients_page.main_address')}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 items-start">
                                            <Phone className="text-gray-400 mt-1" size={18} />
                                            <div className="font-medium">{detailClient.phone}</div>
                                        </div>
                                        <div className="flex gap-4 items-start">
                                            <Mail className="text-gray-400 mt-1" size={18} />
                                            <div className="font-medium">{detailClient.email}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">{t('clients_page.horses_title')}</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {detailClient.horses.map((horse, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="bg-pink-100 p-1.5 rounded-full text-pink-500"><Heart size={14} className="fill-current" /></div>
                                                <span className="font-bold text-gray-700">{horse}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {detailClient.notes && (
                                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm text-gray-700 relative">
                                        <FileText className="absolute top-4 right-4 text-yellow-200" size={24} />
                                        <div className="font-bold text-yellow-800 mb-1">{t('clients_page.notes_title')}</div>
                                        {detailClient.notes}
                                    </div>
                                )}
                            </div>
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <Button variant="secondary" onClick={() => setDetailClient(null)}>{t('clients_page.close_btn')}</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Add Modal - Full Screen Mobile Portal Version */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[99999] flex justify-center items-start md:items-center bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full h-full md:w-full md:max-w-lg md:h-auto md:max-h-[85vh] bg-white md:rounded-2xl shadow-2xl relative flex flex-col">

                        {/* Header Fixed */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white z-10 shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">{t('clients_page.modal.title')}</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50" style={{ paddingBottom: '150px' }}>
                            <form onSubmit={handleAddClient} className="space-y-5">
                                <div>
                                    <label className="text-sm font-semibold text-gray-600 block mb-1">{t('clients_page.modal.name_label')}</label>
                                    <input required className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" style={{ color: '#333', backgroundColor: '#fff' }} placeholder={t('clients_page.modal.placeholders.name')} value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600 block mb-1">{t('clients_page.modal.phone_label')}</label>
                                        <input className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" style={{ color: '#333', backgroundColor: '#fff' }} placeholder={t('clients_page.modal.placeholders.phone')} value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600 block mb-1">{t('clients_page.modal.email_label')}</label>
                                        <input type="email" className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" style={{ color: '#333', backgroundColor: '#fff' }} placeholder={t('clients_page.modal.placeholders.email')} value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-600 block mb-1">{t('clients_page.modal.address_label')}</label>
                                    <input className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" style={{ color: '#333', backgroundColor: '#fff' }} placeholder={t('clients_page.modal.placeholders.address')} value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-600 block mb-1">{t('clients_page.modal.horses_label')}</label>
                                    <input className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" style={{ color: '#333', backgroundColor: '#fff' }} placeholder={t('clients_page.modal.placeholders.horses')} value={newClient.horses} onChange={e => setNewClient({ ...newClient, horses: e.target.value })} />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-600 block mb-1">{t('clients_page.modal.notes_label')}</label>
                                    <textarea className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" style={{ color: '#333', backgroundColor: '#fff' }} placeholder={t('clients_page.modal.placeholders.notes')} rows="3" value={newClient.notes} onChange={e => setNewClient({ ...newClient, notes: e.target.value })} />
                                </div>

                                <div className="flex gap-3 justify-end pt-6 mt-4 border-t border-gray-100">
                                    <Button variant="secondary" onClick={() => setShowModal(false)} type="button">{t('clients_page.modal.cancel_btn')}</Button>
                                    <Button type="submit" className="bg-blue-600 text-white shadow-lg font-bold hover:scale-105 transition-transform">{t('clients_page.modal.submit_btn')}</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                , document.body)}
        </div>
    );
};

export default Clients;
