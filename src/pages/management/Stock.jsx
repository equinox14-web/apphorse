import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Package, Plus, AlertTriangle, Trash2, Edit2, ShoppingCart, Archive, TrendingDown, TrendingUp } from 'lucide-react';

import { useTranslation } from 'react-i18next';

const Stock = () => {
    const { t } = useTranslation();
    // --- State ---
    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem('appHorse_stock_v1');
        return saved ? JSON.parse(saved) : [];
    });

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [filterCategory, setFilterCategory] = useState('All');

    const [newItem, setNewItem] = useState({
        name: '', category: 'Alimentation', quantity: '', unit: '', threshold: '', supplier: ''
    });

    // --- Persistence ---
    useEffect(() => {
        localStorage.setItem('appHorse_stock_v1', JSON.stringify(items));
    }, [items]);

    // --- CRUD Actions ---
    const handleSaveItem = (e) => {
        e.preventDefault();
        const quantity = parseFloat(newItem.quantity);
        const threshold = parseFloat(newItem.threshold);

        if (editingItem) {
            // Edit
            setItems(items.map(i => i.id === editingItem.id ? { ...newItem, id: editingItem.id, quantity, threshold } : i));
        } else {
            // Create
            const item = {
                id: Date.now(),
                ...newItem,
                quantity,
                threshold
            };
            setItems([...items, item]);
        }
        closeModal();
    };

    const handleDelete = (id) => {
        setItems(items.filter(i => i.id !== id));
    };

    const adjustStock = (id, amount) => {
        setItems(items.map(i => {
            if (i.id === id) {
                const newQty = Math.max(0, i.quantity + amount);
                return { ...i, quantity: newQty };
            }
            return i;
        }));
    };

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setNewItem(item);
        } else {
            setEditingItem(null);
            setNewItem({ name: '', category: 'Alimentation', quantity: '', unit: '', threshold: '', supplier: '' });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
    };

    // --- Stats ---
    const lowStockCount = items.filter(i => i.quantity <= i.threshold).length;
    const itemsByCategory = items.reduce((acc, i) => {
        acc[i.category] = (acc[i.category] || 0) + 1;
        return acc;
    }, {});

    const filteredItems = filterCategory === 'All' ? items : items.filter(i => i.category === filterCategory);

    // Map of categories to translation keys
    // We keep using the French/English values as IDs for now to avoid breaking existing data too much, 
    // but ideally we should use technical keys (food, bedding...)
    const categoryKeys = {
        'Alimentation': 'food',
        'Litière': 'bedding',
        'Soins': 'care',
        'Matériel': 'material',
        'Divers': 'misc',
        // English fallback mappings if data was saved in EN
        'Feed': 'food',
        'Bedding': 'bedding',
        'Care': 'care',
        'Equipment': 'material',
        'Misc': 'misc'
    };

    // Construct display list - unique values from current items + default ones
    const categories = ['Alimentation', 'Litière', 'Soins', 'Matériel', 'Divers'];

    return (
        <div className="animate-fade-in">
            {/* Stats Header */}
            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#e0f2fe', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/icons/colis.png" alt="Articles" style={{ width: '24px', height: '24px' }} />
                    </div>
                    <div><div style={{ fontSize: '0.9rem', color: '#666' }}>{t('stock_page.stats.total_items')}</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{items.length}</div></div>
                </Card>
                <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: lowStockCount > 0 ? '#fee2e2' : '#dcfce7', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/icons/attention.png" alt="Alerte" style={{ width: '24px', height: '24px' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>{t('stock_page.stats.low_stock')}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: lowStockCount > 0 ? '#dc2626' : '#16a34a' }}>{lowStockCount}</div>
                    </div>
                </Card>
            </div>

            {/* Controls */}
            <div className="responsive-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setFilterCategory('All')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600,
                            background: filterCategory === 'All' ? '#2c3e50' : 'white',
                            color: filterCategory === 'All' ? 'white' : '#666',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                    >
                        {t('stock_page.filter.all')}
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600,
                                background: filterCategory === cat ? '#2c3e50' : 'white',
                                color: filterCategory === cat ? 'white' : '#666',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {/* Display translated label if possible, else cat */}
                            {t(`stock_page.categories.${categoryKeys[cat] || 'misc'}`)}
                        </button>
                    ))}
                </div>
                <Button onClick={() => openModal()}>
                    <Plus size={18} /> {t('stock_page.add_button')}
                </Button>
            </div>

            {/* Grid */}
            <div className="responsive-card-grid">
                {filteredItems.map(item => {
                    const isLow = item.quantity <= item.threshold;
                    return (
                        <div key={item.id} style={{
                            background: 'white', borderRadius: '16px', padding: '1.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                            border: isLow ? '2px solid #fee2e2' : '2px solid transparent',
                            position: 'relative', overflow: 'hidden'
                        }}>
                            {isLow && (
                                <div style={{
                                    position: 'absolute', top: 0, right: 0, background: '#fee2e2', color: '#dc2626',
                                    padding: '4px 12px', borderBottomLeftRadius: '12px', fontWeight: 700, fontSize: '0.8rem',
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                    <img src="/icons/attention.png" alt="!" style={{ width: '14px', height: '14px' }} /> {t('stock_page.order')}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                                        {t(`stock_page.categories.${categoryKeys[item.category] || 'misc'}`)}
                                    </div>
                                    <h3 style={{ margin: '0.2rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#1f2937' }}>{item.name}</h3>
                                    {item.supplier && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{t('stock_page.supplier_prefix')} {item.supplier}</div>}
                                </div>
                                <div style={{ background: '#f3f4f6', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src="/icons/colis.png" alt="Item" style={{ width: '20px', height: '20px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: isLow ? '#dc2626' : '#1f2937' }}>
                                        {item.quantity}
                                        <span style={{ fontSize: '1rem', fontWeight: 500, color: '#6b7280', marginLeft: '4px' }}>{item.unit}</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{t('stock_page.min_prefix')} {item.threshold} {item.unit}</div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => adjustStock(item.id, 1)}
                                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#dcfce7', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Plus size={16} />
                                    </button>
                                    <button
                                        onClick={() => adjustStock(item.id, -1)}
                                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <TrendingDown size={16} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                                <Button variant="secondary" onClick={() => openModal(item)} style={{ flex: 1, fontSize: '0.9rem' }}>
                                    <Edit2 size={16} /> {t('stock_page.edit')}
                                </Button>
                                <Button variant="secondary" onClick={() => handleDelete(item.id)} style={{ flex: 1, fontSize: '0.9rem', color: '#ef4444' }}>
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0)', zIndex: 1000,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: '5vh'
                }}>
                    <Card style={{ width: '95%', maxWidth: '500px' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{editingItem ? t('stock_page.modal.edit_title') : t('stock_page.modal.new_title')}</h3>
                        <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('stock_page.modal.name_label')}</label>
                                <input required placeholder="Ex: Granulés Sport" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                    value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('stock_page.modal.category_label')}</label>
                                <select
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white', color: '#333' }}
                                    value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                >
                                    {categories.map(c => (
                                        <option key={c} value={c}>
                                            {t(`stock_page.categories.${categoryKeys[c] || 'misc'}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('stock_page.modal.quantity_label')}</label>
                                    <input type="number" required placeholder="0" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                        value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('stock_page.modal.unit_label')}</label>
                                    <input required placeholder="Ex: Sacs, L, Kg" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                        value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('stock_page.modal.threshold_label')}</label>
                                    <input type="number" required placeholder="5" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                        value={newItem.threshold} onChange={e => setNewItem({ ...newItem, threshold: e.target.value })}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('stock_page.modal.supplier_label')}</label>
                                    <input placeholder="Opt." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                        value={newItem.supplier} onChange={e => setNewItem({ ...newItem, supplier: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="secondary" onClick={closeModal} style={{ flex: 1 }}>{t('stock_page.modal.cancel')}</Button>
                                <Button type="submit" style={{ flex: 1 }}>{t('stock_page.modal.save')}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Stock;
