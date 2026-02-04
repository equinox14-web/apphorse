import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';

const Weather = () => {
    // Initialize with saved coords or default (Paris)
    const [coords, setCoords] = useState(() => {
        const saved = localStorage.getItem('weather_coords');
        return saved ? JSON.parse(saved) : { lat: 48.857, lon: 2.352 };
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Try geolocation with High Accuracy whenever component mounts
    useEffect(() => {
        if ("geolocation" in navigator) {
            // Don't show loading immediately if we have saved coords, just update in background
            if (!localStorage.getItem('weather_coords')) setLoading(true);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newCoords = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    };
                    setCoords(newCoords);
                    localStorage.setItem('weather_coords', JSON.stringify(newCoords));
                    setLoading(false);
                },
                (err) => {
                    console.log("Geo denied or error, keeping current coords.");
                    setLoading(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        }
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;

        setLoading(true);
        setError(null);
        try {
            // Using OpenStreetMap Nominatim for free geocoding
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const newCoords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
                setCoords(newCoords);
                localStorage.setItem('weather_coords', JSON.stringify(newCoords)); // Save preference
                setLoading(false);
            } else {
                setError("Ville introuvable. Essayez une autre orthographe.");
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError("Erreur de connexion lors de la recherche.");
            setLoading(false);
        }
    };

    const [weatherData, setWeatherData] = useState(null);

    // Fetch real weather data
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Open-Meteo API (Free, no key)
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&timezone=auto`);
                const data = await res.json();
                setWeatherData(data.current_weather);
            } catch (err) {
                console.error("Erreur météo:", err);
            }
        };
        fetchWeather();
    }, [coords]);

    const getRugAdvice = (temp) => {
        if (temp === undefined || temp === null) return { title: "Chargement...", text: "Chargement des données...", icon: "⏳" };

        if (temp >= 20) return {
            title: "Pas de couverture",
            text: `Il fait ${temp}°C. Attention aux coups de chaleur et aux insectes. Masque anti-mouches recommandé.`,
            icon: "☀️",
            color: "#eab308"
        };
        if (temp >= 15) return {
            title: "Léger ou Rien",
            text: `Il fait ${temp}°C. Rien pour les non-tondus. Chemise coton ou nid d'abeille pour les tondus/sensibles.`,
            icon: "🌤️",
            color: "#84cc16"
        };
        if (temp >= 10) return {
            title: "Imper 0g - 100g",
            text: `Il fait ${temp}°C. Imperméable simple (0g) pour protéger de la pluie/vent. 100g si cheval tondu.`,
            icon: "🌦️",
            color: "#22c55e"
        };
        if (temp >= 5) return {
            title: "Couverture 200g",
            text: `Il fait ${temp}°C. Une couverture moyenne (150-200g) est nécessaire pour maintenir le confort.`,
            icon: "🧥",
            color: "#3b82f6"
        };
        if (temp >= 0) return {
            title: "Chaud (300g)",
            text: `Il fait ${temp}°C. Sortez les couvertures chaudes (300g). Ajoutez un couvre-cou si venté.`,
            icon: "❄️",
            color: "#6366f1"
        };
        return {
            title: "Grand Froid (400g+)",
            text: `Il fait ${temp}°C. Couverture intégrale lourde indispensable. Superposition (Under-rug) conseillée.`,
            icon: "🥶",
            color: "#a855f7"
        };
    };

    const rugAdvice = getRugAdvice(weatherData?.temperature);

    const getTrainingAdvice = (weatherCode, temp) => {
        if (weatherCode === undefined || weatherCode === null) return { title: "Chargement...", text: "Analyse des conditions...", icon: "⏳" };

        // Thunderstorm (Code 95, 96, 99)
        if (weatherCode >= 95) return {
            title: "DANGER / Orage",
            text: "Risque d'orage important. Restez aux écuries ou en manège fermé. Évitez les zones boisées.",
            icon: "⚡",
            color: "#ef4444"
        };

        // Snow (Code 71, 73, 75, 77, 85, 86)
        if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)) return {
            title: "Neige / Sol Glissant",
            text: "Sol potentiellement glissant ou profond. Privilégiez le manège. Si extérieur : crampons et pas uniquement.",
            icon: "❄️",
            color: "#3b82f6"
        };

        // Heavy Rain (Code 63, 65, 81, 82)
        if ([63, 65, 81, 82].includes(weatherCode)) return {
            title: "Manège Recommandé",
            text: "Fortes pluies. Les carrières risquent d'être détrempées et glissantes. Travail à l'abri conseillé.",
            icon: "🌧️",
            color: "#0ea5e9"
        };

        // Light Rain / Drizzle (Code 51, 53, 55, 61, 80)
        if ([51, 53, 55, 61, 80].includes(weatherCode)) return {
            title: "Terrain Souple",
            text: "Pluie modérée. Le sol peut être bon mais surveillez les zones glissantes. Imperméable pour le cavalier !",
            icon: "🌦️",
            color: "#06b6d4"
        };

        // Fog (Code 45, 48)
        if ([45, 48].includes(weatherCode)) return {
            title: "Visibilité Réduite",
            text: "Brouillard. Si vous sortez en extérieur, portez des vêtements réfléchissants. Carrière OK.",
            icon: "🌫️",
            color: "#6b7280"
        };

        // Extreme Heat (> 30°C)
        if (temp >= 30) return {
            title: "Forte Chaleur",
            text: "Canicule. Travaillez très tôt ou tard le soir. Privilégiez les balades ombragées au pas. Hydratez bien.",
            icon: "🔥",
            color: "#f97316"
        };

        // Clear Sky / Clouds (0, 1, 2, 3) - Default Good
        return {
            title: "Conditions Idéales",
            text: "Le temps est calme. Profitez-en pour une séance intensive, un trotting ou un travail sur le plat en extérieur.",
            icon: "🐎",
            color: "#22c55e"
        };
    };

    const trainingAdvice = getTrainingAdvice(weatherData?.weathercode, weatherData?.temperature);

    const mapSrc = `https://embed.windy.com/embed2.html?lat=${coords.lat}&lon=${coords.lon}&detailLat=${coords.lat}&detailLon=${coords.lon}&width=800&height=500&zoom=10&level=surface&overlay=rain&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`;

    return (
        <div className="animate-fade-in" style={{ padding: '1rem' }}>


            {/* Search Bar */}
            <form onSubmit={handleSearch} style={{ maxWidth: '800px', margin: '0 auto 1.5rem', display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    placeholder="Entrez votre ville (ex: Saumur)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        fontSize: '1rem',
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        backdropFilter: 'blur(10px)'
                    }}
                />
                <button
                    type="submit"
                    style={{
                        padding: '0 1.5rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                    disabled={loading}
                >
                    {loading ? '...' : 'modifier'}
                </button>
            </form>

            {error && (
                <div style={{ maxWidth: '800px', margin: '0 auto 1rem', padding: '0.75rem', background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', borderRadius: '8px', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}

            <Card style={{
                maxWidth: '800px',
                height: '500px',
                margin: '0 auto',
                padding: 0,
                overflow: 'hidden',
                position: 'relative',
                borderRadius: 'var(--radius-lg)'
            }}>
                <iframe
                    width="100%"
                    height="100%"
                    src={mapSrc}
                    frameBorder="0"
                    title="Windy Weather Radar"
                    style={{ display: 'block' }}
                ></iframe>
            </Card>

            <p style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '2rem', color: 'var(--color-text-muted)' }}>
                Visualisation des précipitations selon votre position.
            </p>

            {/* Weather Advice Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>

                <Card title="Conseil Couverture (En direct)">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{
                            flexShrink: 0,
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: rugAdvice.color ? `${rugAdvice.color}20` : 'rgba(0,0,0,0.05)',
                            color: rugAdvice.color || 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem'
                        }}>
                            {rugAdvice.icon}
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 600, color: rugAdvice.color || 'inherit' }}>{rugAdvice.title}</h4>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                {rugAdvice.text}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card title="Conseil Entraînement (En direct)">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{
                            flexShrink: 0,
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: trainingAdvice.color ? `${trainingAdvice.color}20` : 'rgba(0,0,0,0.05)',
                            color: trainingAdvice.color || 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem'
                        }}>
                            {trainingAdvice.icon}
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 600, color: trainingAdvice.color || 'inherit' }}>{trainingAdvice.title}</h4>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                {trainingAdvice.text}
                            </p>
                        </div>
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default Weather;
