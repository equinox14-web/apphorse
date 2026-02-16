/**
 * Module OCR pour Scanner d'Étiquettes d'Aliments
 * Utilise Tesseract.js pour extraire les valeurs nutritionnelles
 */

import Tesseract from 'tesseract.js';
import { estimateNutritionFromAnalysis } from './nutritionCalculator';

// Cache du worker Tesseract pour améliorer les performances
let tesseractWorker = null;

/**
 * Initialise le worker Tesseract (une seule fois)
 */
async function initTesseractWorker() {
    if (tesseractWorker) {
        return tesseractWorker;
    }

    console.log('🔄 Initialisation de Tesseract.js...');

    tesseractWorker = await Tesseract.createWorker('fra', 1, {
        logger: (m) => {
            if (m.status === 'recognizing text') {
                console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
        },
    });

    console.log('✅ Tesseract.js prêt');
    return tesseractWorker;
}

/**
 * Extrait le texte d'une image avec Tesseract.js
 * @param {File|Blob|string} image - Image à analyser
 * @returns {Promise<string>} Texte extrait
 */
export async function extractTextFromImage(image) {
    try {
        const worker = await initTesseractWorker();

        const { data: { text } } = await worker.recognize(image);
        console.log('📝 Texte extrait:', text);

        return text;
    } catch (error) {
        console.error('❌ Erreur OCR:', error);
        throw new Error('Impossible d\'extraire le texte de l\'image');
    }
}

/**
 * Parse les valeurs nutritionnelles depuis le texte OCR
 * Recherche les patterns typiques des étiquettes (Analyse Garantie)
 * @param {string} text - Texte extrait par OCR
 * @returns {Object} { mat, cellulose, cendres, graisse, matiereSèche, found }
 */
export function parseNutritionalValues(text) {
    const result = {
        mat: null,          // Matières Azotées Totales (protéines)
        cellulose: null,    // Cellulose brute
        cendres: null,      // Cendres brutes
        graisse: null,      // Matières grasses brutes
        matiereSèche: null, // Matière sèche
        calcium: null,
        phosphore: null,
        found: false,
    };

    // Normaliser le texte (minuscules, supprimer accents)
    const normalizedText = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    // Patterns de recherche (regex)
    const patterns = {
        // MAT : Matières Azotées Totales / Protéines
        mat: [
            /mati[eè]res?\s+azot[eé]es?\s+totales?.*?(\d+(?:[.,]\d+)?)\s*%/i,
            /protéines?\s+brutes?.*?(\d+(?:[.,]\d+)?)\s*%/i,
            /mat\s*:?\s*(\d+(?:[.,]\d+)?)\s*%/i,
            /crude\s+protein.*?(\d+(?:[.,]\d+)?)\s*%/i,
        ],
        // Cellulose
        cellulose: [
            /cellulose\s+brute.*?(\d+(?:[.,]\d+)?)\s*%/i,
            /fibres?\s+brutes?.*?(\d+(?:[.,]\d+)?)\s*%/i,
            /crude\s+fi[bv]re.*?(\d+(?:[.,]\d+)?)\s*%/i,
        ],
        // Cendres
        cendres: [
            /cendres?\s+brutes?.*?(\d+(?:[.,]\d+)?)\s*%/i,
            /mati[eè]res?\s+min[eé]rales?.*?(\d+(?:[.,]\d+)?)\s*%/i,
            /ash.*?(\d+(?:[.,]\d+)?)\s*%/i,
        ],
        // Graisses
        graisse: [
            /mati[eè]res?\s+grasses?\s+brutes?.*?(\d+(?:[.,]\d+)?)\s*%/i,
            /lipides?.*?(\d+(?:[.,]\d+)?)\s*%/i,
            /crude\s+fat.*?(\d+(?:[.,]\d+)?)\s*%/i,
        ],
        // Matière sèche
        matiereSèche: [
            /mati[eè]re\s+s[eè]che.*?(\d+(?:[.,]\d+)?)\s*%/i,
            /humidi(te|ty).*?(\d+(?:[.,]\d+)?)\s*%/i, // Inverser pour MS
        ],
        // Calcium
        calcium: [
            /calcium.*?(\d+(?:[.,]\d+)?)\s*(?:g\/kg|%)/i,
            /ca\s*:?\s*(\d+(?:[.,]\d+)?)\s*(?:g\/kg|%)/i,
        ],
        // Phosphore
        phosphore: [
            /phosphore.*?(\d+(?:[.,]\d+)?)\s*(?:g\/kg|%)/i,
            /p\s*:?\s*(\d+(?:[.,]\d+)?)\s*(?:g\/kg|%)/i,
        ],
    };

    // Extraire chaque valeur
    for (const [key, regexList] of Object.entries(patterns)) {
        for (const regex of regexList) {
            const match = normalizedText.match(regex);
            if (match) {
                let value = parseFloat(match[1].replace(',', '.'));

                // Cas spécial : humidité → matière sèche
                if (key === 'matiereSèche' && regex.source.includes('humidi')) {
                    value = 100 - value;
                }

                result[key] = value;
                result.found = true;
                break; // Passer à la valeur suivante
            }
        }
    }

    return result;
}

/**
 * Extrait la marque et le nom du produit depuis le texte OCR
 * @param {string} text - Texte extrait
 * @returns {Object} { brand, name }
 */
export function extractProductInfo(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 2);

    // Marques connues (à enrichir)
    const knownBrands = [
        'reverdy', 'royal horse', 'horse master', 'paskacheval',
        'destrier', 'cavalor', 'versele-laga', 'dynavena',
        'dodson', 'agrobs', 'equi-form'
    ];

    let brand = 'Générique';
    let name = '';

    // Rechercher la marque dans les premières lignes
    for (const line of lines.slice(0, 10)) {
        const lowerLine = line.toLowerCase();
        for (const knownBrand of knownBrands) {
            if (lowerLine.includes(knownBrand)) {
                brand = knownBrand.split(' ').map(w =>
                    w.charAt(0).toUpperCase() + w.slice(1)
                ).join(' ');
                break;
            }
        }
        if (brand !== 'Générique') break;
    }

    // Le nom du produit est souvent en haut, avant "Analyse Garantie"
    const analyseIndex = lines.findIndex(line =>
        line.toLowerCase().includes('analyse') ||
        line.toLowerCase().includes('composition')
    );

    if (analyseIndex > 0) {
        // Prendre la ligne la plus longue avant "Analyse Garantie"
        const candidates = lines.slice(0, analyseIndex)
            .filter(line => line.length > 5 && line.length < 50)
            .sort((a, b) => b.length - a.length);

        if (candidates.length > 0) {
            name = candidates[0].trim();
        }
    }

    // Fallback : prendre la première ligne non vide
    if (!name) {
        name = lines[0]?.trim() || 'Aliment sans nom';
    }

    return { brand, name };
}

/**
 * Pipeline complet : OCR → Parsing → Estimation UFC/MADC
 * @param {File|Blob|string} image - Image de l'étiquette
 * @returns {Promise<Object>} Aliment complet avec valeurs nutritionnelles
 */
export async function scanFeedLabel(image) {
    console.log('📸 Scan de l\'étiquette...');

    // 1. Extraction du texte
    const text = await extractTextFromImage(image);

    // 2. Parsing des valeurs nutritionnelles
    const nutritionalValues = parseNutritionalValues(text);

    if (!nutritionalValues.found) {
        throw new Error(
            'Aucune valeur nutritionnelle détectée. ' +
            'Assurez-vous que l\'image contient la section "Analyse Garantie".'
        );
    }

    // 3. Extraction du nom et de la marque
    const productInfo = extractProductInfo(text);

    // 4. Estimation UFC/MADC avec le fallback INRA
    let ufc = null;
    let madc = null;

    if (nutritionalValues.cellulose && nutritionalValues.mat) {
        const estimated = estimateNutritionFromAnalysis(
            nutritionalValues.cellulose,
            nutritionalValues.mat,
            nutritionalValues.cendres || 8
        );
        ufc = estimated.ufc;
        madc = estimated.madc;
    }

    // 5. Construction de l'objet aliment
    const feed = {
        id: `custom-${Date.now()}`,
        category: 'MELANGE', // Par défaut
        brand: productInfo.brand,
        name: productInfo.name,
        density: 0.55, // Densité par défaut pour granulés

        // Valeurs extraites
        ufc: ufc || 0.85, // Fallback
        madc: madc || 85,
        matiereSèche: nutritionalValues.matiereSèche || 88,
        cellulose: nutritionalValues.cellulose || 12,
        cendres: nutritionalValues.cendres || 8,

        // Minéraux
        calcium: nutritionalValues.calcium || 9,
        phosphore: nutritionalValues.phosphore || 5,

        // Métadonnées
        scannedAt: new Date().toISOString(),
        rawText: text,
        isEstimated: !ufc, // True si UFC estimé via formule
    };

    console.log('✅ Aliment scanné:', feed);
    return feed;
}

/**
 * Libère les ressources Tesseract
 */
export async function disposeTesseract() {
    if (tesseractWorker) {
        await tesseractWorker.terminate();
        tesseractWorker = null;
        console.log('🗑️ Tesseract worker libéré');
    }
}

export default {
    extractTextFromImage,
    parseNutritionalValues,
    extractProductInfo,
    scanFeedLabel,
    disposeTesseract,
};
