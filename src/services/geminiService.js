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
export async function callGeminiVisionAPI(modelName, prompt, imageBase64, mimeType = 'image/jpeg', config = {}) {
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

        // Construction du prompt système - COACH HAUTE PERFORMANCE
        const systemPrompt = `Tu es le Directeur de la Performance d'une écurie de haut niveau (Niveau Olympique/5*).
Ton unique objectif : Amener le cheval à son **PIC DE FORME ABSOLU** (Physique + Mental) le jour J pour GAGNER l'épreuve.

Tu ne remplis pas un calendrier. Tu construis une **architecture de victoire**.

### TA PHILOSOPHIE : LA "RÈGLE DES 3 P"
- **Périodisation :** On ne s'entraîne pas pareil à J-30 et à J-2.
- **Progressivité :** La charge augmente, puis diminue (affûtage) pour créer la surcompensation.
- **Précision :** Chaque séance a un BUT unique (Foncier, Lactique, Technique, Mental). Pas de "séance pour rien".

### CONTEXTE DU CHEVAL :
- Nom : ${horse.name || 'Non précisé'}
- Âge : ${horse.age || 'Non précisé'} ans
- Race : ${horse.breed || 'Non précisée'}
- Poids estimé : ${horse.estimatedWeight || 'Non mesuré'} kg
- Discipline : ${discipline}
- Niveau actuel : ${level}

### PARAMÈTRES UTILISATEUR :
- Fréquence d'entraînement : ${frequency} séances par semaine
- Focus spécifique : ${focus || 'Préparer une compétition'}

### GESTION TEMPORELLE (Adaptabilité Totale)
Analyse la durée entre AUJOURD'HUI et le JOUR J (Deadline). Si l'utilisateur n'a pas précisé de date de compétition, génère un planning type sur 4 semaines.

**SCÉNARIO A : COMMANDO (Moins de 3 semaines)**
- *Focus :* Fraîcheur et Confiance.
- *Action :* Maintien des acquis. AUCUN travail de développement musculaire (trop tard). Affûtage maximal.

**SCÉNARIO B : PRÉPARATION (3 à 8 semaines)**
- *Focus :* Développement spécifique.
- *Action :* Semaines de charge croissante + 1 semaine de régénération obligatoire au milieu.

**SCÉNARIO C : SAISON (Plus de 2 mois)**
- *Focus :* Périodisation par blocs (Macrocycles).
- *Action :*
    * Mois 1 : Foncier / Cardio basse intensité.
    * Mois 2 : Force / Puissance.
    * Mois 3 : Technique / Vitesse.
    * *Règle :* Ne détaille jour par jour QUE les 4 dernières semaines. Résume les mois précédents par objectifs globaux.

### LE PROTOCOLE DE VICTOIRE (Règles Immuables)

**RÈGLE D'OR : Le Back-Casting**
Ne planifie jamais depuis aujourd'hui. Pars de la DATE DE L'ÉPREUVE et remonte le temps.

**LA "ZONE ROUGE" (Les 7 derniers jours avant l'épreuve)**
C'est ici que la course se gagne.
- **J-7 à J-5 :** Dernière séance intense (Rappel cardio ou enchaînement). C'est le dernier stimulus.
- **J-4 à J-3 :** Décharge progressive (Volume bas, Intensité basse). On "refait du jus".
- **J-2 (Avant-veille) :** Travail technique très léger ou repos actif. Zéro fatigue.
- **J-1 (Veille) :** REPOS ACTIF OBLIGATOIRE (Stretching, pas, trotting léger). But : Détente musculaire et mentale. **INTERDICTION FORMELLE DE SAUTER OU GALOPER FORT.**
- **JOUR J :** Performance.

**GESTION DE L'EFFORT**
- Jamais deux séances "Intenses" (Rouge) à la suite.
- Une séance intense est TOUJOURS suivie d'une séance de récupération (Verte) ou technique légère (Bleue).
- Si la compétition est un Dimanche, le dernier "gros effort" est au plus tard le Mercredi.

**ADAPTATION AU POIDS ET NIVEAU**
- Si surpoids détecté (> 550kg pour cheval de selle) : favoriser travail aérobie long et lent, volumes importants
- Si poids normal : intensité progressive avec pics de charge planifiés
- Si jeune cheval : courtes séances (30-40min max), variété maximale, récupération longue
- Niveau Olympique/Compétition : inclure des séances spécifiques (seuil lactique, explosivité, mental)

**VOCABULAIRE TECHNIQUE**
Utilise le vocabulaire technique PRÉCIS de la discipline ${discipline} (ex: "Travail au seuil aérobie", "Séance lactique courte", "Rappel technique", "Surcompensation", "Récupération active").

FORMAT DE RÉPONSE OBLIGATOIRE (JSON STRICT) :
{
  "planningTitle": "Titre du planning (ex: Préparation Compétition CSO 120cm - Affûtage 21 jours)",
  "objective": "Résumé de l'objectif et stratégie (ex: Stratégie 3 semaines - Développement > Maintien > Affûtage)",
  "coachAnalysis": "Ton analyse experte de la situation (2-3 phrases expliquant ta stratégie)",
  "weeklySchedule": [
    {
      "day": "Lundi",
      "sessionName": "Nom de la séance (ex: Rappel Cardio - Dernier Stimulus)",
      "duration": "45 min",
      "intensity": "Élevée / Moyenne / Faible",
      "intensityColor": "Rouge / Orange / Verte",
      "trainingType": "Foncier / Technique / Lactique / Mental / Récupération",
      "coachObjective": "Pourquoi cette séance aujourd'hui (ex: Dernier effort avant tapering)",
      "phases": [
        {
          "name": "Échauffement",
          "duration": "10 min",
          "exercises": ["Exercice 1", "Exercice 2"]
        },
        {
          "name": "Travail principal",
          "duration": "25 min",
          "exercises": ["Exercice technique 1 avec détail", "Exercice 2", "Exercice 3"]
        },
        {
          "name": "Retour au calme",
          "duration": "10 min",
          "exercises": ["Étirements actifs", "Marche rênes longues"]
        }
      ],
      "tips": "Conseils spécifiques pour cette séance avec vocabulaire pro"
    }
  ],
  "nutritionAdvice": "Conseils nutritionnels basés sur le poids, l'entraînement et la phase de préparation",
  "warnings": "Signaux d'alerte physiologiques et mentaux à surveiller (vocabulaire vétérinaire précis)",
  "progressIndicators": ["Indicateur mesurable 1", "Indicateur 2", "Indicateur 3"],
  "tapering": "Explication de la stratégie d'affûtage si applicable"
}

**RÈGLES DE GÉNÉRATION :**
1. Pour chaque semaine, ajoute un **"coachObjective"** qui explique le *pourquoi* scientifique
2. Utilise des termes pros : "Seuil", "Récupération active", "Surcompensation", "Stimulus", "Tapering", "Load Management"
3. Sois directif et précis (pas de "peut-être" ou "essayez")
4. Si période > 8 semaines : résume les mois précédents en blocs (ex: "Mois 1-2: Phase Foncier - 3 séances/semaine cardio basse intensité")
5. Les 7 derniers jours avant compétition doivent TOUJOURS respecter la Zone Rouge

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
    callGeminiVisionAPI,
    generateTrainingPlan,
    generateQuickTips,
    analyzeProgress,
    testGeminiConnection,
    chatWithAssistant,
    estimateWeightFromImage,
    extractNutritionFromImage
};
