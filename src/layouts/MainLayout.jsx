import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Calendar, LayoutList, Activity, Utensils, Trophy, Heart, Brain, Sparkles, MessageCircle, Users, FileText, Package, ClipboardList, Handshake, Repeat, Headphones, Settings, Menu, LogOut, Eye, PieChart, UserCheck } from 'lucide-react';
import { canAccess, getMaxHorses, isExternalUser } from '../utils/permissions';
import { useTheme } from '../context/ThemeContext';
import NotificationManager from '../components/features/NotificationManager';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import AdBanner from '../components/features/AdBanner';
import Button from '../components/common/Button';

import SEO from '../components/common/SEO';

const SidebarItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
        }
    >
        <Icon size={20} />
        <span>{label}</span>
    </NavLink>
);

const BottomNavItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `bottom-nav-item ${isActive ? 'active' : ''}`
        }
        end={to === '/dashboard'}
    >
        <Icon size={24} />
        <span style={{ fontSize: '0.7rem' }}>{label}</span>
    </NavLink>
);

const SidebarSectionTitle = ({ title }) => (
    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2 px-4">
        {title}
    </div>
);

const MainLayout = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { mode } = useTheme();
    const [userName, setUserName] = useState(localStorage.getItem('user_name') || 'Rider');
    const [userLogo, setUserLogo] = useState(localStorage.getItem('user_logo'));

    useEffect(() => {
        const handleUserUpdate = () => {
            setUserName(localStorage.getItem('user_name') || 'Rider');
            setUserLogo(localStorage.getItem('user_logo'));
        };

        window.addEventListener('user_updated', handleUserUpdate);

        // Onboarding Check
        const userType = localStorage.getItem('userType');
        if (!userType) {
            navigate('/onboarding');
        }

        // PRO TRIAL EXPIRATION CHECK
        const userPlans = JSON.parse(localStorage.getItem('subscriptionPlan') || '[]');
        if (userPlans.includes('pro_trial')) {
            const startStr = localStorage.getItem('trialStartDate');
            if (startStr) {
                const start = parseInt(startStr);
                const now = Date.now();
                const daysPassed = (now - start) / (1000 * 60 * 60 * 24);

                if (daysPassed > 30) {
                    // Trial Expired!
                    console.log("Pro Trial Expired. Redirecting to Settings.");
                    if (location.pathname !== '/settings' && location.pathname !== '/billing') {
                        navigate('/settings?trial_expired=true');
                    }
                }
            }
        }

        return () => window.removeEventListener('user_updated', handleUserUpdate);
    }, [navigate, location]);

    const userPlans = JSON.parse(localStorage.getItem('subscriptionPlan') || '[]');
    // Check strict equality if we want "only" or just containment. The prompt says "pack élevage uniquement"
    // referencing the single choice we just enforced. So checking includes is safe enough for the pro plan context.
    const isBreederOnly = userPlans.includes('eleveur') || userPlans.includes('eleveur_amateur_paid');
    const showAds = !isExternalUser() && userPlans.includes('decouverte');

    // Simulation Mode Check
    const isSimulation = localStorage.getItem('is_simulation') === 'true';

    const handleExitSimulation = () => {
        localStorage.removeItem('is_simulation');
        localStorage.removeItem('user_role');
        localStorage.setItem('user_name', 'Cavalier'); // Reset to default owner name
        window.location.reload();
    };

    // --- Responsive Sidebar Logic ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Auto-close sidebar on route change (Mobile UX)
    // Ensures that when a user clicks a link in the mobile menu, the menu closes automatically.
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location]);

    const displayInitial = userName.charAt(0).toUpperCase();

    // Helper to Determine Page Title dynamically
    const getPageTitle = () => {
        switch (location.pathname) {
            case '/':
            case '/dashboard':
                return t('welcome_user', { name: userName });
            case '/profile': return t('profile');
            case '/weather': return t('weather');
            case '/horses': return t('horses');
            case '/care': return t('care');
            case '/calendar': return t('calendar');
            case '/team': return t('team_and_partners');
            case '/leases': return t('manage_half_leases');
            case '/messages': return t('messaging');
            case '/breeding': return t('manage_breeding');
            case '/settings': return t('settings');
            case '/billing': return t('billing');
            case '/contacts': return t('manage_clients');
            case '/stock': return t('manage_stocks');
            case '/nutrition': return t('nutrition');
            case '/competition': return t('competition_season');
            case '/register': return t('legal_register');
            case '/assistant': return 'Assistant IA';
            case '/ai-coach': return 'AI Training Coach';
            case '/training/Detail': return t('training_details');
            default: return 'Equinox';
        }
    };

    return (
        <div className="app-layout" style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
            <SEO title={`${getPageTitle()} - Equinox`} />
            <NotificationManager />

            {/* 
              Mobile Sidebar Overlay 
              - Only visible when sidebar is open on mobile
              - Clicks close the menu (backdrop behavior)
            */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Application Sidebar */}
            <aside
                className={`glass-panel no-print app-sidebar ${isSidebarOpen ? 'open' : ''}`}
                style={{
                    width: '280px',
                    position: 'fixed',
                    height: 'calc(100vh - 2rem)',
                    top: '1rem',
                    left: '1rem',
                    padding: '1rem 1rem 2rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 50,
                    borderRadius: 'var(--radius-lg)',
                    // background: 'rgba(255, 255, 255, 0.4)' // Removed to allow CSS glass-panel var to work
                }}
            >
                <div style={{ padding: '0 0.5rem 0.5rem 0.5rem', marginBottom: '0.5rem', textAlign: 'center', position: 'relative' }}>
                    <img src="/Logo_equinox-nom.png" alt="Equinox" style={{ maxWidth: '100%', height: 'auto', maxHeight: '130px' }} />

                    {/* Close button (Optional/Hidden logic for strictly mobile if needed) */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="mobile-only"
                        style={{
                            position: 'absolute', top: 0, right: 0,
                            background: 'transparent', border: 'none', display: 'none'
                        }}
                    />
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', minHeight: 0, scrollbarWidth: 'none' }}>

                    {/* 1. LE DASHBOARD (Force Sidebar Update 2026-01-18) */}
                    {!isExternalUser() && <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Accueil" />}
                    <SidebarItem to="/planning" icon={Calendar} label="Planning" />

                    {/* 2. SECTION : CAVALERIE */}
                    <SidebarSectionTitle title="CAVALERIE" />

                    <SidebarItem to="/horses" icon={LayoutList} label="Mon Écurie" /> {/* HorseHead not available */}
                    <SidebarItem to="/health" icon={Activity} label="Santé & Soins" />
                    <SidebarItem to="/rations" icon={Utensils} label="Rations" />
                    <SidebarItem to="/competition" icon={Trophy} label="Compétition" />
                    <SidebarItem to="/breeding" icon={Heart} label="Élevage" />

                    {/* 3. SECTION : INTELLIGENCE (IA) */}
                    <SidebarSectionTitle title="INTELLIGENCE (IA)" />

                    <SidebarItem to="/ai-coach" icon={Brain} label="AI Training Coach" />
                    <SidebarItem to="/ai-assistant" icon={Sparkles} label="Assistant IA" />

                    {/* 4. SECTION : GESTION & ADMIN */}
                    <SidebarSectionTitle title="GESTION & ADMIN" />

                    <SidebarItem to="/messages" icon={MessageCircle} label="Messagerie" />
                    <SidebarItem to="/clients" icon={Users} label="Clients" />
                    <SidebarItem to="/team" icon={UserCheck} label="Mon Équipe" />
                    <SidebarItem to="/billing" icon={FileText} label="Facturation" />
                    <SidebarItem to="/stocks" icon={Package} label="Stocks" />
                    <SidebarItem to="/legal-register" icon={ClipboardList} label="Registre Légal" />
                    <SidebarItem to="/sharing" icon={Handshake} label="Demi-Pensions" />

                    {/* FOOTER */}
                    <div className="my-4 border-t border-gray-100 dark:border-gray-700"></div>

                    <SidebarItem to="/accounts" icon={Repeat} label="Comptes" />
                    <SidebarItem to="/support" icon={Headphones} label="Support" />

                    {/* Settings - Always visible or restricted? Previously controlled by !isExternalUser. 
                        User snippet shows it unconditionally. I will keep existing logic for safety if needed, 
                        or assume User snippet overrides. 
                        User snippet: <SidebarItem icon={SettingsIcon} text="Paramètres" to="/settings" />
                        I will apply !isExternalUser check if logic requires it, but user requested explicit list.
                        I'll stick to User Request but keep permissions if they are critical to prevent crashes.
                        Actually, Settings is usually for everyone (Profile etc). 
                        I'll show it for everyone as per request layout. 
                    */}
                    <SidebarItem to="/settings" icon={Settings} label="Paramètres" />

                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="layout-content" style={{ marginLeft: '310px', flex: 1, padding: '1rem 2rem', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {/* Top Header */}
                {location.pathname !== '/settings' && (
                    <header className="no-print" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '2rem',
                        padding: '1rem 0'
                    }}>
                        <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {/* Hamburger Menu Button (Mobile Only via CSS) */}
                            <button
                                className="btn-secondary"
                                onClick={() => setIsSidebarOpen(true)}
                                style={{
                                    padding: '0.5rem',
                                    display: 'none', // Overridden by media query in CSS
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '12px'
                                }}
                                id="mobile-menu-btn"
                            >
                                <Menu size={24} />
                            </button>

                            <div>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                                <h2 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{getPageTitle()}</h2>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <LanguageSwitcher variant="header" />
                            <div
                                onClick={() => navigate('/profile')}
                                className="glass-panel"
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--color-primary)',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    background: userLogo ? 'transparent' : 'var(--glass-bg)'
                                }}
                                title={t('profile')}
                            >
                                {userLogo ? (
                                    <img src={userLogo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    displayInitial
                                )}
                            </div>
                        </div>
                    </header>
                )}

                {/* Page Content */}
                <main className="animate-fade-in" style={{ paddingBottom: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {showAds && <AdBanner seed={1} />}
                    <div style={{ flex: 1 }}>
                        <Outlet />
                    </div>


                    {/* Footer */}
                    <div style={{
                        marginTop: 'auto',
                        paddingTop: '2rem',
                        borderTop: '1px solid var(--border-color)',
                        textAlign: 'center',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.8rem',
                        opacity: 0.7
                    }}>
                        {t('footer.copyright')}
                    </div>
                </main>
            </div>

            {/* Simulation Banner */}
            {
                isSimulation && (
                    <div style={{
                        position: 'fixed',
                        bottom: '1rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#1f2937',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '999px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Eye size={18} className="text-blue-400" />
                            <span style={{ fontSize: '0.9rem' }}>
                                {t('simulation.view_for')} <strong>{userName}</strong>
                            </span>
                        </div>
                        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />
                        <button
                            onClick={handleExitSimulation}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#fbbf24',
                                cursor: 'pointer',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <LogOut size={16} /> {t('simulation.exit')}
                        </button>
                    </div>
                )
            }

            {/* DEMO MODE BANNER & LOGIC */}
            {localStorage.getItem('app_demo_mode') === 'true' && (() => {
                const expiresAt = parseInt(localStorage.getItem('app_demo_expires') || '0');
                const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((expiresAt - Date.now()) / 60000))); // Minutes

                useEffect(() => {
                    const timer = setInterval(() => {
                        const remaining = expiresAt - Date.now();
                        if (remaining <= 0) {
                            // EXPIRED
                            clearInterval(timer);
                            localStorage.clear();
                            alert(t('demo.expired'));
                            window.location.href = '/signup';
                        } else {
                            setTimeLeft(Math.floor(remaining / 60000));
                        }
                    }, 1000 * 60); // Check every minute (or refresh on mount)
                    return () => clearInterval(timer);
                }, []);

                const days = Math.floor(timeLeft / 1440);
                const hours = Math.floor((timeLeft % 1440) / 60);
                const minutes = timeLeft % 60;

                // Progress base on 7 days (10080 minutes)
                const totalMinutes = 7 * 24 * 60;
                const progress = Math.min(100, (timeLeft / totalMinutes) * 100);

                return (
                    <div style={{
                        position: 'fixed',
                        top: '0',
                        left: '0',
                        right: '0',
                        height: '6px',
                        background: '#1f2937',
                        zIndex: 99999
                    }}>
                        <div style={{
                            height: '100%',
                            background: '#fbbf24',
                            width: `${progress}%`,
                            transition: 'width 1s linear'
                        }} />
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '20px',
                            background: '#fbbf24',
                            color: '#1f2937',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            {t('demo.bar_text', { days, hours, minutes })}
                        </div>
                    </div>
                );
            })()}

            {/* PRO TRIAL BANNER */}
            {(() => {
                const userPlans = JSON.parse(localStorage.getItem('subscriptionPlan') || '[]');
                if (userPlans.includes('pro_trial')) {
                    const startStr = localStorage.getItem('trialStartDate');
                    if (startStr) {
                        const start = parseInt(startStr);
                        const now = Date.now();
                        const daysPassed = (now - start) / (1000 * 60 * 60 * 24);
                        const daysLeft = Math.max(0, Math.ceil(30 - daysPassed));

                        return (
                            <div style={{
                                position: 'fixed',
                                bottom: '1rem',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: '#f97316',
                                color: 'white',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '999px',
                                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)',
                                zIndex: 9990,
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                <Trophy size={16} />
                                <span>{t('trial.text', { days: daysLeft })}</span>
                                <Button
                                    size="small"
                                    onClick={() => navigate('/settings')}
                                    style={{ marginLeft: '0.5rem', background: 'white', color: '#f97316', border: 'none', padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                                >
                                    {t('trial.subscribe')}
                                </Button>
                            </div>
                        );
                    }
                }
                return null;
            })()}

            {/* Mobile Bottom Navigation */}
            <nav className="bottom-nav no-print">
                <BottomNavItem to="/dashboard" icon={LayoutDashboard} label={t('home')} />
                <BottomNavItem to="/calendar" icon={Calendar} label={t('planning')} />
                {(getMaxHorses() > 0 || isExternalUser()) && (
                    <BottomNavItem to="/horses" icon={LayoutList} label={isBreederOnly ? t('my_breeding') : t('my_stable')} />
                )}
                <button
                    className={`bottom-nav-item ${isSidebarOpen ? 'active' : ''}`}
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <Menu size={24} />
                    <span style={{ fontSize: '0.7rem' }}>Menu</span>
                </button>
            </nav>
        </div >
    );
};

export default MainLayout;
