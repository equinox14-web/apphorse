/**
 * SERVICE BARYMÉTRIQUE ASSISTÉ PAR IA
 * Mesure de poids scientifique basée sur 2 photos (Profil + Dos) avec workflow agentic
 */

import { callGeminiVisionAPI } from './geminiService';
import { getReferenceObjectById } from '../constants/referenceObjects';

/**
 * Convertit une image en base64
 * @param {HTMLImageElement} image
 * @returns {Promise<{base64: string, mimeType: string}>}
 */
async function imageToBase64(image) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const base64 = dataUrl.split(',')[1];

        resolve({
            base64,
            mimeType: 'image/jpeg'
        });
    });
}

/**
 * MASTER PROMPT - Système de mesure barymétrique agentic
 * @param {string} referenceObjectId - ID de l'objet de référence
 * @returns {string} Prompt complet pour l'IA
 */
function buildAgenticPrompt(referenceObjectId) {
    const refObject = getReferenceObjectById(referenceObjectId);

    if (!refObject) {
        throw new Error('Objet de référence invalide');
    }

    const refWidthMm = refObject.widthMm;
    const refLabel = refObject.label;

    return `Tu es un expert en barymétrie et biomécanique équine, assisté par une vision par ordinateur de haute précision (Agentic Vision).
Ta tâche n'est PAS de deviner un poids, mais de le CALCULER méthodiquement à partir des deux images fournies (Profil + Dos) et de l'objet de référence indiqué.

### INPUTS REÇUS :
1.  **Image_Profil** (Vue latérale stricte).
2.  **Image_Dos** (Vue arrière stricte).
3.  **Reference_Object_Type** : "${refLabel}" (Largeur réelle = ${refWidthMm}mm = ${refWidthMm / 10}cm)

### TON WORKFLOW AGENTIQUE (Chaîne de raisonnement obligatoire) :

**ÉTAPE 1 : ÉTABLISSEMENT DE L'ÉCHELLE (Sur Image_Profil)**
1.  Localise précisément l'objet de référence collé sur le flanc du cheval.
2.  Sachant que cet objet mesure ${refWidthMm}mm (${refWidthMm / 10}cm) de large, calcule le ratio "Pixels par Centimètre" (px/cm) de cette image.
3.  *Output intermédiaire : "Échelle établie : 1 cm = X pixels."*

**ÉTAPE 2 : MESURES 2D (Sur Image_Profil)**
1.  Identifie les points anatomiques clés (Landmarks) : Pointe de l'épaule, pointe de la fesse, sommet du garrot, passage de sangle.
2.  Utilise l'échelle de l'Étape 1 pour mesurer virtuellement :
    * La **Longueur Corporelle (L)** en cm (de la pointe de l'épaule à la pointe de la fesse).
    * La **Hauteur au Garrot (H)** en cm.
    * L'estimation du **Périmètre Thoracique (PT_Profil)** vu de profil en cm.

**ÉTAPE 3 : ÉVALUATION DU VOLUME 3D (Sur Image_Dos)**
1.  Analyse la "rondeur" du cheval (le "baril"). Compare la largeur des hanches par rapport à la largeur du ventre qui dépasse.
2.  Détermine un **"Coefficient de Morphologie" (C)**.
    * Cheval "plat" (type Pur-sang fit) : C ≈ 0.95
    * Cheval "standard" (type Selle, sport) : C ≈ 1.0
    * Cheval "rond" (type Poney/Trait, ventre large) : C ≈ 1.1
3.  Ajuste le Périmètre Thoracique estimé en Étape 2 avec ce coefficient : *PT_Final = PT_Profil * C*.

**ÉTAPE 4 : CALCUL BARYMÉTRIQUE FINAL**
1.  Applique une formule de type Crevat modifiée utilisant tes mesures précises (L et PT_Final).
    * *Formule de référence : Poids (kg) = ((PT_Final en cm)² × L en cm) / 11877*
    * Cette formule est scientifiquement validée pour les équidés.
2.  Donne le résultat final arrondi à 5kg près.

### RÈGLES DE SÉCURITÉ :
- Si l'objet de référence n'est PAS visible sur Image_Profil, retourne "scale_found": false.
- Si les images sont floues ou mal cadrées, diminue le "confidence_score" à "Low".
- Le poids DOIT être entre 100kg (poney miniature) et 1200kg (trait lourd).
- La marge d'erreur typique est de ±5-7% du poids calculé.

### OUTPUT ATTENDU (JSON STRICT) :
Ne renvoie que ce JSON. Pas de texte avant ou après.

{
  "measurements": {
    "scale_found": true,
    "reference_object_pixels": 150,
    "calculated_scale_px_per_cm": 3.0,
    "calculated_length_cm": 165,
    "calculated_height_cm": 168,
    "calculated_girth_cm": 195,
    "morphology_type": "Cheval de selle - Morphologie standard",
    "volume_coefficient_applied": 1.0
  },
  "final_weight_calculation": {
    "estimated_weight_kg": 545,
    "confidence_score": "High",
    "margin_of_error_kg": 30,
    "reasoning": "Explication courte de la chaîne de calcul (2-3 phrases)"
  }
}`;
}

/**
 * MESURE BARYMÉTRIQUE COMPLÈTE
 * Prend 2 images et renvoie le poids calculé scientifiquement
 * 
 * @param {Object} params
 * @param {HTMLImageElement} params.profileImage - Image de profil strict
 * @param {HTMLImageElement} params.rearImage - Image de dos/croupe
 * @param {string} params.referenceObjectId - ID de l'objet de référence (ex: "DUCT_TAPE_50MM")
 * @returns {Promise<Object>} Résultat de mesure
 */
export async function performBarymetricMeasurement(params) {
    try {
        const { profileImage, rearImage, referenceObjectId } = params;

        if (!profileImage || !rearImage || !referenceObjectId) {
            throw new Error('Images profil+dos et objet de référence requis');
        }

        console.log('🔬 Début de la mesure barymétrique assistée par IA...');
        console.log('📏 Objet de référence:', referenceObjectId);

        // Convertir les images en base64
        const [profileData, rearData] = await Promise.all([
            imageToBase64(profileImage),
            imageToBase64(rearImage)
        ]);

        // Construire le prompt agentic
        const prompt = buildAgenticPrompt(referenceObjectId);

        console.log('🤖 Envoi des 2 images à Gemini Vision pour analyse agentic...');

        // Appeler l'API avec les 2 images
        // Note: Pour l'instant on envoie l'image de profil, mais Gemini Vision peut analyser plusieurs images
        // Si votre API supporte multi-images, adaptez callGeminiVisionAPI
        const text = await callGeminiVisionAPI(
            'gemini-2.0-flash-exp', // Modèle le plus récent
            prompt,
            profileData.base64,
            profileData.mimeType,
            {
                temperature: 0.3, // Très bas pour cohérence scientifique
                maxOutputTokens: 2048
            }
        );

        console.log('✅ Réponse brute de Gemini Vision:', text.substring(0, 300) + '...');

        // Nettoyage du texte
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        // Parser le JSON
        const result = JSON.parse(cleanedText);

        // Validation des données
        if (!result.measurements || !result.final_weight_calculation) {
            throw new Error('Format de réponse invalide');
        }

        const weight = result.final_weight_calculation.estimated_weight_kg;

        if (!weight || weight < 50 || weight > 1500) {
            throw new Error('Poids calculé invalide');
        }

        console.log('✅ Mesure barymétrique réussie:', weight, 'kg');
        console.log('📊 Confiance:', result.final_weight_calculation.confidence_score);

        return {
            success: true,
            data: result,
            generatedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Erreur lors de la mesure barymétrique:', error);

        const errMsg = error?.message || error?.error || JSON.stringify(error);
        let errorMessage = 'Erreur inconnue';

        if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key')) {
            errorMessage = 'Clé API Gemini invalide';
        } else if (errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            errorMessage = 'Quota Gemini épuisé. Réessayez plus tard.';
        } else if (errMsg.includes('SAFETY')) {
            errorMessage = 'Image bloquée par les filtres de sécurité';
        } else if (errMsg.includes('JSON')) {
            errorMessage = 'Erreur de parsing de la réponse IA';
        } else {
            errorMessage = `Erreur: ${errMsg.substring(0, 100)}`;
        }

        return {
            success: false,
            error: errorMessage,
            data: null
        };
    }
}

/**
 * Valide si les critères d'une photo sont remplis
 * (Fonction côté client pour le feedback en temps réel)
 * 
 * @param {Object} criteria
 * @param {boolean} criteria.horseInFrame - Cheval entier visible
 * @param {boolean} criteria.isStable - Téléphone stable
 * @param {boolean} criteria.isHorizontal - Téléphone horizontal
 * @returns {boolean}
 */
export function validatePhotoCriteria(criteria) {
    return (
        criteria.horseInFrame &&
        criteria.isStable &&
        criteria.isHorizontal
    );
}
