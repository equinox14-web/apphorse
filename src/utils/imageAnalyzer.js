/**
 * Module d'Analyse d'Image par IA pour l'Estimation de Poids
 * Utilise TensorFlow.js avec COCO-SSD et Body-Pix
 */

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as bodyPix from '@tensorflow-models/body-pix';

// Cache des modèles chargés
let cocoModel = null;
let bodyPixModel = null;
let modelsLoading = false;

/**
 * Charge les modèles TensorFlow.js (une seule fois)
 */
export async function loadModels() {
    if (cocoModel && bodyPixModel) {
        return { cocoModel, bodyPixModel };
    }

    if (modelsLoading) {
        // Attendre que le chargement en cours se termine
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (cocoModel && bodyPixModel) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
        return { cocoModel, bodyPixModel };
    }

    modelsLoading = true;

    try {
        console.log('🔄 Chargement des modèles TensorFlow.js...');

        // Charger COCO-SSD pour détecter le cheval (ou tout animal)
        cocoModel = await cocoSsd.load({
            base: 'lite_mobilenet_v2', // Version légère pour mobile
        });
        console.log('✅ COCO-SSD chargé');

        // Charger Body-Pix pour segmentation (optionnel, plus précis)
        bodyPixModel = await bodyPix.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            multiplier: 0.75,
            quantBytes: 2,
        });
        console.log('✅ Body-Pix chargé');

        modelsLoading = false;
        return { cocoModel, bodyPixModel };
    } catch (error) {
        console.error('❌ Erreur chargement modèles:', error);
        modelsLoading = false;
        throw error;
    }
}

/**
 * Analyse une image et extrait les dimensions du cheval
 * @param {HTMLImageElement | HTMLCanvasElement} image - Image à analyser
 * @param {Object} calibration - { height: number, morphotype: string }
 * @returns {Promise<Object>} { pixelHeight, pixelLength, pixelDepth, confidence, boundingBox }
 */
export async function analyzeHorseImage(image, calibration) {
    console.log('📸 Analyse de l\'image...');

    try {
        // Charger les modèles si pas encore fait
        const { cocoModel: model } = await loadModels();

        // Détection d'objets avec COCO-SSD
        const predictions = await model.detect(image);
        console.log('🔍 Prédictions COCO-SSD:', predictions);

        // Rechercher un cheval, un animal, ou tout objet de grande taille
        let horsePrediction = predictions.find(p =>
            p.class === 'horse' ||
            p.class === 'cow' ||
            p.class === 'sheep' ||
            p.class === 'dog' ||
            p.class === 'cat' ||
            p.class === 'person' // Parfois détecté pour grands animaux
        );

        // Si pas trouvé, prendre la plus grande détection
        if (!horsePrediction && predictions.length > 0) {
            horsePrediction = predictions.reduce((prev, current) => {
                const prevArea = prev.bbox[2] * prev.bbox[3];
                const currentArea = current.bbox[2] * current.bbox[3];
                return currentArea > prevArea ? current : prev;
            });
            console.log('⚠️ Aucun cheval détecté, utilisation de:', horsePrediction.class);
        }

        if (!horsePrediction) {
            throw new Error('Aucun animal détecté dans l\'image. Placez le cheval de profil dans le cadre.');
        }

        // Extraire le bounding box [x, y, width, height]
        const [x, y, width, height] = horsePrediction.bbox;
        const confidence = horsePrediction.score;

        console.log(`📐 Bounding Box: ${Math.round(width)}x${Math.round(height)}px (confidence: ${Math.round(confidence * 100)}%)`);

        // ANALYSE MORPHOMÉTRIQUE
        // Le cheval est détecté, maintenant on extrait les dimensions anatomiques

        // 1. Hauteur (Garrot → Sol) = hauteur du bounding box
        const pixelHeight = height;

        // 2. Longueur (Épaule → Fesse) ≈ 85% de la largeur du bbox
        // (car le bbox inclut la tête et la queue qui dépassent du corps)
        const pixelLength = width * 0.85;

        // 3. Profondeur (Garrot → Passage de sangle)
        // Estimation basée sur les proportions anatomiques classiques
        // Chez un cheval de profil, la profondeur thoracique ≈ 40% de la hauteur
        const pixelDepth = height * 0.40;

        // Raffinage avec analyse de la silhouette (si Body-Pix disponible)
        let refinedDimensions = null;
        try {
            if (bodyPixModel) {
                refinedDimensions = await refineWithBodyPix(image, { x, y, width, height });
            }
        } catch (error) {
            console.warn('⚠️ Body-Pix raffinement échoué, utilisation bbox brut:', error);
        }

        const result = {
            pixelHeight: refinedDimensions?.pixelHeight || pixelHeight,
            pixelLength: refinedDimensions?.pixelLength || pixelLength,
            pixelDepth: refinedDimensions?.pixelDepth || pixelDepth,
            confidence,
            boundingBox: { x, y, width, height },
            detectedClass: horsePrediction.class,
            rawPredictions: predictions.length,
        };

        console.log('✅ Analyse terminée:', result);
        return result;

    } catch (error) {
        console.error('❌ Erreur analyse image:', error);
        throw error;
    }
}

/**
 * Raffine les dimensions en utilisant Body-Pix pour segmentation plus précise
 * @param {HTMLImageElement} image 
 * @param {Object} bbox - { x, y, width, height }
 * @returns {Promise<Object>} Dimensions raffinées
 */
async function refineWithBodyPix(image, bbox) {
    console.log('🔬 Raffinement avec Body-Pix...');

    try {
        const segmentation = await bodyPixModel.segmentPerson(image, {
            flipHorizontal: false,
            internalResolution: 'medium',
            segmentationThreshold: 0.5,
        });

        // Créer un masque binaire de la zone segmentée
        const { data, width, height } = segmentation;

        // Trouver les limites réelles du sujet dans le bbox
        let minX = bbox.width, maxX = 0;
        let minY = bbox.height, maxY = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                if (data[index] === 1) { // Pixel appartient au sujet
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        const refinedWidth = maxX - minX;
        const refinedHeight = maxY - minY;

        console.log(`✨ Dimensions raffinées: ${refinedWidth}x${refinedHeight}px`);

        return {
            pixelHeight: refinedHeight,
            pixelLength: refinedWidth * 0.85,
            pixelDepth: refinedHeight * 0.40,
        };
    } catch (error) {
        console.warn('Body-Pix raffinement échoué:', error);
        return null;
    }
}

/**
 * Dessine le bounding box sur un canvas (pour debug)
 * @param {HTMLCanvasElement} canvas 
 * @param {Object} boundingBox 
 */
export function drawBoundingBox(canvas, boundingBox) {
    const ctx = canvas.getContext('2d');
    const { x, y, width, height } = boundingBox;

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    // Points anatomiques estimés
    ctx.fillStyle = '#10b981';
    ctx.font = '14px sans-serif';

    // Garrot (haut au milieu)
    const garrotX = x + width / 2;
    const garrotY = y;
    ctx.beginPath();
    ctx.arc(garrotX, garrotY, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillText('Garrot', garrotX + 10, garrotY);

    // Passage de sangle (bas au milieu)
    const sangleX = x + width / 2;
    const sangleY = y + height * 0.40; // 40% vers le bas
    ctx.beginPath();
    ctx.arc(sangleX, sangleY, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillText('Sangle', sangleX + 10, sangleY);

    // Épaule (avant, milieu hauteur)
    const epauleX = x + width * 0.15;
    const epauleY = y + height / 2;
    ctx.beginPath();
    ctx.arc(epauleX, epauleY, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillText('Épaule', epauleX + 10, epauleY);

    // Fesse (arrière, milieu hauteur)
    const fesseX = x + width * 0.85;
    const fesseY = y + height / 2;
    ctx.beginPath();
    ctx.arc(fesseX, fesseY, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillText('Fesse', fesseX + 10, fesseY);
}

/**
 * Précharge les modèles au démarrage de l'app (optionnel)
 */
export function preloadModels() {
    loadModels().catch(err => {
        console.warn('Préchargement modèles échoué (sera chargé à la demande):', err);
    });
}

/**
 * Libère la mémoire des modèles (utile pour libérer RAM)
 */
export function disposeModels() {
    if (cocoModel) {
        cocoModel = null;
    }
    if (bodyPixModel) {
        bodyPixModel.dispose();
        bodyPixModel = null;
    }
    console.log('🗑️ Modèles TensorFlow.js libérés');
}
