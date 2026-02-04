import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { CloudSun, Activity, Plus, MapPin, Heart, Crown, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { canAccess, getMaxHorses } from '../utils/permissions';
import AdBanner from '../components/features/AdBanner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import InstallAppCard from '../components/pwa/InstallAppCard';

// Custom Horse Icon
const HorseIcon = ({ size = 24, ...props }) => (
    <span style={{ fontSize: size, lineHeight: 1, display: 'inline-block', fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"', ...props.style }} {...props}>🐴</span>
);

const StatCard = ({ label, value, icon: IconOrUrl, subtext, onClick }) => {
    const isImage = typeof IconOrUrl === 'string';

    return (
        <Card onClick={onClick} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.2s, box-shadow 0.2s' }} className={onClick ? "hover-card" : ""}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(221, 161, 94, 0.15)', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px' }}>
                    {isImage ? (
                        <img src={IconOrUrl} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                    ) : (
                        IconOrUrl ? <IconOrUrl size={24} style={{ strokeWidth: 2.5 }} /> : null
                    )}
                </div>
                {subtext && <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{subtext}</span>}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>{value}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{label}</div>
        </Card>
    );
};

const getDayOfWeekNumber = (dayName) => {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days.findIndex(d => d.toLowerCase() === dayName.toLowerCase());
};

const getNextDateForDay = (refDate, dayOfWeek) => {
    if (dayOfWeek === -1) return null;
    const resultDate = new Date(refDate);
    const currentDay = resultDate.getDay();
    let distance = dayOfWeek - currentDay;
    if (distance < 0) distance += 7;
    resultDate.setDate(resultDate.getDate() + distance);
    return resultDate;
};

const Dashboard = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { userProfile } = useAuth(); // Get profile
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null); // Pour la modale de détail
    const [locationName, setLocationName] = useState('...');
    const [refreshLoc, setRefreshLoc] = useState(0); // Trigger pour forcer la re-localisation

    // ... (keep useEffect for loadEvents and fetchCity same place or above, they don't depend on userProfile usually)
    // Actually I can jump to the stats effect.

    // Insert userProfile destructuring at start of component if I haven't. I need to match StartLine.
    // I will rewrite the component start to be safe.

    useEffect(() => {
        // Load Events Logic
        const loadEvents = () => {
            // ... existing logic ...
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const savedCare = localStorage.getItem('appHorse_careItems_v3');
            let careEvents = [];
            if (savedCare) {
                careEvents = JSON.parse(savedCare).map(item => ({
                    id: `care-${item.id}`,
                    title: `${item.name} (${item.horse})`,
                    date: new Date(item.date),
                    type: 'care',
                    subtype: item.type, // Pass specific type (vaccins, vermifuges, etc.)
                    details: 'Soin Vétérinaire'
                }));
            }

            const savedCustom = localStorage.getItem('appHorse_customEvents');
            let customEvents = [];
            if (savedCustom) {
                customEvents = JSON.parse(savedCustom).map(evt => ({
                    ...evt,
                    date: new Date(evt.dateStr)
                }));
            }

            // MODIFICATION: On ne met PLUS les soins dans les "Activités à venir"
            // On garde uniquement les événements personnalisés (cours, concours, etc.) et l'IA

            // 3. AI Training Plans
            let aiEvents = [];
            try {
                const savedAIPlans = JSON.parse(localStorage.getItem('ai_training_plans') || '[]');
                savedAIPlans.forEach((planData, planIndex) => {
                    if (planData.plan && planData.plan.weeklySchedule) {
                        planData.plan.weeklySchedule.forEach((session, sessionIndex) => {
                            if (session.day && session.sessionName) {
                                const dayOfWeek = getDayOfWeekNumber(session.day);
                                const targetDate = getNextDateForDay(now, dayOfWeek);

                                if (targetDate && targetDate >= now) {
                                    // Set time to morning or arbitrary logic if needed, but date obj is enough
                                    aiEvents.push({
                                        id: `ai-plan-${planIndex}-${sessionIndex}`,
                                        title: `🤖 ${session.sessionName}`,
                                        date: targetDate,
                                        type: 'training',
                                        details: `${session.intensity} • ${session.duration} (${planData.horseName || 'Cheval'})`,
                                        description: session.exercises || session.tips || '' // Ajouter la description/conseils
                                    });
                                }
                            }
                        });
                    }
                });
            } catch (err) {
                console.error("Error loading AI plans in dashboard", err);
            }

            const all = [...customEvents, ...aiEvents]
                .filter(e => e.date >= now)
                .sort((a, b) => a.date - b.date)
                .slice(0, 5);

            setUpcomingEvents(all);
        };
        loadEvents();
    }, []);

    const [weatherData, setWeatherData] = useState(null);

    // Unified Location & Weather Logic
    useEffect(() => {
        const fetchAllData = async (lat, lon) => {
            // 1. Fetch City Name
            try {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`);
                const data = await response.json();
                const city = data.city || data.locality || data.principalSubdivision || "Ma Position";
                const country = data.countryCode === 'FR' ? 'FR' : data.countryCode;
                setLocationName(country ? `${city}, ${country}` : city);
            } catch (err) {
                console.warn("Erreur reverse geo:", err);
                if (locationName === '...') setLocationName("Ville inconnue");
            }

            // 2. Fetch Weather
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`);
                const data = await res.json();
                setWeatherData(data.current_weather);
            } catch (err) {
                console.error("Erreur météo dashboard:", err);
            }
        };

        const savedCoords = localStorage.getItem('weather_coords');

        // If we have saved coords, load them immediately for speed
        if (savedCoords) {
            const { lat, lon } = JSON.parse(savedCoords);
            fetchAllData(lat, lon);
        }

        // Always try to refresh with high accuracy if possible
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;

                    // Update LocalStorage with precise data
                    localStorage.setItem('weather_coords', JSON.stringify({ lat, lon }));

                    // Refresh data with new precise location
                    fetchAllData(lat, lon);
                },
                (error) => {
                    console.warn("Geolocation error:", error);
                    // If no saved coords and error, default to Paris
                    if (!savedCoords) {
                        setLocationName("Paris (Défaut)");
                        fetchAllData(48.857, 2.352);
                    }
                },
                {
                    enableHighAccuracy: false, // Plus rapide et suffisant pour la météo
                    timeout: 5000,
                    maximumAge: 600000 // 10 minutes
                }
            );
        } else if (!savedCoords) {
            // No geo support and no saved data -> Default Paris
            setLocationName("Paris (Défaut)");
            setLocationName("Paris (Défaut)");
            fetchAllData(48.857, 2.352);
        }
    }, [refreshLoc]);

    const [stats, setStats] = useState({ horses: 0, mares: 0, cares: 0, activeAlerts: [] });

    useEffect(() => {
        const savedHorses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const savedMares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');
        const savedCare = JSON.parse(localStorage.getItem('appHorse_careItems_v3') || '[]');

        // Filter upcoming care (ALL future cares, not just next 7 days)
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Ignore time part for today comparison

        let upcomingCare = savedCare.filter(item => {
            const careDate = new Date(item.date);
            return careDate >= now; // Show ALL future care events
        }).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date

        // Enrichir avec l'ID du cheval pour la navigation
        upcomingCare = upcomingCare.map(care => {
            // Essayer de trouver l'ID du cheval correspondant par son nom
            // Note: C'est une approximation si les noms ne sont pas uniques, mais c'est le mieux qu'on puisse faire avec les données actuelles
            const horseObj = savedHorses.find(h => h.name === care.horse);
            return {
                ...care,
                horseId: horseObj ? horseObj.id : null
            };
        });

        // Respect User Notification Settings
        if (userProfile?.notifications?.careAlerts === false) {
            upcomingCare = [];
        }

        setStats({
            horses: savedHorses.length,
            mares: savedMares.length,
            cares: savedCare.length,
            activeAlerts: upcomingCare
        });
    }, [userProfile]); // Refresh when profile loads/updates

    const userPlans = JSON.parse(localStorage.getItem('subscriptionPlan') || '[]');
    const isBreederOnly = userPlans.includes('eleveur');

    let upsellData = null;
    if (userPlans.includes('decouverte')) {
        upsellData = {
            title: t('dashboard_page.upsell.passion_title'),
            desc: t('dashboard_page.upsell.passion_desc'),
            gradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
            btnColor: "#be185d",
            shadow: "rgba(236, 72, 153, 0.4)",
            icon: Crown
        };
    }

    const getWeatherIcon = (code) => {
        if (code >= 95) return <CloudSun size={48} color="#ef4444" />; // Thunder
        if (code >= 71) return <CloudSun size={48} color="#3b82f6" />; // Snow
        if (code >= 61) return <CloudSun size={48} color="#0ea5e9" />; // Rain
        if (code >= 51) return <CloudSun size={48} color="#06b6d4" />; // Drizzle
        if (code >= 45) return <CloudSun size={48} color="#6b7280" />; // Fog
        if (code >= 3) return <CloudSun size={48} color="#9ca3af" />; // Cloudy/Overcast
        if (code >= 1) return <CloudSun size={48} color="#f59e0b" />; // Partly cloudy
        return <CloudSun size={48} color="#fcd34d" />; // Clear
    };

    const getWeatherCondition = (code) => {
        if (code >= 95) return t('dashboard_page.weather.thunder');
        if (code >= 71) return t('dashboard_page.weather.snow');
        if (code >= 61) return t('dashboard_page.weather.rain');
        if (code >= 51) return t('dashboard_page.weather.drizzle');
        if (code >= 45) return t('dashboard_page.weather.fog');
        if (code >= 3) return t('dashboard_page.weather.cloudy');
        if (code >= 1) return t('dashboard_page.weather.partly_cloudy');
        return t('dashboard_page.weather.sunny');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <SEO title={`${t('page_titles.dashboard')} - Equinox`} description="Vue d'ensemble de vos activités équestres et suivi de vos chevaux sur Equinox." noIndex={true} />
            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                {!isBreederOnly && (
                    <StatCard
                        icon="/icons/cheval.png"
                        value={stats.horses}
                        label={t('dashboard_page.stats.horses')}
                        onClick={() => navigate('/horses')}
                    />
                )}

                {canAccess('breeding') && (
                    <StatCard
                        icon="/icons/coeur.png"
                        value={stats.mares}
                        label={t('dashboard_page.stats.breeding_horses')}
                        onClick={() => navigate('/breeding')}
                    />
                )}

                <StatCard icon="/icons/stetoscope.png" value={stats.cares} label={t('dashboard_page.stats.planned_care')} subtext={t('dashboard_page.stats.total')} onClick={() => navigate('/health')} />
                <Card onClick={() => navigate('/weather')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} className="hover:scale-[1.02]">
                    <div>
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', cursor: 'help' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Voulez-vous redétecter votre position actuelle ?\nAssurez-vous d'autoriser l'accès à la localisation.")) {
                                    localStorage.removeItem('weather_coords');
                                    setLocationName("Détection...");
                                    setRefreshLoc(n => n + 1);
                                }
                            }}
                            title="Cliquez pour redétecter la localisation"
                        >
                            <MapPin size={14} /> {locationName}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {weatherData ? `${weatherData.temperature}°C` : '--°C'}
                        </div>
                        <p style={{ color: 'var(--color-text-muted)' }}>
                            {weatherData ? getWeatherCondition(weatherData.weathercode) : t('dashboard_page.weather.loading')}
                        </p>
                    </div>
                    {weatherData ? getWeatherIcon(weatherData.weathercode) : <CloudSun size={48} style={{ opacity: 0.5 }} />}
                </Card>
            </div>

            {/* Install App Banner (Visible on Mobile & Desktop if not installed) */}
            <InstallAppCard />

            <div className="dashboard-grid">
                {/* Main Content Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card title={t('dashboard_page.activities.title')} style={{ minHeight: '300px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {upcomingEvents.length === 0 && (
                                <div style={{ color: '#999', fontStyle: 'italic', padding: '1rem' }}>{t('dashboard_page.activities.empty')}</div>
                            )}
                            {upcomingEvents.map((evt) => (
                                <div key={evt.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.5)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgba(0,0,0,0.03)'
                                }}>
                                    <div style={{
                                        width: '4px', height: '40px',
                                        background: (() => {
                                            if (evt.type === 'care') {
                                                switch (evt.subtype) {
                                                    case 'vaccins': return '#3b82f6'; // Bleu
                                                    case 'vermifuges': return '#22c55e'; // Vert
                                                    case 'marechal': return '#f59e0b'; // Orange
                                                    case 'osteo': return '#a855f7'; // Violet
                                                    default: return '#0891b2'; // Cyan par défaut
                                                }
                                            }
                                            if (evt.type === 'training') return '#8b5cf6'; // Violet IA
                                            return evt.type === 'stable' ? '#722ed1' : 'var(--color-primary)';
                                        })(),
                                        borderRadius: '2px', marginRight: '1rem'
                                    }}></div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '1rem', margin: 0 }}>{evt.title}</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0 0' }}>
                                            {evt.date.toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })}
                                            {evt.date.getHours() ? ` • ${evt.date.getHours()}h${String(evt.date.getMinutes()).padStart(2, '0')}` : ''}
                                            {evt.details ? ` • ${evt.details}` : ''}
                                        </p>
                                    </div>
                                    <Button variant="secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => setSelectedEvent(evt)}>
                                        Voir
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Side Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {canAccess('alerts') && (
                        <Card title={t('dashboard_page.alerts.title')} accent={true} onClick={() => navigate('/health')} style={{ cursor: 'pointer' }} className="hover:scale-[1.02]">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {stats.activeAlerts && stats.activeAlerts.length > 0 ? (
                                    stats.activeAlerts.slice(0, 5).map((care, idx) => {
                                        // Format date
                                        const careDate = new Date(care.date);
                                        const formattedDate = careDate.toLocaleDateString(i18n.language, {
                                            weekday: 'short',
                                            day: 'numeric',
                                            month: 'short'
                                        });

                                        // Get type icon/emoji based on care.type and care.name
                                        const getIcon = () => {
                                            // First check type
                                            if (care.type === 'vaccins') return '💉';
                                            if (care.type === 'vermifuges') return '💊';
                                            if (care.type === 'marechal') return '🔨';
                                            if (care.type === 'osteo') {
                                                // Check name for dentiste
                                                if (care.name && care.name.toLowerCase().includes('dentiste')) return '🦷';
                                                return '🤲';
                                            }
                                            // Fallback: check name for veto/vet keywords
                                            if (care.name && (care.name.toLowerCase().includes('veto') || care.name.toLowerCase().includes('vétérinaire'))) return '🩺';
                                            return '📋';
                                        };
                                        const icon = getIcon();

                                        return (
                                            <div
                                                key={idx}
                                                style={{
                                                    padding: '0.5rem 0',
                                                    borderBottom: idx < 4 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                                                    cursor: care.horseId ? 'pointer' : 'default',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                className={care.horseId ? "hover:bg-black/5 rounded px-2 -mx-2" : ""}
                                                onClick={(e) => {
                                                    if (care.horseId) {
                                                        e.stopPropagation();
                                                        navigate(`/horses/${care.horseId}`);
                                                    }
                                                }}
                                                title={care.horseId ? "Voir la fiche du cheval" : ""}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                    <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                                                    <div style={{ fontWeight: '600' }}>{care.horse}</div>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginLeft: '1.7rem' }}>
                                                    {care.name} • {formattedDate}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ padding: '1rem 0', color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                                        {t('dashboard_page.alerts.empty')}
                                    </div>
                                )}
                            </div>
                            <Button style={{ marginTop: '1rem', width: '100%' }} onClick={(e) => { e.stopPropagation(); navigate('/health?tab=overview'); }}>
                                Voir tous les soins
                            </Button>
                        </Card>
                    )}

                    {upsellData && (
                        <Card style={{
                            background: upsellData.gradient,
                            color: 'white',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: `0 10px 25px -5px ${upsellData.shadow}`
                        }}>
                            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />

                            <h3 style={{ color: 'white', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                                <upsellData.icon size={22} fill="rgba(255,255,255,0.2)" /> {upsellData.title}
                            </h3>
                            <p style={{ fontSize: '0.9rem', opacity: 0.95, marginBottom: '1.5rem', lineHeight: 1.5, position: 'relative', zIndex: 1 }}>
                                {upsellData.desc}
                            </p>
                            <button
                                onClick={() => navigate('/settings')}
                                style={{
                                    background: 'white',
                                    color: upsellData.btnColor,
                                    padding: '0.8rem 1.5rem',
                                    borderRadius: 'var(--radius-full)',
                                    fontWeight: '700',
                                    width: '100%',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    position: 'relative', zIndex: 1
                                }}
                            >
                                {t('dashboard_page.upsell.discover', { plan: upsellData.title.replace('Offre ', '').replace('Plan ', '') })}
                            </button>
                        </Card>
                    )}

                    {/* Extra Ad for Free Plans ONLY (Not Passion or any paid plan) */}
                    {(userPlans.includes('decouverte') && !userPlans.includes('passion')) && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <AdBanner />
                        </div>
                    )}
                </div>
            </div>
            {/* Event Detail Modal */}
            {selectedEvent && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.2)', zIndex: 9999, // Fond plus léger
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(3px)'
                }} onClick={() => setSelectedEvent(null)}>
                    <Card style={{ width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{selectedEvent.title}</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={16} />
                            {selectedEvent.date.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{selectedEvent.details}</div>
                        </div>

                        {selectedEvent.description && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Description / Exercices</div>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{selectedEvent.description}</div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button onClick={() => setSelectedEvent(null)}>Fermer</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
