import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialisation du client Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error('❌ VITE_GEMINI_API_KEY non définie dans .env');
}

const genAI = new GoogleGenerativeAI(API_KEY);

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

        // Modèle à utiliser (flash pour rapidité et coût)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

        // Génération du contenu
        console.log('🤖 Génération du planning avec Gemini...');
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

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

        return {
            success: false,
            error: error.message || 'Erreur inconnue',
            data: null
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

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Tu es un coach équestre expert. Donne 3 conseils concrets et rapides pour bien réaliser l'exercice suivant :

Discipline : ${discipline}
Exercice : ${exercise}
Cheval : ${horseName}

Réponds en français, sous forme de liste à puces, maximum 3 conseils de 2 lignes chacun.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        return {
            success: true,
            tips: response.text()
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

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

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

export default {
    generateTrainingPlan,
    generateQuickTips,
    analyzeProgress
};
