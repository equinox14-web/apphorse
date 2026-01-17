import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { User, Plus, LogOut, Check, X } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

import { useTranslation } from 'react-i18next';

const SwitchAccount = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [currentUid, setCurrentUid] = useState(auth.currentUser?.uid);

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('known_accounts') || '[]');
            setAccounts(saved);
        } catch (e) {
            console.error(e);
        }

        const unsubscribe = auth.onAuthStateChanged(user => {
            setCurrentUid(user?.uid);
        });
        return () => unsubscribe();
    }, []);

    const handleSwitch = async (account) => {
        if (account.uid === currentUid) {
            navigate('/'); // Already logged in
            return;
        }

        try {
            await signOut(auth);
            localStorage.clear();
            // We must preserve known_accounts though!
            localStorage.setItem('known_accounts', JSON.stringify(accounts));

            // Redirect to login with hint
            navigate(`/login?email=${encodeURIComponent(account.email)}`);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleAddAccount = async () => {
        try {
            await signOut(auth);
            localStorage.clear();
            localStorage.setItem('known_accounts', JSON.stringify(accounts));
            navigate('/login');
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateAccount = async () => {
        try {
            await signOut(auth);
            localStorage.clear();
            localStorage.setItem('known_accounts', JSON.stringify(accounts));
            navigate('/signup');
        } catch (error) {
            console.error(error);
        }
    };

    const removeAccount = (e, uid) => {
        e.stopPropagation();
        if (window.confirm(t('switch_account.confirm_forget'))) {
            const newAccounts = accounts.filter(a => a.uid !== uid);
            setAccounts(newAccounts);
            localStorage.setItem('known_accounts', JSON.stringify(newAccounts));
        }
    };

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', background: '#f3f4f6', padding: '1rem'
        }}>
            <Card style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.8rem' }}>{t('switch_account.title')}</h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {accounts.map(account => (
                        <div
                            key={account.uid}
                            onClick={() => handleSwitch(account)}
                            className="hover-scale"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                padding: '1rem', borderRadius: '12px',
                                background: account.uid === currentUid ? '#e0e7ff' : 'white',
                                border: account.uid === currentUid ? '2px solid #6366f1' : '1px solid #e5e7eb',
                                cursor: 'pointer', position: 'relative',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}
                        >
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: '#e5e7eb', overflow: 'hidden',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#6b7280'
                            }}>
                                {account.photoURL ? (
                                    <img src={account.photoURL} alt={account.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={24} />
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, color: '#111827' }}>
                                    {account.displayName}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                    {account.email}
                                </div>
                            </div>

                            {account.uid === currentUid && <Check size={20} color="#6366f1" />}

                            {account.uid !== currentUid && (
                                <button
                                    onClick={(e) => removeAccount(e, account.uid)}
                                    style={{ border: 'none', background: 'none', padding: '4px', color: '#9ca3af', cursor: 'pointer' }}
                                    title={t('switch_account.forget_tooltip')}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ))}

                    {accounts.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic', marginBottom: '1rem' }}>
                            {t('switch_account.no_accounts')}
                        </div>
                    )}

                    <Button variant="secondary" onClick={handleAddAccount} style={{ padding: '1rem', justifyContent: 'center' }}>
                        <Plus size={20} /> {t('switch_account.add_account_btn')}
                    </Button>

                    <div style={{ borderTop: '1px solid #e5e7eb', margin: '1rem 0' }} />

                    <Button variant="outline" onClick={handleCreateAccount} style={{ padding: '1rem', justifyContent: 'center', border: '1px dashed #ccc' }}>
                        {t('switch_account.create_account_btn')}
                    </Button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ border: 'none', background: 'none', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {t('switch_account.cancel_btn')}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default SwitchAccount;
