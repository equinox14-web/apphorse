// Configuration de l'API Gemini via REST directement (v1)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/models';

if (!API_KEY) {
    console.error('❌ VITE_GEMINI_API_KEY non définie dans .env');
}

/**
 * Appel direct à l'API REST Gemini v1
 * @param {string} modelName - Nom du modèle
 * @param {string} prompt - Texte du prompt
 * @returns {Promise<string>} Réponse générée
 */
async function callGeminiAPI(modelName, prompt, config = {}) {
    const url = `${API_ENDPOINT}/${modelName}:generateContent?key=${API_KEY}`;

    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            temperature: config.temperature || 0.7,
            topP: config.topP || 0.8,
            maxOutputTokens: config.maxOutputTokens || 4096,  // Défaut augmenté pour Gemini 2.5
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Réponse invalide de l\'API');
    }

    return data.candidates[0].content.parts[0].text;
}

/**
 * Appel à l'API Gemini avec image (Vision multimodal)
 * @param {string} modelName - Nom du modèle
 * @param {string} prompt - Texte du prompt
 * @param {string} imageBase64 - Image en base64
 * @param {string} mimeType - Type MIME de l'image (image/jpeg, image/png, etc.)
 * @returns {Promise<string>} Réponse générée
 */
async function callGeminiVisionAPI(modelName, prompt, imageBase64, mimeType = 'image/jpeg', config = {}) {
    const url = `${API_ENDPOINT}/${modelName}:generateContent?key=${API_KEY}`;

    const requestBody = {
        contents: [{
            parts: [
                { text: prompt },
                {
                    inline_data: {
                        mime_type: mimeType,
                        data: imageBase64
                    }
                }
            ]
        }],
        generationConfig: {
            temperature: config.temperature || 0.4, // Plus bas pour analyse objective
            topP: config.topP || 0.8,
            maxOutputTokens: config.maxOutputTokens || 2048,
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Réponse invalide de l\'API');
    }

    return data.candidates[0].content.parts[0].text;
}

/**
 * Estime le poids d'un cheval à partir d'une photo et de sa taille
 * @param {Object} params - Paramètres d'estimation
 * @param {string} params.imageBase64 - Image en base64 (sans préfixe data:image/...)
 * @param {string} params.mimeType - Type MIME de l'image
 * @param {number} params.heightCm - Taille au garrot en cm
 * @param {string} params.breed - Race du cheval (optionnel)
 * @returns {Promise<Object>} Estimation du poids
 */
export async function estimateWeightFromImage(params) {
    try {
        const { imageBase64, mimeType = 'image/jpeg', heightCm, breed = 'Non précisée' } = params;

        if (!imageBase64 || !heightCm) {
            throw new Error('Image et taille au garrot requises');
        }

        // Construction du prompt expert
        const prompt = `Tu es un expert en biomécanique équine.
Ta tâche : Estimer le poids du cheval à partir de sa PHOTO et de sa TAILLE connue.

INPUTS :
1. Image : Photo du cheval de profil.
2. Donnée : Taille au garrot = ${heightCm} cm.
3. Race déclarée : ${breed}

RÈGLE DE CALCUL OBLIGATOIRE :
Tu ne dois pas "deviner" le poids au hasard. Tu dois appliquer cette logique déductive :
1. Observe la morphologie (Lourd, Sport, Fin).
2. Estime la "Note d'État Corporel" (Body Condition Score) de 1 à 5.
3. Utilise la TAILLE FOURNIE (${heightCm} cm) comme étalon d'échelle.
   - Si Taille = 165cm et type Sport (Selle Français) -> Poids de base environ 500-550kg.
   - Ajuste ensuite selon si le cheval est maigre (-50kg) ou gros (+50kg) sur la photo.

INTERDICTIONS :
- Interdit de donner un poids inférieur à 350kg si la taille est > 150cm.
- Interdit de donner un poids > 800kg si ce n'est pas un cheval de Trait.

FORMAT DE RÉPONSE OBLIGATOIRE (JSON STRICT) :
{
  "estimatedWeight": 500,
  "morphologyType": "Sport/Lourd/Fin",
  "bodyConditionScore": 3,
  "confidence": "Haute/Moyenne/Faible",
  "reasoning": "Explication courte du calcul (2-3 phrases)",
  "recommendations": "Conseils si surpoids ou sous-poids détecté"
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

        console.log('🤖 Estimation du poids avec Gemini Vision...');
        const text = await callGeminiVisionAPI('gemini-2.0-flash', prompt, imageBase64, mimeType, {
            temperature: 0.4,
            maxOutputTokens: 1024
        });

        console.log('✅ Réponse brute de Gemini Vision:', text.substring(0, 200) + '...');

        // Nettoyage du texte
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        // Parser le JSON
        const estimation = JSON.parse(cleanedText);

        // Validation des données
        if (!estimation.estimatedWeight || estimation.estimatedWeight < 50 || estimation.estimatedWeight > 1500) {
            throw new Error('Poids estimé invalide');
        }

        console.log('✅ Estimation réussie:', estimation.estimatedWeight, 'kg');
        return {
            success: true,
            data: estimation,
            generatedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Erreur lors de l\'estimation du poids:', error);

        const errMsg = error?.message || error?.error || JSON.stringify(error);
        let errorMessage = 'Erreur inconnue';

        if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key')) {
            errorMessage = 'Clé API Gemini invalide';
        } else if (errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            errorMessage = 'Quota Gemini épuisé. Réessayez plus tard.';
        } else if (errMsg.includes('SAFETY')) {
            errorMessage = 'Image bloquée par les filtres de sécurité';
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
 * Génère un planning d'entraînement personnalisé avec Gemini
 * @param {Object} params - Paramètres du planning
 * @param {Object} params.horse - Données du cheval
 * @param {string} params.discipline - Discipline équestre
 * @param {string} params.level - Niveau du cheval
 * @param {number} params.frequency - Nombre de séances par semaine
 * @param {string} params.focus - Focus spécifique de l'entraînement
 * @returns {Promise<Object>} Planning généré au format JSON
 */
export async function generateTrainingPlan(params) {
    try {
        const { horse, discipline, level, frequency, focus } = params;

        // Construction du prompt système
        const systemPrompt = `Tu es un entraîneur équin expert et diplômé d'État. Tu as une expertise dans toutes les disciplines équestres.

CONTEXTE DU CHEVAL :
- Nom : ${horse.name || 'Non précisé'}
- Âge : ${horse.age || 'Non précisé'} ans
- Race : ${horse.breed || 'Non précisée'}
- Poids estimé : ${horse.estimatedWeight || 'Non mesuré'} kg
- Discipline : ${discipline}
- Niveau actuel : ${level}

OBJECTIF DE L'UTILISATEUR :
- Fréquence d'entraînement : ${frequency} séances par semaine
- Focus spécifique : ${focus || 'Amélioration générale'}

INSTRUCTIONS STRICTES :
1. Génère un planning hebdomadaire COMPLET avec ${frequency} séances
2. Adapte l'intensité au poids :
   - Si surpoids détecté (> 550kg pour cheval de selle) : favoriser travail aérobie long et lent
   - Si poids normal : intensité progressive adaptée au niveau
   - Si jeune cheval : courtes séances, beaucoup de variété
3. Utilise le vocabulaire technique PRÉCIS de la discipline ${discipline}
4. Chaque séance doit inclure :
   - Échauffement (détaillé)
   - Travail principal (exercices précis)
   - Retour au calme
   - Durée totale réaliste
5. Varie les séances pour éviter la monotonie
6. Intègre des jours de repos stratégiques

FORMAT DE RÉPONSE OBLIGATOIRE (JSON STRICT) :
{
  "planningTitle": "Titre du planning",
  "objective": "Résumé de l'objectif",
  "weeklySchedule": [
    {
      "day": "Lundi",
      "sessionName": "Nom de la séance",
      "duration": "45 min",
      "intensity": "Moyenne",
      "phases": [
        {
          "name": "Échauffement",
          "duration": "10 min",
          "exercises": ["Exercice 1", "Exercice 2"]
        },
        {
          "name": "Travail principal",
          "duration": "25 min",
          "exercises": ["Exercice technique 1", "Exercice technique 2", "Exercice technique 3"]
        },
        {
          "name": "Retour au calme",
          "duration": "10 min",
          "exercises": ["Étirements", "Marche rênes longues"]
        }
      ],
      "tips": "Conseils spécifiques pour cette séance"
    }
  ],
  "nutritionAdvice": "Conseils nutritionnels basés sur le poids et l'entraînement",
  "warnings": "Signaux d'alerte à surveiller",
  "progressIndicators": ["Indicateur 1", "Indicateur 2", "Indicateur 3"]
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après. Le JSON doit être parsable directement.`;

        // Génération du contenu via API REST v1 avec Gemini 2.5 Flash
        console.log('🤖 Génération du planning avec Gemini 2.5 Flash...');
        const text = await callGeminiAPI('gemini-2.0-flash', systemPrompt, {
            temperature: 0.7,
            topP: 0.8,
            maxOutputTokens: 8192  // Gemini 2.5 Flash supporte jusqu'à 65k
        });

        console.log('✅ Réponse brute de Gemini:', text.substring(0, 200) + '...');

        // Nettoyage du texte (enlever les balises markdown si présentes)
        let cleanedText = text.trim();

        // Retirer les blocs de code markdown
        if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        // Parser le JSON
        const trainingPlan = JSON.parse(cleanedText);

        console.log('✅ Planning généré avec succès');
        return {
            success: true,
            data: trainingPlan,
            generatedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Erreur lors de la génération du planning:', error);
        console.error('Type d\'erreur:', typeof error);
        console.error('Détails complets:', JSON.stringify(error, null, 2));

        let errorMessage = 'Erreur inconnue';

        // Extraire le message d'erreur depuis différents formats possibles
        const errMsg = error?.message || error?.error || JSON.stringify(error);

        // Messages d'erreur plus clairs pour l'utilisateur
        if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key')) {
            errorMessage = 'Cle API Gemini invalide. Verifiez votre configuration.';
        } else if (errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            errorMessage = 'Quota Gemini epuise. Reessayez plus tard.';
        } else if (errMsg.includes('SAFETY') || errMsg.includes('blocked')) {
            errorMessage = 'Contenu bloque par les filtres de securite.';
        } else if (errMsg.includes('NOT_FOUND')) {
            errorMessage = 'Modele Gemini non trouve. Verifiez la configuration.';
        } else if (errMsg.includes('PERMISSION_DENIED')) {
            errorMessage = 'API Gemini non activee sur ce projet.';
        } else {
            errorMessage = `Erreur Gemini: ${errMsg.substring(0, 100)}`;
        }

        return {
            success: false,
            error: errorMessage,
            data: null
        };
    }
}

/**
 * Test simple de connexion à l'API Gemini
 * @returns {Promise<Object>} Résultat du test
 */
export async function testGeminiConnection() {
    try {
        console.log('🔍 Test de connexion Gemini (API REST v1)...');
        console.log('🔑 API Key présente:', API_KEY ? 'Oui' : 'Non');

        const text = await callGeminiAPI('gemini-2.0-flash', 'Dis bonjour en francais en une phrase.');

        console.log('✅ Test réussi! Réponse:', text);

        return {
            success: true,
            message: 'Connexion Gemini OK',
            response: text
        };
    } catch (error) {
        console.error('❌ Test échoué:', error);
        return {
            success: false,
            error: error.message || JSON.stringify(error)
        };
    }
}

/**
 * Génère des conseils rapides pour une séance spécifique
 * @param {Object} params - Paramètres de la séance
 * @returns {Promise<string>} Conseils générés
 */
export async function generateQuickTips(params) {
    try {
        const { discipline, exercise, horseName } = params;

        const prompt = `Tu es un coach équestre expert. Donne 3 conseils concrets et rapides pour bien réaliser l'exercice suivant :

Discipline : ${discipline}
Exercice : ${exercise}
Cheval : ${horseName}

Réponds en français, sous forme de liste à puces, maximum 3 conseils de 2 lignes chacun.`;

        const text = await callGeminiAPI('gemini-2.0-flash', prompt);

        return {
            success: true,
            tips: text
        };

    } catch (error) {
        console.error('❌ Erreur génération conseils:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Analyse la progression et suggère des ajustements
 * @param {Object} params - Données de progression
 * @returns {Promise<Object>} Analyse et recommandations
 */
export async function analyzeProgress(params) {
    try {
        const { sessionHistory, horseProfile, currentGoal } = params;

        const prompt = `Tu es un entraîneur équin expert. Analyse la progression suivante et donne des recommandations.

PROFIL DU CHEVAL :
${JSON.stringify(horseProfile, null, 2)}

OBJECTIF ACTUEL :
${currentGoal}

HISTORIQUE DES SÉANCES (dernières) :
${JSON.stringify(sessionHistory, null, 2)}

Ta mission :
1. Analyse la cohérence et la progression
2. Identifie les points forts et axes d'amélioration
3. Suggère des ajustements au planning

FORMAT JSON :
{
  "overallProgress": "Évaluation globale en 2-3 phrases",
  "strengths": ["Point fort 1", "Point fort 2"],
  "areasForImprovement": ["Axe 1", "Axe 2"],
  "recommendations": ["Recommandation 1", "Recommandation 2"],
  "nextWeekFocus": "Focus suggéré pour la semaine prochaine"
}

Réponds uniquement avec le JSON.`;

        const text = await callGeminiAPI('gemini-2.0-flash', prompt);

        let cleanedText = text.trim();
        if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        const analysis = JSON.parse(cleanedText);

        return {
            success: true,
            data: analysis
        };

    } catch (error) {
        console.error('❌ Erreur analyse progression:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Chat générique avec l'assistant (remplace l'extension Firebase)
 * @param {string} prompt - Le prompt complet contexte + question
 * @returns {Promise<string>} La réponse de l'IA
 */
export async function chatWithAssistant(prompt) {
    try {
        console.log('💬 Appels Assistant IA (REST)...');
        const text = await callGeminiAPI('gemini-2.0-flash', prompt, {
            temperature: 0.7,
            maxOutputTokens: 2048
        });
        return { success: true, response: text };
    } catch (error) {
        console.error('❌ Erreur Chat Assistant:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Extrait les valeurs nutritionnelles d'une étiquette d'aliment via Gemini Vision
 * @param {Object} params - Paramètres d'analyse
 * @param {string} params.imageBase64 - Image en base64
 * @param {string} params.mimeType - Type MIME
 * @returns {Promise<Object>} Données nutritionnelles extraites
 */
export async function extractNutritionFromImage(params) {
    try {
        const { imageBase64, mimeType = 'image/jpeg' } = params;

        if (!imageBase64) {
            throw new Error('Image requise pour l\'analyse');
        }

        const systemPrompt = `Tu es un expert en nutrition équine et en extraction de données.
Ta mission est d'analyser la photo d'une étiquette d'aliment pour chevaux (sac ou fiche technique) et d'extraire les valeurs nutritionnelles précises normalisées pour le marché français (système INRA).

1. IDENTIFICATION : Trouve la Marque et le Nom du produit.
2. VALEURS NUTRITIONNELLES (par kg brut) :
   - Cherche spécifiquement les "UFC" (Unités Fourragères Cheval). Si absent, cherche l'Énergie Digestible (DE) et convertis-la (1 UFC ≈ 2200 kcal DE).
   - Cherche les "MADC" (Matières Azotées Digestibles Cheval). Si absent, cherche la "Protéine Brute" (Crude Protein) et estime les MADC (environ 70-80% de la PB pour des granulés standards).
   - Cherche le Calcium (Ca), le Phosphore (P), le Sodium (Na) et l'Amidon (si disponible).
3. DOSAGE RECOMMANDÉ : Extrait les instructions du fabricant (ex: "300g pour 100kg de poids vif").

FORMAT DE SORTIE (JSON strict uniquement) :
{
  "product_info": {
    "brand": "String (ex: Reverdy, Dynavena)",
    "name": "String (ex: Adult Specific)",
    "type": "Concentré"
  },
  "nutrition_per_kg": {
    "UFC": Number (ex: 0.85),
    "MADC_g": Number (ex: 95),
    "Amidon_pct": Number (ou null),
    "Calcium_g": Number,
    "Phosphore_g": Number
  },
  "manufacturer_dosage": {
    "min_kg_per_100kg_bodyweight": Number,
    "instructions": "String courte résumant le dosage"
  },
  "analysis_confidence": "High"
}

Si une valeur clé (UFC ou MADC) est introuvable mais qu'il y a la composition analytique (Protéines brutes, Matières grasses, Cellulose), fais une estimation prudente et indique-le dans un champ "note".
Réponds UNIQUEMENT avec le JSON.`;

        console.log('🥦 Analyse nutritionnelle avec Gemini Vision...');
        const text = await callGeminiVisionAPI('gemini-2.0-flash', systemPrompt, imageBase64, mimeType, {
            temperature: 0.2, // Très bas pour être précis et factuel
            maxOutputTokens: 2048
        });

        console.log('✅ Réponse brute nutrition:', text.substring(0, 100) + '...');

        let cleanedText = text.trim();
        if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        const data = JSON.parse(cleanedText);
        return {
            success: true,
            data: data
        };

    } catch (error) {
        console.error('❌ Erreur analyse nutrition:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

export default {
    generateTrainingPlan,
    generateQuickTips,
    analyzeProgress,
    testGeminiConnection,
    chatWithAssistant,
    estimateWeightFromImage,
    extractNutritionFromImage
};
