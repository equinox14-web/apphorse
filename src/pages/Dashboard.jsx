import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { CloudSun, Activity, Plus, MapPin, Heart, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { canAccess, getMaxHorses } from '../utils/permissions';
import AdBanner from '../components/AdBanner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import InstallAppCard from '../components/InstallAppCard';

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

const Dashboard = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { userProfile } = useAuth(); // Get profile
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [locationName, setLocationName] = useState('...');

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

            const all = [...careEvents, ...customEvents]
                .filter(e => e.date >= now)
                .sort((a, b) => a.date - b.date)
                .slice(0, 5);

            setUpcomingEvents(all);
        };
        loadEvents();
    }, []);

    useEffect(() => {
        const fetchCity = async (lat, lon) => {
            try {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`);
                const data = await response.json();
                const city = data.city || data.locality || data.principalSubdivision || "Ma Position";
                const country = data.countryCode === 'FR' ? 'FR' : data.countryCode;
                setLocationName(country ? `${city}, ${country}` : city);
            } catch (err) {
                // setLocationName('Paris, FR'); // Keep ... or default
            }
        };

        const savedCoords = localStorage.getItem('weather_coords');
        if (savedCoords) {
            const { lat, lon } = JSON.parse(savedCoords);
            fetchCity(lat, lon);
        } else if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchCity(position.coords.latitude, position.coords.longitude);
                    localStorage.setItem('weather_coords', JSON.stringify({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    }));
                },
                () => setLocationName('Paris, FR')
            );
        } else {
            // Let it be ...
        }
    }, []);

    const [stats, setStats] = useState({ horses: 0, mares: 0, cares: 0, activeAlerts: [] });

    useEffect(() => {
        const savedHorses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const savedMares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');
        const savedCare = JSON.parse(localStorage.getItem('appHorse_careItems_v3') || '[]');

        // Filter alerts (Urgent or Warning)
        let activeAlerts = savedCare.filter(i => i.status === 'urgent' || i.status === 'warning');

        // Respect User Notification Settings
        if (userProfile?.notifications?.careAlerts === false) {
            activeAlerts = [];
        }

        setStats({
            horses: savedHorses.length,
            mares: savedMares.length,
            cares: savedCare.length,
            activeAlerts: activeAlerts
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

    const [weatherData, setWeatherData] = useState(null);

    // Weather Fetching Logic (Same as Weather.jsx)
    useEffect(() => {
        const fetchWeather = async () => {
            const savedCoords = localStorage.getItem('weather_coords');
            let lat = 48.857, lon = 2.352;

            if (savedCoords) {
                const c = JSON.parse(savedCoords);
                lat = c.lat;
                lon = c.lon;
            } else if ("geolocation" in navigator) {
                // Try to get current pos if no saved preference
                navigator.geolocation.getCurrentPosition(
                    (p) => {
                        lat = p.coords.latitude;
                        lon = p.coords.longitude;
                        // Don't save strictly here to avoid loop, let the main effect handle it, 
                        // just use for this fetch
                        doFetch(lat, lon);
                    },
                    (e) => doFetch(lat, lon) // Fallback Paris
                );
                return;
            }

            doFetch(lat, lon);
        };

        const doFetch = async (lat, lon) => {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`);
                const data = await res.json();
                setWeatherData(data.current_weather);
            } catch (err) {
                console.error("Erreur météo dashboard:", err);
            }
        };

        fetchWeather();
    }, []);

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

                <StatCard icon="/icons/stetoscope.png" value={stats.cares} label={t('dashboard_page.stats.planned_care')} subtext={t('dashboard_page.stats.total')} onClick={() => navigate('/care')} />
                <Card onClick={() => navigate('/weather')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} className="hover:scale-[1.02]">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                            <MapPin size={14} /> {locationName}
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', lineHeight: 1 }}>
                            {weatherData ? `${weatherData.temperature}°C` : '...'}
                        </h3>
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
                                    <Button variant="secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => navigate('/calendar')}>
                                        {t('dashboard_page.activities.see')}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Side Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {canAccess('alerts') && (
                        <Card title={t('dashboard_page.alerts.title')} accent={true} onClick={() => navigate('/care')} style={{ cursor: 'pointer' }} className="hover:scale-[1.02]">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {stats.activeAlerts && stats.activeAlerts.length > 0 ? (
                                    stats.activeAlerts.slice(0, 3).map((alert, idx) => (
                                        <div key={idx} style={{ padding: '0.5rem 0', borderBottom: idx < 2 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                                            <div style={{ fontWeight: '600' }}>{alert.horse}</div>
                                            <div style={{ fontSize: '0.9rem', color: alert.status === 'urgent' ? '#ff4d4f' : 'var(--color-accent)' }}>
                                                {alert.name} - {alert.daysLeft < 0 ? t('dashboard_page.alerts.late', { days: Math.abs(alert.daysLeft) }) : t('dashboard_page.alerts.days_left', { days: alert.daysLeft })}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '1rem 0', color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                                        {t('dashboard_page.alerts.empty')}
                                    </div>
                                )}
                            </div>
                            <Button style={{ marginTop: '1rem', width: '100%' }} onClick={(e) => { e.stopPropagation(); navigate('/care'); }}>
                                {t('dashboard_page.alerts.see_health_record')}
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

                    {/* Extra Ad for Free Plans */}
                    {(userPlans.includes('decouverte') || userPlans.includes('eleveur_amateur_free')) && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <AdBanner />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
