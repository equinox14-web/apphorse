import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import { MapPin } from 'lucide-react';

const Weather = () => {
    // Initialize with saved coords or default (Paris)
    // Initialize with saved coords, NO DEFAULT PARIS to force user awareness if not found
    const [coords, setCoords] = useState(() => {
        const saved = localStorage.getItem('weather_coords');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchIpLocation = async () => {
        try {
            const res = await fetch('https://ipapi.co/json/');
            if (!res.ok) throw new Error('IP API failed');
            const data = await res.json();
            if (data.latitude && data.longitude) {
                const newCoords = { lat: data.latitude, lon: data.longitude };
                setCoords(newCoords);
                localStorage.setItem('weather_coords', JSON.stringify(newCoords));
                setLoading(false);
                return true;
            }
        } catch (err) {
            console.error("IP Geoloc failed", err);
            return false;
        }
    };

    const handleGeolocation = React.useCallback(() => {
        if (!("geolocation" in navigator)) {
            setError("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
        }

        setLoading(true);
        setError(null);
        setSearchQuery("");
        setCoords(null); // Force UI to show "Searching..." state

        const options = {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
        };

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
                console.error(err);
                if (err.code === 1) { // PERMISSION_DENIED
                    setError("⚠️ Localisation bloquée. Cliquez sur le cadenas 🔒 dans la barre d'adresse pour autoriser la localisation, puis réessayez.");
                } else if (err.code === 2) { // POSITION_UNAVAILABLE
                    setError("Position indisponible. Votre appareil ne parvient pas à vous localiser.");
                } else if (err.code === 3) { // TIMEOUT
                    setError("Le délai d'attente est dépassé. Réessayez dans une zone mieux couverte.");
                } else {
                    setError("Erreur inconnue lors de la localisation.");
                }
                setLoading(false);
            },
            options
        );
    }, []);

    // Try geolocation ONLY if we have no saved coords on mount
    useEffect(() => {
        if ("geolocation" in navigator && !localStorage.getItem('weather_coords')) {
            handleGeolocation();
        }
    }, [handleGeolocation]);

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
        if (!coords) return; // Wait for coords
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

    const mapSrc = coords ? `https://embed.windy.com/embed2.html?lat=${coords.lat}&lon=${coords.lon}&detailLat=${coords.lat}&detailLon=${coords.lon}&width=800&height=500&zoom=10&level=surface&overlay=rain&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1` : "";

    return (
        <div className="animate-fade-in" style={{ padding: '1rem' }}>


            {/* Search Bar */}
            {/* Search Bar */}
            <div className="max-w-3xl mx-auto mb-6">
                {!coords && loading && (
                    <div className="text-center mb-4 text-primary font-semibold">
                        <span className="jumping-dots">📍 Recherche de votre position...</span>
                    </div>
                )}

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                    <button
                        type="button"
                        onClick={handleGeolocation}
                        title="Utiliser ma position"
                        disabled={loading}
                        className="p-3 rounded-lg bg-white/70 border border-black/5 hover:bg-white/90 transition-colors text-gray-500 flex items-center justify-center"
                    >
                        <MapPin size={20} />
                    </button>
                    <input
                        type="text"
                        placeholder="Entrez votre ville (ex: Saumur)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 p-3 rounded-lg border border-black/5 bg-white/70 backdrop-blur-md text-base"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-70"
                    >
                        {loading ? '...' : 'Modifier'}
                    </button>
                </form>
            </div>

            {error && (
                <div className="max-w-3xl mx-auto mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}

            <Card
                className="max-w-3xl mx-auto overflow-hidden rounded-xl h-[300px] sm:h-[500px]"
                style={{ padding: 0 }}
            >
                {coords ? (
                    <iframe
                        width="100%"
                        height="100%"
                        src={mapSrc}
                        frameBorder="0"
                        title="Windy Weather Radar"
                        className="block"
                    ></iframe>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                        <MapPin size={48} className="opacity-30" />
                        <p>En attente de localisation...</p>
                        <button
                            onClick={handleGeolocation}
                            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:opacity-90 transition"
                        >
                            Réessayer
                        </button>
                    </div>
                )}
            </Card>

            <p style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '2rem', color: 'var(--color-text-muted)' }}>
                Visualisation des précipitations selon votre position.
            </p>

            {/* Weather Advice Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

                <Card title="Conseil Couverture (En direct)">
                    <div className="flex items-start gap-4">
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
                            <p className="text-gray-500 text-sm leading-relaxed">
                                {rugAdvice.text}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card title="Conseil Entraînement (En direct)">
                    <div className="flex items-start gap-4">
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
                            <p className="text-gray-500 text-sm leading-relaxed">
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
