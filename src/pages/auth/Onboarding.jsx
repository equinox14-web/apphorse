
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, updateDoc, collection, query, where, getDocs, onSnapshot, addDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Briefcase, Heart, Check, X, Star, Crown, ShieldCheck, Baby } from 'lucide-react';
import { startCheckoutSession } from '../../utils/stripePayment';
import { createSubscriptionSession } from '../../utils/marketplacePayment'; // Import custom function
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

// ... (rest of imports)



const Onboarding = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Type, 2: Pricing
    const [userType, setUserType] = useState(null);
    const [showProModal, setShowProModal] = useState(false);
    const [selectedActivities, setSelectedActivities] = useState([]);
    const [selectedPlanIds, setSelectedPlanIds] = useState([]); // Array for multi-select

    // Dynamic Data State
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
    const [fetchError, setFetchError] = useState(null);

    // Fetch Products (Moved to Top Level - CRITICAL FIX)
    React.useEffect(() => {
        const fetchProducts = async () => {
            try {
                // DEBUG: Filtering for active products
                const productsQuery = query(collection(db, 'products'), where('active', '==', true));
                const querySnapshot = await getDocs(productsQuery);
                console.log("DEBUG: Products Snapshot Size:", querySnapshot.size);

                const loadedProducts = await Promise.all(querySnapshot.docs.map(async (doc) => {
                    const productData = { id: doc.id, ...doc.data() };
                    const pricesQuery = collection(db, 'products', doc.id, 'prices');
                    const pricesSnapshot = await getDocs(pricesQuery);
                    const prices = pricesSnapshot.docs.map(p => ({ id: p.id, ...p.data() }));
                    return { ...productData, prices };
                }));
                // Sort by price
                loadedProducts.sort((a, b) => {
                    const priceA = a.prices.find(p => p.interval === 'month')?.unit_amount || 0;
                    const priceB = b.prices.find(p => p.interval === 'month')?.unit_amount || 0;
                    return priceA - priceB;
                });
                setProducts(loadedProducts);
            } catch (error) {
                console.error("Error fetching products:", error);
                setFetchError(error.message);
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
    }, []);

    const activitiesList = [
        { key: "sport_horses", value: "Chevaux de sport" },
        { key: "race_trotters", value: "Chevaux de course (Trotteurs)" },
        { key: "race_gallopers", value: "Chevaux de course (Galoppeurs)" },
        { key: "endurance_horses", value: "Chevaux d'endurance" },
        { key: "owners_stable", value: "Écurie de propriétaire" },
        { key: "breeder", value: "Éleveur" }
    ];

    // STATIC UI CONFIG (To match original design "comme avant")
    // STATIC UI CONFIG
    const PLAN_FEATURES = {
        'Découverte': {
            color: '#10b981', icon: Star,
            features: ['one_horse_mare', 'health_book', 'breeding_registry', 'simple_calendar', 'support_standard']
        },
        'Passion Élevage': {
            color: '#d946ef', icon: Heart,
            features: ['five_mares', 'repro_tracking', 'health_book', 'budget_management', 'option_mare', 'support_priority']
        },
        'Passion': {
            color: '#eb2f96', icon: Crown, popular: true,
            features: ['unlimited_horses', 'budget_management', 'media_storage', 'alerts_reminders', 'competition_module', 'half_lease_management', 'support_priority']
        },
        'Start': {
            color: '#60a5fa', icon: Briefcase,
            features: ['upto_10_horses', 'owner_management', 'simple_billing', 'care_reminders', 'two_staff', 'client_support']
        },
        'Pro': {
            color: '#3b82f6', icon: Star, popular: true,
            features: ['upto_30_horses', 'recurring_billing', 'team_planning_5', 'stock_management', 'competition_module', 'support_priority']
        },
        'Élite': {
            color: '#1e40af', icon: Crown,
            features: ['unlimited_horses', 'unlimited_breeding', 'unlimited_staff', 'competition_module', 'stock_management', 'export_accounting', 'support_priority']
        },
        'Elite': { // Support both casings
            color: '#1e40af', icon: Crown,
            features: ['unlimited_horses', 'unlimited_breeding', 'unlimited_staff', 'competition_module', 'stock_management', 'export_accounting', 'support_priority']
        },
        'Spécial Éleveur': {
            color: '#8b5cf6', icon: ShieldCheck,
            features: ['unlimited_mares', 'gyn_tracking', 'care', 'planning', 'five_staff', 'full_billing', 'support_priority']
        },
        'Special': { // Fallback for unaccented match
            color: '#8b5cf6', icon: ShieldCheck,
            features: ['unlimited_mares', 'gyn_tracking', 'care', 'planning', 'five_staff', 'full_billing', 'support_priority']
        },
        'Spécial': { // Fallback for partial match
            color: '#8b5cf6', icon: ShieldCheck,
            features: ['unlimited_mares', 'gyn_tracking', 'care', 'planning', 'five_staff', 'full_billing', 'support_priority']
        }
    };

    const getPlanDisplay = (productName) => {
        // Find best match in PLAN_FEATURES
        const name = productName || '';
        const key = Object.keys(PLAN_FEATURES).find(k => name.toLowerCase().includes(k.toLowerCase()));
        return PLAN_FEATURES[key] || {
            color: '#6b7280', icon: Star, features: ['full_features'], popular: false
        };
    };

    // Pricing Plans Data (Reference for static/fallback, though we use dynamic mainly now)
    const plansString = {
        amateur: [
            { id: 'decouverte', name: 'Découverte', price: 'Gratuit', icon: Star, color: '#10b981', features: ['1 Cheval + 1 Jument', 'Carnet de Santé', 'Registre d\'Élevage', 'Calendrier simple', 'Support (Standard)'] },
            { id: 'passion', name: 'Passion', price: '9,90 € / mois', icon: Crown, color: '#eb2f96', popular: true, features: ['Chevaux Illimités', 'Gestion Budget', 'Stockage Photos/Vidéos', 'Alertes & Rappels', 'Module Compétition', 'Gestion Demi-Pensions', 'Support Prioritaire'] },
            { id: 'eleveur_amateur_paid', name: 'Passion Élevage', price: '4,90 € / mois', icon: Heart, color: '#d946ef', features: ['5 Juments Poulinières', 'Suivi Reproduction', 'Carnet de Santé', 'Gestion Budget', 'Option +1 Jument (Add-on)', 'Support Prioritaire'] }
        ],
        pro: [
            { id: 'start', name: 'Start', price: '29 € / mois', icon: Briefcase, color: '#60a5fa', features: ['Jusqu\'à 10 Chevaux', 'Gestion Propriétaires', 'Facturation Simple', 'Soins & Rappels', '2 Comptes Staff', 'Support Client'] },
            { id: 'pro', name: 'Pro', price: '79 € / mois', icon: Star, color: '#3b82f6', popular: true, features: ['Jusqu\'à 30 Chevaux', 'Facturation Récurrente', 'Planning Équipe (5 Staff)', 'Module Compétition', 'Gestion des Stocks', 'Support Prioritaire'] },
            { id: 'elite', name: 'Élite', price: '129 € / mois', icon: Crown, color: '#1e40af', features: ['Chevaux Illimités', 'Module Élevage Illimité', 'Staff Illimité', 'Module Compétition', 'Gestion des Stocks', 'Comptabilité Export', 'Support Prioritaire'] },
            { id: 'eleveur', name: 'Spécial Éleveur', price: '59 € / mois', icon: ShieldCheck, color: '#8b5cf6', features: ['Juments Illimitées', 'Suivi gynéco', 'Soins', 'Planing', '5 Staff', 'Facturation complète', 'Support prioritaire'] }
        ]
    };

    // Fallback Prices (Amounts in cents + Stripe Price IDs)
    const fallbackPrices = {
        'passion': { monthly: { amount: 990, id: 'price_1SjKF1P3xLdYUD5QXTpfv2Zx' }, yearly: { amount: 9900, id: '' } },
        'passion élevage': { monthly: { amount: 490, id: 'price_1SjKCjP3xLdYUD5QrvDCDCrS' }, yearly: { amount: 4900, id: '' } },
        'start': { monthly: { amount: 2900, id: 'price_1SjK2yP3xLdYUD5QUytiRD8E' }, yearly: { amount: 27900, id: 'price_1SjK44P3xLdYUD5Qeerlga5X' } },
        'pro': { monthly: { amount: 7900, id: 'price_1SjK5HP3xLdYUD5QgMTsr2cv' }, yearly: { amount: 74900, id: 'price_1SjK7HP3xLdYUD5Q0AfX739b' } },
        'elite': { monthly: { amount: 12900, id: 'price_1SjK8ZP3xLdYUD5QquyGadGq' }, yearly: { amount: 122900, id: 'price_1SjK9mP3xLdYUD5QFiVOAmCQ' } },
        'élite': { monthly: { amount: 12900, id: 'price_1SjK8ZP3xLdYUD5QquyGadGq' }, yearly: { amount: 122900, id: 'price_1SjK9mP3xLdYUD5QFiVOAmCQ' } },
        'spécial éleveur': { monthly: { amount: 6900, id: 'price_1SjKAiP3xLdYUD5Q8uEplDyf' }, yearly: { amount: 65900, id: 'price_1SjKBrP3xLdYUD5QgUq64uFB' } },
        'spécial': { monthly: { amount: 6900, id: 'price_1SjKAiP3xLdYUD5Q8uEplDyf' }, yearly: { amount: 65900, id: 'price_1SjKBrP3xLdYUD5QgUq64uFB' } },
        'eleveur': { monthly: { amount: 6900, id: 'price_1SjKAiP3xLdYUD5Q8uEplDyf' }, yearly: { amount: 65900, id: 'price_1SjKBrP3xLdYUD5QgUq64uFB' } },
        'éleveur': { monthly: { amount: 6900, id: 'price_1SjKAiP3xLdYUD5Q8uEplDyf' }, yearly: { amount: 65900, id: 'price_1SjKBrP3xLdYUD5QgUq64uFB' } }
    };

    const toggleActivity = (activity) => {
        if (selectedActivities.includes(activity)) {
            setSelectedActivities(selectedActivities.filter(a => a !== activity));
        } else {
            setSelectedActivities([...selectedActivities, activity]);
        }
    };

    const handleSelectType = (type) => {
        setUserType(type);
        localStorage.setItem('userType', type);

        if (type === 'pro') {
            setShowProModal(true);
        } else {
            // Amateur acts immediately to go to pricing
            setStep(2);
        }
    };

    const handleProActivitiesSubmit = () => {
        localStorage.setItem('userActivities', JSON.stringify(selectedActivities));
        setShowProModal(false);
        setStep(2); // Go to pricing
    };

    const togglePlan = (planId) => {
        if (userType === 'pro') {
            if (selectedPlanIds.includes(planId)) {
                setSelectedPlanIds([]);
            } else {
                setSelectedPlanIds([planId]);
            }
        } else {
            if (selectedPlanIds.includes(planId)) {
                setSelectedPlanIds(selectedPlanIds.filter(id => id !== planId));
            } else {
                setSelectedPlanIds([...selectedPlanIds, planId]);
            }
        }
    };

    const validateSelection = async () => {
        console.log("Validation started", selectedPlanIds);
        // alert("Validation started. IDs: " + JSON.stringify(selectedPlanIds));

        if (selectedPlanIds.length === 0) {
            alert("Aucune formule sélectionnée.");
            return;
        }

        const selectedId = selectedPlanIds.find(id => id !== 'decouverte') || 'decouverte';
        console.log("Selected ID:", selectedId);

        // If free plan
        if (selectedId === 'decouverte') {
            if (auth.currentUser) {
                await updateDoc(doc(db, "users", auth.currentUser.uid), {
                    plans: ['decouverte'],
                    role: userType === 'pro' ? 'Pro' : 'Propriétaire'
                });
            }
            navigate('/dashboard');
            window.location.reload();
            return;
        }

        // Paid Plan -> Checkout
        const product = products.find(p => p.id === selectedId);

        let priceIdToUse = null;

        // 1. PRIORITY: Check Hardcoded Live IDs (Fallback) first
        // This ensures we use the correct LIVE IDs even if Firestore data is stale (still showing Test IDs)
        const productNameKey = (product ? product.name : selectedId).toLowerCase();
        const fallbackKey = Object.keys(fallbackPrices).find(k => productNameKey.includes(k));
        const fallbackData = fallbackKey ? fallbackPrices[fallbackKey] : null;

        if (fallbackData) {
            priceIdToUse = billingCycle === 'monthly' ? fallbackData.monthly.id : fallbackData.yearly.id;
            console.log(`Using Hardcoded ID for ${selectedId}: ${priceIdToUse}`);
        }

        // 2. If not found in hardcode, try Dynamic Product data (Firestore)
        if (!priceIdToUse && product) {
            const getInterval = (p) => (p.interval || p.recurring?.interval || '').toLowerCase();
            const price = product.prices.find(p => getInterval(p) === (billingCycle === 'monthly' ? 'month' : 'year'));
            if (price) priceIdToUse = price.id;
        }

        // Helper to map Product Name to Internal Key (permissions.js)
        const getInternalPlanId = (name) => {
            const n = (name || '').toLowerCase();
            if (n.includes('passion élevage') || n.includes('passion elevage')) return 'eleveur_amateur_paid';
            if (n.includes('passion')) return 'passion'; // After examing specific 'passion élevage'
            if (n.includes('start')) return 'start';
            if (n.includes('spécial') || n.includes('special') || n.includes('éleveur') || n.includes('eleveur')) return 'eleveur';
            if (n.includes('élite') || n.includes('elite')) return 'elite';
            if (n.includes('pro')) return 'pro'; // Check 'pro' last as it's short
            if (n.includes('découverte') || n.includes('decouverte')) return 'decouverte';
            return 'decouverte'; // Default fallback
        };

        if (priceIdToUse) {
            // ADMIN BYPASS LOGIC
            const ADMIN_EMAILS = ['admin@equinox.com', 'dev@equinox.com', 'aurelie.jossic@gmail.com', 'papy.gamers14@gmail.com', 'horse-equinox@outlook.com'];
            const userEmail = auth.currentUser?.email;

            if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
                // Direct Activation for Admins
                console.log(`[ADMIN MODE] Activation immédiate.`);
                const internalKey = getInternalPlanId(product.name);

                await updateDoc(doc(db, "users", auth.currentUser.uid), {
                    plans: [internalKey],
                    role: userType === 'pro' ? 'Pro' : 'Propriétaire', // Ensure role matches type
                    isAdminBypass: false // Allow Admins to test specific plans without auto-upgrade
                });

                // Force Clean Clean LocalStorage to prevent AuthContext from keeping old Admin Role
                localStorage.removeItem('is_simulation');
                localStorage.setItem('user_role', userType === 'pro' ? 'Pro' : 'Propriétaire');
                localStorage.setItem('subscriptionPlan', JSON.stringify([internalKey]));
                localStorage.setItem('user_simulated', 'true');

                navigate('/dashboard');
                window.location.reload();
                return;
            }

            // NORMAL USER FLOW
            // alert("Starting checkout with Price ID: " + priceIdToUse);
            // USE CUSTOM CLOUD FUNCTION INSTEAD OF EXTENSION
            // await startCheckoutSession(priceIdToUse);
            if (auth.currentUser && auth.currentUser.email) {
                await createSubscriptionSession(priceIdToUse, auth.currentUser.email, auth.currentUser.uid);
            } else {
                alert("Erreur utilisateur: Email manquant. Veuillez vous reconnecter.");
            }
        } else {
            console.error("No price found for", selectedId, billingCycle);
            alert(`Erreur configuration: Aucun tarif trouvé pour ${selectedId} (${billingCycle}).\nVérifiez les Price IDs Live.`);
        }
    };

    // Render Pricing Step
    if (step === 2) {
        // Filter Dynamic Products based on UserType
        let filteredProducts = products;

        if (userType === 'amateur') {
            const amateurKeywords = ['decouverte', 'découverte', 'passion'];
            filteredProducts = products.filter(p => {
                const name = (p.name || '').toLowerCase();
                return amateurKeywords.some(k => name.includes(k));
            });

            // Always ensure Découverte is present for Amateurs
            if (!filteredProducts.find(p => p.id === 'decouverte' || p.name.toLowerCase().includes('découverte'))) {
                filteredProducts.unshift({
                    id: 'decouverte',
                    name: 'Découverte',
                    active: true,
                    prices: []
                });
            }
        } else if (userType === 'pro') {
            const proKeywords = ['start', 'pro', 'elite', 'élite', 'eleveur', 'éleveur'];
            filteredProducts = products.filter(p => {
                const name = (p.name || '').toLowerCase();
                const matchesPro = proKeywords.some(k => name.includes(k));
                return matchesPro && !name.includes('passion');
            });
        }

        // Sort manually to ensure order: Découverte -> Passion -> Passion Élevage -> Start -> Pro -> Elite -> Eleveur
        filteredProducts.sort((a, b) => { // Removed 'return' here
            const nA = (a.name || '').toLowerCase();
            const nB = (b.name || '').toLowerCase();

            const getRank = (name) => {
                if (name.includes('découverte') || name.includes('decouverte')) return 1;
                if (name.includes('passion élevage')) return 3; // Specific before generic
                if (name.includes('passion')) return 2;
                if (name.includes('start')) return 4;
                if (name.includes('pro')) return 5;
                if (name.includes('elite') || name.includes('élite')) return 6;
                if (name.includes('spécial') || name.includes('special') || name.includes('éleveur') || name.includes('eleveur')) return 7; // After Elite
                return 99;
                return 99;
            };

            return getRank(nA) - getRank(nB);
        });

        return (
            <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ maxWidth: '1000px', width: '100%' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1f2937', marginBottom: '0.5rem' }}>
                            {userType === 'pro' ? t('onboarding.pricing.title_pro') : t('onboarding.pricing.title_owner')}
                        </h1>
                        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
                            {t('onboarding.pricing.subtitle')}<br />
                            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#10b981', display: 'inline-block', marginTop: '0.5rem' }}>
                                {t('onboarding.pricing.no_commitment')}
                            </span>
                        </p>
                    </div>

                    {/* TOGGLE MENSUEL / ANNUEL */}
                    {userType === 'pro' && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                background: '#e5e7eb', borderRadius: '999px', padding: '4px', display: 'inline-flex', position: 'relative',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    style={{
                                        padding: '8px 20px', borderRadius: '999px', border: 'none', cursor: 'pointer', zIndex: 1,
                                        background: billingCycle === 'monthly' ? 'white' : 'transparent',
                                        color: billingCycle === 'monthly' ? '#1f2937' : '#6b7280',
                                        fontWeight: billingCycle === 'monthly' ? 700 : 500,
                                        boxShadow: billingCycle === 'monthly' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {t('onboarding.pricing.monthly')}
                                </button>
                                <button
                                    onClick={() => setBillingCycle('yearly')}
                                    style={{
                                        padding: '8px 20px', borderRadius: '999px', border: 'none', cursor: 'pointer', zIndex: 1,
                                        background: billingCycle === 'yearly' ? 'white' : 'transparent',
                                        color: billingCycle === 'yearly' ? '#1f2937' : '#6b7280',
                                        fontWeight: billingCycle === 'yearly' ? 700 : 500,
                                        boxShadow: billingCycle === 'yearly' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                                        transition: 'all 0.2s',
                                        display: 'flex', alignItems: 'center', gap: '6px'
                                    }}
                                >
                                    {t('onboarding.pricing.yearly')} <span style={{ fontSize: '0.75rem', color: '#16a34a', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>-20%</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '2rem',
                        alignItems: 'stretch'
                    }}>
                        {loadingProducts && <div className="text-center text-gray-500 col-span-full">{t('onboarding.pricing.loading')}</div>}

                        {filteredProducts.map(product => {
                            const isSelected = selectedPlanIds.includes(product.id);
                            const ui = getPlanDisplay(product.name);
                            const Icon = ui.icon;

                            // Price Logic
                            const getInterval = (p) => (p.interval || p.recurring?.interval || '').toLowerCase();
                            const priceMonth = product.prices.find(p => getInterval(p) === 'month');
                            const priceYear = product.prices.find(p => getInterval(p) === 'year');
                            let activePrice = billingCycle === 'monthly' ? priceMonth : priceYear;
                            const isFree = product.id === 'decouverte' || product.name.toLowerCase().includes('découverte');

                            // Fallback Price if dynamic price is missing
                            if (!activePrice && !isFree) {
                                const productNameKey = product.name.toLowerCase();
                                const fallbackKey = Object.keys(fallbackPrices).find(k => productNameKey.includes(k));
                                if (fallbackKey) {
                                    const fallbackAmount = billingCycle === 'monthly' ? fallbackPrices[fallbackKey].monthly.amount : fallbackPrices[fallbackKey].yearly.amount;
                                    activePrice = { unit_amount: fallbackAmount, currency: 'eur' }; // Mock object
                                }
                            }

                            // Discount
                            let discountBadge = null;
                            if (priceMonth && priceYear) {
                                const diff = (priceMonth.unit_amount * 12) - priceYear.unit_amount;
                                if (diff > 0) discountBadge = `-${Math.round((diff / (priceMonth.unit_amount * 12)) * 100)}%`;
                            }

                            return (
                                <Card
                                    key={product.id}
                                    onClick={() => (activePrice || isFree) && togglePlan(product.id)}
                                    style={{
                                        padding: '2rem',
                                        display: 'flex', flexDirection: 'column',
                                        border: isSelected ? `3px solid ${ui.color}` : (ui.popular ? `2px solid ${ui.color}` : '1px solid #e5e7eb'),
                                        position: 'relative',
                                        background: isSelected ? `${ui.color}08` : 'white',
                                        transform: isSelected ? 'translateY(-8px)' : 'none',
                                        transition: 'all 0.2s',
                                        cursor: (activePrice || isFree) ? 'pointer' : 'not-allowed',
                                        opacity: (activePrice || isFree) ? 1 : 0.6
                                    }}
                                >
                                    {/* POPULAR BADGE */}
                                    {ui.popular && (
                                        <div style={{
                                            position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                                            background: ui.color, color: 'white', padding: '0.25rem 1rem', borderRadius: '20px',
                                            fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                        }}>
                                            {t('onboarding.pricing.popular')}
                                        </div>
                                    )}

                                    {/* Name & Icon */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div style={{ padding: '0.75rem', borderRadius: '12px', background: `${ui.color}15`, color: ui.color }}>
                                            <Icon size={28} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>{product.name}</h3>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: ui.color, display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {activePrice ?
                                                    <>
                                                        {(activePrice.unit_amount / 100).toLocaleString('fr-FR', { minimumFractionDigits: activePrice.unit_amount % 100 === 0 ? 0 : 2 })} € <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{billingCycle === 'monthly' ? t('onboarding.pricing.per_month') : t('onboarding.pricing.per_year')}</span>
                                                    </>
                                                    : (isFree ? t('onboarding.pricing.free') : t('onboarding.pricing.unavailable'))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Discount Badge Inline if Year */}
                                    {billingCycle === 'yearly' && discountBadge && (
                                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
                                            {t('onboarding.pricing.save_badge')} {discountBadge}
                                        </div>
                                    )}

                                    {/* FEATURES LIST (Restored) */}
                                    <ul style={{ flex: 1, listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {ui.features.map((feature, i) => (
                                            <li key={i} style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', fontSize: '0.95rem', color: '#4b5563' }}>
                                                <Check size={16} style={{ marginTop: '3px', color: ui.color, flexShrink: 0 }} />
                                                {t(`onboarding.pricing.features.${feature}`)}
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        className="w-full"
                                        disabled={!activePrice && !isFree}
                                        style={{
                                            background: isSelected ? ui.color : '#f3f4f6',
                                            color: isSelected ? 'white' : '#1f2937',
                                            border: 'none',
                                            padding: '0.8rem',
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            marginTop: 'auto'
                                        }}
                                    >
                                        {isSelected ? t('onboarding.pricing.selected') : t('onboarding.pricing.choose')}
                                    </Button>

                                    {/* DEBUG / TEST BUTTON */}
                                    <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const idToUse = activePrice?.id || (isFree ? 'free' : 'unknown');

                                                // Map to Internal Key
                                                const n = (product.name || '').toLowerCase();
                                                let internalKey = 'decouverte';
                                                if (n.includes('passion élevage') || n.includes('passion elevage')) internalKey = 'eleveur_amateur_paid';
                                                else if (n.includes('passion')) internalKey = 'passion';
                                                else if (n.includes('start')) internalKey = 'start';
                                                else if (n.includes('spécial') || n.includes('special') || n.includes('éleveur') || n.includes('eleveur')) internalKey = 'eleveur';
                                                else if (n.includes('élite') || n.includes('elite')) internalKey = 'elite';
                                                else if (n.includes('pro')) internalKey = 'pro';

                                                if (confirm(`[DEV] Simuler abonnement réussi pour ${product.name} (Key: ${internalKey}) ?`)) {
                                                    updateDoc(doc(db, "users", auth.currentUser.uid), {
                                                        plans: [internalKey],
                                                        role: userType === 'pro' ? 'Pro' : 'Propriétaire',
                                                        subscriptionStatus: 'active',
                                                        simulated: true,
                                                        isAdminBypass: false
                                                    }).then(() => {
                                                        localStorage.removeItem('is_simulation');
                                                        localStorage.setItem('user_role', userType === 'pro' ? 'Pro' : 'Propriétaire');
                                                        localStorage.setItem('subscriptionPlan', JSON.stringify([internalKey]));
                                                        localStorage.setItem('user_simulated', 'true');

                                                        alert("Plan activé (Simulation) ! Redirection...");
                                                        window.location.href = '/';
                                                    });
                                                }
                                            }}
                                            style={{ fontSize: '0.7rem', color: '#ccc', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            Simuler Paiement (Dev)
                                        </button>
                                    </div>
                                </Card>
                            );
                        })}

                        {/* DEMO CARD - PRO ONLY */}
                        {userType === 'pro' && (
                            <Card
                                onClick={() => window.open(`/demo?type=${userType}`, '_blank')}
                                style={{
                                    padding: '2rem',
                                    display: 'flex', flexDirection: 'column',
                                    border: '2px dashed #fbbf24',
                                    position: 'relative',
                                    background: '#fffbeb',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                className="hover:-translate-y-2 hover:shadow-lg"
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#fef3c7', color: '#d97706' }}>
                                        <Crown size={28} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#92400e' }}>
                                            {t('onboarding.pricing.demo_pro_elite')}
                                        </h3>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#d97706' }}>{t('onboarding.pricing.demo_free_trial')}</div>
                                    </div>
                                </div>

                                <p style={{ color: '#92400e', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                    {t('onboarding.pricing.demo_desc')}
                                </p>

                                <Button
                                    className="w-full"
                                    style={{
                                        background: '#d97706',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.8rem',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        marginTop: 'auto'
                                    }}
                                >
                                    {t('onboarding.pricing.try_now')}
                                </Button>
                            </Card>
                        )}
                    </div>

                    <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                        <Button
                            onClick={() => {
                                console.log("Button Clicked. Selected Plans:", selectedPlanIds);
                                if (selectedPlanIds.length === 0) {
                                    alert("Veuillez sélectionner une formule avant de valider.");
                                    return;
                                }
                                validateSelection();
                            }}
                            // disabled={selectedPlanIds.length === 0} // DEBUG: Enable to check click
                            style={{
                                fontSize: '1.2rem', padding: '1rem 3rem',
                                background: selectedPlanIds.length > 0 ? '#1890ff' : '#9ca3af', // Visual Feedback
                                cursor: 'pointer'
                            }}
                        >
                            {t('onboarding.pricing.validate_selection')}
                        </Button>
                    </div>

                    <button
                        onClick={() => setStep(1)}
                        style={{ display: 'block', margin: '2rem auto', color: '#9ca3af', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        {t('onboarding.pricing.back_to_profile')}
                    </button>
                </div>
            </div>
        );
    }





    // STEP 1: Type Selection (Existing Code wrapped)
    return (
        <div style={{
            minHeight: '100vh',
            background: '#f9fafb',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            position: 'relative'
        }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <LanguageSwitcher variant="header" />
            </div>

            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', color: '#1f2937' }}>
                {t('onboarding.welcome_on')}
            </h1>
            <img src="/Logo_equinox-nom.png" alt="Equinox" style={{ height: '250px', marginBottom: '3rem' }} />




            {/* Grid Container */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 300px))',
                gap: '2rem',
                justifyContent: 'center',
                width: '100%',
                maxWidth: '800px'
            }}>

                {/* Professional Card */}
                <Card
                    onClick={() => handleSelectType('pro')}
                    style={{
                        position: 'relative', overflow: 'hidden', cursor: 'pointer', padding: '1.5rem',
                        transition: 'transform 0.2s', height: '150px', display: 'flex', alignItems: 'center'
                    }}
                    className="hover:shadow-lg hover:-translate-y-1"
                >
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', background: '#1890ff' }} />
                    <div style={{ paddingLeft: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: '#e6f7ff', color: '#1890ff', padding: '1rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Briefcase size={24} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#333' }}>{t('onboarding.professional')}</h3>
                    </div>
                </Card>

                {/* Amateur Card */}
                <Card
                    onClick={() => handleSelectType('amateur')}
                    style={{
                        position: 'relative', overflow: 'hidden', cursor: 'pointer', padding: '1.5rem',
                        transition: 'transform 0.2s', height: '150px', display: 'flex', alignItems: 'center'
                    }}
                    className="hover:shadow-lg hover:-translate-y-1"
                >
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', background: '#eb2f96' }} />
                    <div style={{ paddingLeft: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: '#fff0f6', color: '#eb2f96', padding: '1rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Heart size={24} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#333' }}>{t('onboarding.owner')}</h3>
                    </div>
                </Card>
            </div>

            {/* Modal for Professionals Activities */}
            {showProModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ width: '90%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', padding: '0', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} className="animate-fade-in-up">
                        <div style={{
                            padding: '1.5rem',
                            background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
                            color: 'white',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Briefcase size={22} className="text-white op-80" />
                                    {t('onboarding.pro_modal.title')}
                                </h3>
                                <p style={{ margin: '0.3rem 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>{t('onboarding.pro_modal.subtitle')}</p>
                            </div>
                            <button onClick={() => setShowProModal(false)} style={{ color: 'white', opacity: 0.8, cursor: 'pointer', background: 'none', border: 'none' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: '2rem' }}>
                            <p style={{ marginBottom: '1.5rem', color: '#4b5563', fontSize: '1rem', fontWeight: 500 }}>
                                {t('onboarding.pro_modal.instruction')}
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
                                {activitiesList.map(activityObj => {
                                    const isSelected = selectedActivities.includes(activityObj.value);
                                    return (
                                        <div
                                            key={activityObj.value}
                                            onClick={() => toggleActivity(activityObj.value)}
                                            style={{
                                                padding: '1rem 1.25rem',
                                                borderRadius: '12px',
                                                border: isSelected ? '2px solid #1890ff' : '1px solid #e5e7eb',
                                                background: isSelected ? '#f0f9ff' : 'white',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                                                boxShadow: isSelected ? '0 4px 6px -1px rgba(24, 144, 255, 0.1)' : 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                <div style={{
                                                    width: '20px', height: '20px', borderRadius: '50%',
                                                    border: isSelected ? '5px solid #1890ff' : '2px solid #d1d5db',
                                                    transition: 'all 0.2s'
                                                }} />
                                                <span style={{ fontWeight: isSelected ? 600 : 500, color: isSelected ? '#1f2937' : '#4b5563', fontSize: '1.05rem' }}>{t(`onboarding.pro_modal.activities.${activityObj.key}`)}</span>
                                            </div>
                                            {isSelected && <Check size={20} style={{ color: '#1890ff' }} />}
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #f3f4f6', paddingTop: '1.5rem' }}>
                                <Button variant="secondary" onClick={() => setShowProModal(false)} style={{ padding: '0.75rem 1.5rem' }}>{t('onboarding.pro_modal.back_btn')}</Button>
                                <Button
                                    onClick={handleProActivitiesSubmit}
                                    disabled={selectedActivities.length === 0}
                                    style={{
                                        opacity: selectedActivities.length === 0 ? 0.5 : 1,
                                        background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
                                        border: 'none',
                                        padding: '0.75rem 2rem',
                                        fontSize: '1rem',
                                        boxShadow: '0 4px 6px rgba(24, 144, 255, 0.25)'
                                    }}
                                >
                                    {t('onboarding.pro_modal.validate_btn')}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Onboarding;
