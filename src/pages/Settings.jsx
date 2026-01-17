import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    FileText, Trash2, CreditCard, Star, Download, Wallet,
    Check, Crown, Briefcase, User, Bell, Palette, Settings as SettingsIcon,
    ChevronRight, LogOut, Mail, Smartphone, X
} from 'lucide-react';

// Component Imports
import Card from '../components/Card';
import SEO from '../components/SEO';

// Context & Utils Imports
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getUserPlanIds } from '../utils/permissions';
import { redirectToCustomerPortal, startCheckoutSession, changeSubscriptionPlan, connectStripeAccount } from '../utils/stripePayment';

// Firebase Imports
import { auth, db } from '../firebase';
import { updateEmail, updatePassword, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

const Settings = () => {
    const { t, i18n } = useTranslation();
    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };
    const { userProfile, currentUser, logout } = useAuth();
    const { mode, toggleMode, setTheme } = useTheme();

    // --- Stripe Connect Callback Handling ---
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const code = query.get('code');

        if (code) {
            const handleConnect = async () => {
                // Prevent double processing if desired, via local variable or ref, 
                // but window.history.replaceState clears logic quickly enough.
                alert("Finalisation de la connexion de votre compte bancaire...");

                const result = await connectStripeAccount(code);
                if (result.success) {
                    alert("Compte bancaire connecté avec succès !");
                    // Remove query param from URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                    // Reload to update UI (show connected state if handled) or just clear search
                    window.location.reload();
                } else {
                    alert("Erreur de connexion : " + (result.error || "Inconnue"));
                }
            };
            handleConnect();
        }
    }, []);

    // Init Legal Form from Profile
    useEffect(() => {
        if (userProfile) {
            setLegalForm({
                structureName: userProfile.billingDetails?.structureName || userProfile.displayName || '',
                headquartersAddress: userProfile.billingDetails?.headquartersAddress || '',
                siret: userProfile.billingDetails?.siret || '',
                tva: userProfile.billingDetails?.tva || ''
            });
        }
    }, [userProfile]);

    // --- Plan Configuration ---
    const PLAN_CONFIG = {
        // PRO PLANS
        'eleveur': {
            name: 'Spécial Éleveur',
            priceIds: { monthly: 'price_eleveur_month', yearly: 'price_eleveur_year' }
        },
        'start': {
            name: 'Start',
            priceIds: { monthly: 'price_start_month', yearly: 'price_start_year' }
        },
        'pro': {
            name: 'Pro',
            priceIds: { monthly: 'price_pro_month', yearly: 'price_pro_year' }
        },
        'elite': {
            name: 'Elite',
            priceIds: { monthly: 'price_elite_month', yearly: 'price_elite_year' }
        },
        // OWNER / AMATEUR PLANS
        'decouverte': {
            name: 'Découverte',
            priceIds: { monthly: null, yearly: null }
        },
        'passion': {
            name: 'Passion',
            priceIds: { monthly: 'price_passion_month', yearly: 'price_passion_year' }
        },
        'eleveur_amateur_paid': {
            name: 'Passion Élevage',
            priceIds: { monthly: 'price_passion_breeder_month', yearly: 'price_passion_breeder_year' }
        }
    };

    // --- State ---
    const pricingRef = useRef(null);
    const [billingPeriod, setBillingPeriod] = useState('monthly');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showChangePlanModal, setShowChangePlanModal] = useState(false);
    const [targetPlan, setTargetPlan] = useState(null); // { id, name, price }

    // Edit Profile State
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [editEmail, setEditEmail] = useState('');
    const [editDisplayName, setEditDisplayName] = useState('');

    // Change Password State
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // Legal Info State
    const [isEditingLegal, setIsEditingLegal] = useState(false);
    const [legalForm, setLegalForm] = useState({
        structureName: '',
        headquartersAddress: '',
        siret: '',
        tva: ''
    });
    const [showCGU, setShowCGU] = useState(false);

    // Notifications State
    const [notifications, setNotifications] = useState({
        careAlerts: true,
        supportMessages: true
    });

    // Sync Notifications from Profile
    useEffect(() => {
        if (userProfile?.notifications) {
            setNotifications({
                careAlerts: userProfile.notifications.careAlerts ?? true,
                supportMessages: userProfile.notifications.supportMessages ?? true
            });
        }
    }, [userProfile]);

    const handleToggleNotification = async (key) => {
        if (!currentUser) return;

        const newValue = !notifications[key];
        const newNotifications = { ...notifications, [key]: newValue };
        setNotifications(newNotifications); // Optimistic update

        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                notifications: newNotifications
            });
        } catch (error) {
            console.error("Error saving notifications:", error);
            // Revert if error
            setNotifications(prev => ({ ...prev, [key]: !newValue }));
        }
    };

    // --- Subscription Logic ---
    const plans = getUserPlanIds();
    const currentPlanId = plans[0] || 'decouverte';

    const formatPlanName = (id) => {
        if (!id) return 'Découverte';
        // Handle Amateur Names explicitly for nicer display
        if (id === 'eleveur_amateur_paid') return 'Passion Élevage';
        return id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const currentPlanName = formatPlanName(currentPlanId);

    const isProfessional = useMemo(() => {
        if (userProfile?.accountType === 'professional') return true;
        if (userProfile?.accountType === 'private') return false;

        const role = localStorage.getItem('user_role') || '';
        // Explicit PRO roles
        if (['Pro', 'Admin', 'Vétérinaire', 'Maréchal'].includes(role)) return true;

        // Explicit PRIVATE roles
        if (['rider', 'Propriétaire', 'Cavalier'].includes(role)) return false;

        const currentPlans = JSON.parse(localStorage.getItem('subscriptionPlan') || "[]");
        const proPlanKeys = ['start', 'pro', 'elite', 'eleveur', 'special_eleveur'];
        if (currentPlans.some(p => proPlanKeys.includes(p))) return true;

        // Default to FALSE for safety (Owner view is less complex/confusing than Pro view)
        return false;
    }, [userProfile]);

    const getPrice = (monthlyPrice) => {
        let price = monthlyPrice;
        if (billingPeriod === 'yearly') {
            const annualMap = {
                69: 659,
                129: 1229,
                79: 749,
                29: 279
            };
            price = annualMap[monthlyPrice] || Math.round(monthlyPrice * 12 * 0.8);
        }

        let formattedPrice = price;
        // Format with 2 decimals if not an integer (e.g. 9.9 -> 9.90)
        if (typeof price === 'number' && !Number.isInteger(price)) {
            formattedPrice = price.toFixed(2);
        }

        if (i18n.language.startsWith('en')) {
            return `$${formattedPrice}`;
        }
        // French format: use comma
        return `${String(formattedPrice).replace('.', ',')} €`;
    };

    const periodLabel = billingPeriod === 'yearly' ? t('settings_page.subscription.per_year') : t('settings_page.subscription.per_month');

    // --- Actions ---
    const handleChangePlanClick = (planId, monthlyPrice) => {
        const config = PLAN_CONFIG[planId];
        const displayPrice = getPrice(monthlyPrice);
        setTargetPlan({
            id: planId,
            name: config.name,
            priceDisplay: displayPrice,
            priceId: config.priceIds[billingPeriod]
        });
        setShowChangePlanModal(true);
    };

    const confirmChangePlan = async () => {
        if (!targetPlan) return;

        // 1. Optimistic Update of Local Name/Plan
        localStorage.setItem('subscriptionPlan', JSON.stringify([targetPlan.id]));

        // 2. Try Direct Update (Cloud Function)
        try {
            // Attempt to update existing subscription
            const result = await changeSubscriptionPlan(targetPlan.priceId);

            if (result.success) {
                alert("Votre abonnement a été mis à jour avec succès !");
                window.location.reload();
            } else {
                // Fallback if no active subscription found -> Redirect to Checkout
                console.log("Fallback to checkout session...");
                await startCheckoutSession(targetPlan.priceId);
            }

        } catch (error) {
            console.error(error);
            alert("Erreur lors du changement d'offre. Veuillez réessayer.");
        }

        setShowChangePlanModal(false);
    };

    const handleEditProfileClick = () => {
        setEditEmail(userProfile?.email || '');
        setEditDisplayName(userProfile?.displayName || '');
        setShowEditProfileModal(true);
    };

    const handleSaveProfile = async () => {
        if (!currentUser) return;

        try {
            const updates = [];
            // 1. Update Display Name (Auth + Firestore)
            if (editDisplayName !== currentUser.displayName) {
                await updateProfile(currentUser, { displayName: editDisplayName });
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    name: editDisplayName
                });
                updates.push("Nom d'affichage");
            }

            // 2. Update Email (Auth + Firestore)
            if (editEmail !== currentUser.email) {
                await updateEmail(currentUser, editEmail);
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    email: editEmail
                });
                updates.push("Email");
            }

            if (updates.length > 0) {
                alert(`Succès : ${updates.join(', ')} mis à jour.`);
                window.location.reload(); // Reload to refresh context/UI
            } else {
                setShowEditProfileModal(false);
            }

        } catch (error) {
            console.error("Erreur mise à jour profil:", error);
            if (error.code === 'auth/requires-recent-login') {
                alert("Pour modifier ces informations sensibles (email), veuillez vous déconnecter et vous reconnecter.");
            } else {
                alert("Erreur : " + error.message);
            }
        }
    };

    const handleChangePasswordClick = () => {
        setNewPassword('');
        setConfirmNewPassword('');
        setShowChangePasswordModal(true);
    };

    const handleSavePassword = async () => {
        if (!currentUser) return;

        if (newPassword !== confirmNewPassword) {
            alert("Les mots de passe ne correspondent pas.");
            return;
        }
        if (newPassword.length < 6) {
            alert("Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }

        try {
            await updatePassword(currentUser, newPassword);
            alert("Mot de passe modifié avec succès !");
            setShowChangePasswordModal(false);
        } catch (error) {
            console.error("Erreur changement mot de passe:", error);
            if (error.code === 'auth/requires-recent-login') {
                alert("Pour changer votre mot de passe, veuillez vous déconnecter et vous reconnecter.");
            } else {
                alert("Erreur : " + error.message);
            }
        }
    };

    const handleSaveLegalInfo = async () => {
        if (!currentUser) return;
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                billingDetails: {
                    structureName: legalForm.structureName,
                    headquartersAddress: legalForm.headquartersAddress,
                    siret: legalForm.siret,
                    tva: legalForm.tva
                }
            });
            setIsEditingLegal(false);
            alert("Mentions légales mises à jour !");
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la sauvegarde.");
        }
    };

    // --- DATA BACKUP LOGIC ---
    const importFileRef = useRef(null);

    const handleExportData = () => {
        try {
            const dataToExport = {
                exportDate: new Date().toISOString(),
                userProfile: userProfile, // Export current profile for reference
                localStorageData: {}
            };

            // Collect all localStorage items starting with prefixes or specific keys
            const prefixes = ['appHorse_', 'my_', 'user', 'subscription', 'weather'];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (prefixes.some(p => key.startsWith(p)) || key === 'company_details') {
                    dataToExport.localStorageData[key] = localStorage.getItem(key);
                }
            }

            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `equinox_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            alert("Sauvegarde téléchargée avec succès !");
        } catch (e) {
            console.error("Export failed:", e);
            alert("Erreur lors de l'export: " + e.message);
        }
    };

    const handleImportData = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                if (!importedData.localStorageData) {
                    throw new Error("Format de fichier invalide (pas de données locales)");
                }

                if (window.confirm(`Voulez-vous restaurer cette sauvegarde datée du ${importedData.exportDate || 'Inconnue'} ? Cela écrasera les données actuelles.`)) {
                    // Restore LocalStorage
                    Object.entries(importedData.localStorageData).forEach(([key, value]) => {
                        localStorage.setItem(key, value);
                    });

                    // Restore Profile if User is logged in (optional, but good for billing details restoration)
                    if (currentUser && importedData.userProfile && importedData.userProfile.billingDetails) {
                        try {
                            await updateDoc(doc(db, 'users', currentUser.uid), {
                                billingDetails: importedData.userProfile.billingDetails,
                                notifications: importedData.userProfile.notifications || {}
                            });
                        } catch (err) {
                            console.warn("Could not auto-restore firestore profile data", err);
                        }
                    }

                    alert("Restauration terminée ! L'application va redémarrer.");
                    window.location.reload();
                }
            } catch (error) {
                console.error("Import error:", error);
                alert("Erreur lors de l'import : " + error.message);
            }
        };
        reader.readAsText(file);
        // Reset input
        event.target.value = '';
    };

    const handleDownloadInvoices = () => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text("Factures - Equinox", 14, 22);

            autoTable(doc, {
                startY: 40,
                head: [['Date', 'Description', 'Statut']],
                body: [
                    [new Date().toLocaleDateString('fr-FR'), `Abonnement ${formatPlanName(currentPlanId)}`, "Payé"],
                    [new Date(Date.now() - 2592000000).toLocaleDateString('fr-FR'), `Abonnement ${formatPlanName(currentPlanId)}`, "Payé"]
                ],
            });

            // Open in new window instead of forced download
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');

        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Erreur lors de l'ouverture de la facture: " + error.message);
        }
    };

    const handleCancelClick = () => {
        setShowCancelModal(true);
    };

    const confirmCancellation = async () => {
        // Use Stripe Portal for secure cancellation
        // We notify the user that they must complete the step on Stripe
        try {
            const success = await redirectToCustomerPortal();
            if (!success) {
                // Fallback for non-paying users or errors: Manual local downgrade
                localStorage.setItem('subscriptionPlan', JSON.stringify(['decouverte']));
                alert("Redirection Stripe impossible. Votre offre a été passée en 'Découverte' manuellement.");
                window.location.reload();
            }
        } catch (error) {
            console.error("Cancellation Error", error);
        }
        setShowCancelModal(false);
    };

    const handleStripeConnect = () => {
        const clientId = import.meta.env.VITE_STRIPE_CLIENT_ID;
        if (!clientId) {
            alert("Erreur: Client ID Stripe manquant dans la configuration.");
            return;
        }
        // Redirection vers l'URL OAuth de Stripe Connect
        // On redirige vers /settings pour capturer le code au retour
        const redirectUri = window.location.origin + '/settings';
        const url = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${encodeURIComponent(redirectUri)}`;

        window.location.assign(url);
    };

    const handleThemeChange = (themeName) => {
        setTheme(themeName);
    };

    const handleScrollToPricing = () => {
        pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleManageSubscription = async () => {
        await redirectToCustomerPortal();
    };

    return (
        <div className="min-h-screen py-10">
            <SEO title={`${t('page_titles.settings')} - Equinox`} description="Gérez votre abonnement, votre compte et vos préférences sur Equinox." />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                            <SettingsIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            {t('settings')}
                        </h1>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">{t('settings_subtitle')}</p>
                    </div>

                    {/* Language Switcher */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-full border border-gray-200 dark:border-gray-700 w-fit">
                        <button
                            onClick={() => changeLanguage('fr')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${i18n.language === 'fr' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            FR
                        </button>
                        <button
                            onClick={() => changeLanguage('en')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${i18n.language.startsWith('en') ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            EN
                        </button>
                    </div>
                </div>

                {/* 2. CARD: MON ABONNEMENT (Current Plan) */}
                <Card
                    className="mb-8"
                    title={<span className="flex items-center gap-2 dark:text-white">💳 {t('settings_page.subscription.title')}</span>}
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                ⭐
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings_page.subscription.current_offer')}</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{currentPlanName}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleDownloadInvoices}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                {t('settings_page.subscription.invoices_pdf')}
                            </button>
                            <button
                                onClick={handleScrollToPricing}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                {t('settings_page.subscription.change_offer')}
                            </button>
                            <button
                                onClick={handleCancelClick}
                                className="px-4 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 rounded-md text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                {t('settings_page.subscription.cancel_sub')}
                            </button>
                        </div>
                    </div>
                </Card>

                {/* 3. CARD: NOS FORMULES (The Grid) */}
                <div ref={pricingRef} className="pb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">👑 {t('settings_page.subscription.plans_title')}</h3>
                        {isProfessional && (
                            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex border border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setBillingPeriod('monthly')}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${billingPeriod === 'monthly' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    {t('settings_page.subscription.monthly')}
                                </button>
                                <button
                                    onClick={() => setBillingPeriod('yearly')}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${billingPeriod === 'yearly' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    {t('settings_page.subscription.yearly')} <span className="text-green-600 dark:text-green-400 text-xs ml-1">{t('settings_page.subscription.discount')}</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* PRICING GRID */}
                    {/* PRICING GRID */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {isProfessional ? (
                            <>
                                {/* Spécial Éleveur */}
                                <Card className="hover:border-indigo-500 transition-all flex flex-col h-full bg-white dark:bg-gray-900/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-pink-500">🦄</span>
                                        <span className="font-bold dark:text-white">{t('landing.pricing.cards.breeder')}</span>
                                    </div>
                                    <p className="text-2xl font-bold dark:text-white">{getPrice(69)} HT <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{periodLabel}</span></p>
                                    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        {(t('settings_page.plan_features.special_breeder', { returnObjects: true }) || []).map((f, i) => (
                                            <li key={i}>• {f}</li>
                                        ))}
                                    </ul>
                                    <button onClick={() => handleChangePlanClick('eleveur', 69)} className="mt-auto w-full py-2 bg-gray-800 dark:bg-indigo-600 text-white rounded-md text-sm hover:opacity-90">{currentPlanId === 'eleveur' ? t('settings_page.subscription.current_badge') : t('settings_page.subscription.change_sub')}</button>
                                </Card>
                                {/* Start */}
                                <Card className="hover:border-indigo-500 transition-all flex flex-col h-full bg-white dark:bg-gray-900/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-blue-500">👜</span>
                                        <span className="font-bold dark:text-white">{t('landing.pricing.cards.start')}</span>
                                    </div>
                                    <p className="text-2xl font-bold dark:text-white">{getPrice(29)} HT <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{periodLabel}</span></p>
                                    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        {(t('settings_page.plan_features.start', { returnObjects: true }) || []).map((f, i) => (
                                            <li key={i}>• {f}</li>
                                        ))}
                                    </ul>
                                    <button onClick={() => handleChangePlanClick('start', 29)} className="mt-auto w-full py-2 bg-gray-800 dark:bg-indigo-600 text-white rounded-md text-sm hover:opacity-90">{currentPlanId === 'start' ? t('settings_page.subscription.current_badge') : t('settings_page.subscription.change_sub')}</button>
                                </Card>
                                {/* Pro */}
                                <Card className="hover:border-indigo-500 transition-all flex flex-col h-full border-2 border-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-indigo-500">⭐</span>
                                        <span className="font-bold dark:text-white">{t('landing.pricing.cards.pro')}</span>
                                    </div>
                                    <p className="text-2xl font-bold dark:text-white">{getPrice(79)} HT <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{periodLabel}</span></p>
                                    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        {(t('settings_page.plan_features.pro', { returnObjects: true }) || []).map((f, i) => (
                                            <li key={i}>• {f}</li>
                                        ))}
                                    </ul>
                                    <button onClick={() => handleChangePlanClick('pro', 79)} className="mt-auto w-full py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md text-sm hover:opacity-90">{currentPlanId === 'pro' ? t('settings_page.subscription.current_badge') : t('settings_page.subscription.change_sub')}</button>
                                </Card>
                                {/* Elite */}
                                <Card className="hover:border-indigo-500 transition-all flex flex-col h-full bg-white dark:bg-gray-900/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-purple-500">👑</span>
                                        <span className="font-bold dark:text-white">{t('landing.pricing.cards.elite')}</span>
                                    </div>
                                    <p className="text-2xl font-bold dark:text-white">{getPrice(129)} HT <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{periodLabel}</span></p>
                                    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        {(t('settings_page.plan_features.elite', { returnObjects: true }) || []).map((f, i) => (
                                            <li key={i}>• {f}</li>
                                        ))}
                                    </ul>
                                    <button onClick={() => handleChangePlanClick('elite', 129)} className="mt-auto w-full py-2 bg-gray-800 dark:bg-indigo-600 text-white rounded-md text-sm hover:opacity-90">{currentPlanId === 'elite' ? t('settings_page.subscription.current_badge') : t('settings_page.subscription.change_sub')}</button>
                                </Card>
                            </>
                        ) : (
                            <>
                                {/* OWNERS / AMATEURS CARDS */}

                                {/* Découverte */}
                                <Card className="hover:border-indigo-500 transition-all flex flex-col h-full bg-white dark:bg-gray-900/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-gray-500">🌱</span>
                                        <span className="font-bold dark:text-white">{t('landing.pricing.cards.discovery')}</span>
                                    </div>
                                    <p className="text-2xl font-bold dark:text-white">Gratuit</p>
                                    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        {(t('settings_page.plan_features.discovery', { returnObjects: true }) || []).map((f, i) => (
                                            <li key={i}>• {f}</li>
                                        ))}
                                    </ul>
                                    <button onClick={() => handleChangePlanClick('decouverte', 0)} className="mt-auto w-full py-2 bg-gray-800 dark:bg-indigo-600 text-white rounded-md text-sm hover:opacity-90">{currentPlanId === 'decouverte' ? t('settings_page.subscription.current_badge') : t('settings_page.subscription.change_sub')}</button>
                                </Card>

                                {/* Passion */}
                                <Card className="hover:border-indigo-500 transition-all flex flex-col h-full border-2 border-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-pink-500">❤️</span>
                                        <span className="font-bold dark:text-white">{t('landing.pricing.cards.passion')}</span>
                                    </div>
                                    <p className="text-2xl font-bold dark:text-white">{getPrice(9.90)} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{periodLabel}</span></p>
                                    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        {(t('settings_page.plan_features.passion', { returnObjects: true }) || []).map((f, i) => (
                                            <li key={i}>• {f}</li>
                                        ))}
                                    </ul>
                                    <button onClick={() => handleChangePlanClick('passion', 9.90)} className="mt-auto w-full py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md text-sm hover:opacity-90">{currentPlanId === 'passion' ? t('settings_page.subscription.current_badge') : t('settings_page.subscription.change_sub')}</button>
                                </Card>

                                {/* Passion Élevage - Using amateur ID 'eleveur_amateur_paid' */}
                                <Card className="hover:border-indigo-500 transition-all flex flex-col h-full bg-white dark:bg-gray-900/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-purple-500">🦄</span>
                                        <span className="font-bold dark:text-white">{t('landing.pricing.cards.passion_breeding')}</span>
                                    </div>
                                    <p className="text-2xl font-bold dark:text-white">{getPrice(4.90)} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{periodLabel}</span></p>
                                    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        {(t('settings_page.plan_features.passion_breeding', { returnObjects: true }) || []).map((f, i) => (
                                            <li key={i}>• {f}</li>
                                        ))}
                                    </ul>
                                    <button onClick={() => handleChangePlanClick('eleveur_amateur_paid', 4.90)} className="mt-auto w-full py-2 bg-gray-800 dark:bg-indigo-600 text-white rounded-md text-sm hover:opacity-90">{currentPlanId === 'eleveur_amateur_paid' ? t('settings_page.subscription.current_badge') : t('settings_page.subscription.change_sub')}</button>
                                </Card>
                            </>
                        )}
                    </div>
                </div>

                {/* 4. CARD: ENCAISSER MES CLIENTS (Stripe Connect) - PRO ONLY */}
                {isProfessional && (
                    <Card
                        title={<span className="flex items-center gap-2 dark:text-white">🏦 {t('settings_page.stripe_connect.title')}</span>}
                    >
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('settings_page.stripe_connect.desc')}
                        </p>
                        <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border border-gray-100 dark:border-gray-700">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong className="dark:text-white">{t('settings_page.stripe_connect.consent_label')}</strong>
                                    <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-500">
                                        {(t('settings_page.stripe_connect.conditions', { returnObjects: true }) || []).map((c, i) => (
                                            <li key={i}>{c}</li>
                                        ))}
                                    </ul>
                                </span>
                            </label>
                        </div>
                        <button
                            onClick={handleStripeConnect}
                            className="mt-6 w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 shadow-sm transition-colors"
                        >
                            {t('settings_page.stripe_connect.connect_button')}
                        </button>
                    </Card>
                )}

                {/* 5. CARD: MON COMPTE */}
                <Card
                    title={<span className="flex items-center gap-2 dark:text-white">👤 {t('settings_page.account.title')}</span>}
                >
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{t('settings_page.account.email_label')}</label>
                                <div className="text-gray-900 dark:text-gray-200 font-medium">{userProfile?.email || 'utilisateur@exemple.com'}</div>
                            </div>
                            <button onClick={handleEditProfileClick} className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300 transition-all active:scale-95">{t('settings_page.account.edit_button')}</button>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{t('settings_page.account.password_label')}</label>
                                <div className="text-gray-900 dark:text-gray-200 font-medium">{t('settings_page.account.placeholder_pass')}</div>
                            </div>
                            <button onClick={handleChangePasswordClick} className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300 transition-all active:scale-95">{t('settings_page.account.change_button')}</button>
                        </div>
                    </div>
                </Card>

                {/* 6. CARD: MENTIONS LEGALES FACTURATION - PRO ONLY */}
                {isProfessional && (
                    <Card
                        title={
                            <div className="flex items-center justify-between w-full">
                                <span className="flex items-center gap-2 dark:text-white">📄 {t('settings_page.company.title')}</span>
                                {!isEditingLegal && (
                                    <button
                                        onClick={() => setIsEditingLegal(true)}
                                        className="p-2 transition-colors rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                                        title={t('settings_page.account.edit_button')}
                                    >
                                        ✏️
                                    </button>
                                )}
                            </div>
                        }
                    >
                        {/* VIEW MODE */}
                        {!isEditingLegal ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('settings_page.company.name_label')}</label>
                                    <p className="font-medium text-gray-900 dark:text-gray-200">{userProfile?.billingDetails?.structureName || userProfile?.displayName || t('settings_page.company.name_placeholder')}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('settings_page.company.address_label')}</label>
                                    <p className="font-medium text-gray-900 dark:text-gray-200">{userProfile?.billingDetails?.headquartersAddress || '—'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('settings_page.company.siret_label')}</label>
                                    <p className="font-medium text-gray-900 dark:text-gray-200">{userProfile?.billingDetails?.siret || '—'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('settings_page.company.tva_label')}</label>
                                    <p className="font-medium text-gray-900 dark:text-gray-200">{userProfile?.billingDetails?.tva || '—'}</p>
                                </div>
                            </div>
                        ) : (
                            /* EDIT MODE */
                            <div className="space-y-4 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('settings_page.company.name_label')}</label>
                                        <input
                                            type="text"
                                            value={legalForm.structureName}
                                            onChange={(e) => setLegalForm({ ...legalForm, structureName: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-100 dark:border-gray-800 dark:bg-gray-800/50 rounded-xl focus:border-indigo-500 dark:text-white transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('settings_page.company.address_label')}</label>
                                        <input
                                            type="text"
                                            value={legalForm.headquartersAddress}
                                            onChange={(e) => setLegalForm({ ...legalForm, headquartersAddress: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-100 dark:border-gray-800 dark:bg-gray-800/50 rounded-xl focus:border-indigo-500 dark:text-white transition-all outline-none"
                                            placeholder="123 rue de l'Exemple, 75000 Paris"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('settings_page.company.siret_label')}</label>
                                        <input
                                            type="text"
                                            value={legalForm.siret}
                                            onChange={(e) => setLegalForm({ ...legalForm, siret: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-100 dark:border-gray-800 dark:bg-gray-800/50 rounded-xl focus:border-indigo-500 dark:text-white transition-all outline-none"
                                            placeholder="14 chiffres"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('settings_page.company.tva_label')}</label>
                                        <input
                                            type="text"
                                            value={legalForm.tva}
                                            onChange={(e) => setLegalForm({ ...legalForm, tva: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-100 dark:border-gray-800 dark:bg-gray-800/50 rounded-xl focus:border-indigo-500 dark:text-white transition-all outline-none"
                                            placeholder="FR..."
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={() => setIsEditingLegal(false)}
                                        className="px-6 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95"
                                    >
                                        {t('horses_page.cancel')}
                                    </button>
                                    <button
                                        onClick={handleSaveLegalInfo}
                                        className="px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg transition-all active:scale-95"
                                    >
                                        {t('settings_page.company.save_button')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                {/* 7. CARD: NOTIFICATIONS */}
                <Card
                    title={<span className="flex items-center gap-2 dark:text-white">🔔 {t('settings_page.notifications.title')}</span>}
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex flex-col text-left">
                                <span className="text-gray-700 dark:text-gray-200 font-medium">{t('settings_page.notifications.care')}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{t('settings_page.notifications.care_desc')}</span>
                            </div>
                            <div className="relative inline-block w-11 align-middle select-none">
                                <input
                                    type="checkbox"
                                    id="toggle-care"
                                    checked={notifications.careAlerts}
                                    onChange={() => handleToggleNotification('careAlerts')}
                                    className="toggle-checkbox"
                                />
                                <label htmlFor="toggle-care" className="toggle-label"></label>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex flex-col text-left">
                                <span className="text-gray-700 dark:text-gray-200 font-medium">{t('settings_page.notifications.support')}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{t('settings_page.notifications.support_desc')}</span>
                            </div>
                            <div className="relative inline-block w-11 align-middle select-none">
                                <input
                                    type="checkbox"
                                    id="toggle-support"
                                    checked={notifications.supportMessages}
                                    onChange={() => handleToggleNotification('supportMessages')}
                                    className="toggle-checkbox"
                                />
                                <label htmlFor="toggle-support" className="toggle-label"></label>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 8. CARD: MES DONNEES */}
                <Card
                    title={<span className="flex items-center gap-2 dark:text-white">📥 {t('settings_page.backup.title')}</span>}
                >
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('settings_page.backup.backup_desc')}</p>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={handleExportData}
                            className="px-6 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-full text-sm font-medium hover:scale-105 transition-transform shadow-lg flex items-center gap-2"
                        >
                            ⬇️ {t('settings_page.backup.backup_button')}
                        </button>
                        <button
                            onClick={() => importFileRef.current.click()}
                            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                            🔄 {t('settings_page.backup.restore_button')}
                        </button>
                        <input
                            type="file"
                            ref={importFileRef}
                            style={{ display: 'none' }}
                            accept=".json"
                            onChange={handleImportData}
                        />
                    </div>
                </Card>

                {/* 9. CARD: APPARENCE */}
                <Card
                    title={<span className="flex items-center gap-2 dark:text-white">🎨 {t('settings_page.appearance.title')}</span>}
                >
                    <div className="flex items-center justify-between p-4 bg-gray-100/50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div>
                            <span className="font-bold text-gray-900 dark:text-white">{t('settings_page.appearance.dark_mode')}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings_page.appearance.toggle_desc')}</p>
                        </div>
                        <div className="relative inline-block w-11 align-middle select-none">
                            <input
                                type="checkbox"
                                id="toggle-darkmode"
                                checked={mode === 'dark'}
                                onChange={toggleMode}
                                className="toggle-checkbox"
                            />
                            <label htmlFor="toggle-darkmode" className="toggle-label"></label>
                        </div>
                    </div>

                    <div className="mt-8">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{t('settings_page.appearance.theme_color')}</label>
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4">
                            {/* Buttons colors */}
                            {[
                                { id: 'saddle', color: 'bg-orange-600', label: t('settings_page.appearance.themes.saddle') },
                                { id: 'forest', color: 'bg-emerald-600', label: t('settings_page.appearance.themes.forest') },
                                { id: 'ocean', color: 'bg-sky-600', label: t('settings_page.appearance.themes.ocean') },
                                { id: 'berry', color: 'bg-pink-600', label: t('settings_page.appearance.themes.berry') }
                            ].map((t_item) => (
                                <button
                                    key={t_item.id}
                                    onClick={() => handleThemeChange(t_item.id)}
                                    className={`relative group w-full sm:w-28 h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 overflow-hidden ${(localStorage.getItem('app_theme') || 'saddle') === t_item.id
                                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20'
                                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full shadow-inner ${t_item.color} group-hover:scale-110 transition-transform`}></div>
                                    <span className="text-[10px] font-bold uppercase tracking-tight text-gray-600 dark:text-gray-400">{t_item.label}</span>
                                    {(localStorage.getItem('app_theme') || 'saddle') === t_item.id && (
                                        <div className="absolute top-1 right-1">
                                            <Check className="w-3 h-3 text-indigo-500" />
                                        </div>
                                    )}
                                </button>
                            ))}

                            <button
                                onClick={() => handleThemeChange('minimalist')}
                                className={`relative group w-full sm:w-28 h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 overflow-hidden ${(localStorage.getItem('app_theme')) === 'minimalist'
                                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20'
                                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700'
                                    }`}
                            >
                                <div className="w-8 h-8 rounded-full shadow-inner bg-gray-800 group-hover:scale-110 transition-transform border border-white/20"></div>
                                <span className="text-[10px] font-bold uppercase tracking-tight text-gray-600 dark:text-gray-400">{t('settings_page.appearance.themes.minimalist')}</span>
                                {(localStorage.getItem('app_theme')) === 'minimalist' && (
                                    <div className="absolute top-1 right-1">
                                        <Check className="w-3 h-3 text-indigo-500" />
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </Card>

                {/* 10. CARD: INFORMATIONS */}
                <Card
                    title={<span className="flex items-center gap-2 dark:text-white">📄 {t('settings_page.legal.modal_title')}</span>}
                >
                    <div
                        onClick={() => setShowCGU(true)}
                        className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-indigo-500/30"
                    >
                        <span className="font-bold text-gray-700 dark:text-gray-200">{t('settings_page.legal.link_text')}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                </Card>

                {/* 11. DANGER ZONE */}
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 shadow-lg rounded-2xl overflow-hidden transition-all">
                    <div className="px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center justify-center md:justify-start gap-2">
                                <Trash2 className="w-6 h-6" />
                                {t('settings_page.backup.danger_zone')}
                            </h3>
                            <p className="mt-1 text-sm text-red-600 dark:text-red-500/80">{t('settings_page.backup.delete_account')}</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                            <button
                                onClick={logout}
                                className="px-6 py-2 border border-red-200 dark:border-red-900/50 bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 rounded-full text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm"
                            >
                                {t('settings_page.account.logout')}
                            </button>
                            <button
                                onClick={() => setShowDeleteAccountModal(true)}
                                className="px-6 py-2 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 transition-all shadow-md active:scale-95"
                            >
                                {t('settings_page.backup.delete_account')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CANCELLATION MODAL */}
            {/* CANCELLATION MODAL */}
            {showCancelModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in border border-gray-100 dark:border-gray-800">
                        <div className="p-8">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-3">
                                {t('settings_page.subscription.cancel_sub')} ?
                            </h3>
                            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                {t('settings_page.alerts.cancel_confirm_msg')}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="flex-1 px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                >
                                    {t('horses_page.cancel')}
                                </button>
                                <button
                                    onClick={confirmCancellation}
                                    className="flex-1 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md active:scale-95"
                                >
                                    {t('settings_page.subscription.cancel_sub')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )
            }

            {/* CHANGE PLAN MODAL */}
            {
                showChangePlanModal && targetPlan && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in border border-gray-100 dark:border-gray-800">
                            <div className="absolute top-4 right-4 group">
                                <button
                                    onClick={() => setShowChangePlanModal(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-8">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400">
                                    <Star size={32} fill="currentColor" />
                                </div>
                                <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-3">
                                    {t('settings_page.subscription.change_offer')} {targetPlan.name} ?
                                </h3>
                                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                    {t('settings_page.alerts.redirect_confirm')} <strong className="text-gray-900 dark:text-white">{targetPlan.priceDisplay}</strong>.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => setShowChangePlanModal(false)}
                                        className="flex-1 px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={confirmChangePlan}
                                        className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                                    >
                                        {t('settings_page.delete_modal.confirm')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
            {/* EDIT PROFILE MODAL */}
            {
                showEditProfileModal && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in border border-gray-100 dark:border-gray-800">
                            <div className="absolute top-4 right-4">
                                <button
                                    onClick={() => setShowEditProfileModal(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-8">
                                <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-8 uppercase tracking-widest">
                                    {t('settings_page.account.edit_button')}
                                </h3>

                                <div className="space-y-5 mb-8">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('settings_page.account.name_label')}</label>
                                        <input
                                            type="text"
                                            value={editDisplayName}
                                            onChange={(e) => setEditDisplayName(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:border-indigo-500 dark:text-white transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('settings_page.account.email_label')}</label>
                                        <input
                                            type="email"
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:border-indigo-500 dark:text-white transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => setShowEditProfileModal(false)}
                                        className="flex-1 px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        className="flex-1 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                                    >
                                        {t('common.save')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
            {/* CHANGE PASSWORD MODAL */}
            {
                showChangePasswordModal && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in border border-gray-100 dark:border-gray-800">
                            <div className="absolute top-4 right-4 group">
                                <button
                                    onClick={() => setShowChangePasswordModal(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-8">
                                <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-8 uppercase tracking-widest">
                                    {t('settings_page.account.change_pass_title')}
                                </h3>

                                <div className="space-y-5 mb-8">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('settings_page.account.new_pass_label')}</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:border-indigo-500 dark:text-white transition-all outline-none"
                                            placeholder={t('settings_page.account.pass_placeholder')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('settings_page.account.confirm_pass_label')}</label>
                                        <input
                                            type="password"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:border-indigo-500 dark:text-white transition-all outline-none"
                                            placeholder={t('settings_page.account.pass_placeholder')}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => setShowChangePasswordModal(false)}
                                        className="flex-1 px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-bold"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleSavePassword}
                                        className="flex-1 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                                    >
                                        {t('common.save')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* CGU MODAL */}
            {
                showCGU && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-fade-in border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 sticky top-0 z-10">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    CGU / CGV
                                </h3>
                                <button
                                    onClick={() => setShowCGU(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-normal bg-white dark:bg-gray-900 custom-scrollbar">
                                <p className="mb-6 italic text-xs text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">Dernière mise à jour : 28/12/2025</p>

                                <h5 className="font-bold mt-6 mb-3 text-gray-900 dark:text-white flex items-center gap-2">1. OBJET</h5>
                                <p className="mb-4">Les présentes Conditions Générales ont pour objet de définir les modalités de mise à disposition de l'application EQUINOX (ci-après "la Solution") par la société Dev Normandie, immatriculée sous le numéro SIRET 85217162800021, dont le siège est situé à 2030 route de Pont l'évêque 14800 TOURGEVILLE (ci-après "EQUINOX"), auprès des écuries et professionnels du cheval (ci-après "le Client").</p>

                                <h5 className="font-bold mt-8 mb-3 text-gray-900 dark:text-white">2. ABONNEMENT AU LOGICIEL (SaaS)</h5>
                                <p className="mb-2"><span className="font-semibold text-indigo-600 dark:text-indigo-400">2.1. Description du service :</span> EQUINOX fournit un logiciel de gestion pour écuries (suivi des chevaux, facturation, planning) accessible par abonnement.</p>
                                <p className="mb-2"><span className="font-semibold text-indigo-600 dark:text-indigo-400">2.2. Durée et Tarifs :</span> Le Client souscrit à l'une des offres (ex: "Start", "Spécial Éleveur").</p>
                                <ul className="list-disc pl-5 my-4 space-y-2">
                                    <li><strong className="dark:text-white">Abonnement Mensuel :</strong> Sans engagement, renouvelable tacitement chaque mois.</li>
                                    <li><strong className="dark:text-white">Abonnement Annuel :</strong> Engagement de 12 mois, paiement en une fois à la souscription. Les prix sont indiqués en Euros Hors Taxes (HT). Tout mois ou année entamé est dû.</li>
                                </ul>
                                <p className="mb-4"><span className="font-semibold text-indigo-600 dark:text-indigo-400">2.3. Résiliation :</span> Le Client peut résilier son abonnement à tout moment depuis son espace client. La résiliation prend effet à la fin de la période en cours (mois ou année). Aucun remboursement au prorata n'est effectué.</p>

                                <h5 className="font-bold mt-8 mb-3 text-gray-900 dark:text-white">3. MODULE DE PAIEMENT ET FACTURATION (STRIPE CONNECT)</h5>
                                <p className="mb-4"><span className="font-semibold text-indigo-600 dark:text-indigo-400">3.1. Rôle d'intermédiaire technique :</span> EQUINOX propose une fonctionnalité permettant au Client d'émettre des factures et d'encaisser des paiements de ses propres clients (les "Cavaliers"). Pour ce service, EQUINOX agit en tant qu'intermédiaire technique et "Plateforme". Les transactions financières sont gérées exclusivement par le prestataire de services de paiement STRIPE. En activant ce module, le Client accepte sans réserve l'Accord sur les comptes connectés Stripe.</p>

                                <p className="mb-4"><span className="font-semibold text-indigo-600 dark:text-indigo-400">3.2. Mandat de Facturation (OBLIGATOIRE) :</span> Le Client donne expressément mandat à EQUINOX d'établir et d'émettre ses factures en son nom et pour son compte, conformément à l'article 289 du Code Général des Impôts. Le Client conserve l'entière responsabilité de ses obligations fiscales et de TVA. Le Client s'engage à vérifier les factures émises par EQUINOX en son nom.</p>

                                <p className="mb-3 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-1 w-fit">3.3. Conditions Financières et Frais de Service</p>
                                <p className="mb-4">En contrepartie de l'utilisation de la plateforme et des services de paiement, les frais suivants s'appliquent automatiquement à chaque transaction :</p>

                                <div className="pl-4 mt-3 border-l-4 border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10 p-4 rounded-r-xl">
                                    <p className="mb-3"><span className="font-bold text-indigo-900 dark:text-indigo-300">A. Commission de Plateforme (EQUINOX)</span><br />EQUINOX prélève une commission de 1 % sur le montant total TTC de chaque transaction encaissée.</p>
                                    <p className="mb-3"><span className="font-bold text-indigo-900 dark:text-indigo-300">B. Frais de Transaction Bancaire (STRIPE)</span><br />Le Client supporte les frais de traitement bancaire appliqués par Stripe (environ 1,4 % + 0,25 € par transaction pour les cartes européennes standard).</p>
                                    <p className="mb-3"><span className="font-bold text-indigo-900 dark:text-indigo-300">C. Frais du Module de Facturation (STRIPE INVOICING)</span><br />L'utilisation du service de génération et d'envoi de factures est soumise à la tarification "Stripe Invoicing Starter". Au jour de la signature des présentes, les conditions sont les suivantes :</p>
                                    <ul className="list-disc pl-5 mb-3 text-xs space-y-1">
                                        <li>Jusqu'à 25 factures payées par mois : 0 € (Gratuit).</li>
                                        <li>Au-delà de 25 factures par mois : 0,4 % du montant de la facture (avec un plafond maximal de 2,00 € par facture).</li>
                                    </ul>
                                    <p><span className="font-bold text-indigo-900 dark:text-indigo-300">D. Modalités de paiement</span><br />Le Client accepte que l'ensemble de ces frais (A, B et C) soient déduits automatiquement par Stripe du montant versé par le payeur avant le virement sur le compte bancaire de l'Écurie.</p>
                                </div>

                                <p className="mt-6 mb-4"><span className="font-semibold text-indigo-600 dark:text-indigo-400">3.4. Gestion des litiges :</span> EQUINOX n'est pas partie au contrat entre le Client (l'écurie) et le Cavalier. Tout litige doit être réglé directement entre l'écurie et le cavalier.</p>

                                <h5 className="font-bold mt-8 mb-3 text-gray-900 dark:text-white">4. RESPONSABILITÉ</h5>
                                <p className="mb-2"><span className="font-semibold text-indigo-600 dark:text-indigo-400">4.1. Responsabilité d'EQUINOX :</span> EQUINOX s'engage à fournir le service avec diligence (obligation de moyens). Sa responsabilité ne saurait être engagée en cas de panne temporaire des serveurs.</p>
                                <p className="mb-4"><span className="font-semibold text-indigo-600 dark:text-indigo-400">4.2. Données des chevaux et des tiers :</span> Le Client est seul responsable des données qu'il entre dans l'application. EQUINOX agit en tant que sous-traitant au sens du RGPD.</p>

                                <h5 className="font-bold mt-8 mb-3 text-gray-900 dark:text-white">5. LOI APPLICABLE</h5>
                                <p className="mb-8">Les présentes conditions sont soumises au droit français. Tout litige relève de la compétence exclusive des tribunaux du ressort du siège social d'EQUINOX.</p>

                                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4 text-xs text-gray-500">
                                    <div>
                                        <p className="font-bold uppercase tracking-widest mb-1 dark:text-gray-400">Éditeur</p>
                                        <p>Dev Normandie</p>
                                    </div>
                                    <div>
                                        <p className="font-bold uppercase tracking-widest mb-1 dark:text-gray-400">Hébergeur</p>
                                        <p>Vercel / Firebase (Google)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end sticky bottom-0 z-10">
                                <button
                                    onClick={() => setShowCGU(false)}
                                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                                >
                                    {t('common.close')}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* DELETE ACCOUNT MODAL */}
            {
                showDeleteAccountModal && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in text-center p-8 border border-gray-100 dark:border-gray-800 relative">
                            <div className="absolute top-4 right-4">
                                <button
                                    onClick={() => setShowDeleteAccountModal(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400 animate-pulse">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                {t('settings_page.delete_modal.confirm_question')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                {t('settings_page.delete_modal.irreversible')}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowDeleteAccountModal(false)}
                                    className="flex-1 px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={() => {
                                        alert(t('settings_page.delete_modal.support_alert'));
                                        setShowDeleteAccountModal(false);
                                    }}
                                    className="flex-1 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md active:scale-95"
                                >
                                    {t('settings_page.delete_modal.confirm')}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div >
    );
};

export default Settings;
