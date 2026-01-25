
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, AlertCircle, CheckCircle, Info, Camera, Plus, Trash2, Search, X, Wand2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LabelScanner from '../../components/camera/LabelScanner';
import { analyzeFeedLabel, getExpertRationAdvice } from '../../services/aiNutritionService'; // Import Service AI
import {
    ACTIVITY_LEVELS,
    PHYSIOLOGICAL_STATES,
    REFERENCE_FEEDS,
    calculateTotalNeeds,
    calculateForageAmount,
    calculateForageNutrition,
    calculateRationStats
} from '../../utils/nutritionCalculator';
import { getCurrentWeight } from '../../utils/weightEstimation';

function NutritionCalculator() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [horse, setHorse] = useState(null);
    const [currentWeight, setCurrentWeight] = useState(null);
    const [age, setAge] = useState(null); // Age state

    // Paramètres
    const [activityLevel, setActivityLevel] = useState('LOISIR_LEGER');
    const [physiologicalState, setPhysiologicalState] = useState('NORMAL');

    // Bloc A : Fourrage (Base)
    const [selectedForageId, setSelectedForageId] = useState('foin-prairie');

    // Bloc B : Ingrédients dynamiques
    const [rationIngredients, setRationIngredients] = useState([]);

    // Data transversale
    const [customFeeds, setCustomFeeds] = useState([]);
    const [allFeeds, setAllFeeds] = useState(REFERENCE_FEEDS);

    // Modale et UI
    const [showScanner, setShowScanner] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [stats, setStats] = useState(null);

    // Chargement initial
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        loadHorseData();
        loadCustomFeeds();
    }, [id]);

    useEffect(() => {
        setAllFeeds([...REFERENCE_FEEDS, ...customFeeds]);
    }, [customFeeds]);

    // Recalcul automatique à chaque changement
    useEffect(() => {
        if (currentWeight) {
            calculateStats();
        }
    }, [currentWeight, activityLevel, physiologicalState, selectedForageId, rationIngredients, allFeeds]);

    // Auto-Save Effect (Sauvegarde automatique du brouillon)
    useEffect(() => {
        if (!isLoaded || !horse) return;

        const saveDraft = () => {
            const horses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
            const updatedHorses = horses.map(h => {
                if (h.id.toString() === id.toString()) {
                    return {
                        ...h,
                        savedRation: {
                            ...h.savedRation,
                            forageId: selectedForageId,
                            ingredients: rationIngredients,
                            activityLevel: activityLevel,
                            physiologicalState: physiologicalState,
                            lastUpdated: new Date().toISOString()
                        }
                    };
                }
                return h;
            });
            localStorage.setItem('my_horses_v4', JSON.stringify(updatedHorses));
            // console.log("Auto-saved draft");
        };

        const timeoutId = setTimeout(saveDraft, 1000); // Debounce 1s
        return () => clearTimeout(timeoutId);

    }, [rationIngredients, selectedForageId, activityLevel, physiologicalState, isLoaded, horse, id]);


    function loadHorseData() {
        const horses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const currentHorse = horses.find(h => h.id.toString() === id.toString());

        if (currentHorse) {
            setHorse(currentHorse);
            const weight = getCurrentWeight(id);
            setCurrentWeight(weight);

            // Calculate Age if DOB exists
            if (currentHorse.birthDate) {
                const birth = new Date(currentHorse.birthDate);
                const now = new Date();
                const diffTime = Math.abs(now - birth);
                const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
                setAge(diffYears);
            } else {
                setAge(8); // Default
            }

            // Chargement de la ration sauvegardée si existante
            if (currentHorse.savedRation) {
                if (currentHorse.savedRation.forageId) {
                    setSelectedForageId(currentHorse.savedRation.forageId);
                }
                if (currentHorse.savedRation.ingredients) {
                    setRationIngredients(currentHorse.savedRation.ingredients);
                }
                // Restore settings
                if (currentHorse.savedRation.activityLevel) {
                    setActivityLevel(currentHorse.savedRation.activityLevel);
                }
                if (currentHorse.savedRation.physiologicalState) {
                    setPhysiologicalState(currentHorse.savedRation.physiologicalState);
                }
            }
            setIsLoaded(true);
        }
    };

    function handleSaveRation() {
        try {
            // 1. Ask for Meal Frequency
            const mealsInput = prompt("Combien de repas par jour ? (2 ou 3)", "3");
            const mealsCount = parseInt(mealsInput) || 3;

            // 2. Prepare Dashboard Ration Strings
            const morning = [];
            const noon = [];
            const evening = [];
            const supplements = [];

            rationIngredients.forEach(item => {
                const isSupplement = item.feed.category === 'COMPLEMENT' || item.feed.category === 'MINERAL';
                const qty = parseFloat(item.quantity) || 0;
                const unit = item.unit || (item.feed.density ? 'L' : 'kg');
                const label = `${qty.toFixed(2)} ${unit} - ${item.feed.name}`; // e.g. "2.00 L - Granulés"

                if (isSupplement) {
                    supplements.push(label);
                } else {
                    // Split concentrates
                    const qtyPerMeal = qty / mealsCount;
                    const labelPerMeal = `${qtyPerMeal.toFixed(2)} ${unit} - ${item.feed.name}`;

                    if (mealsCount === 2) {
                        morning.push(labelPerMeal);
                        evening.push(labelPerMeal);
                    } else {
                        morning.push(labelPerMeal);
                        noon.push(labelPerMeal);
                        evening.push(labelPerMeal);
                    }
                }
            });

            const forageName = allFeeds.find(f => f.id === selectedForageId)?.name || "Foin";
            const forageKg = stats ? stats.forageInfo.kg : 0;
            const hayLabel = `${forageKg} kg - ${forageName} (Dont ${mealsCount === 2 ? (forageKg / 2).toFixed(1) : (forageKg / 3).toFixed(1)} kg/repas)`;


            const horses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
            const updatedHorses = horses.map(h => {
                if (h.id.toString() === id.toString()) {
                    return {
                        ...h,
                        // 1. Save Calculator State (Official Snapshot)
                        savedRation: {
                            forageId: selectedForageId,
                            ingredients: rationIngredients,
                            activityLevel: activityLevel,
                            physiologicalState: physiologicalState,
                            lastUpdated: new Date().toISOString()
                        },
                        // 2. Save Dashboard Display Ration (The "Fiche Ration" view)
                        ration: {
                            morning: morning,
                            noon: noon,
                            evening: evening,
                            supplements: supplements,
                            hay: [hayLabel]
                        }
                    };
                }
                return h;
            });
            localStorage.setItem('my_horses_v4', JSON.stringify(updatedHorses));
            alert(`✅ Ration enregistrée et divisée en ${mealsCount} repas !`);
        } catch (e) {
            console.error("Erreur sauvegarde", e);
            alert("Erreur lors de la sauvegarde.");
        }
    };

    if (!horse) return <div className="p-8 text-center">Chargement...</div>;

    function loadCustomFeeds() {
        // Charge from GLOBAL storage, not per horse
        const saved = localStorage.getItem('appHorse_customFeeds');
        if (saved) {
            setCustomFeeds(JSON.parse(saved));
        }
    };

    function calculateStats() {
        // 1. Besoins
        const needs = calculateTotalNeeds(currentWeight, activityLevel, physiologicalState);

        // 2. Fourrage
        const forageFeed = allFeeds.find(f => f.id === selectedForageId) || REFERENCE_FEEDS[0];
        // Quantité par défaut : 1.5% du poids
        const forageAmount = calculateForageAmount(currentWeight, 1.5);

        // On prépare l'objet forage enrichi pour le calcul
        const forageData = {
            kg: forageAmount.kgBrut,
            nutrition: calculateForageNutrition(forageAmount.kgBrut, forageFeed)
        };

        // 3. Calcul Stats Globales (Recalcul Dynamique)
        // On convertit tout en Kg pour le calculateur
        const ingredientsForCalc = rationIngredients.map(item => {
            // Si l'unité est 'L', on convertit en Kg selon la densité
            const isLiters = item.unit === 'L' || (!item.unit && item.feed.density);
            const qtyKg = isLiters ? (parseFloat(item.quantity) || 0) * (item.feed.density || 0.65) : (parseFloat(item.quantity) || 0);

            // On retourne une copie avec la quantité normalisée en KG pour le moteur de calcul
            return {
                ...item,
                quantity: qtyKg
            };
        });

        const result = calculateRationStats(needs, forageData, ingredientsForCalc);

        // Génération des conseils
        const advice = generateAdvice(result);

        setStats({
            ...result,
            forageInfo: {
                name: forageFeed.brand + ' ' + forageFeed.name,
                kg: forageAmount.kgBrut,
                nutrition: forageData.nutrition
            },
            advice
        });
    };

    function generateAdvice(stats) {
        const msgs = [];
        const { balance, needs } = stats;

        // Tolérance de 10%
        const toleranceUFC = needs.ufc * 0.1;
        const toleranceMADC = needs.madc * 0.1;

        // Check availability of adjustable concentrates
        const hasConcentrate = rationIngredients.some(i =>
            i.feed.category === 'GRANULE' || i.feed.category === 'CEREALE'
        );

        if (balance.ufc < -toleranceUFC) {
            msgs.push({
                type: 'warning',
                text: `Manque d'énergie (-${Math.abs(balance.ufc.toFixed(1))} UFC).`,
                details: "Augmentez le fourrage ou les concentrés.",
                canFix: hasConcentrate
            });
        } else if (balance.ufc > toleranceUFC) {
            msgs.push({ type: 'info', text: `Excès d'énergie (+${balance.ufc.toFixed(1)} UFC). Risque de prise de poids.` });
        }

        if (balance.madc < -toleranceMADC) {
            msgs.push({ type: 'warning', text: `Carence en protéines (-${Math.abs(balance.madc.toFixed(0))}g MADC). Ajoutez un correcteur (Luzerne, Soja) ou un CMV.` });
        }

        if (msgs.length === 0) {
            msgs.push({ type: 'success', text: "La ration est parfaitement équilibrée ! ✅" });
        }

        return msgs;
    };

    // --- Actions ---

    const handleFeedScanned = async (feedData) => {
        // Sauvegarder dans la lib perso GLOBALE
        const newFeed = {
            ...feedData,
            id: 'custom-' + Date.now(),
            isCustom: true
        };

        const updatedCustoms = [...customFeeds, newFeed];
        setCustomFeeds(updatedCustoms);
        localStorage.setItem('appHorse_customFeeds', JSON.stringify(updatedCustoms));

        // Ajouter directement à la ration
        addIngredientToRation(newFeed);
        setShowScanner(false);
    };

    const addIngredientToRation = (feed) => {
        // Calcul intelligent de la quantité par défaut
        let defaultQty = 1.0;
        // Détection de l'unité par défaut (L pour concentrés avec densité, Kg pour le reste)
        const defaultUnit = feed.density ? 'L' : 'kg';

        // Est-ce un complément minéral ? 
        const isSupplement = feed.category === 'MINERAL' || feed.category === 'COMPLEMENT' ||
            (feed.ufc === 0) ||
            feed.name.toLowerCase().includes('cmv') ||
            feed.name.toLowerCase().includes('myco') ||
            feed.name.toLowerCase().includes('levure');

        if (isSupplement) {
            // Règle générique : environ 20g pour 100kg de PV
            const weight = currentWeight || 500;
            // Calcul en KG
            defaultQty = parseFloat(((weight / 100) * 0.025).toFixed(3));
            // Si l'unité est L (cas rare pour CMV mais possible si liquide/densité), convertir
            if (defaultUnit === 'L' && feed.density) {
                defaultQty = defaultQty / feed.density;
            }
        } else {
            // C'est un concentré énergétique
            // On regarde s'il y a un déficit énergétique à combler
            if (stats && stats.balance.ufc < -0.5) {
                const ufcPerKg = feed.ufc || 0.85;
                const neededKg = Math.abs(stats.balance.ufc) / ufcPerKg;
                // Plafonné à 2kg par repas
                const cappedKg = Math.min(neededKg, 2.0);

                // Conversion dans l'unité d'affichage
                defaultQty = defaultUnit === 'L' ? (cappedKg / (feed.density || 0.65)) : cappedKg;
                defaultQty = parseFloat(defaultQty.toFixed(1));
            } else {
                defaultQty = 1.0; // Valeur par défaut standard (1L ou 1kg)
            }
        }

        const newIngredient = {
            id: Date.now(),
            feed: feed,
            quantity: defaultQty,
            unit: defaultUnit
        };
        setRationIngredients([...rationIngredients, newIngredient]);
        setShowAddMenu(false);
    };

    const removeIngredient = (uniqueId) => {
        setRationIngredients(prev => prev.filter(item => item.id !== uniqueId));
    };

    const updateIngredientQuantity = (uniqueId, newQty) => {
        // newQty is the Raw User Input (Liters or Kg)
        setRationIngredients(prev => prev.map(item => {
            if (item.id === uniqueId) {
                return { ...item, quantity: parseFloat(newQty) || 0 };
            }
            return item;
        }));
    };

    const updateIngredientDensity = (uniqueId, newDensity) => {
        setRationIngredients(prev => prev.map(item => {
            if (item.id === uniqueId) {
                // Update the feed object locally within the ration item
                return { ...item, feed: { ...item.feed, density: parseFloat(newDensity) || 0.65 } };
            }
            return item;
        }));
    };
    const handleAutoBalance = () => {
        if (!stats) return;

        // 1. Identify Main Concentrate (First Granule/Cereale)
        const mainConcentrate = rationIngredients.find(i =>
            i.feed.category === 'GRANULE' || i.feed.category === 'CEREALE'
        );

        if (!mainConcentrate) {
            alert("Veuillez ajouter un concentré (Granulés ou Céréales) à la ration pour utiliser l'équilibrage automatique.");
            return;
        }

        // 2. Calculate Gap to Fill (UFC)
        const { needs } = stats;
        const totalUFC = needs.ufc;

        // Sum of Forage + Supplements (everything EXCEPT the Main Concentrate)
        const forageUFC = stats.forageInfo.nutrition.ufc;
        let othersUFC = 0;

        rationIngredients.forEach(item => {
            if (item.id !== mainConcentrate.id) {
                const qtyKg = parseFloat(item.quantity) || 0;
                const ufcPerKg = item.feed.ufc || 0;
                othersUFC += qtyKg * ufcPerKg;
            }
        });

        // The Gap (Total needed from concentrate)
        const ufcGap = totalUFC - (forageUFC + othersUFC);

        // Current Contribution of Main Concentrate
        // helpful to know if we are adding or removing
        const currentQtyRaw = parseFloat(mainConcentrate.quantity) || 0;
        const isLiters = mainConcentrate.unit === 'L' || (!mainConcentrate.unit && mainConcentrate.feed.density);
        const density = mainConcentrate.feed.density || 0.65;

        const currentQtyKg = isLiters ? (currentQtyRaw * density) : currentQtyRaw;
        const currentUFC = currentQtyKg * (mainConcentrate.feed.ufc || 0.85);

        if (ufcGap <= 0.1) {
            // Case: Energy needs are fully met by forage + supplements alone.
            // We should propose removing the concentrate entirely if it's currently used.
            if (currentQtyKg > 0.05) {
                if (confirm(`Les besoins sont couverts par le reste de la ration. Voulez-vous supprimer ${mainConcentrate.feed.name} ?`)) {
                    updateIngredientQuantity(mainConcentrate.id, 0);
                }
            } else {
                alert("Les besoins énergétiques sont déjà couverts !");
            }
            return;
        }

        // 3. Solve for Main Concentrate Quantity (in Kg needed)
        const concentrateUFCPerKg = mainConcentrate.feed.ufc || 0.85;
        const kgNeeded = ufcGap / concentrateUFCPerKg;

        // 4. Update (Convert Kg back to Unit if needed)
        // The new quantity to set in the state (Raw Value)
        const newQtyRaw = isLiters ? (kgNeeded / density) : kgNeeded;
        const litersDisplay = kgNeeded / density;

        const diffKg = kgNeeded - currentQtyKg;

        // Update state with the Raw Value
        setRationIngredients(prev => prev.map(item => {
            if (item.id === mainConcentrate.id) {
                return { ...item, quantity: parseFloat(newQtyRaw.toFixed(2)) };
            }
            return item;
        }));

        // 5. Feedback
        if (Math.abs(diffKg) < 0.05) {
            alert(`La ration est déjà équilibrée à ${litersDisplay.toFixed(1)} L !`);
        } else {
            const action = diffKg > 0 ? "Augmentation" : "Diminution";
            alert(`✅ ${action} du concentré à ${litersDisplay.toFixed(1)} L (${kgNeeded.toFixed(2)} kg) pour combler 100% des besoins.`);
        }
    };



    // --- AI Expert Analysis ---
    const handleAIExpertAnalysis = async () => {
        const profile = {
            weight: currentWeight,
            age: age,
            type: horse?.breed || 'Selle Français', // Fallback
            physiological_status: physiologicalState,
            workload: activityLevel
        };

        // Gather all available feeds (scanned + reference)
        const feeds = [
            ...allFeeds.map(f => ({ name: f.name, brand: f.brand, ufc: f.ufc, madc: f.madc, category: f.category }))
        ];

        try {
            alert("🧠 L'IA analyse votre cheval et votre stock... Patientez...");
            const analysis = await getExpertRationAdvice(profile, feeds);
            console.log("AI Analysis:", analysis);

            // Format result for display (simple alert or console for now, ideally a modal)
            let msg = `🔎 ANALYSE EXPERT INRA :\n\n`;
            msg += `Besoins Cibles : ${analysis.analysis.needs_ufc} UFC / ${analysis.analysis.needs_madc} g MADC\n`;
            msg += `Commentaire: ${analysis.analysis.status_comment}\n\n`;
            msg += `📋 PROPOSITION :\n`;
            analysis.proposed_ration.forEach(r => {
                msg += `- ${r.feed_name}: ${r.qty_kg} kg (${r.role})\n`;
            });
            if (analysis.warnings && analysis.warnings.length > 0) {
                msg += `\n⚠️ ATTENTION :\n${analysis.warnings.join('\n')}`;
            }

            alert(msg);

            // Optional: Ask to apply quantities? (Complex because we need to match feed names)

        } catch (e) {
            console.error(e);
            alert("Erreur lors de l'analyse experte.");
        }
    };

    if (!horse) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

            {/* Header Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button onClick={() => navigate(`/horses/${id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{ marginLeft: '0.5rem' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Calculateur de Ration</h1>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{horse.name} • {currentWeight || '?'} kg • {age ? `${age} ans` : 'Age inconnu'}</p>
                </div>
            </div>

            {/* Profile Config Bar */}
            <Card style={{ marginBottom: '1.5rem', background: '#f8fafc' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Stade Physiologique Selector */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                            Stade Physiologique
                        </label>
                        <select
                            value={physiologicalState}
                            onChange={(e) => setPhysiologicalState(e.target.value)}
                            style={{
                                width: '100%', padding: '0.6rem', borderRadius: '8px',
                                border: '1px solid #cbd5e1', background: 'white',
                                color: '#1e293b' // Force dark text
                            }}
                        >
                            {Object.values(PHYSIOLOGICAL_STATES).map(state => (
                                <option key={state.code} value={state.code}>{state.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Activity/Discipline Selector */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                            Discipline / Travail
                        </label>
                        <select
                            value={activityLevel}
                            onChange={(e) => setActivityLevel(e.target.value)}
                            style={{
                                width: '100%', padding: '0.6rem', borderRadius: '8px',
                                border: '1px solid #cbd5e1', background: 'white',
                                color: '#1e293b' // Force dark text
                            }}
                        >
                            {Object.values(ACTIVITY_LEVELS).map(level => (
                                <option key={level.code} value={level.code}>{level.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Jauge Résultat + Conseils IA */}
            {stats && (
                <>
                    <Card style={{ marginBottom: '1rem', background: '#1e293b', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>UFC (Énergie)</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stats.balance.ufc >= 0 ? '#4ade80' : '#f87171' }}>
                                    {stats.totals.ufc.toFixed(2)} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ {stats.needs.ufc}</span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>MADC (Protéines)</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stats.balance.madc >= 0 ? '#4ade80' : '#f87171' }}>
                                    {stats.totals.madc.toFixed(0)} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ {stats.needs.madc}</span>
                                </div>
                            </div>
                        </div>
                        {/* Barres de progression */}
                        <div style={{ marginBottom: '0.5rem' }}>
                            <div style={{ height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(stats.percent.ufc, 100)}%`, height: '100%', background: stats.percent.ufc >= 100 ? '#4ade80' : '#facc15', transition: 'width 0.5s' }} />
                            </div>
                        </div>
                    </Card>

                    {/* Conseils IA */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        {stats.advice.map((msg, i) => (
                            <div key={i} style={{
                                padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem',
                                background: msg.type === 'success' ? '#dcfce7' : msg.type === 'info' ? '#dbeafe' : '#fee2e2',
                                color: msg.type === 'success' ? '#166534' : msg.type === 'info' ? '#1e40af' : '#991b1b',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                    <span>
                                        <strong>{msg.text}</strong> {msg.details && <span style={{ opacity: 0.8 }}> {msg.details}</span>}
                                    </span>
                                </div>
                                {msg.canFix && (
                                    <Button
                                        onClick={handleAutoBalance}
                                        size="sm"
                                        style={{
                                            background: '#991b1b', color: 'white', border: 'none',
                                            fontSize: '0.75rem', padding: '0.25rem 0.5rem', height: 'auto',
                                            display: 'flex', gap: '0.25rem'
                                        }}
                                    >
                                        <Wand2 size={12} /> Ajuster
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Bloc A : Fourrage (Fixe) */}
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                🌾 Fourrage (Base)
            </h3>
            <Card style={{ marginBottom: '1.5rem', borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <select
                            value={selectedForageId}
                            onChange={(e) => setSelectedForageId(e.target.value)}
                            style={{
                                width: '100%', padding: '0.5rem', borderRadius: '6px',
                                border: '1px solid #e2e8f0', fontWeight: '500',
                                background: 'white', color: '#1e293b' // Force White Bg & Dark Text
                            }}
                        >
                            {allFeeds.filter(f => f.category === 'FOURRAGE').map(f => (
                                <option key={f.id} value={f.id}>{f.brand} {f.name}</option>
                            ))}
                        </select>
                        {stats && (
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                Calculé: {stats.forageInfo.kg} kg ({stats.forageInfo.nutrition.ufc} UFC)
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Bloc B : Bol Alimentaire (Dynamique) */}
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                🥣 Bol Alimentaire
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {rationIngredients.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
                        Aucun aliment ajouté
                    </div>
                ) : (
                    rationIngredients.map((item) => (
                        <Card key={item.id} style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {/* Icone / Type */}
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '8px',
                                background: item.feed.category === 'GRANULE' ? '#fef3c7' : '#dbeafe',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.2rem'
                            }}>
                                {item.feed.category === 'GRANULE' ? '⚡' : '💊'}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600' }}>{item.feed.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.feed.brand}</div>
                            </div>

                            {/* Input Qty */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ position: 'relative' }}>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            // DISPLAY: Raw value from state
                                            value={item.quantity}
                                            onChange={(e) => updateIngredientQuantity(item.id, e.target.value)}
                                            style={{
                                                width: '90px', padding: '0.5rem', borderRadius: '8px',
                                                border: '2px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem',
                                                color: '#1e293b'
                                            }}
                                        />
                                        <span style={{
                                            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                                            fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600'
                                        }}>
                                            {item.unit || (item.feed.density ? 'L' : 'kg')}
                                        </span>
                                    </div>
                                </div>

                                {/* Secondary Info: Weight & Density */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                    {/* Calculated Weight Display if Unit is L */}
                                    {(item.unit === 'L' || (!item.unit && item.feed.density)) && (
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                                            Soit <strong>{(parseFloat(item.quantity || 0) * (item.feed.density || 0.65)).toFixed(2)} kg</strong>
                                        </div>
                                    )}

                                    {/* Editable Density */}
                                    <div
                                        style={{ fontSize: '0.7rem', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        title="Modifier la densité pour ajuster le calcul Poids/Volume"
                                        onClick={() => {
                                            const newD = prompt("Densité du produit (kg/L) ?", item.feed.density || 0.65);
                                            if (newD) updateIngredientDensity(item.id, newD);
                                        }}
                                    >
                                        Densité: {item.feed.density || 0.65} <Search size={10} />
                                    </div>
                                </div>
                            </div>

                            {/* Delete */}
                            <button
                                onClick={() => removeIngredient(item.id)}
                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                            >
                                <X size={20} />
                            </button>
                        </Card>
                    ))
                )}
            </div>

            {/* Bloc C : Actions */}

            {/* Bouton d'auto-équilibrage prioritaire */}
            {rationIngredients.length > 0 && stats && (
                <div style={{ marginBottom: '1rem' }}>
                    <Button
                        onClick={handleAutoBalance}
                        variant="secondary"
                        style={{
                            width: '100%', padding: '1rem',
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', // Gradient Gradient
                            color: 'white', border: 'none',
                            display: 'flex', justifyContent: 'center', gap: '0.5rem',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                            fontSize: '1.2rem', fontWeight: 'bold'
                        }}
                    >
                        <Wand2 size={24} /> ✨ Équilibrer la ration
                    </Button>
                    <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                        Ajuste automatiquement le concentré
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                        Ajuste automatiquement le concentré
                    </div>
                </div>
            )}

            {/* AI Advisor Button */}
            <div style={{ marginBottom: '1.5rem' }}>
                <Button
                    onClick={handleAIExpertAnalysis}
                    variant="secondary"
                    style={{
                        width: '100%', padding: '0.8rem',
                        background: '#f1f5f9', color: '#475569',
                        border: '1px solid #cbd5e1',
                        display: 'flex', justifyContent: 'center', gap: '0.5rem'
                    }}
                >
                    🧠 Analyse Expert INRA & Conseils (IA)
                </Button>
            </div>

            {!showAddMenu ? (
                <Button
                    onClick={() => setShowAddMenu(true)}
                    variant="primary"
                    style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={24} /> Ajouter un aliment
                </Button>
            ) : (
                <Card style={{ background: '#f8fafc', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0, color: '#1e293b' }}>Ajouter un produit</h4>
                        <button onClick={() => setShowAddMenu(false)} style={{ color: '#64748b' }}><X size={20} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Button
                            onClick={() => { setShowScanner(true); setShowAddMenu(false); }}
                            style={{ height: '80px', flexDirection: 'column', gap: '0.5rem', background: 'white', color: 'black', border: '1px solid #e2e8f0' }}
                        >
                            <Camera size={24} color="#6366f1" />
                            Scanner une étiquette
                        </Button>
                        <Button
                            disabled
                            style={{ height: '80px', flexDirection: 'column', gap: '0.5rem', background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0', cursor: 'not-allowed' }}
                        >
                            <Search size={24} color="#94a3b8" />
                            Rechercher (Bientôt)
                        </Button>
                    </div>

                    {/* Liste de sélection rapide */}
                    <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                            Mes Scans & Favoris
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                            {allFeeds.filter(f => f.category !== 'FOURRAGE').map(feed => (
                                <div
                                    key={feed.id}
                                    onClick={() => addIngredientToRation(feed)}
                                    style={{
                                        padding: '0.75rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0',
                                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        color: '#1e293b' // force dark text
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{feed.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{feed.brand} • {feed.ufc} UFC</div>
                                    </div>
                                    <div style={{ color: '#4f46e5' }}><Plus size={16} /></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            )}


            {/* Bouton de sauvegarde final */}
            <div style={{ marginTop: '2rem' }}>
                <Button onClick={handleSaveRation} variant="primary" style={{ width: '100%', padding: '1rem', background: '#0f172a' }}>
                    💾 Enregistrer cette ration
                </Button>
            </div>

            {/* Scanner Modal */}
            {
                showScanner && (
                    <LabelScanner
                        onFeedScanned={handleFeedScanned}
                        onClose={() => setShowScanner(false)}
                    />
                )
            }

        </div >
    );
}

export default NutritionCalculator;
