/**
 * Module de Calcul Nutritionnel selon les Normes INRA
 * Référence: Systèmes d'Alimentation Équine (INRA 2015)
 */

// ===========================
// DONNÉES DE RÉFÉRENCE INRA
// ===========================

/**
 * Niveaux d'activité et facteurs multiplicateurs
 */
export const ACTIVITY_LEVELS = {
    REPOS: {
        code: 'REPOS',
        label: 'Repos / Paddock',
        description: 'Cheval au repos, sans travail',
        multiplier: 1.0,
    },
    LOISIR_LEGER: {
        code: 'LOISIR_LEGER',
        label: 'Loisir Léger',
        description: '1-3h de balade/semaine',
        multiplier: 1.25,
    },
    LOISIR_REGULIER: {
        code: 'LOISIR_REGULIER',
        label: 'Loisir Régulier',
        description: '3-5h de travail/semaine',
        multiplier: 1.5,
    },
    SPORT_LEGER: {
        code: 'SPORT_LEGER',
        label: 'Sport Léger',
        description: 'CSO/Dressage amateur',
        multiplier: 1.75,
    },
    SPORT_INTENSE: {
        code: 'SPORT_INTENSE',
        label: 'Sport Intense',
        description: 'Compétition régulière',
        multiplier: 2.0,
    },
    COMPETITION: {
        code: 'COMPETITION',
        label: 'Haute Compétition',
        description: 'CCE, Endurance, GP CSO',
        multiplier: 2.5,
    },
};

/**
 * États physiologiques et ajustements
 */
export const PHYSIOLOGICAL_STATES = {
    NORMAL: {
        code: 'NORMAL',
        label: 'Normal',
        ufcAdjustment: 0,
        madcAdjustment: 0,
    },
    GESTATION_EARLY: {
        code: 'GESTATION_EARLY',
        label: 'Jument Gestante (0-7 mois)',
        ufcAdjustment: 0.2,
        madcAdjustment: 50,
    },
    GESTATION_LATE: {
        code: 'GESTATION_LATE',
        label: 'Jument Gestante (8-11 mois)',
        ufcAdjustment: 1.5,
        madcAdjustment: 150,
    },
    LACTATION_EARLY: {
        code: 'LACTATION_EARLY',
        label: 'Jument Allaitante (0-3 mois)',
        ufcAdjustment: 5.5,
        madcAdjustment: 450,
    },
    LACTATION_LATE: {
        code: 'LACTATION_LATE',
        label: 'Jument Allaitante (3-6 mois)',
        ufcAdjustment: 3.5,
        madcAdjustment: 300,
    },
    GROWTH_FOAL: {
        code: 'GROWTH_FOAL',
        label: 'Poulain en Croissance',
        ufcAdjustment: 2.0,
        madcAdjustment: 250,
    },
};

/**
 * Valeurs nutritionnelles de référence pour aliments courants
 */
export const REFERENCE_FEEDS = [
    // FOURRAGES (Sources: INRA 2011 & Reverdy)
    {
        id: 'foin-prairie-tardif',
        category: 'FOURRAGE',
        brand: 'INRA',
        name: 'Foin de Prairie (Tardif)',
        description: 'Coupe tardive, tigeux, jaune. Idéal entretien/poney.',
        density: 0.15,
        ufc: 0.45, // Faible énergie
        madc: 30,  // Faible protéine
        matiereSèche: 90,
        cellulose: 32,
        cendres: 7,
        calcium: 4,
        phosphore: 2,
    },
    {
        id: 'foin-prairie-precoce',
        category: 'FOURRAGE',
        brand: 'INRA',
        name: 'Foin de Prairie (Précoce)',
        description: 'Coupe précoce, feuillu, vert. Riche en énergie/sucres.',
        density: 0.15,
        ufc: 0.62, // Haute énergie
        madc: 55,
        matiereSèche: 90,
        cellulose: 26,
        cendres: 8,
        calcium: 5,
        phosphore: 2.5,
    },
    {
        id: 'foin-crau',
        category: 'FOURRAGE',
        brand: 'AOP',
        name: 'Foin de Crau',
        description: 'Foin de qualité supérieure, équilibré et appétent.',
        density: 0.16,
        ufc: 0.68, // Premium
        madc: 60,
        matiereSèche: 92,
        cellulose: 28,
        cendres: 9,
        calcium: 8, // Riche en calcium
        phosphore: 2.5,
    },
    {
        id: 'enrubanne',
        category: 'FOURRAGE',
        brand: 'Générique',
        name: 'Enrubanné / Haylage',
        description: 'Fourrage fermenté, humide. Très riche. Attention PSSM/SME.',
        density: 0.25, // Plus dense car humide
        ufc: 0.75, // Très riche (par kg MS)
        madc: 70,
        matiereSèche: 65, // ⚠️ CRITIQUE : Contient 35% d'eau
        cellulose: 25,
        cendres: 9,
        calcium: 5,
        phosphore: 3,
    },
    {
        id: 'paille',
        category: 'FOURRAGE',
        brand: 'Générique',
        name: 'Paille de Blé',
        description: 'Lest alimentaire, très pauvre. Pour dilution.',
        density: 0.10,
        ufc: 0.25, // Très faible énergie
        madc: 15,
        matiereSèche: 88,
        cellulose: 40, // Très fibreux
        cendres: 6,
        calcium: 3,
        phosphore: 1,
    },

    // CÉRÉALES
    {
        id: 'avoine',
        category: 'CEREALE',
        brand: 'Générique',
        name: 'Avoine',
        density: 0.50,
        ufc: 1.00,
        madc: 65,
        matiereSèche: 88,
        cellulose: 11,
        cendres: 3,
        calcium: 1,
        phosphore: 3.5,
    },
    {
        id: 'orge',
        category: 'CEREALE',
        brand: 'Générique',
        name: 'Orge Aplatie',
        density: 0.60,
        ufc: 1.15,
        madc: 75,
        matiereSèche: 88,
        cellulose: 5,
        cendres: 2.5,
        calcium: 0.5,
        phosphore: 3.5,
    },
    {
        id: 'mais',
        category: 'CEREALE',
        brand: 'Générique',
        name: 'Maïs Concassé',
        density: 0.70,
        ufc: 1.20,
        madc: 50,
        matiereSèche: 88,
        cellulose: 2,
        cendres: 1.5,
        calcium: 0.1,
        phosphore: 2.5,
    },

    // ALIMENTS COMPLETS (Exemples Reverdy)
    {
        id: 'reverdy-adult',
        category: 'MELANGE',
        brand: 'Reverdy',
        name: 'Adult',
        density: 0.55,
        ufc: 0.85,
        madc: 85,
        matiereSèche: 88,
        cellulose: 12,
        cendres: 8,
        calcium: 9,
        phosphore: 5,
    },
    {
        id: 'reverdy-energy',
        category: 'MELANGE',
        brand: 'Reverdy',
        name: 'Energy Control',
        density: 0.55,
        ufc: 0.95,
        madc: 100,
        matiereSèche: 88,
        cellulose: 10,
        cendres: 7.5,
        calcium: 10,
        phosphore: 5.5,
    },
    {
        id: 'reverdy-sport',
        category: 'MELANGE',
        brand: 'Reverdy',
        name: 'Chronos Sport',
        density: 0.55,
        ufc: 1.00,
        madc: 110,
        matiereSèche: 88,
        cellulose: 9,
        cendres: 7,
        calcium: 11,
        phosphore: 6,
    },
];

// ===========================
// FONCTIONS DE CALCUL
// ===========================

/**
 * Calcule les besoins énergétiques d'entretien (UFC)
 * Formule INRA 2011 (Revisée): UFC_entretien = 0.038 × PV^0.75 (au lieu de 0.033)
 * @param {number} weight - Poids du cheval en kg
 * @returns {number} Besoins en UFC
 */
export function calculateMaintenanceUFC(weight) {
    return 0.038 * Math.pow(weight, 0.75);
}

/**
 * Calcule les besoins en protéines d'entretien (MADC)
 * Formule INRA 2011: MADC_entretien = 2.8 × PV^0.75 (en g/jour)
 * @param {number} weight - Poids du cheval en kg
 * @returns {number} Besoins en MADC (g/jour)
 */
export function calculateMaintenanceMADC(weight) {
    return 2.8 * Math.pow(weight, 0.75);
}

/**
 * Calcule les besoins totaux en fonction de l'activité et de l'état physiologique
 * @param {number} weight - Poids en kg
 * @param {string} activityCode - Code du niveau d'activité
 * @param {string} physiologicalCode - Code de l'état physiologique
 * @returns {Object} { ufc, madc }
 */
export function calculateTotalNeeds(weight, activityCode = 'REPOS', physiologicalCode = 'NORMAL') {
    const activity = ACTIVITY_LEVELS[activityCode] || ACTIVITY_LEVELS.REPOS;
    const physio = PHYSIOLOGICAL_STATES[physiologicalCode] || PHYSIOLOGICAL_STATES.NORMAL;

    const maintenanceUFC = calculateMaintenanceUFC(weight);
    const maintenanceMADC = calculateMaintenanceMADC(weight);

    const totalUFC = (maintenanceUFC * activity.multiplier) + physio.ufcAdjustment;
    const totalMADC = (maintenanceMADC * activity.multiplier) + physio.madcAdjustment;

    return {
        ufc: Math.round(totalUFC * 100) / 100,
        madc: Math.round(totalMADC),
        breakdown: {
            maintenance: {
                ufc: Math.round(maintenanceUFC * 100) / 100,
                madc: Math.round(maintenanceMADC),
            },
            activity: {
                multiplier: activity.multiplier,
                label: activity.label,
            },
            physiological: {
                ufcAdjustment: physio.ufcAdjustment,
                madcAdjustment: physio.madcAdjustment,
                label: physio.label,
            },
        },
    };
}

/**
 * Calcule la quantité de fourrage recommandée
 * Règle: 1.5% à 2% du poids vif en matière sèche
 * @param {number} weight - Poids en kg
 * @param {number} percentage - Pourcentage du poids (1.5 à 2)
 * @returns {Object} { kgBrut, kgMatiereSèche }
 */
export function calculateForageAmount(weight, percentage = 1.5) {
    const kgMatiereSèche = (weight * percentage) / 100;

    // Conversion en brut (foin = ~85% MS)
    const kgBrut = kgMatiereSèche / 0.85;

    return {
        kgMatiereSèche: Math.round(kgMatiereSèche * 10) / 10,
        kgBrut: Math.round(kgBrut * 10) / 10,
    };
}

/**
 * Calcule l'apport nutritionnel du fourrage
 * @param {number} kgBrut - Quantité de foin en kg brut
 * @param {Object} forage - Objet fourrage avec propriétés nutritionnelles
 * @returns {Object} { ufc, madc }
 */
export function calculateForageNutrition(kgBrut, forage) {
    const kgMS = kgBrut * (forage.matiereSèche / 100);

    return {
        ufc: Math.round(kgMS * (forage.ufc || 0) * 100) / 100,
        madc: Math.round(kgMS * (forage.madc || 0)),
        calcium: Math.round(kgMS * (forage.calcium || 0) * 10) / 10,
        phosphore: Math.round(kgMS * (forage.phosphore || 0) * 10) / 10,
    };
}

/**
 * Calcule la quantité de concentré nécessaire pour combler les besoins
 * @param {Object} totalNeeds - { ufc, madc } besoins totaux
 * @param {Object} forageNutrition - { ufc, madc } apports du fourrage
 * @param {Object} adjustmentNutrition - { ufc, madc } apports des autres aliments (optionnel)
 * @param {Object} concentrate - Objet concentré avec propriétés nutritionnelles
 * @returns {Object} { kg, liters, ufc, madc }
 */
export function calculateConcentrateAmount(totalNeeds, forageNutrition, concentrate, adjustmentNutrition = { ufc: 0, madc: 0 }) {
    // Déficit énergétique (en tenant compte des ajustements)
    const currentUfc = forageNutrition.ufc + (adjustmentNutrition.ufc || 0);
    const ufcDeficit = Math.max(0, totalNeeds.ufc - currentUfc);

    // Quantité en kg pour combler le déficit UFC
    const kgNeeded = ufcDeficit / concentrate.ufc;

    // Conversion en litres (plus pratique pour l'utilisateur)
    const litersNeeded = kgNeeded / concentrate.density;

    // Vérifier si ça couvre aussi les protéines
    const currentMadc = forageNutrition.madc + (adjustmentNutrition.madc || 0);
    const madcProvided = kgNeeded * concentrate.madc;
    const madcDeficit = totalNeeds.madc - currentMadc;

    return {
        kg: Math.round(kgNeeded * 10) / 10,
        liters: Math.round(litersNeeded * 10) / 10,
        ufc: Math.round(ufcDeficit * 100) / 100,
        madc: Math.round(madcProvided),
        madcDeficit: Math.round(madcDeficit),
        isSufficient: madcProvided >= madcDeficit,
    };
}

/**
 * Génère une ration complète pour un cheval
 * @param {number} weight - Poids du cheval en kg
 * @param {string} activityCode - Code activité
 * @param {string} physiologicalCode - Code état physiologique
 * @param {Object} forage - Fourrage choisi
 * @param {Object} concentrate - Concentré choisi (principal)
 * @param {Array} additionalFeeds - Liste d'objets { feed, quantity } pour les compléments
 * @returns {Object} Ration complète avec détails
 */
export function generateRation(weight, activityCode, physiologicalCode, forage, concentrate, additionalFeeds = []) {
    // 1. Calculer les besoins totaux
    const needs = calculateTotalNeeds(weight, activityCode, physiologicalCode);

    // 2. Calculer la quantité de fourrage (prioritaire)
    const forageAmount = calculateForageAmount(weight, 1.5);
    const forageNutrition = calculateForageNutrition(forageAmount.kgBrut, forage);

    // 2b. Calculer les apports des aliments additionnels (fixes)
    let additionalNutrition = { ufc: 0, madc: 0, calcium: 0, phosphore: 0 };

    additionalFeeds.forEach(item => {
        const qty = parseFloat(item.quantity) || 0;
        // On suppose que l'aliment a les propriétés nutritionnelles
        const feed = item.feed;
        if (feed && qty > 0) {
            // Conversion en MS si besoin, ici on simplifie en prenant brut * valeur/kg
            // Les valeurs de ref sont souvent par kg Brut ou kg MS, on assume Brut pour simplifier ici ou on applique un facteur
            // Dans REFERENCE_FEEDS, ufc est par kg MS, mais souvent sur étiquette par kg Brut.
            // On va assumer que l'input `quantity` est du Brut et que les valeurs nutri sont cohérentes.
            // Pour être précis comme le fourrage :
            const kgMS = qty * ((feed.matiereSèche || 88) / 100);

            additionalNutrition.ufc += kgMS * (feed.ufc || 0);
            additionalNutrition.madc += kgMS * (feed.madc || 0);
            additionalNutrition.calcium += qty * (feed.calcium || 0);
            additionalNutrition.phosphore += qty * (feed.phosphore || 0);
        }
    });

    // 3. Calculer la quantité de concentré pour combler (en tenant compte des additionnels)
    const concentrateAmount = calculateConcentrateAmount(needs, forageNutrition, concentrate, additionalNutrition);

    // 4. Vérifier l'équilibre minéral
    const calciumTotal = (forageAmount.kgBrut * forage.calcium) +
        (concentrateAmount.kg * concentrate.calcium) +
        additionalNutrition.calcium;

    const phosphoreTotal = (forageAmount.kgBrut * forage.phosphore) +
        (concentrateAmount.kg * concentrate.phosphore) +
        additionalNutrition.phosphore;

    const caToP = phosphoreTotal > 0 ? calciumTotal / phosphoreTotal : 0;

    return {
        weight,
        needs,
        forage: {
            name: `${forage.brand} ${forage.name}`,
            kg: forageAmount.kgBrut,
            nutrition: forageNutrition,
        },
        additionalFeeds: additionalFeeds.map(f => ({
            name: `${f.feed.brand} ${f.feed.name}`,
            kg: f.quantity,
            nutrition: {
                ufc: (f.quantity * ((f.feed.matiereSèche || 88) / 100) * f.feed.ufc).toFixed(2),
                madc: Math.round(f.quantity * ((f.feed.matiereSèche || 88) / 100) * f.feed.madc)
            }
        })),
        concentrate: {
            name: `${concentrate.brand} ${concentrate.name}`,
            kg: concentrateAmount.kg,
            liters: concentrateAmount.liters,
            nutrition: {
                ufc: concentrateAmount.ufc,
                madc: concentrateAmount.madc,
            },
        },
        minerals: {
            calcium: Math.round(calciumTotal),
            phosphore: Math.round(phosphoreTotal),
            ratio: Math.round(caToP * 10) / 10,
            isBalanced: caToP >= 1.5 && caToP <= 2.5, // Ratio idéal Ca:P
        },
        warnings: generateWarnings(weight, needs, forageNutrition, concentrateAmount, caToP),
    };
}

/**
 * Génère des avertissements si la ration n'est pas équilibrée
 */
function generateWarnings(weight, needs, forageNutrition, concentrateAmount, caToP) {
    const warnings = [];

    if (!concentrateAmount.isSufficient) {
        warnings.push({
            type: 'PROTEIN_DEFICIT',
            severity: 'warning',
            message: `Déficit en protéines: ${Math.abs(concentrateAmount.madcDeficit - concentrateAmount.madc)}g MADC manquants`,
            recommendation: 'Ajouter de la luzerne ou un complément protéique',
        });
    }

    if (caToP < 1.5) {
        warnings.push({
            type: 'CALCIUM_LOW',
            severity: 'warning',
            message: `Ratio Ca:P trop bas (${caToP.toFixed(1)}:1)`,
            recommendation: 'Ajouter un complément calcique (carbonate de calcium)',
        });
    }

    if (caToP > 3) {
        warnings.push({
            type: 'CALCIUM_HIGH',
            severity: 'info',
            message: `Ratio Ca:P élevé (${caToP.toFixed(1)}:1)`,
            recommendation: 'Vérifier l\'apport en phosphore',
        });
    }

    if (concentrateAmount.kg > weight * 0.005) {
        warnings.push({
            type: 'CONCENTRATE_HIGH',
            severity: 'warning',
            message: `Quantité de concentré élevée (${concentrateAmount.kg}kg)`,
            recommendation: 'Fractionner en 3-4 repas pour éviter les coliques',
        });
    }

    return warnings;
}

/**
 * Calcule le nombre de repas recommandés selon le volume total de concentrés
 * Règle INRA : Max 2.5L à 3L par repas (pour un cheval de 500kg)
 */
export function calculateMealAdvice(totalLiters, weight = 500) {
    // Volume max par repas ajusté au poids (env 0.5% à 0.6% du PV en volume, ou 3L pour 500kg)
    // 3L pour 500kg => 0.6 L / 100kg
    const maxLitersPerMeal = (weight / 500) * 3.0;

    let recommendedMeals = 2; // Minimum standard

    if (totalLiters > maxLitersPerMeal * 3) {
        recommendedMeals = 4;
    } else if (totalLiters > maxLitersPerMeal * 2) {
        recommendedMeals = 3;
    } else if (totalLiters > maxLitersPerMeal) {
        recommendedMeals = 2; // On reste à 2, mais ça remplit bien les repas
    }

    // Safety check : Si gros volume (> 4L), jamais moins de 3 repas
    if (totalLiters > 4 && recommendedMeals < 3) recommendedMeals = 3;
    if (totalLiters > 8 && recommendedMeals < 4) recommendedMeals = 4;

    const litersPerMeal = totalLiters / recommendedMeals;

    return {
        mealsCount: recommendedMeals,
        litersPerMeal: Math.round(litersPerMeal * 10) / 10,
        maxLitersPerMeal: Math.round(maxLitersPerMeal * 10) / 10,
        reason: totalLiters > 0 ? `Volume total de ${totalLiters}L` : 'Pas de concentrés'
    };
}

/**
 * Estime les valeurs UFC à partir de la cellulose et des protéines (pour OCR)
 * Formule simplifiée basée sur les équations INRA
 * @param {number} cellulose - % cellulose brute
 * @param {number} mat - % MAT (Matières Azotées Totales)
 * @returns {Object} { ufc, madc }
 */
export function estimateNutritionFromAnalysis(cellulose, mat, cendres = 8) {
    // Formule simplifiée d'estimation UFC (INRA)
    // Plus la cellulose est élevée, moins l'énergie est digestible
    const ufc = 1.2 - (cellulose * 0.015) - (cendres * 0.02);

    // Estimation MADC (environ 80% de MAT est digestible)
    const madc = mat * 0.8 * 10; // Conversion en g/kg

    return {
        ufc: Math.max(0.4, Math.min(1.3, Math.round(ufc * 100) / 100)),
        madc: Math.round(madc),
        isEstimated: true,
    };
}

/**
 * Calcule le bilan nutritionnel complet d'une ration composée manuellement
 * @param {Object} needs - Besoins calculés { ufc, madc }
 * @param {Object} forageData - Données du fourrage { kg, nutrition }
 * @param {Array} ingredients - Liste des ingrédients [{ feed, quantity }]
 * @param {number} weight - Poids du cheval (défaut 500)
 * @returns {Object} Bilan complet (totaux, balance, pourcentages)
 */
export function calculateRationStats(needs, forageData, ingredients = [], weight = 500) {
    // 1. Apports du Fourrage (Base)
    // forageData.nutrition est supposé contenir les totaux calculés via calculateForageNutrition
    // Mais calculateForageNutrition ne renvoie que ufc, madc, calcium, phosphore.
    // Si le fourrage a d'autres propriétés (zinc, cuivre...), elles ne sont pas dans .nutrition.
    // On doit donc vérifier forageData.nutrition OU recalculer depuis forageData complet si dispo.
    // Pour simplifier, on prend ce qui est dans .nutrition et on ajoute 0 pour le reste du fourrage (souvent négligeable ou inconnu pour foin standard sauf analyse)

    let totalUFC = forageData.nutrition.ufc || 0;
    let totalMADC = forageData.nutrition.madc || 0;
    let totalCalcium = forageData.nutrition.calcium || 0;
    let totalPhosphore = forageData.nutrition.phosphore || forageData.nutrition.phosphorus || 0;

    // Initialisation des autres minéraux (souvent 0 pour fourrage standard sans analyse poussée)
    // Si on veut être précis, il faudrait que forageData contienne l'objet fourrage source pour relire ses props zinc/cuivre...
    // Supposons pour l'instant 0.
    let totalMagnesium = 0;
    let totalSodium = 0;
    let totalZinc = 0;
    let totalCuivre = 0;
    let totalSelenium = 0;
    let totalLysine = 0;
    let totalAmidon = 0;
    let totalSucre = 0;

    // 2. Somme des Ingrédients
    const ingredientsAnalysis = ingredients.map(item => {
        const qty = parseFloat(item.quantity) || 0;
        const feed = item.feed;
        if (!feed || qty <= 0) return null;

        // Facteur : Si item.unit est 'L' et feed.density existe, qty est en Litres.
        // Mais attention, dans NutritionCalculator, 'quantity' est souvent stocké en kg (converti).
        // On suppose ici que 'item.quantity' est en KG (standard du calculateur).

        // Valeurs nutritionnelles de l'aliment (par kg)
        const ufc = feed.ufc || 0;
        const madc = feed.madc || 0;
        const ca = feed.calcium || 0;
        const p = feed.phosphore || feed.phosphorus || 0;
        const mg = feed.magnesium || 0;
        const na = feed.sodium || 0;
        const zn = feed.zinc || 0;
        const cu = feed.cuivre || feed.copper || 0; // Gérer FR/EN
        const se = feed.selenium || 0;
        const lys = feed.lysine || 0;
        const starch = feed.amidon || feed.starch || 0; // %
        const sugar = feed.sucre || feed.sugar || 0; // %

        // Calculs par ingrédient
        const itemUFC = qty * ufc;
        const itemMADC = qty * madc;
        const itemCa = qty * ca;
        const itemP = qty * p;
        const itemMg = qty * mg;
        const itemNa = qty * na;
        const itemZn = qty * zn;
        const itemCu = qty * cu;
        const itemSe = qty * se;
        const itemLys = qty * lys;

        // Pour Amidon/Sucre, c'est souvent en % -> convertir en g (qty * % * 10)
        const itemAmidon = qty * starch * 10;
        const itemSucre = qty * sugar * 10;

        // Cumul
        totalUFC += itemUFC;
        totalMADC += itemMADC;
        totalCalcium += itemCa;
        totalPhosphore += itemP;
        totalMagnesium += itemMg;
        totalSodium += itemNa;
        totalZinc += itemZn;
        totalCuivre += itemCu;
        totalSelenium += itemSe;
        totalLysine += itemLys;
        totalAmidon += itemAmidon;
        totalSucre += itemSucre;

        return {
            ...item,
            nutrition: {
                ufc: itemUFC, madc: itemMADC,
                calcium: itemCa, phosphore: itemP,
                zinc: itemZn, cuivre: itemCu
            }
        };
    }).filter(Boolean);

    // 3. Calcul de la balance (Besoins vs Apports)
    const balance = {
        ufc: totalUFC - needs.ufc,
        madc: totalMADC - needs.madc,
    };

    const percent = {
        ufc: (totalUFC / needs.ufc) * 100,
        madc: (totalMADC / needs.madc) * 100
    };

    // 4. Ratios
    // Ca:P (Cible normal ~ 1.5 - 2.0)
    const ratioCaP = totalPhosphore > 0 ? totalCalcium / totalPhosphore : 0;

    // Zn:Cu (Cible ~ 3:1 à 4:1)
    const ratioZnCu = totalCuivre > 0 ? totalZinc / totalCuivre : 0;

    return {
        totals: {
            ufc: totalUFC,
            madc: totalMADC,
            calcium: totalCalcium,
            phosphore: totalPhosphore,
            magnesium: totalMagnesium,
            sodium: totalSodium,
            zinc: totalZinc,
            cuivre: totalCuivre,
            selenium: totalSelenium,
            lysine: totalLysine,
            amidon: totalAmidon,
            sucre: totalSucre
        },
        ratios: {
            ca_p: ratioCaP,
            zn_cu: ratioZnCu
        },
        needs,
        balance,
        percent,
        ingredients: ingredientsAnalysis,
        mealAdvice: calculateMealAdvice(
            ingredientsAnalysis.reduce((sum, item) => {
                let density = parseFloat(item.feed.density) || 0.65;
                if (density > 10) density = density / 1000;
                return sum + (parseFloat(item.quantity) / density);
            }, 0),
            weight
        )
    };
}

export default {
    ACTIVITY_LEVELS,
    PHYSIOLOGICAL_STATES,
    REFERENCE_FEEDS,
    calculateMaintenanceUFC,
    calculateMaintenanceMADC,
    calculateTotalNeeds,
    calculateForageAmount,
    calculateForageNutrition,
    calculateConcentrateAmount,
    generateRation,
    estimateNutritionFromAnalysis,
    calculateRationStats,
    calculateMealAdvice, // Nouvel export
};
