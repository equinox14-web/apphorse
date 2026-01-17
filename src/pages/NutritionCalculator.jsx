import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, AlertCircle, CheckCircle, Info, Camera } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import LabelScanner from '../components/LabelScanner';
import {
    ACTIVITY_LEVELS,
    PHYSIOLOGICAL_STATES,
    REFERENCE_FEEDS,
    generateRation,
} from '../utils/nutritionCalculator';
import { getCurrentWeight } from '../utils/weightEstimation';

function NutritionCalculator() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [horse, setHorse] = useState(null);
    const [currentWeight, setCurrentWeight] = useState(null);

    // Paramètres de la ration
    const [activityLevel, setActivityLevel] = useState('LOISIR_LEGER');
    const [physiologicalState, setPhysiologicalState] = useState('NORMAL');
    const [selectedForage, setSelectedForage] = useState('foin-prairie');
    const [selectedConcentrate, setSelectedConcentrate] = useState('reverdy-adult');

    // Résultats
    const [ration, setRation] = useState(null);
    const [loading, setLoading] = useState(false);

    // Scanner d'étiquettes
    const [showScanner, setShowScanner] = useState(false);
    const [customFeeds, setCustomFeeds] = useState([]);
    const [allFeeds, setAllFeeds] = useState(REFERENCE_FEEDS);

    useEffect(() => {
        loadHorseData();
        loadCustomFeeds();
    }, [id]);

    useEffect(() => {
        // Combiner aliments de référence + aliments scannés
        setAllFeeds([...REFERENCE_FEEDS, ...customFeeds]);
    }, [customFeeds]);

    const loadHorseData = () => {
        // Charger le cheval depuis localStorage
        const horses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const currentHorse = horses.find(h => h.id.toString() === id.toString());

        if (currentHorse) {
            setHorse(currentHorse);

            // Récupérer le poids actuel
            const weight = getCurrentWeight(id);
            setCurrentWeight(weight);
        }
    };

    const loadCustomFeeds = () => {
        const saved = localStorage.getItem(`customFeeds_${id}`);
        if (saved) {
            setCustomFeeds(JSON.parse(saved));
        }
    };

    const handleFeedScanned = (feed) => {
        const updated = [...customFeeds, feed];
        setCustomFeeds(updated);
        localStorage.setItem(`customFeeds_${id}`, JSON.stringify(updated));

        // Sélectionner automatiquement l'aliment scanné
        if (feed.category === 'FOURRAGE') {
            setSelectedForage(feed.id);
        } else {
            setSelectedConcentrate(feed.id);
        }
    };

    const handleCalculate = () => {
        if (!currentWeight) {
            alert('Poids non disponible. Veuillez effectuer une pesée d\'abord.');
            return;
        }

        setLoading(true);
        setRation(null); // Reset des résultats précédents

        // Trouver les aliments sélectionnés
        const forage = allFeeds.find(f => f.id === selectedForage);
        const concentrate = allFeeds.find(f => f.id === selectedConcentrate);

        // Générer la ration
        setTimeout(() => {
            try {
                console.log('Calcul de la ration pour un poids de', currentWeight, 'kg');
                const result = generateRation(
                    currentWeight,
                    activityLevel,
                    physiologicalState,
                    forage,
                    concentrate
                );
                console.log('Résultat du calcul:', result);
                setRation(result);
                setLoading(false);
            } catch (error) {
                console.error('Erreur lors du calcul de la ration:', error);
                alert(`Erreur: ${error.message}`);
                setLoading(false);
            }
        }, 500);
    };

    if (!horse) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                Chargement...
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate(`/horses/${id}`)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '2rem' }}>
                        <Calculator size={32} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        Calculateur de Ration - {horse.name}
                    </h1>
                    <p style={{ color: '#666', margin: '0.5rem 0 0 0' }}>
                        Ration personnalisée selon les normes INRA
                    </p>
                </div>
            </div>

            {/* Poids actuel */}
            <Card style={{ marginBottom: '2rem', background: 'var(--color-primary-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {currentWeight ? (
                        <>
                            <CheckCircle size={24} color="var(--color-primary)" />
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                                    Poids actuel: {currentWeight} kg
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                    Ration calculée pour ce poids
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={24} color="#ef4444" />
                            <div>
                                <div style={{ fontWeight: 'bold', color: '#ef4444' }}>
                                    Aucune pesée enregistrée
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                    Effectuez une pesée pour calculer la ration
                                </div>
                            </div>
                            <Button
                                onClick={() => navigate(`/horses/${id}/weight`)}
                                variant="primary"
                                style={{ marginLeft: 'auto' }}
                            >
                                Peser le cheval
                            </Button>
                        </>
                    )}
                </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Colonne gauche: Paramètres */}
                <div>
                    <Card style={{ marginBottom: '1rem' }}>
                        <h2 style={{ marginTop: 0 }}>🏃 Niveau d'Activité</h2>
                        <select
                            value={activityLevel}
                            onChange={(e) => setActivityLevel(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                fontSize: '1rem',
                            }}
                        >
                            {Object.values(ACTIVITY_LEVELS).map((level) => (
                                <option key={level.code} value={level.code}>
                                    {level.label} - {level.description}
                                </option>
                            ))}
                        </select>
                    </Card>

                    <Card style={{ marginBottom: '1rem' }}>
                        <h2 style={{ marginTop: 0 }}>🐴 État Physiologique</h2>
                        <select
                            value={physiologicalState}
                            onChange={(e) => setPhysiologicalState(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                fontSize: '1rem',
                            }}
                        >
                            {Object.values(PHYSIOLOGICAL_STATES).map((state) => (
                                <option key={state.code} value={state.code}>
                                    {state.label}
                                </option>
                            ))}
                        </select>
                    </Card>

                    <Card style={{ marginBottom: '1rem' }}>
                        <h2 style={{ marginTop: 0 }}>🌾 Fourrage</h2>
                        <select
                            value={selectedForage}
                            onChange={(e) => setSelectedForage(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                fontSize: '1rem',
                            }}
                        >
                            {allFeeds.filter(f => f.category === 'FOURRAGE').map((feed) => (
                                <option key={feed.id} value={feed.id}>
                                    {feed.brand} {feed.name} ({feed.ufc} UFC/kg)
                                    {feed.scannedAt && ' 📸'}
                                </option>
                            ))}
                        </select>
                    </Card>

                    <Card style={{ marginBottom: '1rem' }}>
                        <h2 style={{ marginTop: 0 }}>⚡ Concentré</h2>
                        <select
                            value={selectedConcentrate}
                            onChange={(e) => setSelectedConcentrate(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                fontSize: '1rem',
                            }}
                        >
                            {allFeeds.filter(f => f.category === 'GRANULE' || f.category === 'CEREALE').map((feed) => (
                                <option key={feed.id} value={feed.id}>
                                    {feed.brand} {feed.name} ({feed.ufc} UFC/kg)
                                    {feed.scannedAt && ' 📸'}
                                </option>
                            ))}
                        </select>
                    </Card>

                    <Button
                        onClick={() => setShowScanner(true)}
                        variant="secondary"
                        style={{ width: '100%', marginBottom: '1rem' }}
                    >
                        <Camera size={20} style={{ marginRight: '0.5rem' }} />
                        Scanner une étiquette
                    </Button>

                    <Button
                        onClick={handleCalculate}
                        variant="primary"
                        disabled={!currentWeight || loading}
                        style={{ width: '100%' }}
                    >
                        <Calculator size={20} style={{ marginRight: '0.5rem' }} />
                        {loading ? 'Calcul en cours...' : 'Calculer la Ration'}
                    </Button>
                </div>

                {/* Colonne droite: Résultats */}
                <div>
                    {ration ? (
                        <>
                            {/* Besoins */}
                            <Card style={{ marginBottom: '1rem' }}>
                                <h2 style={{ marginTop: 0 }}>📋 Besoins Nutritionnels</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                                            UFC (Énergie)
                                        </div>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                            {ration.needs.ufc}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                                            MADC (Protéines)
                                        </div>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                            {ration.needs.madc}g
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Ration */}
                            <Card style={{ marginBottom: '1rem' }}>
                                <h2 style={{ marginTop: 0 }}>🍽️ Ration Journalière</h2>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <div style={{ fontWeight: '500' }}>🌾 {ration.forage.name}</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                            {ration.forage.kg} kg
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                        ➜ {ration.forage.nutrition.ufc} UFC • {ration.forage.nutrition.madc}g MADC
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <div style={{ fontWeight: '500' }}>⚡ {ration.concentrate.name}</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                            {ration.concentrate.kg} kg ({ration.concentrate.liters}L)
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                        ➜ {ration.concentrate.nutrition.ufc} UFC • {ration.concentrate.nutrition.madc}g MADC
                                    </div>
                                </div>
                            </Card>

                            {/* Équilibre Minéral */}
                            <Card style={{ marginBottom: '1rem' }}>
                                <h2 style={{ marginTop: 0 }}>⚖️ Équilibre Minéral</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Calcium</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{ration.minerals.calcium}g</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Phosphore</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{ration.minerals.phosphore}g</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Ratio Ca:P</div>
                                        <div style={{
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold',
                                            color: ration.minerals.isBalanced ? '#10b981' : '#ef4444'
                                        }}>
                                            {ration.minerals.ratio}:1
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Avertissements */}
                            {ration.warnings.length > 0 && (
                                <Card>
                                    <h2 style={{ marginTop: 0 }}>⚠️ Recommandations</h2>
                                    {ration.warnings.map((warning, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                display: 'flex',
                                                gap: '0.75rem',
                                                padding: '1rem',
                                                background: warning.severity === 'warning' ? '#fef3c7' : '#dbeafe',
                                                borderRadius: '8px',
                                                marginBottom: '0.75rem',
                                            }}
                                        >
                                            {warning.severity === 'warning' ? (
                                                <AlertCircle size={20} color="#92400e" style={{ flexShrink: 0 }} />
                                            ) : (
                                                <Info size={20} color="#1e40af" style={{ flexShrink: 0 }} />
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                                                    {warning.message}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                                    💡 {warning.recommendation}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card style={{ textAlign: 'center', padding: '3rem' }}>
                            <Calculator size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p style={{ color: '#999', fontSize: '1.1rem' }}>
                                Configurez les paramètres et cliquez sur "Calculer la Ration"
                            </p>
                        </Card>
                    )}
                </div>
            </div>

            {/* Label Scanner Modal */}
            {showScanner && (
                <LabelScanner
                    onFeedScanned={handleFeedScanned}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}

export default NutritionCalculator;
