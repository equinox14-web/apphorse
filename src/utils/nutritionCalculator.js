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
        ufcAdjustment: 0.8,
        madcAdjustment: 120,
    },
    LACTATION_EARLY: {
        code: 'LACTATION_EARLY',
        label: 'Jument Allaitante (0-3 mois)',
        ufcAdjustment: 2.5,
        madcAdjustment: 350,
    },
    LACTATION_LATE: {
        code: 'LACTATION_LATE',
        label: 'Jument Allaitante (3-6 mois)',
        ufcAdjustment: 1.5,
        madcAdjustment: 200,
    },
    GROWTH_FOAL: {
        code: 'GROWTH_FOAL',
        label: 'Poulain en Croissance',
        ufcAdjustment: 0.5,
        madcAdjustment: 150,
    },
};

/**
 * Valeurs nutritionnelles de référence pour aliments courants
 */
export const REFERENCE_FEEDS = [
    // FOURRAGES
    {
        id: 'foin-prairie',
        category: 'FOURRAGE',
        brand: 'Générique',
        name: 'Foin de Prairie',
        density: 0.15, // kg/L (très variable selon compression)
        ufc: 0.50, // UFC/kg MS
        madc: 30, // g/kg MS
        matiereSèche: 85, // %
        cellulose: 30,
        cendres: 8,
        calcium: 5, // g/kg
        phosphore: 2, // g/kg
    },
    {
        id: 'foin-luzerne',
        category: 'FOURRAGE',
        brand: 'Générique',
        name: 'Foin de Luzerne',
        density: 0.15,
        ufc: 0.60,
        madc: 100,
        matiereSèche: 85,
        cellulose: 28,
        cendres: 10,
        calcium: 15,
        phosphore: 2.5,
    },
    {
        id: 'enrubanne',
        category: 'FOURRAGE',
        brand: 'Générique',
        name: 'Enrubannage',
        density: 0.25,
        ufc: 0.70,
        madc: 50,
        matiereSèche: 50,
        cellulose: 25,
        cendres: 9,
        calcium: 4,
        phosphore: 2,
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
        category: 'GRANULE',
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
        category: 'GRANULE',
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
        category: 'GRANULE',
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
 * Formule INRA: UFC_entretien = 0.033 × PV^0.75
 * @param {number} weight - Poids du cheval en kg
 * @returns {number} Besoins en UFC
 */
export function calculateMaintenanceUFC(weight) {
    return 0.033 * Math.pow(weight, 0.75);
}

/**
 * Calcule les besoins en protéines d'entretien (MADC)
 * Formule INRA: MADC_entretien = 0.6 × PV (en g/jour)
 * @param {number} weight - Poids du cheval en kg
 * @returns {number} Besoins en MADC (g/jour)
 */
export function calculateMaintenanceMADC(weight) {
    return 0.6 * weight;
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
        ufc: Math.round(kgMS * forage.ufc * 100) / 100,
        madc: Math.round(kgMS * forage.madc),
    };
}

/**
 * Calcule la quantité de concentré nécessaire pour combler les besoins
 * @param {Object} totalNeeds - { ufc, madc } besoins totaux
 * @param {Object} forageNutrition - { ufc, madc } apports du fourrage
 * @param {Object} concentrate - Objet concentré avec propriétés nutritionnelles
 * @returns {Object} { kg, liters, ufc, madc }
 */
export function calculateConcentrateAmount(totalNeeds, forageNutrition, concentrate) {
    // Déficit énergétique
    const ufcDeficit = Math.max(0, totalNeeds.ufc - forageNutrition.ufc);

    // Quantité en kg pour combler le déficit UFC
    const kgNeeded = ufcDeficit / concentrate.ufc;

    // Conversion en litres (plus pratique pour l'utilisateur)
    const litersNeeded = kgNeeded / concentrate.density;

    // Vérifier si ça couvre aussi les protéines
    const madcProvided = kgNeeded * concentrate.madc;
    const madcDeficit = totalNeeds.madc - forageNutrition.madc;

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
 * @param {Object} concentrate - Concentré choisi
 * @returns {Object} Ration complète avec détails
 */
export function generateRation(weight, activityCode, physiologicalCode, forage, concentrate) {
    // 1. Calculer les besoins totaux
    const needs = calculateTotalNeeds(weight, activityCode, physiologicalCode);

    // 2. Calculer la quantité de fourrage (prioritaire)
    const forageAmount = calculateForageAmount(weight, 1.5);
    const forageNutrition = calculateForageNutrition(forageAmount.kgBrut, forage);

    // 3. Calculer la quantité de concentré pour combler
    const concentrateAmount = calculateConcentrateAmount(needs, forageNutrition, concentrate);

    // 4. Vérifier l'équilibre minéral
    const calciumTotal = (forageAmount.kgBrut * forage.calcium) + (concentrateAmount.kg * concentrate.calcium);
    const phosphoreTotal = (forageAmount.kgBrut * forage.phosphore) + (concentrateAmount.kg * concentrate.phosphore);
    const caToP = phosphoreTotal > 0 ? calciumTotal / phosphoreTotal : 0;

    return {
        weight,
        needs,
        forage: {
            name: `${forage.brand} ${forage.name}`,
            kg: forageAmount.kgBrut,
            nutrition: forageNutrition,
        },
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
};
