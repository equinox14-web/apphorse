/**
 * Weight Estimation by Photo Analysis
 * Algorithme de Crevat/Carroll avec coefficients morphométriques
 */

// ===========================
// 1. MORPHOTYPE COEFFICIENTS
// ===========================

export const MORPHOTYPES = {
    BLOOD: {
        code: 'BLOOD',
        label: 'Pur-sang / Fin',
        coefficient: 1.30,
        description: 'Cheval léger, profil élancé (Pur-sang, Arabe)',
    },
    SPORT: {
        code: 'SPORT',
        label: 'Selle Français / Standard',
        coefficient: 1.40,
        description: 'Cheval de sport standard (SF, KWPN, BWP)',
    },
    PONY: {
        code: 'PONY',
        label: 'Poney de Sport',
        coefficient: 1.45,
        description: 'Poney compact et musclé',
    },
    COB: {
        code: 'COB',
        label: 'Rustique / Rond',
        coefficient: 1.55,
        description: 'Cheval rustique, type cob (Fjord, Haflinger)',
    },
    DRAFT: {
        code: 'DRAFT',
        label: 'Trait / Lourd',
        coefficient: 1.65,
        description: 'Cheval de trait massif (Percheron, Comtois)',
    },
};

// ===========================
// 2. BODY CONDITION SCORE
// ===========================

export const BODY_CONDITION_SCORES = [
    { value: 1, label: 'Émacié', description: 'Très maigre, côtes très saillantes' },
    { value: 2, label: 'Mince', description: 'Côtes visibles, peu de graisse' },
    { value: 3, label: 'Modéré', description: 'État normal, côtes palpables' },
    { value: 4, label: 'Gras', description: 'Encolure épaisse, côtes difficilement palpables' },
    { value: 5, label: 'Obèse', description: 'Très gras, dépôts graisseux importants' },
];

// ===========================
// 3. IMAGE ANALYSIS HELPERS
// ===========================

/**
 * Extrait les dimensions du cheval depuis l'image avec IA
 * @param {HTMLImageElement} image - Image capturée
 * @param {Object} calibration - { height: number (cm), morphotype: string }
 * @returns {Promise<Object>} { pixelHeight, pixelLength, pixelDepth, confidence }
 */
export async function extractHorseDimensions(image, calibration) {
    // Import dynamique pour éviter de charger TensorFlow.js au démarrage
    const { analyzeHorseImage } = await import('./imageAnalyzer.js');

    try {
        // Analyse réelle avec TensorFlow.js
        const analysis = await analyzeHorseImage(image, calibration);

        return {
            pixelHeight: analysis.pixelHeight,
            pixelLength: analysis.pixelLength,
            pixelDepth: analysis.pixelDepth,
            confidence: analysis.confidence,
            boundingBox: analysis.boundingBox,
            detectedClass: analysis.detectedClass,
        };
    } catch (error) {
        console.error('Erreur analyse IA, fallback sur estimation par défaut:', error);

        // Fallback : estimation basée sur les proportions moyennes
        // (utilisé si l'IA échoue ou si l'image est de mauvaise qualité)
        const imageHeight = image.height || image.naturalHeight || 800;
        const imageWidth = image.width || image.naturalWidth || 600;

        return {
            pixelHeight: imageHeight * 0.6, // Le cheval occupe ~60% de la hauteur
            pixelLength: imageWidth * 0.5,   // Le cheval occupe ~50% de la largeur
            pixelDepth: imageHeight * 0.24,  // Profondeur ≈ 40% de la hauteur du cheval
            confidence: 0.5, // Faible confiance car estimation par défaut
            boundingBox: null,
            detectedClass: 'fallback',
        };
    }
}

/**
 * Calcule le facteur d'échelle pixel → cm
 * @param {number} realHeight - Taille au garrot en cm
 * @param {number} pixelHeight - Hauteur en pixels dans l'image
 * @returns {number} Scale ratio
 */
export function calculateScaleRatio(realHeight, pixelHeight) {
    if (!pixelHeight || pixelHeight === 0) {
        throw new Error('Hauteur en pixels invalide');
    }
    return realHeight / pixelHeight;
}

// ===========================
// 4. WEIGHT CALCULATION
// ===========================

/**
 * Formule de Crevat/Carroll
 * Weight (kg) = (PT² × Length) / 11877
 * 
 * @param {Object} measurements - Mesures du cheval
 * @param {number} measurements.realDepth - Profondeur réelle en cm (garrot → sangle)
 * @param {number} measurements.realLength - Longueur réelle en cm (épaule → fesse)
 * @param {string} morphotype - Code du morphotype (BLOOD, SPORT, etc.)
 * @param {number} bodyConditionScore - Note d'état (1-5, optionnel)
 * @returns {number} Poids estimé en kg
 */
export function calculateWeight(measurements, morphotype, bodyConditionScore = 3) {
    const { realDepth, realLength } = measurements;

    // Récupération du coefficient K
    const morphoData = MORPHOTYPES[morphotype];
    if (!morphoData) {
        throw new Error(`Morphotype invalide: ${morphotype}`);
    }

    const K = morphoData.coefficient;

    // Calcul du Périmètre Thoracique (PT) estimé
    // PT = Profondeur × K × 2.5 (constante d'approximation ellipse)
    const PT = realDepth * K * 2.5;

    // Formule de Crevat/Carroll
    let weight = (PT * PT * realLength) / 11877;

    // Ajustement selon le Body Condition Score
    // Note 3 = référence (100%)
    // Note 1 = -15%, Note 2 = -7%, Note 4 = +7%, Note 5 = +15%
    const bcsAdjustment = {
        1: 0.85,
        2: 0.93,
        3: 1.00,
        4: 1.07,
        5: 1.15,
    };

    weight *= bcsAdjustment[bodyConditionScore] || 1.00;

    // Arrondir à l'entier
    return Math.round(weight);
}

/**
 * Pipeline complet d'estimation de poids
 * @param {HTMLImageElement} image - Image capturée
 * @param {Object} horse - { height: number, morphotype: string }
 * @param {number} bodyConditionScore - Note d'état (optionnel)
 * @returns {Promise<Object>} { weight, confidence, measurements }
 */
export async function estimateWeightFromPhoto(image, horse, bodyConditionScore = 3) {
    try {
        // 1. Extraction des dimensions en pixels
        const pixelDimensions = await extractHorseDimensions(image, horse);

        // 2. Calcul du facteur d'échelle
        const scaleRatio = calculateScaleRatio(horse.height, pixelDimensions.pixelHeight);

        // 3. Conversion pixels → centimètres
        const realDepth = pixelDimensions.pixelDepth * scaleRatio;
        const realLength = pixelDimensions.pixelLength * scaleRatio;

        // 4. Calcul du poids
        const weight = calculateWeight(
            { realDepth, realLength },
            horse.morphotype,
            bodyConditionScore
        );

        // 5. Estimation de la confiance (basée sur la qualité de l'image)
        // Ici simplifié, devrait être calculé par le modèle ML
        const confidence = 0.85; // 85% de confiance

        return {
            weight,
            confidence,
            measurements: {
                realDepth: Math.round(realDepth),
                realLength: Math.round(realLength),
                pixelDimensions,
                scaleRatio,
            },
        };
    } catch (error) {
        console.error('Erreur estimation poids:', error);
        throw error;
    }
}

// ===========================
// 5. WEIGHT HISTORY HELPERS
// ===========================

/**
 * Calcule les statistiques de l'historique de poids
 * @param {Array} weightEntries - Liste des entrées de poids
 * @returns {Object} Stats (current, min, max, avg, trend)
 */
export function calculateWeightStats(weightEntries) {
    if (!weightEntries || weightEntries.length === 0) {
        return null;
    }

    // Trier par date décroissante
    const sorted = [...weightEntries].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    const current = sorted[0].value;
    const values = weightEntries.map(e => e.value);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

    // Calcul de la tendance (pente sur les 30 derniers jours)
    let trend = 0;
    if (sorted.length >= 2) {
        const recent = sorted.slice(0, Math.min(5, sorted.length));
        const first = recent[recent.length - 1];
        const last = recent[0];

        const daysDiff = (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24);
        if (daysDiff > 0) {
            trend = ((last.value - first.value) / daysDiff) * 30; // kg/mois
        }
    }

    return {
        current,
        min,
        max,
        avg,
        trend: Math.round(trend * 10) / 10, // 1 décimale
    };
}

/**
 * Valide si les données de calibration sont complètes
 * @param {Object} horse - Objet cheval
 * @returns {Object} { valid: boolean, missingFields: Array }
 */
export function validateCalibration(horse) {
    const missingFields = [];

    if (!horse.height || horse.height < 50 || horse.height > 220) {
        missingFields.push('height');
    }

    if (!horse.morphotype || !MORPHOTYPES[horse.morphotype]) {
        missingFields.push('morphotype');
    }

    return {
        valid: missingFields.length === 0,
        missingFields,
    };
}

/**
 * Récupère le poids actuel d'un cheval (dernière pesée enregistrée)
 * @param {string} horseId - ID du cheval
 * @returns {number|null} Poids en kg ou null si aucune pesée
 */
export function getCurrentWeight(horseId) {
    const key = `weightHistory_${horseId}`;
    const history = JSON.parse(localStorage.getItem(key) || '[]');

    if (history.length === 0) {
        return null;
    }

    // Trier par date décroissante et prendre le plus récent
    const sorted = [...history].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    return sorted[0].value;
}
