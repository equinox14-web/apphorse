import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Utensils, Info, Check, Save, Plus, Trash2, Calculator } from 'lucide-react';
import { canManageHorses } from '../../utils/permissions';

const Nutrition = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [horses, setHorses] = useState([]);
    const [stockItems, setStockItems] = useState([]);
    const [selectedHorseId, setSelectedHorseId] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false); // New choice modal

    // Form state for editing
    const [rationForm, setRationForm] = useState({
        morning: '', noon: '', evening: '', supplements: '', hay: ''
    });

    useEffect(() => {
        // Load Horses from Stable and Breeding
        const savedStable = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const savedBreeding = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');

        const stableHorses = savedStable.map(h => ({ ...h, source: 'stable' }));
        const breedingHorses = savedBreeding.map(m => ({
            ...m,
            source: 'breeding',
            // Map fields if necessary or rely on generic display
            ration: m.ration || { morning: '', noon: '', evening: '', supplements: '', hay: '' }
        }));

        const allHorses = [...stableHorses, ...breedingHorses];
        setHorses(allHorses);

        // Priority Selection Logic
        // 1. From Navigation State (redirect from Calculator)
        if (location.state && location.state.selectedHorseId) {
            const targetId = location.state.selectedHorseId;
            setSelectedHorseId(targetId);
            const targetHorse = allHorses.find(h => h.id.toString() === targetId.toString());
            if (targetHorse && targetHorse.ration) {
                setRationForm(targetHorse.ration);
            }
        }
        // 2. Default to first horse
        else if (allHorses.length > 0) {
            const firstHorse = allHorses[0];
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
    }, [location.state]);

    const handleHorseSelect = (id) => {
        // Convertir en nombre si nécessaire pour la comparaison
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

        setSelectedHorseId(numericId);
        const horse = horses.find(h => h.id == numericId); // == pour comparaison flexible
        if (horse && horse.ration) {
            setRationForm(horse.ration);
        } else {
            setRationForm({ morning: '', noon: '', evening: '', supplements: '', hay: '' });
        }
        setEditMode(false);
    };

    const handleSaveRation = () => {
        const horseToUpdate = horses.find(h => h.id == selectedHorseId);
        if (!horseToUpdate) return;

        // Update Local State for immediate UI feedback
        const updatedAllHorses = horses.map(h => {
            if (h.id == selectedHorseId) {
                return { ...h, ration: rationForm };
            }
            return h;
        });
        setHorses(updatedAllHorses);

        // Conditional Persistent Save
        if (horseToUpdate.source === 'breeding') {
            const savedMares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');
            const updatedMares = savedMares.map(m => m.id == selectedHorseId ? { ...m, ration: rationForm } : m);
            localStorage.setItem('appHorse_breeding_v2', JSON.stringify(updatedMares));
        } else {
            const savedStable = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
            const updatedStable = savedStable.map(h => h.id == selectedHorseId ? { ...h, ration: rationForm } : h);
            localStorage.setItem('my_horses_v4', JSON.stringify(updatedStable));
        }

        setEditMode(false);
    };

    const handleCancel = () => {
        const horse = horses.find(h => h.id == selectedHorseId); // == pour comparaison flexible
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

    const selectedHorse = horses.find(h => h.id == selectedHorseId); // == pour comparaison flexible

    if (horses.length === 0) return <div className="p-8 text-center text-gray-500">{t('nutrition_page.no_horses')}</div>;

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
            <div className="responsive-row mb-8 flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                    <Utensils size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-extrabold m-0 text-slate-800 dark:text-white">{t('nutrition_page.title')}</h2>
                    <p className="text-slate-500 dark:text-slate-400">{t('nutrition_page.subtitle')}</p>
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
                        {/* Vérifier si le cheval a une ration définie OU si on est en mode édition */}
                        {(selectedHorse.ration && Object.values(selectedHorse.ration).some(val => val && val.length > 0)) || editMode ? (
                            <>
                                <div className="responsive-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <h3 className="text-2xl m-0 font-bold dark:text-white">{t('nutrition_page.ration_card.title')} <span className="text-primary">{selectedHorse.name}</span></h3>

                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {(!editMode) && (
                                            <>
                                                <Button onClick={() => setShowEditModal(true)}>{t('nutrition_page.ration_card.edit_btn')}</Button>
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
                                            { key: 'morning', label: t('nutrition_page.meals.morning'), className: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/30 text-amber-900 dark:text-amber-100', iconColor: '#d97706' },
                                            { key: 'noon', label: t('nutrition_page.meals.noon'), className: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/30 text-orange-900 dark:text-orange-100', iconColor: '#c2410c' },
                                            { key: 'evening', label: t('nutrition_page.meals.evening'), className: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/30 text-sky-900 dark:text-sky-100', iconColor: '#0284c7' },
                                            { key: 'supplements', label: t('nutrition_page.meals.supplements'), className: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700/30 text-purple-900 dark:text-purple-100', iconColor: '#7e22ce' },
                                            { key: 'hay', label: t('nutrition_page.meals.hay'), className: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/30 text-emerald-900 dark:text-emerald-100', iconColor: '#059669', fullWidth: true }
                                        ].map((meal) => (
                                            <div key={meal.key} style={{ gridColumn: meal.fullWidth ? '1 / -1' : 'auto' }}>
                                                <div className="mb-2 font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: meal.iconColor }}></div>
                                                    {meal.label}
                                                </div>
                                                {editMode ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        {(Array.isArray(rationForm[meal.key]) ? rationForm[meal.key] : (rationForm[meal.key] ? [rationForm[meal.key]] : []))
                                                            .map((item, idx) => (
                                                                <div key={idx} style={{ display: 'flex', gap: '6px' }}>
                                                                    <input
                                                                        className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/50"
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
                                                    <div className={`${meal.className} p-6 rounded-2xl border min-h-[80px] flex flex-col justify-center transition-colors`}>
                                                        {(Array.isArray(rationForm[meal.key]) ? rationForm[meal.key] : (rationForm[meal.key] ? [rationForm[meal.key]] : []))
                                                            .map((line, i) => (
                                                                <div key={i} className="mb-1 font-medium text-lg">{line}</div>
                                                            ))}
                                                        {(!rationForm[meal.key] || rationForm[meal.key].length === 0) && <span className="opacity-50 italic text-sm">{t('nutrition_page.placeholders.undefined')}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-2xl text-yellow-900 dark:text-yellow-100 flex gap-4">
                                    <Info className="flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                                    <div>
                                        <h4 className="m-0 mb-2 font-bold text-yellow-800 dark:text-yellow-200">{t('nutrition_page.needs_estimation.title')}</h4>
                                        <p className="m-0 text-sm opacity-90 leading-relaxed">
                                            {t('nutrition_page.needs_estimation.description_part1')}
                                            <strong> {calculateWeeklyNeeds()} {t('nutrition_page.needs_estimation.description_part2')}</strong> {t('nutrition_page.needs_estimation.description_part3')}
                                            <br />
                                            {t('nutrition_page.needs_estimation.check_stock')}
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* État vide : Aucune ration configurée */
                            <Card>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4rem 2rem',
                                    textAlign: 'center'
                                }}>
                                    <div style={{
                                        padding: '1.5rem',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        borderRadius: '50%',
                                        marginBottom: '2rem'
                                    }}>
                                        <Calculator size={48} color="white" />
                                    </div>

                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                                        Aucune ration configurée pour {selectedHorse.name}
                                    </h3>

                                    <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '2rem', maxWidth: '500px' }}>
                                        Utilisez notre calculateur intelligent ou créez une ration manuellement.
                                    </p>

                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        <Button
                                            onClick={() => navigate(`/horses/${selectedHorseId}/nutrition`)}
                                            style={{
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                fontSize: '1.05rem',
                                                padding: '0.9rem 1.8rem'
                                            }}
                                        >
                                            <Calculator size={20} style={{ marginRight: '8px' }} />
                                            Calculateur IA
                                        </Button>

                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                // Initialiser une ration vide et passer en mode édition
                                                setRationForm({
                                                    morning: [''],
                                                    noon: [''],
                                                    evening: [''],
                                                    supplements: [''],
                                                    hay: ['']
                                                });
                                                setEditMode(true);
                                            }}
                                            style={{
                                                fontSize: '1.05rem',
                                                padding: '0.9rem 1.8rem'
                                            }}
                                        >
                                            <Plus size={20} style={{ marginRight: '8px' }} />
                                            Créer Manuellement
                                        </Button>
                                    </div>

                                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '1.5rem' }}>
                                        Le calculateur génère une ration optimisée que vous pourrez modifier par la suite
                                    </p>
                                </div>
                            </Card>
                        )}

                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#94a3b8', fontStyle: 'italic' }}>
                        {t('nutrition_page.select_hint')}
                    </div>
                )}
            </div>
            {/* Modal de choix du mode d'édition */}
            {showEditModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(3px)'
                }} onClick={() => setShowEditModal(false)}>

                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'white', padding: '2rem', borderRadius: '24px',
                            width: '90%', maxWidth: '480px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            animation: 'fadeIn 0.2s ease-out'
                        }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '50%', background: '#eff6ff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto',
                                color: '#3b82f6'
                            }}>
                                <Utensils size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                                Modifier la Ration
                            </h3>
                            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                                Choisissez votre methode de modification pour <strong>{selectedHorse?.name}</strong>
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            {/* Option Manuelle */}
                            <button
                                onClick={() => { setShowEditModal(false); setEditMode(true); }}
                                style={{
                                    padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0',
                                    background: 'white', cursor: 'pointer', transition: 'all 0.2s',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <div style={{ padding: '0.8rem', background: '#f1f5f9', borderRadius: '12px', color: '#475569' }}>
                                    <Utensils size={24} />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1rem' }}>Manuellement</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Édition texte libre</div>
                                </div>
                            </button>

                            {/* Option IA */}
                            <button
                                onClick={() => { setShowEditModal(false); navigate(`/horses/${selectedHorseId}/nutrition`); }}
                                style={{
                                    padding: '1.5rem', borderRadius: '16px', border: '2px solid transparent',
                                    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem',
                                    boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.1)',
                                    position: 'relative'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 20px -3px rgba(124, 58, 237, 0.2)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(124, 58, 237, 0.1)'; }}
                            >
                                <div style={{
                                    padding: '0.8rem',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                    borderRadius: '12px', color: 'white',
                                    boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.4)'
                                }}>
                                    <Calculator size={24} />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontWeight: 'bold', color: '#5b21b6', fontSize: '1rem' }}>Assistant IA</div>
                                    <div style={{ fontSize: '0.75rem', color: '#7c3aed', marginTop: '4px' }}>Calculateur Automatique</div>
                                </div>
                                <div style={{
                                    position: 'absolute', top: -10, right: -10,
                                    background: '#10b981', color: 'white', fontSize: '0.65rem', fontWeight: 'bold',
                                    padding: '0.2rem 0.6rem', borderRadius: '999px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    RECOMMANDÉ
                                </div>
                            </button>
                        </div>

                        <Button
                            variant="text"
                            onClick={() => setShowEditModal(false)}
                            style={{ width: '100%', padding: '0.8rem', color: '#94a3b8' }}
                        >
                            Annuler
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Nutrition;
