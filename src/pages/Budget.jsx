import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { Plus, Trash2, PieChart, TrendingUp, DollarSign, Calendar, Tag, Filter } from 'lucide-react';

import { useTranslation } from 'react-i18next';

const Budget = () => {
    const { t, i18n } = useTranslation();
    const [expenses, setExpenses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // New Expense State
    const [newExpense, setNewExpense] = useState({
        date: new Date().toISOString().split('T')[0],
        category: 'Pension',
        amount: '',
        description: ''
    });

    const categories = ['pension', 'farrier', 'vet', 'care', 'competition', 'lesson', 'equipment', 'transport', 'other'];

    useEffect(() => {
        const saved = localStorage.getItem('appHorse_budget');
        if (saved) {
            setExpenses(JSON.parse(saved));
        }
    }, []);

    const saveExpenses = (updated) => {
        setExpenses(updated);
        localStorage.setItem('appHorse_budget', JSON.stringify(updated));
    };

    const handleAdd = (e) => {
        e.preventDefault();
        const expense = {
            id: Date.now(),
            ...newExpense,
            amount: parseFloat(newExpense.amount)
        };
        saveExpenses([expense, ...expenses]);
        setShowModal(false);
        setNewExpense({
            date: new Date().toISOString().split('T')[0],
            category: 'pension',
            amount: '',
            description: ''
        });
    };

    const handleDelete = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (deleteId) {
            saveExpenses(expenses.filter(e => e.id !== deleteId));
            setShowDeleteModal(false);
            setDeleteId(null);
        }
    };

    // Derived Data
    const filteredExpenses = expenses
        .filter(e => e.date.startsWith(filterMonth))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalMonth = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    const expensesByCat = filteredExpenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {});

    const topCategory = Object.entries(expensesByCat).sort((a, b) => b[1] - a[1])[0];

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PieChart className="text-primary" /> {t('budget_page.title')}
                    </h2>
                    <p style={{ color: '#666', margin: '0.5rem 0 0 0' }}>{t('budget_page.subtitle')}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Calendar size={18} style={{ position: 'absolute', left: '10px', color: '#666', pointerEvents: 'none', zIndex: 1 }} />
                        <div style={{
                            padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            background: 'white',
                            minWidth: '160px',
                            cursor: 'pointer',
                            userSelect: 'none',
                            fontSize: '0.95rem',
                            color: '#000'
                        }}>
                            {(() => {
                                const [y, m] = filterMonth.split('-');
                                const d = new Date(parseInt(y), parseInt(m) - 1);
                                const label = d.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });
                                return label.charAt(0).toUpperCase() + label.slice(1);
                            })()}
                        </div>
                        <input
                            type="month"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                opacity: 0,
                                cursor: 'pointer',
                                width: '100%',
                                height: '100%'
                            }}
                        />
                    </div>
                    <Button onClick={() => setShowModal(true)} title={t('budget_page.new_expense_btn')}>
                        <Plus size={18} /> <span className="hide-on-mobile">{t('budget_page.new_expense_btn')}</span>
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <Card style={{ textAlign: 'center' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t('budget_page.stats.total_month', { month: new Date(filterMonth).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' }) })}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>{totalMonth.toFixed(2)} €</div>
                </Card>
                <Card style={{ textAlign: 'center' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t('budget_page.stats.top_category')}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{topCategory ? t(`budget_page.categories.${topCategory[0]}`) : '-'}</div>
                    <div style={{ fontSize: '0.9rem', color: '#888' }}>{topCategory ? topCategory[1].toFixed(2) + ' €' : ''}</div>
                </Card>
                <Card style={{ textAlign: 'center' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t('budget_page.stats.expense_count')}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{filteredExpenses.length}</div>
                </Card>
            </div>

            {/* Expenses List */}
            <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredExpenses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#999', background: '#f9fafb', borderRadius: '12px' }}>
                        {t('budget_page.empty_list')}
                    </div>
                ) : (
                    filteredExpenses.map(expense => (
                        <div key={expense.id} style={{
                            background: 'white', padding: '1rem', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', fontSize: '1.2rem'
                                }}>
                                    {t(`budget_page.categories.${expense.category}`).charAt(0)}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{t(`budget_page.categories.${expense.category}`)}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                        {new Date(expense.date).toLocaleDateString(i18n.language)}
                                        {expense.description && ` • ${expense.description}`}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>-{expense.amount.toFixed(2)} €</div>
                                <button
                                    onClick={() => handleDelete(expense.id)}
                                    style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}
                                    title={t('budget_page.delete_tooltip')}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Modal */}
            {showModal && createPortal(
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, // Dark overlay
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', // Align to top
                    paddingTop: '10vh'
                }}>
                    <Card style={{ width: '90%', maxWidth: '400px' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0' }}>{t('budget_page.modal.title')}</h3>
                        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('budget_page.modal.amount')}</label>
                                <input
                                    type="number" step="0.01" required autoFocus
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1.2rem', color: '#333', backgroundColor: '#fff' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('budget_page.modal.date')}</label>
                                    <input
                                        type="date" required
                                        value={newExpense.date}
                                        onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('budget_page.modal.category')}</label>
                                    <select
                                        value={newExpense.category}
                                        onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                    >
                                        {categories.map(c => <option key={c} value={c}>{t(`budget_page.categories.${c}`)}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('budget_page.modal.description')}</label>
                                <input
                                    type="text" placeholder={t('budget_page.modal.description_placeholder')}
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button type="button" variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>{t('budget_page.modal.cancel_btn')}</Button>
                                <Button type="submit" style={{ flex: 1 }}>{t('budget_page.modal.add_btn')}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
                , document.body)}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ width: '90%', maxWidth: '350px', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 1rem 0' }}>{t('budget_page.delete_modal.title')}</h3>
                        <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('budget_page.delete_modal.subtitle')}</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} style={{ flex: 1 }}>{t('budget_page.delete_modal.cancel_btn')}</Button>
                            <Button onClick={confirmDelete} style={{ flex: 1, background: '#ef4444' }}>{t('budget_page.delete_modal.confirm_btn')}</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Budget;
