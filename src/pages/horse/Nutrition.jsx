import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Utensils, Info, Check, Save, Plus, Trash2, Calculator } from 'lucide-react';
import { canManageHorses } from '../../utils/permissions';

const Nutrition = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [horses, setHorses] = useState([]);
    const [stockItems, setStockItems] = useState([]);
    const [selectedHorseId, setSelectedHorseId] = useState(null);
    const [editMode, setEditMode] = useState(false);

    // Form state for editing
    const [rationForm, setRationForm] = useState({
        morning: '', noon: '', evening: '', supplements: '', hay: ''
    });

    useEffect(() => {
        // Load Horses
        const savedHorses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        setHorses(savedHorses);
        if (savedHorses.length > 0) {
            const firstHorse = savedHorses[0];
            setSelectedHorseId(firstHorse.id);
            // Initialize form with first horse's data
            if (firstHorse.ration) {
                setRationForm(firstHorse.ration);
            }
        }

        // Load Stock for suggestions
        const savedStock = JSON.parse(localStorage.getItem('appHorse_stock_v1') || '[]');
        const food = savedStock.filter(item =>
            item.category && (item.category.toLowerCase().includes('aliment') || item.category.toLowerCase().includes('grain') || item.category === 'Nourriture')
        );
        setStockItems(food);
    }, []);

    const handleHorseSelect = (id) => {
        setSelectedHorseId(id);
        const horse = horses.find(h => h.id === id);
        if (horse && horse.ration) {
            setRationForm(horse.ration);
        } else {
            setRationForm({ morning: '', noon: '', evening: '', supplements: '', hay: '' });
        }
        setEditMode(false);
    };

    const handleSaveRation = () => {
        const updatedHorses = horses.map(h => {
            if (h.id === selectedHorseId) {
                return { ...h, ration: rationForm };
            }
            return h;
        });

        setHorses(updatedHorses);
        localStorage.setItem('my_horses_v4', JSON.stringify(updatedHorses));
        setEditMode(false);
        // alert(t('nutrition_page.ration_card.save_alert')); // Optional feedback
    };

    const handleCancel = () => {
        const horse = horses.find(h => h.id === selectedHorseId);
        if (horse && horse.ration) {
            setRationForm(horse.ration);
        } else {
            setRationForm({ morning: '', noon: '', evening: '', supplements: '', hay: '' });
        }
        setEditMode(false);
    };

    // Calculate weekly needs based on simple text parsing (approximation)
    const calculateWeeklyNeeds = () => {
        let totalLiters = 0;
        Object.values(rationForm).forEach(val => {
            const lines = Array.isArray(val) ? val : [val];
            lines.forEach(line => {
                if (!line) return;
                const match = line.match(/(\d+(\.\d+)?)/);
                if (match) {
                    totalLiters += parseFloat(match[0]);
                }
            });
        });
        return (totalLiters * 7).toFixed(1);
    };

    const selectedHorse = horses.find(h => h.id === selectedHorseId);

    if (horses.length === 0) return <div className="p-8 text-center text-gray-500">{t('nutrition_page.no_horses')}</div>;

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
            <div className="responsive-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '12px', background: '#dbeafe', borderRadius: '12px', color: '#2563eb' }}>
                    <Utensils size={32} />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#1e3a8a' }}>{t('nutrition_page.title')}</h2>
                    <p style={{ color: '#64748b' }}>{t('nutrition_page.subtitle')}</p>
                </div>
            </div>

            {/* Horse Selector - Top Bar (Mobile Friendly) */}
            <Card style={{ marginBottom: '2rem', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                        {t('nutrition_page.sidebar_title')}:
                    </div>
                    <select
                        value={selectedHorseId || ''}
                        onChange={(e) => handleHorseSelect(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '0.8rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '1rem',
                            background: 'white',
                            color: '#1e293b',
                            fontWeight: 600
                        }}
                    >
                        {horses.map(h => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                    </select>
                </div>
            </Card>

            {/* Content Area */}
            <div>
                {selectedHorse ? (
                    <div className="animate-fade-in">
                        <div className="responsive-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{t('nutrition_page.ration_card.title')} <span style={{ color: '#2563eb' }}>{selectedHorse.name}</span></h3>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {(!editMode) && (
                                    <>
                                        <Button variant="secondary" onClick={() => navigate(`/horses/${selectedHorseId}/nutrition`)}>
                                            <Calculator size={18} style={{ marginRight: '6px' }} />
                                            Calculateur
                                        </Button>
                                        <Button onClick={() => setEditMode(true)}>{t('nutrition_page.ration_card.edit_btn')}</Button>
                                    </>
                                )}
                                {editMode && (
                                    <>
                                        <Button variant="secondary" onClick={handleCancel}>{t('nutrition_page.ration_card.cancel_btn')}</Button>
                                        <Button onClick={handleSaveRation} style={{ background: '#10b981' }}><Save size={18} style={{ marginRight: '6px' }} /> {t('nutrition_page.ration_card.save_btn')}</Button>
                                    </>
                                )}
                            </div>
                        </div>

                        <Card>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                                {[
                                    { key: 'morning', label: t('nutrition_page.meals.morning'), color: '#fef3c7', iconColor: '#d97706' },
                                    { key: 'noon', label: t('nutrition_page.meals.noon'), color: '#fff7ed', iconColor: '#c2410c' },
                                    { key: 'evening', label: t('nutrition_page.meals.evening'), color: '#f0f9ff', iconColor: '#0284c7' },
                                    { key: 'supplements', label: t('nutrition_page.meals.supplements'), color: '#f3e8ff', iconColor: '#7e22ce' },
                                    { key: 'hay', label: t('nutrition_page.meals.hay'), color: '#ecfdf5', iconColor: '#059669', fullWidth: true }
                                ].map((meal) => (
                                    <div key={meal.key} style={{ gridColumn: meal.fullWidth ? '1 / -1' : 'auto' }}>
                                        <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: meal.iconColor }}></div>
                                            {meal.label}
                                        </div>
                                        {editMode ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {(Array.isArray(rationForm[meal.key]) ? rationForm[meal.key] : (rationForm[meal.key] ? [rationForm[meal.key]] : []))
                                                    .map((item, idx) => (
                                                        <div key={idx} style={{ display: 'flex', gap: '6px' }}>
                                                            <input
                                                                style={{
                                                                    width: '100%', padding: '0.8rem', borderRadius: '8px',
                                                                    border: '1px solid #cbd5e1', fontSize: '0.95rem',
                                                                    color: '#333', backgroundColor: '#fff'
                                                                }}
                                                                placeholder={t('nutrition_page.placeholders.ration_input', { meal: meal.label.toLowerCase() })}
                                                                value={item}
                                                                onChange={(e) => {
                                                                    const oldVal = Array.isArray(rationForm[meal.key]) ? rationForm[meal.key] : (rationForm[meal.key] ? [rationForm[meal.key]] : []);
                                                                    const newVal = [...oldVal];
                                                                    newVal[idx] = e.target.value;
                                                                    setRationForm({ ...rationForm, [meal.key]: newVal });
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const oldVal = Array.isArray(rationForm[meal.key]) ? rationForm[meal.key] : (rationForm[meal.key] ? [rationForm[meal.key]] : []);
                                                                    const newVal = oldVal.filter((_, i) => i !== idx);
                                                                    setRationForm({ ...rationForm, [meal.key]: newVal });
                                                                }}
                                                                style={{ padding: '0 10px', color: '#ef4444', border: '1px solid #fee2e2', background: '#fff', borderRadius: '8px', cursor: 'pointer' }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                <button
                                                    onClick={() => {
                                                        const oldVal = Array.isArray(rationForm[meal.key]) ? rationForm[meal.key] : (rationForm[meal.key] ? [rationForm[meal.key]] : []);
                                                        setRationForm({ ...rationForm, [meal.key]: [...oldVal, ''] });
                                                    }}
                                                    style={{ fontSize: '0.85rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '4px' }}
                                                >
                                                    <Plus size={16} /> {t('nutrition_page.placeholders.add_product_btn')}
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{
                                                padding: '1.5rem', background: meal.color, borderRadius: '12px',
                                                fontSize: '1.1rem', fontWeight: 500, color: '#334155', minHeight: '80px',
                                                display: 'flex', flexDirection: 'column', justifyContent: 'center'
                                            }}>
                                                {(Array.isArray(rationForm[meal.key]) ? rationForm[meal.key] : (rationForm[meal.key] ? [rationForm[meal.key]] : []))
                                                    .map((line, i) => (
                                                        <div key={i} style={{ marginBottom: '4px' }}>{line}</div>
                                                    ))}
                                                {(!rationForm[meal.key] || rationForm[meal.key].length === 0) && <span style={{ opacity: 0.5, fontStyle: 'italic' }}>{t('nutrition_page.placeholders.undefined')}</span>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Info style={{ color: '#d97706', flexShrink: 0 }} />
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>{t('nutrition_page.needs_estimation.title')}</h4>
                                    <p style={{ margin: 0, color: '#b45309', fontSize: '0.95rem' }}>
                                        {t('nutrition_page.needs_estimation.description_part1')}
                                        <strong> {calculateWeeklyNeeds()} {t('nutrition_page.needs_estimation.description_part2')}</strong> {t('nutrition_page.needs_estimation.description_part3')}
                                        <br />
                                        {t('nutrition_page.needs_estimation.check_stock')}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#94a3b8', fontStyle: 'italic' }}>
                        {t('nutrition_page.select_hint')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Nutrition;
