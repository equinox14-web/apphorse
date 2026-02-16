
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, AlertCircle, CheckCircle, Info, Camera, Plus, Trash2, Search, X, Wand2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ForageAnalysisScanner from '../../components/scanner/ForageAnalysisScanner'; // Import Scanner Foin
import LabelScanner from '../../components/camera/LabelScanner'; // Import Scanner Etiquette
import { analyzeFeedLabel, getExpertRationAdvice, searchFeedByName } from '../../services/aiNutritionService'; // Import Service AI

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
    const [selectedForageId, setSelectedForageId] = useState('foin-prairie-tardif');
    const [forageAnalysis, setForageAnalysis] = useState(null); // Données scannées
    const [showForageScanner, setShowForageScanner] = useState(false); // Modal scanner

    // Bloc B : Ingrédients dynamiques
    const [rationIngredients, setRationIngredients] = useState([]);

    // Data transversale
    const [customFeeds, setCustomFeeds] = useState([]);
    const [allFeeds, setAllFeeds] = useState(REFERENCE_FEEDS);

    // Modale et UI
    const [showScanner, setShowScanner] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showFeedInfo, setShowFeedInfo] = useState(false);
    const [selectedFeedInfo, setSelectedFeedInfo] = useState(null);
    const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
    const [duplicateFeed, setDuplicateFeed] = useState(null);
    const [showFeedPreview, setShowFeedPreview] = useState(false);
    const [previewFeed, setPreviewFeed] = useState(null);
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

    // --- States for Save Modal ---
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [recommendedMeals, setRecommendedMeals] = useState(3);
    const [userMealsChoice, setUserMealsChoice] = useState(3);

    // Helper de conversion (pour stats et auto-balance)
    const getQtyInKg = (item) => {
        let qty = parseFloat(item.quantity) || 0;
        const feed = item.feed || {};
        let density = parseFloat(feed.density) || 0.65;

        // 🧠 Correction Intelligente : Si densité > 10, c'est probablement des g/L (ex: 650), on convertit en kg/L
        if (density > 10) density = density / 1000;

        const scoopW = parseFloat(feed.scoopWeight) || 0;

        if (item.unit === 'L' || (!item.unit && feed.density)) {
            return qty * density;
        } else if (item.unit === 'g') {
            return qty / 1000;
        } else if (item.unit === 'dosette' || item.unit === 'mesure' || item.unit === 'D') {
            return scoopW > 0 ? (qty * scoopW) / 1000 : (qty * 25) / 1000;
        }
        return qty;
    };

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
            const rationData = {
                forageId: selectedForageId,
                ingredients: rationIngredients,
                activityLevel: activityLevel,
                physiologicalState: physiologicalState,
                lastUpdated: new Date().toISOString()
            };

            if (horse.source === 'breeding') {
                const mares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');
                const updatedMares = mares.map(m => m.id.toString() === id.toString() ? { ...m, savedRation: { ...(m.savedRation || {}), ...rationData } } : m);
                localStorage.setItem('appHorse_breeding_v2', JSON.stringify(updatedMares));
            } else {
                const horses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
                const updatedHorses = horses.map(h => {
                    if (h.id.toString() === id.toString()) {
                        return {
                            ...h,
                            savedRation: {
                                ...(h.savedRation || {}),
                                ...rationData
                            }
                        };
                    }
                    return h;
                });
                localStorage.setItem('my_horses_v4', JSON.stringify(updatedHorses));
            }
        };

        const timeoutId = setTimeout(saveDraft, 1000); // Debounce 1s
        return () => clearTimeout(timeoutId);

    }, [rationIngredients, selectedForageId, activityLevel, physiologicalState, isLoaded, horse, id]);


    function loadHorseData() {
        const idStr = id.toString();

        // 1. Try Main Stable
        const horses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        let currentHorse = horses.find(h => h.id.toString() === idStr);
        let source = 'stable';

        // 2. Try Breeding List if not found
        if (!currentHorse) {
            const mares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');
            currentHorse = mares.find(m => m.id.toString() === idStr);
            if (currentHorse) source = 'breeding';
        }

        if (currentHorse) {
            setHorse({ ...currentHorse, source });
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
                    // Migration: Force Litres pour les concentrés (MELANGE/CEREALE)
                    const migrated = currentHorse.savedRation.ingredients.map(item => {
                        const isConcentrate = item.feed.category === 'MELANGE' || item.feed.category === 'CEREALE';
                        if (isConcentrate && (item.unit === 'kg' || !item.unit)) {
                            const density = item.feed.density || 0.65;
                            return {
                                ...item,
                                unit: 'L',
                                quantity: parseFloat((item.quantity / density).toFixed(2))
                            };
                        }
                        return item;
                    });
                    setRationIngredients(migrated);
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

    const handleSaveClick = () => {
        if (!stats) return;
        const rec = (stats.mealAdvice && stats.mealAdvice.mealsCount) ? stats.mealAdvice.mealsCount : 3;
        setRecommendedMeals(rec);
        setUserMealsChoice(rec);
        setShowSaveModal(true);
    };

    // AI Search Handler
    const handleAISearch = async () => {
        if (!searchQuery.trim()) {
            alert('Veuillez entrer le nom d\'un aliment');
            return;
        }

        setIsSearching(true);

        try {
            const result = await searchFeedByName(searchQuery);

            if (result && result.notFound) {
                alert("Fiche technique officielle non trouvée pour cet aliment.\n\nPar sécurité, aucune valeur n'a été inventée. Veuillez utiliser le scanner (icône appareil photo) pour analyser l'étiquette de votre sac.");
                setIsSearching(false);
                return;
            }

            if (result && result.name) {
                // Créer un nouvel aliment personnalisé
                const newFeed = {
                    id: `ai-search-${Date.now()}`,
                    ...result,
                    source: 'ai_search',
                    dateAdded: new Date().toISOString()
                };

                // Nettoyage : Pour les aliments complets, on retire dailyDoseG pour forcer l'utilisation de litres
                if (newFeed.category === 'MELANGE' || newFeed.category === 'CEREALE') {
                    delete newFeed.dailyDoseG;
                    delete newFeed.daily_dose_g;
                    delete newFeed.scoopWeight;
                }

                // Afficher la prévisualisation pour validation
                setPreviewFeed(newFeed);
                setShowFeedPreview(true);
                setShowSearchModal(false);
                setSearchQuery('');
            } else {
                alert('Impossible de trouver les informations nutritionnelles pour cet aliment. Veuillez réessayer ou utiliser le scanner.');
            }
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            alert('Erreur lors de la recherche. Veuillez réessayer.');
        } finally {
            setIsSearching(false);
        }
    };

    const confirmAddFeed = () => {
        if (!previewFeed) return;

        // Sauvegarder dans la bibliothèque
        const updatedCustomFeeds = [...customFeeds, previewFeed];
        setCustomFeeds(updatedCustomFeeds);
        localStorage.setItem('appHorse_customFeeds', JSON.stringify(updatedCustomFeeds));

        // Ajouter directement à la ration
        addIngredientToRation(previewFeed);

        // Fermer le modal
        setShowFeedPreview(false);
        setPreviewFeed(null);
        alert(`Aliment "${previewFeed.name}" ajouté avec succès !`);
    };

    const executeSaveRation = (mealsCount) => {
        try {
            // 3. Prepare Dashboard Ration Strings
            const morning = [];
            const noon = [];
            const evening = [];
            const supplements = [];

            rationIngredients.forEach(item => {
                const isSupplement = item.feed.category === 'CMV';
                const qty = parseFloat(item.quantity) || 0;
                const unit = item.unit || (item.feed.density ? 'L' : 'kg');
                const label = `${qty.toFixed(2)} ${unit} - ${item.feed.name}`; // Label Total

                if (isSupplement) {
                    supplements.push(label);
                } else {
                    // Split concentrates
                    const qtyPerMeal = qty / mealsCount;
                    // Simplification de l'affichage : Retrait du "(x3)" inutile et format plus épuré
                    const labelPerMeal = `${qtyPerMeal.toFixed(2)} ${unit} • ${item.feed.name}`;

                    // Répartition Affichage Dashboard (Matin/Midi/Soir)
                    if (mealsCount === 1) {
                        morning.push(labelPerMeal);
                    } else if (mealsCount === 2) {
                        morning.push(labelPerMeal);
                        evening.push(labelPerMeal);
                    } else if (mealsCount === 3) {
                        morning.push(labelPerMeal);
                        noon.push(labelPerMeal);
                        evening.push(labelPerMeal);
                    } else {
                        morning.push(labelPerMeal);
                        noon.push(labelPerMeal);
                        evening.push(labelPerMeal);

                        // Garder cette info pour les 4+ repas car le dashboard n'a pas de colonne dédiée
                        if (mealsCount >= 4) evening.push(`+ ${mealsCount - 3} repas suppl.`);
                    }
                }
            });

            const forageName = allFeeds.find(f => f.id === selectedForageId)?.name || "Foin";
            const forageKg = stats ? stats.forageInfo.kg : 0;
            const hayPerMeal = (forageKg / mealsCount).toFixed(1);
            // Affichage foin simplifié sans parenthèses
            const hayLabel = `${forageKg} kg • ${forageName}`;


            // 🧠 Correction Sauvegarde : Gérer les juments d'élevage
            if (horse.source === 'breeding') {
                const mares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');
                const updatedMares = mares.map(m => {
                    if (m.id.toString() === id.toString()) {
                        return {
                            ...m,
                            savedRation: {
                                forageId: selectedForageId,
                                ingredients: rationIngredients,
                                activityLevel: activityLevel,
                                physiologicalState: physiologicalState,
                                lastUpdated: new Date().toISOString(),
                                mealsCount: mealsCount // Sauvegarde du vrai nombre
                            },
                            ration: {
                                morning: morning,
                                noon: noon,
                                evening: evening,
                                supplements: supplements,
                                hay: [hayLabel]
                            }
                        };
                    }
                    return m;
                });
                localStorage.setItem('appHorse_breeding_v2', JSON.stringify(updatedMares));
            } else {
                // Cas standard : Mes Chevaux
                const horses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
                const updatedHorses = horses.map(h => {
                    if (h.id.toString() === id.toString()) {
                        return {
                            ...h,
                            savedRation: {
                                forageId: selectedForageId,
                                ingredients: rationIngredients,
                                activityLevel: activityLevel,
                                physiologicalState: physiologicalState,
                                lastUpdated: new Date().toISOString(),
                                mealsCount: mealsCount
                            },
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
            }

            // Close Modal
            setShowSaveModal(false);

            // Redirection immédiate vers la page Rations avec le cheval sélectionné
            navigate('/rations', { state: { selectedHorseId: id } });

        } catch (e) {
            console.error("Erreur sauvegarde", e);
            alert("Erreur lors de la sauvegarde.");
        }
    };;

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
            const qtyKg = getQtyInKg(item);
            return {
                ...item,
                quantity: isNaN(qtyKg) ? 0 : qtyKg
            };
        });

        const result = calculateRationStats(needs, forageData, ingredientsForCalc, currentWeight || 500);

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
            i.feed.category === 'MELANGE' || i.feed.category === 'CEREALE'
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
        } else if (balance.madc > toleranceMADC) {
            msgs.push({ type: 'info', text: `Excès de protéines (+${balance.madc.toFixed(0)}g MADC).`, details: "Un léger excès est tolérable, mais surveillez pour éviter le gaspillage." });
        }

        if (msgs.length === 0) {
            msgs.push({ type: 'success', text: "La ration est parfaitement équilibrée ! ✅" });
        }

        return msgs;
    };

    // --- Actions ---

    const handleFeedScanned = async (feedData) => {
        // Vérifier si l'aliment existe déjà (par nom + marque)
        const existingFeed = customFeeds.find(f =>
            f.name.toLowerCase() === feedData.name.toLowerCase() &&
            f.brand.toLowerCase() === feedData.brand.toLowerCase()
        );

        if (existingFeed) {
            // L'aliment existe déjà, incrémenter le compteur d'utilisation
            const updatedCustoms = customFeeds.map(f => {
                if (f.id === existingFeed.id) {
                    return {
                        ...f,
                        usageCount: (f.usageCount || 0) + 1,
                        lastUsed: new Date().toISOString()
                    };
                }
                return f;
            });
            setCustomFeeds(updatedCustoms);
            localStorage.setItem('appHorse_customFeeds', JSON.stringify(updatedCustoms));

            // Ajouter à la ration
            addIngredientToRation(existingFeed);
            setShowScanner(false);
            return;
        }

        // Nouvel aliment : Sauvegarder dans la bibliothèque GLOBALE
        const newFeed = {
            ...feedData,
            id: 'custom-' + Date.now(),
            isCustom: true,
            scannedAt: new Date().toISOString(),
            usageCount: 1,
            lastUsed: new Date().toISOString()
        };

        // Nettoyage : Pour les aliments complets, on retire dailyDoseG pour forcer l'utilisation de litres
        if (newFeed.category === 'MELANGE' || newFeed.category === 'CEREALE') {
            delete newFeed.dailyDoseG;
            delete newFeed.daily_dose_g;
        }

        const updatedCustoms = [...customFeeds, newFeed];
        setCustomFeeds(updatedCustoms);
        localStorage.setItem('appHorse_customFeeds', JSON.stringify(updatedCustoms));

        // Ajouter directement à la ration
        addIngredientToRation(newFeed);
        setShowScanner(false);
    };

    const addIngredientToRation = (feed, skipDuplicateCheck = false) => {
        // Check for duplicates
        if (!skipDuplicateCheck) {
            const existingItem = rationIngredients.find(item =>
                item.feed.id === feed.id ||
                (item.feed.name.toLowerCase() === feed.name.toLowerCase() &&
                    item.feed.brand === feed.brand)
            );

            if (existingItem) {
                setDuplicateFeed(feed);
                setShowDuplicateWarning(true);
                return;
            }
        }

        // Calcul intelligent de la quantité par défaut
        let defaultQty = 1.0;
        let defaultUnit = feed.density ? 'L' : 'kg';

        // 1. Détection spéciale CMV (dosettes uniquement)
        if (feed.scoopWeight && feed.scoopWeight > 0 && feed.category === 'CMV') {
            defaultUnit = 'D'; // 'D' pour Dosette
            defaultQty = 1; // 1 mesurette par défaut
        }
        // 2. Aliments complets (MELANGE, CEREALE) = TOUJOURS en LITRES (norme française)
        else if (feed.category === 'MELANGE' || feed.category === 'CEREALE') {
            defaultUnit = 'L';
            if (!feed.density) feed.density = 0.65; // Valeur par défaut si manquante

            // On regarde s'il y a un déficit énergétique à combler
            if (stats && stats.balance.ufc < -0.5) {
                const ufcPerKg = feed.ufc || 0.85;
                const neededKg = Math.abs(stats.balance.ufc) / ufcPerKg;
                const maxKg = Math.min(neededKg, 2.0); // Plafonné à 2kg
                defaultQty = maxKg / (feed.density > 10 ? feed.density / 1000 : feed.density);
            } else {
                // Par défaut 1.5L pour un aliment complet
                defaultQty = 1.5;
            }
        }
        // 3. CMV sans dosette = utiliser dailyDoseG si présent
        else if (feed.dailyDoseG && feed.dailyDoseG > 0 && feed.category === 'CMV') {
            defaultUnit = 'g';
            defaultQty = feed.dailyDoseG;
        }
        else {
            // 4. Logique standard (CMV détecté par nom)
            const isSupplement = feed.category === 'CMV' ||
                (feed.ufc === 0) ||
                (feed.name || '').toLowerCase().includes('cmv') ||
                (feed.name || '').toLowerCase().includes('myco') ||
                (feed.name || '').toLowerCase().includes('levure');

            if (isSupplement) {
                // Si c'est un CMV sans dosage connu, on met une petite quantité
                const weight = currentWeight || 500;
                // Calcul théorique 25g/100kg = 125g pour 500kg
                const theoreticalKg = (weight / 100) * 0.025;

                if (feed.density) {
                    defaultQty = parseFloat(theoreticalKg.toFixed(3));
                    if (defaultUnit === 'L') defaultQty = defaultQty / feed.density;
                } else {
                    defaultQty = parseFloat(theoreticalKg.toFixed(3));
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
        }

        const newIngredient = {
            id: Date.now(),
            feed: feed,
            quantity: parseFloat(defaultQty.toFixed(2)),
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

    const deleteCustomFeed = (feedId, event) => {
        if (event) {
            event.stopPropagation(); // Prevent triggering addIngredientToRation
        }

        if (confirm('Voulez-vous vraiment supprimer cet aliment de votre bibliothèque ?')) {
            const updatedCustomFeeds = customFeeds.filter(f => f.id !== feedId);
            setCustomFeeds(updatedCustomFeeds);
            localStorage.setItem('appHorse_customFeeds', JSON.stringify(updatedCustomFeeds));

            // Also remove from ration if present
            setRationIngredients(prev => prev.filter(item => item.feed.id !== feedId));
        }
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

        // Fonction locale pour identifier un concentré énergétique ajustable
        const isConcentrate = (feed) => {
            if (feed.category === 'MELANGE' || feed.category === 'CEREALE') return true;
            if (feed.category === 'COMPLEMENT') {
                // Si UFC élevé (> 0.5) et pas explicitement minéral/vitamine
                const name = (feed.name || '').toLowerCase();
                const isCMV = name.includes('cmv') || name.includes('mineral') || name.includes('vitamine') || name.includes('bonutron');
                if (!isCMV && (feed.ufc || 0) > 0.5) return true;
            }
            return false;
        };

        // 1. Identifier les concentrés (ajustables)
        const concentrates = rationIngredients.filter(i => isConcentrate(i.feed));

        // Identifier les compléments fixes (CMV, etc) - tout ce qui n'est pas concentré ni fourrage
        const supplements = rationIngredients.filter(i =>
            !isConcentrate(i.feed) && i.feed.category !== 'FOURRAGE'
        );

        if (concentrates.length === 0) {
            alert("Veuillez ajouter au moins un concentré (Granulés ou Céréales) à la ration pour utiliser l'équilibrage automatique.");
            return;
        }

        // 2. Calculer le gap énergétique à combler
        const { needs } = stats;
        const totalUFCNeeded = needs.ufc;

        // Contribution du fourrage
        const forageUFC = stats.forageInfo.nutrition.ufc;

        // Contribution des compléments minéraux (ne pas les modifier)
        let supplementsUFC = 0;
        supplements.forEach(item => {
            const qtyKg = getQtyInKg(item);
            supplementsUFC += qtyKg * (item.feed.ufc || 0);
        });

        // Gap à combler par les concentrés
        const ufcGap = totalUFCNeeded - (forageUFC + supplementsUFC);

        console.log('📊 Équilibrage:', {
            totalNeeded: totalUFCNeeded,
            forage: forageUFC,
            supplements: supplementsUFC,
            gap: ufcGap
        });

        if (ufcGap <= 0.1) {
            alert("Les besoins énergétiques sont déjà couverts par le fourrage et les compléments !");
            return;
        }

        // Helper inverse pour obtenir la quantité brute (L, g, D) depuis Kg
        const getRawQtyFromKg = (kg, item) => {
            const feed = item.feed || {};
            let density = parseFloat(feed.density) || 0.65;

            // 🧠 Correction Intelligente : Si densité > 10, c'est probablement des g/L
            if (density > 10) density = density / 1000;

            const scoopW = parseFloat(feed.scoopWeight) || 0;

            // 🧠 Correction : Forcer Litres pour les concentrés
            const isConcProp = feed.category === 'MELANGE' || feed.category === 'CEREALE';
            if (item.unit === 'L' || isConcProp || (!item.unit && feed.density)) {
                return kg / density;
            } else if (item.unit === 'g') {
                return kg * 1000;
            } else if (item.unit === 'dosette' || item.unit === 'mesure' || item.unit === 'D') {
                return scoopW > 0 ? (kg * 1000) / scoopW : (kg * 1000) / 25;
            }
            return kg;
        };

        // 3. Stratégie d'équilibrage selon le nombre de concentrés
        if (concentrates.length === 1) {
            // CAS SIMPLE : Un seul concentré
            const concentrate = concentrates[0];
            const ufcPerKg = parseFloat(concentrate.feed.ufc) || 0.85;
            const kgNeeded = ufcGap / ufcPerKg;
            const newQtyRaw = getRawQtyFromKg(kgNeeded, concentrate);

            console.log('DEBUG SINGLE:', {
                name: concentrate.feed.name,
                ufcPerKg, gap: ufcGap, kgNeeded, newQtyRaw
            });

            if (isNaN(newQtyRaw) || !isFinite(newQtyRaw)) {
                console.error("Erreur calcul quantité:", newQtyRaw);
                return;
            }

            setRationIngredients(prev => prev.map(item => {
                if (item.id === concentrate.id) {
                    // UPDATE DIRECT: On met à jour la quantité brute
                    return { ...item, quantity: parseFloat(newQtyRaw.toFixed(2)) };
                }
                return item;
            }));

            console.log(`✅ ${concentrate.feed.name} ajusté automatiquement.`);

        } else {
            // CAS COMPLEXE : Plusieurs concentrés
            // Stratégie : Répartir proportionnellement selon les valeurs UFC de chaque aliment

            // Calculer la somme des UFC/kg de tous les concentrés
            const totalUFCPerKg = concentrates.reduce((sum, c) => sum + (c.feed.ufc || 0.85), 0);

            // Répartir le gap proportionnellement
            const updates = concentrates.map(concentrate => {
                const ufcPerKg = concentrate.feed.ufc || 0.85;
                const proportion = ufcPerKg / totalUFCPerKg;
                const ufcForThis = ufcGap * proportion;
                const kgNeeded = ufcForThis / ufcPerKg;
                const newQtyRaw = getRawQtyFromKg(kgNeeded, concentrate);

                return {
                    id: concentrate.id,
                    quantity: parseFloat(newQtyRaw.toFixed(2))
                };
            });

            console.log('DEBUG MULTIPLE:', updates);

            // Appliquer les mises à jour
            setRationIngredients(prev => prev.map(item => {
                const update = updates.find(u => u.id === item.id);
                if (update) {
                    return { ...item, quantity: update.quantity };
                }
                return item;
            }));
        }
        console.log("✅ Ration équilibrée avec succès.");
    };



    if (!horse) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div className="nutrition-calculator" style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
            <style>{`
                .nutrition-header { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
                .nutrition-header-title { margin-left: 0.5rem; }
                @media (max-width: 768px) {
                    .nutrition-calculator { padding: 0.75rem; }
                    .nutrition-header { flex-direction: column; align-items: flex-start; }
                    .nutrition-header-title { margin-left: 0; }
                    .nutrition-config-grid { grid-template-columns: 1fr !important; }
                    .nutrition-forage-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    .nutrition-add-grid { grid-template-columns: 1fr !important; }
                    .nutrition-ingredient-card { flex-direction: column !important; align-items: stretch !important; }
                    .nutrition-ingredient-actions { align-items: stretch !important; width: 100%; }
                    .nutrition-ingredient-qty { width: 100% !important; }
                    .nutrition-ingredient-qty input { width: 100% !important; }
                    .nutrition-inline-actions { flex-direction: column !important; align-items: stretch !important; gap: 0.5rem !important; }
                    .nutrition-inline-actions button { width: 100% !important; }
                    .nutrition-feed-info-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                }
                @media (max-width: 480px) {
                    .nutrition-forage-stats-grid { grid-template-columns: 1fr !important; }
                    .nutrition-feed-info-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>

            {/* Header Navigation */}
            <div className="nutrition-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button onClick={() => navigate(`/horses/${id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                    <ArrowLeft size={24} />
                </button>
                <div className="nutrition-header-title" style={{ marginLeft: '0.5rem' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Calculateur de Ration</h1>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{horse.name} • {currentWeight || '?'} kg • {age ? `${age} ans` : 'Age inconnu'}</p>
                </div>
            </div>

            {/* Profile Config Bar */}
            <Card style={{ marginBottom: '1.5rem', background: '#f8fafc' }}>
                <div className="nutrition-config-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Stade Physiologique Selector */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem', minHeight: '20px' }}>
                            Stade Physiologique
                        </label>
                        <select
                            value={physiologicalState}
                            onChange={(e) => setPhysiologicalState(e.target.value)}
                            style={{
                                width: '100%', padding: '0.6rem', borderRadius: '8px',
                                border: '1px solid #cbd5e1', background: 'white',
                                color: '#1e293b', // Force dark text
                                marginTop: 'auto'
                            }}
                        >
                            {Object.values(PHYSIOLOGICAL_STATES).map(state => (
                                <option key={state.code} value={state.code}>{state.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Activity/Discipline Selector */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem', minHeight: '20px' }}>
                            Discipline / Travail
                        </label>
                        <select
                            value={activityLevel}
                            onChange={(e) => setActivityLevel(e.target.value)}
                            style={{
                                width: '100%', padding: '0.6rem', borderRadius: '8px',
                                border: '1px solid #cbd5e1', background: 'white',
                                color: '#1e293b', // Force dark text
                                marginTop: 'auto'
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
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stats.percent.ufc >= 98 ? '#4ade80' : '#f87171' }}>
                                    {stats.totals.ufc.toFixed(2)} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ {stats.needs.ufc}</span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>MADC (Protéines)</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stats.percent.madc >= 98 ? '#4ade80' : '#f87171' }}>
                                    {stats.totals.madc.toFixed(0)} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ {stats.needs.madc}</span>
                                </div>
                            </div>
                        </div>
                        {/* Barres de progression */}
                        <div style={{ marginBottom: '0.5rem' }}>
                            <div style={{ height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(stats.percent.ufc, 100)}%`, height: '100%', background: stats.percent.ufc >= 98 ? '#4ade80' : '#facc15', transition: 'width 0.5s' }} />
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
                                <div className="nutrition-ingredient-qty" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center' }}>
                    🌾 Fourrage (Base)
                </h3>
                <Button
                    onClick={() => setShowForageScanner(true)}
                    variant="secondary"
                    size="sm"
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', display: 'flex', gap: '0.25rem' }}
                >
                    <Camera size={14} /> Scanner Analyse Labo
                </Button>
            </div>
            <Card style={{ marginBottom: '1.5rem', borderLeft: '4px solid #10b981' }}>
                {forageAnalysis && (
                    <div style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: '#10b981', color: 'white', padding: '0.25rem 0.5rem',
                        borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '0.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        zIndex: 10
                    }}>
                        <CheckCircle size={10} /> ANALYSE LABO ACTIVE
                        <button
                            onClick={() => setForageAnalysis(null)}
                            style={{ background: 'none', border: 'none', color: 'white', marginLeft: '0.5rem', cursor: 'pointer', padding: 0, display: 'flex' }}
                        >
                            <X size={12} />
                        </button>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Sélecteur (désactivé si analyse scannée) */}
                    <div>
                        <select
                            value={selectedForageId}
                            onChange={(e) => setSelectedForageId(e.target.value)}
                            disabled={!!forageAnalysis}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                border: forageAnalysis ? '1px solid #10b981' : '1px solid #e2e8f0',
                                fontWeight: '500', fontSize: '1rem',
                                background: forageAnalysis ? '#ecfdf5' : 'white',
                                color: '#1e293b',
                                opacity: forageAnalysis ? 0.7 : 1
                            }}
                        >
                            {allFeeds.filter(f => f.category === 'FOURRAGE').map(f => (
                                <option key={f.id} value={f.id}>{f.brand} {f.name}</option>
                            ))}
                        </select>
                        {forageAnalysis && (
                            <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontStyle: 'italic' }}>
                                <Info size={12} /> Utilisant les valeurs de l'analyse scannée
                            </div>
                        )}
                    </div>

                    {/* Détails Nutritionnels */}
                    {(() => {
                        const baseFeed = allFeeds.find(f => f.id === selectedForageId);
                        // Priorité à l'analyse scannée
                        const data = forageAnalysis ? {
                            ufc: forageAnalysis.ufc || forageAnalysis.ufc_per_kg_dm,
                            madc: forageAnalysis.madc || forageAnalysis.madc_per_kg_dm,
                            matiereSèche: forageAnalysis.matiereSèche || forageAnalysis.dry_matter_percent,
                            description: `Analyse Labo: ${forageAnalysis.quality_assessment || forageAnalysis.lab_name || 'Scan'}`
                        } : baseFeed;

                        if (!data) return null;

                        return (
                            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                                <div className="nutrition-forage-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <div style={{ textAlign: 'center', background: 'white', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>UFC/kg MS</div>
                                        <div style={{ fontWeight: 'bold', color: '#334155' }}>{data.ufc}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', background: 'white', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>MADC/kg MS</div>
                                        <div style={{ fontWeight: 'bold', color: '#334155' }}>{data.madc}g</div>
                                    </div>
                                    <div style={{ textAlign: 'center', background: 'white', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Matière Sèche</div>
                                        <div style={{ fontWeight: 'bold', color: (data.matiereSèche < 80) ? '#ef4444' : '#334155' }}>
                                            {data.matiereSèche}%
                                        </div>
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Info size={14} />
                                    <span>
                                        Correction MS : 10kg brut = <strong>{(10 * (data.matiereSèche / 100)).toFixed(1)}kg</strong> nutri réelle.
                                    </span>
                                </div>
                                {data.description && (
                                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.5rem', padding: '0.5rem', background: 'white', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                        📝 {data.description}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {stats && (
                        <div style={{ fontSize: '0.9rem', color: '#334155', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Apport calculé (1.5% poids):</span>
                            <strong>{stats.forageInfo.kg} kg Brut</strong>
                        </div>
                    )}
                </div>
            </Card>

            {showForageScanner && (
                <ForageAnalysisScanner
                    onAnalysisComplete={(data) => {
                        setForageAnalysis(data);
                        setShowForageScanner(false);
                    }}
                    onClose={() => setShowForageScanner(false)}
                />
            )}

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
                        <Card key={item.id} className="nutrition-ingredient-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {/* Icone / Type */}
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '8px',
                                background: item.feed.category === 'MELANGE' ? '#fef3c7' : '#dbeafe',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.2rem'
                            }}>
                                {item.feed.category === 'MELANGE' ? '⚡' : '💊'}
                            </div>

                            {/* Info */}
                            <div
                                style={{ flex: 1, cursor: 'pointer' }}
                                onClick={() => { setSelectedFeedInfo(item.feed); setShowFeedInfo(true); }}
                                title="Cliquer pour voir les détails"
                            >
                                <div style={{ fontWeight: '600' }}>{item.feed.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.feed.brand || 'Générique'}</div>
                                <div style={{ fontSize: '0.75rem', color: '#0ea5e9', marginTop: '2px' }}>ℹ️ Cliquer pour plus d'infos</div>
                            </div>

                            {/* Input Qty */}
                            <div className="nutrition-ingredient-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        // DISPLAY: Raw value from state
                                        value={item.quantity}
                                        onChange={(e) => updateIngredientQuantity(item.id, e.target.value)}
                                        style={{
                                            width: '80px', padding: '0.5rem', borderRadius: '8px',
                                            border: '2px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem',
                                            color: '#1e293b'
                                        }}
                                    />
                                    <span style={{
                                        fontSize: '0.9rem', color: '#475569', fontWeight: '600'
                                    }}>
                                        {item.unit === 'dosette' ? 'D' : (item.unit || ((item.feed.density || item.feed.category === 'MELANGE' || item.feed.category === 'CEREALE') ? 'L' : 'kg'))}
                                    </span>
                                </div>

                                {/* Secondary Info: Weight & Density */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                    {/* Calculated Weight Display if Unit is L */}
                                    {(item.unit === 'L' || (!item.unit && item.feed.density)) && (
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                                            Soit <strong>{(parseFloat(item.quantity || 0) * (item.feed.density > 10 ? item.feed.density / 1000 : (item.feed.density || 0.65))).toFixed(2)} kg</strong>
                                        </div>
                                    )}
                                    {/* Display for Dose/Scoop (D) */}
                                    {((item.unit === 'dosette' || item.unit === 'mesure' || item.unit === 'D') && item.feed.scoopWeight) && (
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                                            Soit <strong>{((parseFloat(item.quantity || 0) * item.feed.scoopWeight) / 1000).toFixed(3)} kg</strong>
                                            <span style={{ fontSize: '0.7rem', display: 'block', color: '#94a3b8' }}>({item.feed.scoopWeight}g / D)</span>
                                        </div>
                                    )}
                                    {/* Display for Grams */}
                                    {item.unit === 'g' && (
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                                            Soit <strong>{(parseFloat(item.quantity || 0) / 1000).toFixed(3)} kg</strong>
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
            {/* Bouton d'auto-équilibrage prioritaire (Calculateur IA) */}
            <div style={{ marginBottom: '1rem' }}>
                <Button
                    onClick={handleAutoBalance}
                    disabled={!stats || rationIngredients.length === 0}
                    variant="secondary"
                    style={{
                        width: '100%', padding: '1rem',
                        background: (stats && rationIngredients.length > 0) ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : '#e2e8f0',
                        color: (stats && rationIngredients.length > 0) ? 'white' : '#94a3b8',
                        border: 'none',
                        display: 'flex', justifyContent: 'center', gap: '0.5rem',
                        boxShadow: (stats && rationIngredients.length > 0) ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none',
                        fontSize: '1.2rem', fontWeight: 'bold',
                        cursor: (stats && rationIngredients.length > 0) ? 'pointer' : 'not-allowed'
                    }}
                >
                    <Wand2 size={24} /> ✨ Calculateur IA (Auto-Équilibrage)
                </Button>

                {/* Messages d'erreur contextuels */}
                {!stats && (
                    <div style={{ textAlign: 'center', color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem', background: '#fee2e2', padding: '0.5rem', borderRadius: '8px' }}>
                        ⚠️ Impossible d'activer le calculateur : Veuillez vérifier le profil du cheval (Poids, Age, Activité).
                    </div>
                )}
                {stats && rationIngredients.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        Ajoutez des aliments pour activer l'équilibrage IA.
                    </div>
                )}
            </div>

            {/* AI Advisor Button */}


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
                    <div className="nutrition-add-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Button
                            onClick={() => { setShowScanner(true); setShowAddMenu(false); }}
                            style={{ height: '80px', flexDirection: 'column', gap: '0.5rem', background: 'white', color: 'black', border: '1px solid #e2e8f0' }}
                        >
                            <Camera size={24} color="#6366f1" />
                            Scanner une étiquette
                        </Button>
                        <Button
                            onClick={() => { setShowSearchModal(true); setShowAddMenu(false); }}
                            style={{ height: '80px', flexDirection: 'column', gap: '0.5rem', background: 'white', color: 'black', border: '1px solid #e2e8f0' }}
                        >
                            <Search size={24} color="#6366f1" />
                            Rechercher
                        </Button>
                    </div>

                    {/* Liste de sélection rapide */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
                                Mes Scans & Favoris
                            </div>
                            {customFeeds.length > 0 && (
                                <button
                                    onClick={() => navigate('/feed-library')}
                                    style={{
                                        fontSize: '0.75rem',
                                        color: '#6366f1',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        padding: '0.25rem'
                                    }}
                                >
                                    Voir tout ({customFeeds.length})
                                </button>
                            )}
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {(feed.isCustom || feed.source === 'ai_search' || feed.source === 'scanned') && (
                                            <button
                                                onClick={(e) => deleteCustomFeed(feed.id, e)}
                                                style={{
                                                    padding: '0.5rem', color: '#ef4444', background: '#fee2e2', borderRadius: '6px',
                                                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                title="Supprimer de la bibliothèque"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                        <div style={{ color: '#4f46e5', padding: '0.5rem', background: '#e0e7ff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Plus size={16} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            )}


            {/* Bouton de sauvegarde final */}
            <div style={{ marginTop: '2rem' }}>
                <Button onClick={handleSaveClick} variant="primary" style={{ width: '100%', padding: '1rem', background: '#0f172a' }}>
                    💾 Enregistrer cette ration
                </Button>
            </div>

            {/* Save Modal */}
            {showSaveModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none' // Click-through the background
                }}>
                    <div style={{
                        pointerEvents: 'auto', // Re-enable clicks on the modal itself
                        backgroundColor: 'white', padding: '2rem', borderRadius: '16px',
                        width: '90%', maxWidth: '450px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#1e293b' }}>Enregistrer la ration</h3>

                        <div style={{ margin: '1.5rem 0', background: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4f46e5', fontWeight: '500', marginBottom: '0.5rem' }}>
                                <Wand2 size={16} /> Recommandation IA
                            </div>
                            <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>
                                Vu le volume total ({stats.mealAdvice.litersPerMeal * stats.mealAdvice.mealsCount} L),
                                nous conseillons <strong>{recommendedMeals} repas</strong> par jour.
                            </p>
                        </div>

                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                            Nombre de repas choisis :
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                            {[1, 2, 3, 4, 5, 6].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setUserMealsChoice(num)}
                                    style={{
                                        flex: 1, padding: '0.75rem 0', borderRadius: '8px',
                                        border: userMealsChoice === num ? '2px solid #6366f1' : '1px solid #e2e8f0',
                                        background: userMealsChoice === num ? '#e0e7ff' : 'white',
                                        color: userMealsChoice === num ? '#4338ca' : '#64748b',
                                        fontWeight: 'bold', cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>

                        <div className="nutrition-inline-actions" style={{ display: 'flex', gap: '1rem' }}>
                            <Button
                                onClick={() => setShowSaveModal(false)}
                                variant="secondary"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={() => executeSaveRation(userMealsChoice)}
                                variant="primary"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                Confirmer
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scanner Modal */}
            {
                showScanner && (
                    <LabelScanner
                        onFeedScanned={handleFeedScanned}
                        onClose={() => setShowScanner(false)}
                    />
                )
            }

            {/* Search Modal */}
            {showSearchModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: '16px',
                        width: '90%', maxWidth: '500px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Rechercher un aliment</h3>
                            <button
                                onClick={() => { setShowSearchModal(false); setSearchQuery(''); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#1e293b' }}>
                                Nom de l'aliment
                            </label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAISearch(); }}
                                placeholder="Ex: Granulés Sport, Avoine, Mix Equi..."
                                disabled={isSearching}
                                style={{
                                    width: '100%', padding: '0.8rem', borderRadius: '8px',
                                    border: '1px solid #e2e8f0', fontSize: '1rem',
                                    outline: 'none'
                                }}
                                autoFocus
                            />
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                                L'IA recherchera les informations nutritionnelles pour cet aliment.
                            </p>
                        </div>

                        <div className="nutrition-inline-actions" style={{ display: 'flex', gap: '1rem' }}>
                            <Button
                                onClick={() => { setShowSearchModal(false); setSearchQuery(''); }}
                                variant="secondary"
                                style={{ flex: 1 }}
                                disabled={isSearching}
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={handleAISearch}
                                variant="primary"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                disabled={isSearching || !searchQuery.trim()}
                            >
                                {isSearching ? (
                                    <>
                                        <div className="spinner" style={{
                                            width: '16px', height: '16px',
                                            border: '2px solid #fff',
                                            borderTopColor: 'transparent',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite'
                                        }} />
                                        Recherche...
                                    </>
                                ) : (
                                    <>
                                        <Search size={18} />
                                        Rechercher
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feed Info Modal */}
            {showFeedInfo && selectedFeedInfo && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: '16px',
                        width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>{selectedFeedInfo.name}</h3>
                            <button
                                onClick={() => { setShowFeedInfo(false); setSelectedFeedInfo(null); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Brand & Category */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                            {selectedFeedInfo.brand && (
                                <span style={{
                                    padding: '0.5rem 1rem', background: '#f1f5f9', borderRadius: '8px',
                                    fontSize: '0.9rem', fontWeight: '600', color: '#475569'
                                }}>
                                    🏷️ {selectedFeedInfo.brand}
                                </span>
                            )}
                            <span style={{
                                padding: '0.5rem 1rem', background: '#dbeafe', borderRadius: '8px',
                                fontSize: '0.9rem', fontWeight: '600', color: '#0369a1'
                            }}>
                                📦 {selectedFeedInfo.category || 'Generic'}
                            </span>
                            {selectedFeedInfo.source && (
                                <span style={{
                                    padding: '0.5rem 1rem', background: '#fef3c7', borderRadius: '8px',
                                    fontSize: '0.9rem', fontWeight: '600', color: '#92400e'
                                }}>
                                    {selectedFeedInfo.source === 'ai_search' ? '🔍 IA Search' : '📸 Scanner'}
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        {selectedFeedInfo.description && (
                            <div style={{
                                padding: '1rem', background: '#f8fafc', borderRadius: '8px',
                                marginBottom: '1.5rem', fontSize: '0.9rem', color: '#334155'
                            }}>
                                <strong>Description :</strong> {selectedFeedInfo.description}
                            </div>
                        )}

                        {/* Nutritional Values */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: '#1e293b' }}>
                                📊 Valeurs nutritionnelles (par kg)
                            </h4>
                            <div className="nutrition-feed-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                {selectedFeedInfo.ufc !== undefined && (
                                    <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: '600' }}>UFC</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>{selectedFeedInfo.ufc}</div>
                                    </div>
                                )}
                                {selectedFeedInfo.madc !== undefined && (
                                    <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '600' }}>MADC</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>{selectedFeedInfo.madc}g</div>
                                    </div>
                                )}
                                {selectedFeedInfo.ca !== undefined && (
                                    <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '600' }}>Calcium (Ca)</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>{selectedFeedInfo.ca}g</div>
                                    </div>
                                )}
                                {selectedFeedInfo.p !== undefined && (
                                    <div style={{ background: '#fef9e7', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#854d0e', fontWeight: '600' }}>Phosphore (P)</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ca8a04' }}>{selectedFeedInfo.p}g</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Physical Properties */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: '#1e293b' }}>
                                ⚖️ Propriétés physiques
                            </h4>
                            <div className="nutrition-feed-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                {selectedFeedInfo.density && (
                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Densité</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#334155' }}>
                                            {selectedFeedInfo.density > 10 ? (selectedFeedInfo.density / 1000).toFixed(2) : selectedFeedInfo.density} kg/L
                                        </div>
                                    </div>
                                )}
                                {selectedFeedInfo.scoopWeight && (
                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Poids dosette</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#334155' }}>
                                            {selectedFeedInfo.scoopWeight}g
                                        </div>
                                    </div>
                                )}
                                {selectedFeedInfo.unit && (
                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Unité</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#334155' }}>
                                            {selectedFeedInfo.unit}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Additional info */}
                        {selectedFeedInfo.dateAdded && (
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                Ajouté le {new Date(selectedFeedInfo.dateAdded).toLocaleDateString('fr-FR')}
                            </div>
                        )}

                        <Button
                            onClick={() => { setShowFeedInfo(false); setSelectedFeedInfo(null); }}
                            variant="primary"
                            style={{ width: '100%', marginTop: '1.5rem' }}
                        >
                            Fermer
                        </Button>
                    </div>
                </div>
            )}

            {/* Feed Preview Modal (for AI Search results) */}
            {showFeedPreview && previewFeed && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: '16px',
                        width: '90%', maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700', color: '#1e293b' }}>
                                    {previewFeed.name}
                                </h3>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>
                                    Vérifiez les informations avant d'ajouter
                                </p>
                            </div>
                            <button
                                onClick={() => { setShowFeedPreview(false); setPreviewFeed(null); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Brand & Category */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                            {previewFeed.brand && (
                                <span style={{
                                    padding: '0.5rem 1rem', background: '#f1f5f9', borderRadius: '8px',
                                    fontSize: '0.9rem', fontWeight: '600', color: '#475569'
                                }}>
                                    🏷️ {previewFeed.brand}
                                </span>
                            )}
                            <span style={{
                                padding: '0.5rem 1rem', background: '#dbeafe', borderRadius: '8px',
                                fontSize: '0.9rem', fontWeight: '600', color: '#0369a1'
                            }}>
                                📦 {previewFeed.category || 'MELANGE'}
                            </span>
                            <span style={{
                                padding: '0.5rem 1rem', background: '#d1fae5', borderRadius: '8px',
                                fontSize: '0.9rem', fontWeight: '600', color: '#065f46'
                            }}>
                                🔍 Recherche IA
                            </span>
                        </div>

                        {/* Description */}
                        {previewFeed.description && (
                            <div style={{
                                padding: '1rem', background: '#f8fafc', borderRadius: '8px',
                                marginBottom: '1.5rem', fontSize: '0.9rem', color: '#334155'
                            }}>
                                <strong>Description :</strong> {previewFeed.description}
                            </div>
                        )}

                        {/* Nutritional Values */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: '#1e293b' }}>
                                📊 Valeurs nutritionnelles (par kg)
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                {previewFeed.ufc !== undefined && (
                                    <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: '600' }}>UFC</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>{previewFeed.ufc}</div>
                                    </div>
                                )}
                                {previewFeed.madc !== undefined && (
                                    <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '600' }}>MADC</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>{previewFeed.madc}g</div>
                                    </div>
                                )}
                                {previewFeed.ca !== undefined && (
                                    <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '600' }}>Calcium (Ca)</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>{previewFeed.ca}g</div>
                                    </div>
                                )}
                                {previewFeed.p !== undefined && (
                                    <div style={{ background: '#fef9e7', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#854d0e', fontWeight: '600' }}>Phosphore (P)</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ca8a04' }}>{previewFeed.p}g</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Physical Properties */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: '#1e293b' }}>
                                ⚖️ Propriétés physiques
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                {previewFeed.density && (
                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Densité</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#334155' }}>
                                            {previewFeed.density > 10 ? (previewFeed.density / 1000).toFixed(2) : previewFeed.density} kg/L
                                        </div>
                                    </div>
                                )}
                                {previewFeed.scoopWeight && (
                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Poids dosette</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#334155' }}>
                                            {previewFeed.scoopWeight}g
                                        </div>
                                    </div>
                                )}
                                {previewFeed.unit && (
                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Unité</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#334155' }}>
                                            {previewFeed.unit}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="nutrition-inline-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <Button
                                onClick={() => {
                                    setShowFeedPreview(false);
                                    setPreviewFeed(null);
                                }}
                                variant="secondary"
                                style={{ flex: 1 }}
                            >
                                <X size={18} style={{ marginRight: '0.5rem' }} />
                                Annuler
                            </Button>
                            <Button
                                onClick={confirmAddFeed}
                                variant="primary"
                                style={{ flex: 1 }}
                            >
                                <Plus size={18} style={{ marginRight: '0.5rem' }} />
                                Valider et Ajouter
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Duplicate Warning Modal */}
            {showDuplicateWarning && duplicateFeed && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: '16px',
                        width: '90%', maxWidth: '500px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '64px', height: '64px', margin: '0 auto 1rem',
                                background: '#fef3c7', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2rem'
                            }}>
                                ⚠️
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                                Aliment déjà ajouté
                            </h3>
                        </div>

                        <div style={{
                            padding: '1rem', background: '#f8fafc', borderRadius: '8px',
                            marginBottom: '1.5rem'
                        }}>
                            <p style={{ margin: 0, fontSize: '1rem', color: '#475569', textAlign: 'center' }}>
                                <strong>{duplicateFeed.name}</strong> est déjà présent dans votre ration.
                            </p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#64748b', textAlign: 'center' }}>
                                Voulez-vous l'ajouter quand même ?
                            </p>
                        </div>

                        <div className="nutrition-inline-actions" style={{ display: 'flex', gap: '1rem' }}>
                            <Button
                                onClick={() => {
                                    setShowDuplicateWarning(false);
                                    setDuplicateFeed(null);
                                }}
                                variant="secondary"
                                style={{ flex: 1 }}
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={() => {
                                    addIngredientToRation(duplicateFeed, true);
                                    setShowDuplicateWarning(false);
                                    setDuplicateFeed(null);
                                }}
                                variant="primary"
                                style={{ flex: 1 }}
                            >
                                Ajouter quand même
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div >
    );
}

export default NutritionCalculator;
