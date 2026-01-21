import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { ChevronRight, Check, Shield, Zap, Heart, FileText, MessageCircle, XCircle, CreditCard, Smartphone, Clock, Calendar, Search, Bell, Sun, Globe, Download } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import SEO from '../components/SEO';
import { usePWA } from '../context/PWAContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    // The Equinox Gradient
    // The Equinox Gradient
    const gradientBg = 'linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%)';
    const [isAnnual, setIsAnnual] = useState(false);
    const { currentUser } = useAuth();
    const [showComingSoon, setShowComingSoon] = useState(false);

    // PWA Install Logic
    const { openInstructions } = usePWA();

    // Legacy effect removed - handled by PWAContext

    const handleInstallClick = () => {
        openInstructions();
    };

    const handleAction = () => {
        if (currentUser) {
            navigate('/dashboard');
        } else {
            // Redirect to signup to open access
            navigate('/signup');
        }
    };

    const getPrice = (amount) => {
        if (i18n.language.startsWith('en')) {
            // Replace comma with dot for English locale and prepend $
            return `$${amount.replace(',', '.')}`;
        }
        return `${amount} €`;
    };

    return (
        <div style={{ fontFamily: '"Inter", sans-serif', background: '#f8fafc', color: '#1e293b', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
            <SEO
                title={t('landing.seo.title')}
                description={t('landing.seo.description')}
                keywords={t('landing.seo.keywords')}
                structuredData={{
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "Equinox",
                    "applicationCategory": "BusinessApplication",
                    "operatingSystem": "Web, iOS, Android",
                    "description": "La solution tout-en-un pour la gestion d'écuries, de propriétaires et d'élevages.",
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "EUR"
                    },
                    "featureList": [
                        "Facturation automatique",
                        "Suivi santé des chevaux",
                        "Gestion des stocks",
                        "Planning des reprises",
                        "Registre d'élevage"
                    ]
                }}
            />

            {/* COMING SOON MODAL */}
            {showComingSoon && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem', backdropFilter: 'blur(5px)'
                }} onClick={() => setShowComingSoon(false)}>
                    <div style={{
                        background: 'white', borderRadius: '24px', padding: '3rem 2rem', maxWidth: '500px', width: '100%',
                        textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        position: 'relative', border: '1px solid #e2e8f0'
                    }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowComingSoon(false)} style={{
                            position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none',
                            color: '#94a3b8', cursor: 'pointer'
                        }}>
                            <XCircle size={24} />
                        </button>

                        <div style={{
                            width: '80px', height: '80px', background: '#f0f9ff', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto',
                            color: '#0ea5e9'
                        }}>
                            <Zap size={40} fill="currentColor" />
                        </div>

                        <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', lineHeight: '1.2' }}>
                            {t('landing.coming_soon.title')}
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                            {t('landing.coming_soon.desc')}
                        </p>

                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', fontSize: '0.95rem', color: '#475569', marginBottom: '2rem' }}>
                            💌 {t('landing.coming_soon.stay_connected')}
                        </div>

                        <Button onClick={() => setShowComingSoon(false)} style={{ width: '100%', borderRadius: '12px', padding: '1rem', background: '#0f172a', border: 'none' }}>
                            {t('landing.coming_soon.button')}
                        </Button>
                    </div>
                </div>
            )}

            {/* --- RESPONSIVE STYLES --- */}
            <style>{`
                /* Global Reset for box behavior */
                * { box-sizing: border-box; }
                
                @media (max-width: 768px) {
                    html, body { 
                        overflow-x: hidden !important; 
                        max-width: 100vw !important; 
                        position: relative;
                        margin: 0; padding: 0;
                    }
                    
                    /* Text Adjustments */
                    .hero-title { 
                        font-size: 1.8rem !important; 
                        line-height: 1.2 !important;
                        padding: 0;
                        width: 100% !important;
                        word-wrap: break-word;
                    }
                    .hero-text { font-size: 1rem !important; padding: 0 1rem; }
                    
                    /* Layout Adjustments */
                    .feature-block { flex-direction: column !important; gap: 2rem !important; }
                    .feature-block.reverse { flex-direction: column !important; }
                    .pain-points-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
                    .pricing-container { grid-template-columns: 1fr !important; }
                    
                    /* Nav & Header Constraints */
                    .nav-container { 
                        padding: 1rem !important; 
                        width: 100% !important; 
                        max-width: 100vw !important;
                    }
                    .nav-logo { height: 30px !important; }
                    
                    .header-container {
                        padding: 2rem 1rem 4rem 1rem !important;
                        width: 100% !important;
                        max-width: 100vw !important;
                        overflow: hidden !important;
                    }
                    
                    .mobile-stack { flex-direction: column !important; }
                    .mobile-hidden { display: none !important; }
                    
                    /* Logo Fix */
                    .hero-logo { 
                        height: auto !important; 
                        width: 100% !important; 
                        max-width: 180px !important; 
                    }
                    .flex-col-mobile {
                        flex-direction: column !important;
                        align-items: center !important;
                        width: 100% !important;
                    }

                    .nav-container {
                        justify-content: center !important;
                    }
                }
            `}</style>

            {/* --- NAVBAR --- */}
            <nav className="nav-container" style={{
                padding: '1.5rem 2rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 50
            }}>
                <div className="flex-col-mobile" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="flex-col-mobile" style={{ display: 'flex', gap: '0.8rem' }}>
                        <Button
                            onClick={handleInstallClick}
                            style={{ borderRadius: '99px', padding: '0.6rem 1.5rem', background: 'transparent', border: 'none', color: '#64748b', fontWeight: 600 }}
                        >
                            <Download size={18} style={{ marginRight: '0.5rem' }} />
                            {t('landing.nav.download_app')}
                        </Button>
                        {!currentUser && (
                            <Button
                                onClick={() => navigate('/signup')}
                                style={{ borderRadius: '99px', padding: '0.6rem 1.5rem', background: 'transparent', border: '1px solid #475569', color: '#1e293b' }}
                            >
                                {t('landing.nav.create')}
                            </Button>
                        )}
                        <Button
                            onClick={() => navigate(currentUser ? '/dashboard' : '/login')}
                            style={{ borderRadius: '99px', padding: '0.6rem 1.5rem', background: gradientBg, border: 'none' }}
                        >
                            {currentUser ? t('landing.nav.dashboard') : t('landing.nav.login')}
                        </Button>
                    </div>
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '99px', border: '1px solid #e2e8f0' }}>
                        <button
                            onClick={() => changeLanguage('fr')}
                            style={{
                                background: i18n.language === 'fr' ? 'white' : 'transparent',
                                color: i18n.language === 'fr' ? '#0f172a' : '#94a3b8',
                                boxShadow: i18n.language === 'fr' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                border: 'none',
                                borderRadius: '99px',
                                padding: '6px 14px',
                                fontSize: '0.8rem',
                                fontWeight: i18n.language === 'fr' ? 700 : 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                lineHeight: 1
                            }}
                        >
                            FR
                        </button>
                        <button
                            onClick={() => changeLanguage('en')}
                            style={{
                                background: i18n.language.startsWith('en') ? 'white' : 'transparent',
                                color: i18n.language.startsWith('en') ? '#0f172a' : '#94a3b8',
                                boxShadow: i18n.language.startsWith('en') ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                border: 'none',
                                borderRadius: '99px',
                                padding: '6px 14px',
                                fontSize: '0.8rem',
                                fontWeight: i18n.language.startsWith('en') ? 700 : 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                lineHeight: 1
                            }}
                        >
                            EN
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <header className="header-container" style={{
                textAlign: 'center', padding: '2rem 1rem 4rem 1rem',
                maxWidth: '1200px', margin: '0 auto', position: 'relative',
                // overflow: 'hidden' removed to allow background blobs to extend
            }}>
                {/* Abstract Background Shape */}
                <div style={{
                    position: 'absolute', top: -100, right: -100, width: '600px', height: '600px',
                    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, rgba(255,255,255,0) 70%)',
                    borderRadius: '50%', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none'
                }}></div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <img
                        src="/Logo_equinox-nom.png"
                        alt="Logo Equinox - Logiciel de Gestion Équestre"
                        className="hero-logo"
                        style={{ height: '220px', objectFit: 'contain', marginBottom: '2rem', display: 'block', margin: '0 auto 2rem auto', maxWidth: '80%' }}
                    />

                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: '99px',
                        background: '#e0e7ff', color: '#4338ca', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.5rem',
                        maxWidth: '90%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                        <Zap size={16} fill="currentColor" style={{ flexShrink: 0 }} /> {t('landing.hero.new_mobile')}
                    </div>

                    <h1 className="hero-title" style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 800, color: '#0f172a', lineHeight: '1.1',
                        marginBottom: '1.5rem', letterSpacing: '-0.02em', maxWidth: '900px', margin: '0 auto 1.5rem auto',
                        wordWrap: 'break-word', overflowWrap: 'break-word'
                    }}>
                        <Trans i18nKey="landing.hero.title_main" components={{ 1: <span style={{ color: '#7c3aed' }} /> }} /> <br />
                        <span style={{
                            background: gradientBg,
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                        }}>{t('landing.hero.title_sub')}</span>
                    </h1>

                    <p className="hero-text" style={{ fontSize: '1.25rem', color: '#475569', maxWidth: '750px', margin: '0 auto 2.5rem auto', lineHeight: '1.6' }}>
                        <Trans i18nKey="landing.hero.subtitle" components={{ 1: <strong></strong> }} />
                    </p>

                    <div className="mobile-stack" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
                        <Button onClick={handleAction} size="large" style={{ borderRadius: '99px', padding: '1rem 3rem', fontSize: '1.1rem', boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.4)', background: gradientBg, border: 'none', width: 'auto' }}>
                            {currentUser ? t('landing.hero.cta_access') : t('landing.hero.cta_create')} <ChevronRight size={20} />
                        </Button>
                    </div>

                    <div style={{ maxWidth: '350px', margin: '0 auto 4rem auto' }}>
                        <PricingCard
                            title={t('landing.pricing.cards.elite')}
                            target={t('landing.pricing.cards.elite_target')}
                            features={[
                                t('landing.pricing.cards.features.all_unlimited'),
                                t('landing.pricing.cards.features.full_breeding'),
                                t('landing.pricing.cards.features.accounting_export'),
                                t('landing.pricing.cards.features.advanced_stocks'),
                                t('landing.pricing.cards.features.vip_support')
                            ]}
                            buttonVariant="primary"
                            buttonText={t('landing.hero.elite_offer_btn')}
                            iconName="Crown"
                            iconColor="#f59e0b"
                            onAction={() => navigate('/signup')}
                            highlight
                            gradient={gradientBg}
                        />
                    </div>

                    {/* VISUEL HERO - Reste inchangé pour desktop, nécessite adaptations CSS si complexe sur mobile, mais le conteneur responsive autour gère le scroll/fit */}
                    <div style={{
                        position: 'relative', maxWidth: '1000px', margin: '0 auto',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)', borderRadius: '24px', overflow: 'hidden',
                        border: '1px solid #e2e8f0', background: 'white'
                    }}>
                        {/* Fake Browser Header */}
                        <div style={{ height: '40px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '16px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></div>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></div>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                        </div>
                        {/* Simulation Dashboard */}
                        <div style={{ height: '500px', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                            {/* Sidebar - HIDDEN ON MOBILE */}
                            <div className="mobile-hidden" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '220px', background: '#1e293b', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ height: '30px', width: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', marginBottom: '10px' }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {[
                                        { label: 'Tableau de bord', active: true },
                                        { label: 'Planning' },
                                        { label: 'Mes Chevaux' },
                                        { label: 'Soins & Santé' },
                                        { label: 'Facturation' }
                                    ].map((item, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '8px 12px', borderRadius: '8px',
                                            background: item.active ? gradientBg : 'transparent',
                                            color: item.active ? 'white' : '#94a3b8',
                                            fontSize: '0.85rem', fontWeight: 500
                                        }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.active ? 'white' : '#475569', opacity: item.active ? 0.8 : 0.5 }}></div>
                                            {item.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Main Board - FULL WIDTH ON MOBILE */}
                            <div style={{ marginLeft: '220px', padding: '30px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}
                                className="mobile-full-width-content"
                            >
                                <style>{`@media(max-width:768px){ .mobile-full-width-content { margin-left: 0 !important; grid-template-columns: 1fr !important; } }`}</style>
                                {/* Top 3 Cards Scroller Container */}
                                <div className="metrics-scroller">
                                    <style>{`
                                        @media (max-width: 768px) {
                                            .metrics-scroller {
                                                display: flex !important;
                                                overflow-x: auto !important;
                                                gap: 1rem !important;
                                                padding-bottom: 10px;
                                                margin-right: -20px; /* Offset parent padding */
                                                padding-right: 20px;
                                                scroll-snap-type: x mandatory;
                                            }
                                            .metrics-card {
                                                min-width: 220px !important;
                                                scroll-snap-align: start;
                                                flex-shrink: 0;
                                            }
                                            /* Custom Scrollbar for metrics */
                                            .metrics-scroller::-webkit-scrollbar {
                                                display: block;
                                                height: 4px;
                                            }
                                            .metrics-scroller::-webkit-scrollbar-track {
                                                background: rgba(0,0,0,0.05);
                                                border-radius: 4px;
                                            }
                                            .metrics-scroller::-webkit-scrollbar-thumb {
                                                background: #cbd5e1;
                                                border-radius: 4px;
                                            }
                                        }
                                        /* Desktop Layout (Grid default) */
                                        .metrics-scroller {
                                            display:contents; /* Use parent grid on desktop */
                                        }
                                    `}</style>

                                    <div className="metrics-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', borderTop: '4px solid #06b6d4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                        <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '5px' }}>{t('landing.metrics.horses_work')}</h4>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>12</div>
                                    </div>
                                    <div className="metrics-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', borderTop: '4px solid #8b5cf6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                        <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '5px' }}>{t('landing.metrics.care_todo')}</h4>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>3</div>
                                    </div>
                                    <div className="metrics-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', borderTop: '4px solid #f59e0b', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                        <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '5px' }}>{t('landing.metrics.weather')}</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Sun size={28} color="#f59e0b" />
                                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>24°C</div>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600, marginTop: '4px' }}>{t('landing.metrics.sunny')}</div>
                                    </div>
                                </div>

                                {/* Planning Mockup */}
                                <div style={{ gridColumn: 'span 3', height: '250px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', overflowX: 'auto' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>Planning de la semaine</div>
                                        <div style={{ padding: '4px 12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.8rem', color: '#64748b' }}>Vue Semaine</div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', minWidth: '500px' }}>
                                        {[
                                            { day: 'Lun', events: [{ text: 'Cours - Spirit', color: '#dbeafe', textC: '#1e40af' }] },
                                            { day: 'Mar', events: [{ text: 'Vaccin - Végas', color: '#fee2e2', textC: '#991b1b' }, { text: 'Cours - Pépite', color: '#dbeafe', textC: '#1e40af' }] },
                                            { day: 'Mer', events: [{ text: 'Maréchal - Dakota', color: '#fef3c7', textC: '#92400e' }] },
                                            { day: 'Jeu', events: [] },
                                            { day: 'Ven', events: [{ text: 'Sortie Paddock', color: '#dcfce7', textC: '#166534' }] }
                                        ].map((col, i) => (
                                            <div key={i} style={{ border: '1px solid #f1f5f9', borderRadius: '8px', padding: '10px', minHeight: '140px' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>{col.day}</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {col.events.map((ev, k) => (
                                                        <div key={k} style={{ fontSize: '0.7rem', padding: '4px', borderRadius: '4px', background: ev.color, color: ev.textC, fontWeight: 600 }}>
                                                            {ev.text}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- PAIN POINTS --- */}
            <section style={{ padding: '6rem 2rem', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)', textAlign: 'center' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4rem', color: '#1e293b' }}>
                        {t('landing.pain_points.title')}
                    </h2>
                    <div className="pain-points-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
                        <PainPoint
                            icon={CreditCard}
                            gradient={gradientBg}
                            title={t('landing.pain_points.invoices.title')}
                            text={t('landing.pain_points.invoices.text')}
                        />
                        <PainPoint
                            icon={Smartphone}
                            gradient={gradientBg}
                            title={t('landing.pain_points.sms.title')}
                            text={t('landing.pain_points.sms.text')}
                        />
                        <PainPoint
                            icon={FileText}
                            gradient={gradientBg}
                            title={t('landing.pain_points.paperwork.title')}
                            text={t('landing.pain_points.paperwork.text')}
                        />
                    </div>
                </div>
            </section>

            {/* --- SOLUTIONS --- */}
            <section style={{ padding: '6rem 2rem', background: 'transparent' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <div style={{ display: 'inline-block', padding: '0.5rem 1rem', background: '#ede9fe', color: '#7c3aed', borderRadius: '99px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>{t('landing.features.label')}</div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a' }}>{t('landing.features.main_title')}</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6rem' }}>

                        {/* FEATURE 1: BILLING */}
                        <FeatureBlock
                            reverse={false}
                            icon={CreditCard}
                            gradient={gradientBg}
                            title={t('landing.features.billing.title')}
                            subtitle={t('landing.features.billing.subtitle')}
                            description={
                                <>
                                    {t('landing.features.billing.desc')}
                                    <span style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginTop: '1rem', fontStyle: 'italic' }}>
                                        {t('landing.features.billing.commission')}
                                    </span>
                                </>
                            }
                            VisualComponent={
                                <div style={{ width: '100%', padding: '20px' }}>
                                    <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '20px', marginBottom: '15px', borderLeft: '4px solid #10b981' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <span style={{ fontWeight: 700, color: '#1e293b' }}>Facture #INV-2024-001</span>
                                            <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600 }}>Payée</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.9rem' }}>
                                            <span>Mme. Dupont - Pension Complète</span>
                                            <span style={{ fontWeight: 600 }}>650.00 €</span>
                                        </div>
                                    </div>
                                    <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '20px', borderLeft: '4px solid #f59e0b', opacity: 0.8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <span style={{ fontWeight: 700, color: '#1e293b' }}>Facture #INV-2024-002</span>
                                            <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600 }}>En attente</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                        <div style={{ display: 'inline-flex', padding: '8px 16px', background: '#635bff', color: 'white', borderRadius: '6px', fontSize: '0.9rem', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(99, 91, 255, 0.3)' }}>
                                            <CreditCard size={14} /> Payer par Carte
                                        </div>
                                    </div>
                                </div>
                            }
                        />

                        {/* FEATURE 2: HEALTH */}
                        <FeatureBlock
                            reverse={true}
                            icon={Heart}
                            gradient={gradientBg}
                            title={t('landing.features.health.title')}
                            subtitle={t('landing.features.health.subtitle')}
                            description={t('landing.features.health.desc')}
                            VisualComponent={
                                <div style={{ width: '100%', padding: '20px' }}>
                                    <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                                        <div style={{ height: '60px', background: gradientBg, display: 'flex', alignItems: 'center', padding: '0 20px', color: 'white', fontWeight: 700 }}>
                                            Spirit du Val
                                        </div>
                                        <div style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#e2e8f0' }}></div>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: '#1e293b' }}>Selle Français</div>
                                                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Né le 12/04/2015</div>
                                                </div>
                                            </div>
                                            <div style={{ marginBottom: '10px', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>PROCHAINS SOINS</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f1f5f9', borderRadius: '8px', marginBottom: '8px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></div>
                                                <span style={{ fontSize: '0.9rem', flex: 1 }}>Vaccin Grippe/Tétanos</span>
                                                <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>J-5</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f1f5f9', borderRadius: '8px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                                <span style={{ fontSize: '0.9rem', flex: 1 }}>Ostéo annuel</span>
                                                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>OK</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            }
                        />

                        {/* FEATURE 3: CHAT */}
                        <FeatureBlock
                            reverse={false}
                            icon={MessageCircle}
                            gradient={gradientBg}
                            title={t('landing.features.messaging.title')}
                            subtitle={t('landing.features.messaging.subtitle')}
                            description={t('landing.features.messaging.desc')}
                            VisualComponent={
                                <div style={{ width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ alignSelf: 'flex-start', background: 'white', padding: '12px 16px', borderRadius: '12px 12px 12px 0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', maxWidth: '80%' }}>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>Bonjour, Spirit a bien mangé ce matin ? 🥕</p>
                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>10:30 • Claire (Propriétaire)</span>
                                    </div>

                                    <div style={{ alignSelf: 'flex-end', background: gradientBg, padding: '12px 16px', borderRadius: '12px 12px 0 12px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', maxWidth: '80%', color: 'white' }}>
                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Oui tout va bien ! Il est au paddock actuellement.</p>
                                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', marginTop: '4px', display: 'block' }}>10:32 • Vous</span>
                                    </div>

                                    <div style={{ alignSelf: 'flex-end', maxWidth: '80%' }}>
                                        <div style={{ height: '120px', width: '180px', borderRadius: '12px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            <span style={{ fontSize: '3rem' }}>🐴</span>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', textAlign: 'right', display: 'block' }}>10:33 • Vous</span>
                                    </div>
                                </div>
                            }
                        />
                    </div>
                </div>
            </section>

            {/* --- PRICING --- */}
            <section style={{ padding: '6rem 2rem', background: '#0f172a', color: 'white', overflow: 'hidden' }}>
                {/* CSS for Responsive Layout */}
                <style>{`
                    .pricing-container {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                        gap: 2rem;
                        padding: 1rem 0;
                    }
                    /* Mobile: Carousel Mode */
                    @media (max-width: 900px) {
                        /* Make container have padding right so last card isn't flush */
                        .pricing-container {
                            display: flex;
                            flex-wrap: nowrap;
                            overflow-x: auto;
                            scroll-snap-type: x mandatory;
                            gap: 1.5rem;
                            padding-bottom: 2rem;
                            -webkit-overflow-scrolling: touch;
                            scroll-padding: 1.5rem; /* Match padding */
                            padding-left: 1.5rem;
                            padding-right: 1.5rem;
                        }
                        .pricing-card {
                            min-width: 75vw; /* Smaller width to allow 'peek' of next card */
                            scroll-snap-align: center;
                        }
                        /* Custom Scrollbar for indicators */
                        .pricing-container::-webkit-scrollbar {
                            display: block; /* Show scrollbar */
                            height: 4px; /* Thin line */
                        }
                        .pricing-container::-webkit-scrollbar-track {
                            background: rgba(0,0,0,0.05);
                            border-radius: 4px;
                            margin: 0 1.5rem; /* Align with padding */
                        }
                        .pricing-container::-webkit-scrollbar-thumb {
                            background: #cbd5e1; /* Grey thumb */
                            border-radius: 4px;
                        }
                    }
                    .hover-card {
                        transition: transform 0.3s ease, box-shadow 0.3s ease;
                    }
                    .hover-card:hover {
                        transform: translateY(-10px);
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
                    }
                `}</style>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>{t('landing.pricing.title')}</h2>
                        <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>{t('landing.pricing.subtitle')}</p>
                    </div>

                    {/* --- PART 1: PARTICULIERS --- */}
                    <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                        <span style={{ background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '0.3rem 1rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {t('landing.pricing.individuals')}
                        </span>
                    </div>

                    {/* Removed text hint, scrollbar is enough */}

                    <div className="pricing-container" style={{ marginBottom: '3rem' }}>
                        {/* OFFRE 1: DÉCOUVERTE */}
                        <div className="pricing-card">
                            <PricingCard
                                title={t('landing.pricing.cards.discovery')}
                                target={t('landing.pricing.cards.discovery_target')}
                                price={t('landing.pricing.cards.free')}
                                features={[
                                    t('landing.pricing.cards.features.1_horse_1_mare'),
                                    t('landing.pricing.cards.features.health_record'),
                                    t('landing.pricing.cards.features.breeding_register'),
                                    t('landing.pricing.cards.features.simple_calendar'),
                                    t('landing.pricing.cards.features.standard_support')
                                ]}
                                buttonVariant="secondary"
                                iconName="Star"
                                iconColor="#10b981"
                                onAction={handleAction}
                            />
                        </div>

                        {/* OFFRE 2: PASSION */}
                        <div className="pricing-card">
                            <PricingCard
                                title={t('landing.pricing.cards.passion')}
                                target={t('landing.pricing.cards.passion_target')}
                                price={getPrice("9,90")}
                                period={t('landing.pricing.monthly')}
                                features={[
                                    t('landing.pricing.cards.features.unlimited_horses'),
                                    t('landing.pricing.cards.features.budget_mgmt'),
                                    t('landing.pricing.cards.features.storage_media'),
                                    t('landing.pricing.cards.features.alerts'),
                                    t('landing.pricing.cards.features.competition'),
                                    t('landing.pricing.cards.features.half_leases'),
                                    t('landing.pricing.cards.features.priority_support')
                                ]}
                                buttonVariant="primary"
                                highlight
                                gradient="linear-gradient(135deg, #ec4899 0%, #db2777 100%)"
                                onAction={handleAction}
                            />
                        </div>

                        {/* OFFRE 3: PASSION ÉLEVAGE */}
                        <div className="pricing-card">
                            <PricingCard
                                title={t('landing.pricing.cards.passion_breeding')}
                                target={t('landing.pricing.cards.passion_breeding_target')}
                                price={getPrice("4,90")}
                                period={t('landing.pricing.monthly')}
                                features={[
                                    t('landing.pricing.cards.features.5_mares'),
                                    t('landing.pricing.cards.features.repro_tracking'),
                                    t('landing.pricing.cards.features.health_record'),
                                    t('landing.pricing.cards.features.budget_mgmt'),
                                    t('landing.pricing.cards.features.option_mare'),
                                    t('landing.pricing.cards.features.priority_support')
                                ]}
                                buttonVariant="secondary"
                                iconName="Heart"
                                iconColor="#d946ef"
                                onAction={handleAction}
                            />
                        </div>


                        {/* OFFRE 4: OPTION +1 CHEVAL */}
                        <div className="pricing-card">
                            <PricingCard
                                title={t('landing.pricing.cards.extra_horse')}
                                target={t('landing.pricing.cards.extra_horse_target')}
                                price={getPrice("2,50")}
                                period="unique"
                                features={[
                                    t('landing.pricing.cards.features.add_horse_life'),
                                    t('landing.pricing.cards.features.one_time_payment'),
                                    t('landing.pricing.cards.features.no_subscription'),
                                    t('landing.pricing.cards.features.stackable_free')
                                ]}
                                buttonVariant="secondary"
                                iconName="Plus"
                                iconColor="#fbbf24"
                                noButton
                                onAction={handleAction}
                            />
                        </div>
                    </div>

                    {/* --- PART 2: PROS --- */}
                    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ background: 'rgba(79, 70, 229, 0.2)', color: '#818cf8', padding: '0.3rem 1rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {t('landing.pricing.pros')}
                            </span>
                        </div>
                        {/* Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                            <span style={{ color: !isAnnual ? 'white' : 'inherit', fontWeight: !isAnnual ? 700 : 400, cursor: 'pointer' }} onClick={() => setIsAnnual(false)}>{t('landing.pricing.monthly')}</span>
                            <div
                                onClick={() => setIsAnnual(!isAnnual)}
                                style={{
                                    width: '50px', height: '26px', background: isAnnual ? '#4f46e5' : '#334155', borderRadius: '99px',
                                    position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
                                }}
                            >
                                <div style={{
                                    width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                    position: 'absolute', top: '3px', left: isAnnual ? '27px' : '3px', transition: 'left 0.3s'
                                }}></div>
                            </div>
                            <span style={{ color: isAnnual ? 'white' : 'inherit', fontWeight: isAnnual ? 700 : 400, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => setIsAnnual(true)}>
                                {t('landing.pricing.annual')}
                                <span style={{ background: '#dcfce7', color: '#166534', padding: '0.1rem 0.5rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700 }}>{t('landing.pricing.discount')}</span>
                            </span>
                        </div>
                    </div>

                    <div className="pricing-container">
                        {/* OFFRE 4: START */}
                        <div className="pricing-card">
                            <PricingCard
                                title={t('landing.pricing.cards.start')}
                                target={t('landing.pricing.cards.start_target')}
                                price={(isAnnual ? getPrice("279") : getPrice("29")) + " HT"}
                                period={isAnnual ? t('landing.pricing.annual') : t('landing.pricing.monthly')}
                                features={[
                                    t('landing.pricing.cards.features.up_to_10'),
                                    t('landing.pricing.cards.features.owner_mgmt'),
                                    t('landing.pricing.cards.features.simple_billing'),
                                    t('landing.pricing.cards.features.care_reminders'),
                                    t('landing.pricing.cards.features.2_staff'),
                                    t('landing.pricing.cards.features.standard_support')
                                ]}
                                buttonVariant="secondary"
                                iconName="Briefcase"
                                iconColor="#60a5fa"
                                onAction={handleAction}
                            />
                        </div>

                        {/* OFFRE 5: SPÉCIAL ÉLEVEUR */}
                        <div className="pricing-card">
                            <PricingCard
                                title={t('landing.pricing.cards.breeder')}
                                target={t('landing.pricing.cards.breeder_target')}
                                price={(isAnnual ? getPrice("659") : getPrice("69")) + " HT"}
                                period={isAnnual ? t('landing.pricing.annual') : t('landing.pricing.monthly')}
                                features={[
                                    t('landing.pricing.cards.features.unlimited_mares'),
                                    t('landing.pricing.cards.features.gyneco_tracking'),
                                    t('care'),
                                    t('landing.pricing.cards.features.planning'),
                                    t('landing.pricing.cards.features.5_staff'),
                                    t('landing.pricing.cards.features.full_billing'),
                                    t('landing.pricing.cards.features.priority_support')
                                ]}
                                buttonVariant="secondary"
                                iconName="Shield"
                                iconColor="#8b5cf6"
                                onAction={handleAction}
                            />
                        </div>

                        {/* OFFRE 6: PRO */}
                        <div className="pricing-card">
                            <PricingCard
                                title={t('landing.pricing.cards.pro')}
                                target={t('landing.pricing.cards.pro_target')}
                                price={(isAnnual ? getPrice("759") : getPrice("79")) + " HT"}
                                period={isAnnual ? t('landing.pricing.annual') : t('landing.pricing.monthly')}
                                features={[
                                    t('landing.pricing.cards.features.up_to_30'),
                                    t('landing.pricing.cards.features.recurring_billing'),
                                    t('landing.pricing.cards.features.planning_team'),
                                    t('landing.pricing.cards.features.competition'),
                                    t('landing.pricing.cards.features.stocks'),
                                    t('landing.pricing.cards.features.priority_support')
                                ]}
                                buttonVariant="primary"
                                highlight
                                gradient={gradientBg}
                                onAction={handleAction}
                            />
                        </div>


                        {/* OFFRE 8: ELITE */}
                        <div className="pricing-card">
                            <PricingCard
                                title={t('landing.pricing.cards.elite')}
                                target={t('landing.pricing.cards.elite_target')}
                                price={(isAnnual ? getPrice("1239") : getPrice("129")) + " HT"}
                                period={isAnnual ? t('landing.pricing.annual') : t('landing.pricing.monthly')}
                                features={[
                                    t('landing.pricing.cards.features.all_unlimited'),
                                    t('landing.pricing.cards.features.full_breeding'),
                                    t('landing.pricing.cards.features.accounting_export'),
                                    t('landing.pricing.cards.features.advanced_stocks'),
                                    t('landing.pricing.cards.features.vip_support')
                                ]}
                                buttonVariant="secondary"
                                iconName="Crown"
                                iconColor="#f59e0b"
                                onAction={handleAction}
                            />
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                        {t('landing.features.billing.commission')}
                    </div>
                </div >
            </section >

            {/* --- FOOTER --- */}
            < footer style={{ padding: '4rem 2rem', background: '#020617', color: '#cbd5e1', fontSize: '0.9rem', borderTop: '1px solid #1e293b' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>
                    <div>
                        <img src="/Logo_equinox-nom.png" alt="Logo Equinox Footer" loading="lazy" style={{ height: '40px', opacity: 1, marginBottom: '1.5rem', filter: 'brightness(0) invert(1)' }} />
                        <p style={{ lineHeight: '1.6', color: '#94a3b8' }}>
                            <Trans i18nKey="landing.footer.tagline" />
                        </p>
                    </div>

                    <div>
                        <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '1rem' }}>{t('landing.footer.legal')}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} className="hover-white">{t('landing.footer.terms_use')}</a>
                            <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} className="hover-white">{t('landing.footer.terms_sale')}</a>
                            <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} className="hover-white">{t('landing.footer.legal_notice')}</a>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '1rem' }}>{t('landing.footer.help_contact')}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <a href="/support" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} className="hover-white">{t('landing.footer.help_center')}</a>
                            <a href="mailto:support@equinox.app" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} className="hover-white">{t('landing.footer.contact_support')}</a>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '1rem' }}>{t('landing.footer.security')}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
                            <Shield size={16} /> {t('landing.footer.secure_payments')}
                        </div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
                            {t('landing.footer.stripe_partner')}
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #1e293b', color: '#64748b' }}>
                    {t('landing.footer.copyright')}
                </div>
            </footer >
        </div >
    );
};

// --- COMPONENTS ---

const PainPoint = ({ icon: Icon, gradient, title, text }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
            width: '70px', height: '70px', borderRadius: '50%', background: gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '1.5rem',
            boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.3)'
        }}>
            <Icon size={32} strokeWidth={1.5} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ color: '#64748b', lineHeight: '1.5' }}>{text}</p>
    </div>
);

const FeatureBlock = ({ reverse, icon: Icon, gradient, title, subtitle, description, VisualComponent }) => (
    <div className={`feature-block ${reverse ? 'reverse' : ''}`} style={{
        display: 'flex', flexDirection: reverse ? 'row-reverse' : 'row', alignItems: 'center', gap: '4rem',
        flexWrap: 'wrap-reverse'
    }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{
                width: '60px', height: '60px', borderRadius: '16px', background: '#f5f3ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', marginBottom: '1.5rem',
                border: '1px solid #ddd6fe'
            }}>
                <Icon size={28} />
            </div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>{title}</h3>
            <p style={{ fontSize: '1.25rem', color: '#4f46e5', fontWeight: 600, marginBottom: '1rem' }}>{subtitle}</p>
            <p style={{ color: '#475569', lineHeight: '1.7', fontSize: '1.1rem' }}>{description}</p>
        </div>
        <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{
                height: '400px', background: '#f1f5f9', borderRadius: '24px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                position: 'relative'
            }}>
                {VisualComponent}
            </div>
        </div>
    </div>
);

const PricingCard = ({ title, target, price, period, features, highlight, gradient, buttonVariant, extraOption, noButton, onAction, buttonText }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isGradient = !!gradient;

    return (
        <div className="hover-card" style={{
            background: isGradient ? gradient : '#1e293b',
            borderRadius: '20px', padding: '1.5rem',
            border: isGradient ? 'none' : '1px solid #334155',
            boxShadow: isGradient ? '0 20px 40px -10px rgba(124, 58, 237, 0.5)' : 'none',
            position: 'relative', display: 'flex', flexDirection: 'column',
            zIndex: isGradient ? 2 : 1,
            height: '100%' // Ensure consistent height in Flex/Grid
        }}>
            {highlight && !isGradient && <div style={{
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                background: '#4f46e5', color: 'white', padding: '0.25rem 1rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700
            }}>{t('landing.pricing.most_popular')}</div>}

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: isGradient ? 'rgba(255,255,255,0.9)' : 'white', marginBottom: '0.25rem' }}>{title}</h3>
            <p style={{ fontSize: '0.9rem', color: isGradient ? 'rgba(255,255,255,0.7)' : '#94a3b8', marginBottom: '1rem' }}>{target}</p>

            {price && <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>{price}</span>
                {period && <span style={{ color: isGradient ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>{period}</span>}
            </div>}

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', flex: 1 }}>
                {features.map((feat, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem', color: isGradient ? 'white' : '#cbd5e1', fontSize: '0.9rem' }}>
                        <div style={{
                            background: isGradient ? 'rgba(255,255,255,0.2)' : 'rgba(79, 70, 229, 0.1)',
                            borderRadius: '50%', padding: '2px', display: 'flex'
                        }}>
                            <Check size={14} color={isGradient ? 'white' : '#4f46e5'} strokeWidth={3} />
                        </div>
                        {feat}
                    </li>
                ))}
            </ul>

            {extraOption && (
                <div style={{ marginBottom: '1rem' }}>
                    {extraOption}
                </div>
            )}

            {!noButton && <Button
                onClick={onAction}
                style={{
                    width: '100%', justifyContent: 'center', borderRadius: '12px', padding: '0.8rem',
                    background: isGradient ? 'white' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: isGradient ? '#7c3aed' : 'white',
                    fontWeight: 700
                }}
            >
                {buttonText || t('landing.pricing.choose_offer')}
            </Button>}
        </div>
    );
};

export default LandingPage;
