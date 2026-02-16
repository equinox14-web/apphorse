import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { User, Plus, LogOut, Check, X } from 'lucide-react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { saveUserDataToFirestore } from '../../services/firestoreSync';

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
            if (currentUid) {
                await saveUserDataToFirestore(currentUid);
            }
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
            if (currentUid) {
                await saveUserDataToFirestore(currentUid);
            }
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
            if (currentUid) {
                await saveUserDataToFirestore(currentUid);
            }
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
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900 p-4 transition-colors duration-300">
            <Card className="w-full max-w-md p-8 bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700">
                <h1 className="text-center mb-8 text-2xl font-bold text-gray-900 dark:text-white">{t('switch_account.title')}</h1>

                <div className="flex flex-col gap-4">
                    {accounts.map(account => (
                        <div
                            key={account.uid}
                            onClick={() => handleSwitch(account)}
                            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 border group ${account.uid === currentUid
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 shadow-md transform scale-[1.02]'
                                : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md'
                                }`}
                        >
                            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300">
                                {account.photoURL ? (
                                    <img src={account.photoURL} alt={account.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={24} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 dark:text-white truncate">
                                    {account.displayName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {account.email}
                                </div>
                            </div>

                            {account.uid === currentUid && <div className="bg-indigo-100 dark:bg-indigo-500/20 p-1 rounded-full"><Check size={18} className="text-indigo-600 dark:text-indigo-400" /></div>}

                            {account.uid !== currentUid && (
                                <button
                                    onClick={(e) => removeAccount(e, account.uid)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title={t('switch_account.forget_tooltip')}
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    ))}

                    {accounts.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 italic mb-4">
                            {t('switch_account.no_accounts')}
                        </div>
                    )}

                    <Button variant="secondary" onClick={handleAddAccount} className="justify-center py-4 text-base bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-white border-none">
                        <Plus size={20} /> {t('switch_account.add_account_btn')}
                    </Button>

                    <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

                    <Button variant="outline" onClick={handleCreateAccount} className="justify-center py-4 border-dashed border-2 text-base dark:text-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-transparent">
                        {t('switch_account.create_account_btn')}
                    </Button>
                </div>

                <div className="text-center mt-8">
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white underline text-sm transition-colors"
                    >
                        {t('switch_account.cancel_btn')}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default SwitchAccount;
