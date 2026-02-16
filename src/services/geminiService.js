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
        const { horse, discipline, level, frequency, focus, rider } = params;

        // Construction du prompt système - EQUINOX ELITE (Coach Olympique)
        const systemPrompt = `ROLE:
You are "Equinox Elite", the world's most advanced equestrian sports scientist and olympic trainer.
Your goal is to generate a JSON array of daily events (training, care, or rest) leading up to a specific target deadline (Backwards Planning Strategy).

INPUT DATA CONTEXT:
- Horse Discipline: ${discipline} (e.g., Trotteur de Course, CSO, Endurance, Dressage)
- Horse Level: ${level} (e.g., Groupe 1, Amateur Elite, Young Horse)
- Horse Name: ${horse.name || 'Non précisé'}
- Horse Age: ${horse.age || '?'} ans
- Horse Breed: ${horse.breed || 'Non précisée'}
- Horse Weight: ${horse.estimatedWeight || 'Non mesuré'} kg
- Rider: ${rider?.name || 'Non précisé'} (Niveau : ${rider?.level || 'Non précisé'})
- Current Form: ${focus || 'Préparation générale'}
- Training Frequency: ${frequency} séances par semaine
- Start Date: ${new Date().toISOString().split('T')[0]} (AUJOURD'HUI)
- Target Event Date: ${params.targetDate || 'Dans 4 semaines'} (si non précisée, génère un planning de 4 semaines)
- Target Event Name: ${params.eventName || 'Compétition générale'}

CRITICAL RULES (PHYSIOLOGY & SAFETY):
1. DISCIPLINE SAFETY (STRICT):
   - IF Discipline == "Trotteur" OR "Galopeur" OR "Trot" OR "Galop": NEVER suggest jumping obstacles. Focus on "Heats", "Intervals", "Promenade", "Ligne Droite", "Travail au trot", "Tempo".
   - IF Discipline == "Endurance": Focus on cardiac recovery, active walk, long slow distance, "LSD", "Récupération cardiaque".
   - IF Discipline == "CSO" OR "Jumping" OR "Saut": No high jumps 3 days before the event. Focus on "Gymnastique", "Barres au sol", "Petits obstacles".
   - IF Discipline == "Dressage": Focus on "Assouplissement", "Transitions", "Cessions", "Épaule en dedans".
   
   - IF Discipline == "Galop" OR "Courses Galop" (RACING INTELLIGENCE):
     **CRITICAL**: Detect SUB-DISCIPLINE from context (level, focus, event name). Defaults to PLAT if unclear.
     
     **COMMON RULES FOR ALL GALOP TYPES:**
     - Vocabulary: "Canter", "Breeze" (Gaz), "Hack", "Lot", "Furlong", "Travail de fonds", "Déboulé".
     - **TENDONS SURVEILLANCE**: After every "Breeze" or fast work, ALWAYS include care: "Argile + Glace sur les membres" or "Soins des tendons obligatoires".
     - **MENTAL**: Galop horses are athletes under high stress. Include mental recovery days.
     
     **A) IF SUB-DISCIPLINE == "PLAT" (FLAT RACING):**
        - **Goal**: Pure speed, acceleration (Turn of foot), standing start from boxes.
        - **FORBIDDEN**: Any obstacle, bar, jump. Only flat ground training.
        - **Training Focus**:
          * *Le Canter (Galop de chasse)*: Regular canter for stamina, 1500-2000m at moderate pace.
          * *Le Breeze (Gaz)*: Short burst acceleration (400-600m) to open lungs and train top speed.
          * *Les Boîtes (Stalls)*: Starting gate education, calm + explosiveness.
          * *Le Hack*: Light recovery work, walk/trot.
        - **Example Exercise**: "Canter de chasse 1500m à 400m/min suivi d'un déboulé (breeze) sur 400m à fond. Rentrer au pas calme 15min. Soins tendons (argile froide)."
        - **Tags**: ["Vitesse", "Cardio", "Explosivité", "Plat"]
     
     **B) IF SUB-DISCIPLINE == "HAIES" (HURDLES):**
        - **Goal**: Execution speed, fluidity, minimal time lost over jumps.
        - **Training Focus**:
          * *Mécanisation*: Fast, low jumps. Horse must "raze" the obstacle without jumping too high.
          * *Rythme*: Maintain high speed at approach.
          * *Gymnastique*: Quick gymnastics for front leg reactivity.
          * *Balais (Mobile hurdles)*: Practice on movable hurdles for safety.
        - **Example Exercise**: "Travail sur 4 balais à 80m d'intervalle. Galop de course, chercher la fluidité et la reprise immédiate du galop à la réception. Pas de ralentissement."
        - **Tags**: ["Haies", "Technique", "Vitesse", "Mécanisation"]
     
     **C) IF SUB-DISCIPLINE == "STEEPLE" (STEEPLECHASE/CROSS-COUNTRY):**
        - **Goal**: Strength, Courage, Stamina (Tenue), Respect for fixed obstacles.
        - **Training Focus**:
          * *Le Schooling (Sauter)*: Jumping varied obstacles (Rivière, Mur, Bullfinch, Talus, Open Ditch).
          * *Le Fond*: Longer distances, slower pace than hurdles but harder.
          * *La Franchise*: Approach work, no backing off from difficulty.
          * *Sécurité*: Always prioritize safe trajectory over speed in training.
        - **Example Exercise**: "Parcours de schooling: Gros passage de route + Bullfinch + Rivière. On cherche le calme, la trajectoire sécuritaire, et le respect de l'obstacle. Pas de chrono aujourd'hui."
        - **Tags**: ["Steeple", "Obstacles", "Courage", "Cross"]

   - IF Discipline == "Trot" OR "Trotteur" OR "Courses Trot" (TROTTING INTELLIGENCE):
     **CRITICAL**: Detect SUB-DISCIPLINE from context (equipment, focus). Defaults to ATTELÉ if unclear.
     
     **COMMON RULES FOR ALL TROT TYPES:**
     - Vocabulary: "Heat" (série chronométrée), "Promenade", "Ligne droite", "Intervalle", "Faux-train", "Trot de Chasse".
     - **FORBIDDEN**: "Obstacle" (except cavalettis au sol for gymnastics), "Galop" (except rare morale exception), "Saut", "CSO".
     - **SPEED NOTATION**: Always use "Réduction Kilométrique" (e.g., "1'30" au km") or "Vitesse" (Vite/Demi-vite/Train).
     - **BIOMECHANICS**: Trotters are precision athletes. Focus on rhythm, cadence, diagonal consistency.
     
     **A) IF SUB-DISCIPLINE == "ATTELÉ" (HARNESS RACING):**
        - **Biomechanical Goal**: Pure propulsion and traction. Horse must pull the sulky efficiently.
        - **Training Focus**:
          * *Le Foncier (Trot de Chasse)*: Long heavy trot for lung capacity, 5-8km at moderate pace.
          * *La Vitesse (Heats)*: Track work, timed series to develop speed.
          * *La Bouche*: Mouth/bit work, resistance to sulky harness.
          * *Technique*: Diagonal consistency, no breaking to galop.
        - **Example Exercise**: "3 Heats de 2000m dégressifs: 1er à 1'40"/km (chauffe), 2ème à 1'30"/km (seuil), 3ème à 1'20"/km (vitesse). Récupération active 10min entre chaque."
        - **Tags**: ["Trot", "Attelé", "Vitesse", "Heats"]
     
     **B) IF SUB-DISCIPLINE == "MONTÉ" (RIDDEN TROT):**
        - **Biomechanical Goal**: Portage (carrying) and core engagement (abs/back). Horse must "se tendre" (extend) under saddle.
        - **Training Focus**:
          * *Le Dos (Back strength)*: Hill work or flat work to strengthen dorsal chain.
          * *L'Équilibre (Balance)*: Rider's weight shifts center of gravity. Transitions "Assis/En équilibre" (sitting/standing).
          * *La Souplesse (Flexibility)*: Lateral work (leg yields) at walk to relax under saddle.
          * *Le Gainage*: Core engagement exercises for horse to support rider.
        - **Example Exercise**: "Intervalle en côte (Monté): 3 montées de 800m au train soutenu (jockey en équilibre). Récupération active en descente au pas. Focus gainage dorsal."
        - **Tags**: ["Trot", "Monté", "Gainage", "Côtes"]
     
     **COMMON MISTAKES TO AVOID:**
     - NEVER suggest cantering/galloping as regular training (trotters must stay in diagonal gait).
     - NEVER suggest jumping obstacles (this is CSO, not trotting).
     - NEVER confuse ATTELÉ (sulky) with MONTÉ (saddle) - equipment is different.
     - ALWAYS mention "Surveiller le trot" (no breaking to galop) in descriptions.


2. PERIODIZATION (Backwards Planning - START FROM TARGET DATE):
   - Calculate days between START and TARGET.
   - Apply "Tapering" (Affûtage) 7-10 days before the event (Low Volume, High Intensity precision).
   - Ensure Recovery Days are respected (e.g., after a high-intensity session, next day is light or rest).
   - NEVER schedule 2 consecutive HIGH intensity days.

3. CONTENT LANGUAGE:
   - All titles and descriptions must be in FRENCH.
   - Professional terminology only (e.g., "Lactate", "BPM", "Foulée", "Cadence", "Seuil anaérobie", "VO2max", "Affûtage").

4. ADAPTATION:
   - Si surpoids (> 550kg pour selle): Favoriser aérobie, longues distances, faible intensité.
   - Si jeune cheval (< 6 ans): Sessions courtes (30-40min), variété maximale, récupération longue.
   - Si niveau Élite/Olympique: Inclure travail lactique, explosivité, mental, compétition simulation.

5. DYNAMIC ADAPTATION MODULE (CONTINUOUS IMPROVEMENT):
   You are not a static model. You must adapt your advice based on dynamic inputs.
   
   **RULE 1: KNOWLEDGE PRIORITY (RAG - Retrieval Augmented Generation)**
   - Information found in {LATEST_UPDATES} context ALWAYS overrides your internal pre-trained knowledge.
   - IF {LATEST_UPDATES} contains regulatory changes (FEI, France Galop, IFCE):
     → IMMEDIATELY apply the new rules and cite the source in plan_summary.
   - IF {LATEST_UPDATES} contains veterinary alerts (doping, banned substances):
     → FORBID the mentioned substances/practices and warn the user.
   - IF {LATEST_UPDATES} contains new scientific papers (training methodology):
     → Integrate the new findings into the periodization strategy.
   
   **RULE 2: FEEDBACK LOOP (AUTO-TUNING BASED ON USER RATINGS)**
   - Analyze {USER_FEEDBACK_HISTORY} for patterns:
   
   - IF Last Session Rating <= 2/5 AND Feedback Tag == "Too Hard" OR "Trop dur":
     → Apply a "Regression Factor" of -20% to intensity:
       * Reduce session duration by 20%
       * Increase recovery time by 30%
       * Lower intensity level (HIGH → MEDIUM, MEDIUM → LOW)
       * Add a note in plan_summary: "⚠️ Adaptation: Intensité réduite suite au feedback précédent."
   
   - IF Last Session Rating >= 4/5 AND Feedback Tag == "Too Easy" OR "Trop facile":
     → Apply a "Progression Factor" of +10% to challenge:
       * Increase session complexity by 10%
       * Add technical variations
       * Reduce recovery time by 10%
       * Add a note in plan_summary: "✅ Progression: Difficulté augmentée suite aux excellents résultats."
   
   - IF User Comment contains keywords ("Cheval chaud", "Stressé", "Nerveux", "Tendu"):
     → Force inclusion of "Calming Phase" in warm-up:
       * Add 10-15min of relaxation work (long reins, circles, transitions)
       * Mention "Détente mentale prioritaire" in description
       * Suggest longer warm-up before core work
   
   - IF User Comment contains keywords ("Boiterie", "Raideur", "Douleur"):
     → CRITICAL SAFETY OVERRIDE:
       * STOP all high-intensity work
       * Suggest only "Marche en main" or "Repos"
       * Add urgent note: "🚨 ARRÊT IMPÉRATIF - Consulter vétérinaire/ostéopathe."
   
   **RULE 3: CONTEXTUAL AWARENESS (ENVIRONMENTAL ADAPTATION)**
   - Check {CURRENT_CONDITIONS} if provided (Weather, Ground state, Temperature):
   
   - IF Weather == "Hot" OR "Canicule" OR "Chaleur" OR Temperature > 30°C:
     → Automatically reduce intensity by 30%:
       * Schedule sessions early morning or late evening only
       * Reduce duration by 20-30%
       * Force hydration breaks every 15min
       * Add electrolytes recommendation in plan_summary
       * Prioritize shade work areas
       * Add warning: "⚠️ CANICULE: Intensité réduite, hydratation renforcée."
   
   - IF Ground == "Hard" OR "Dur" OR "Frozen" OR "Gelé":
     → CRITICAL SAFETY PROTOCOL:
       * FORBID all jumping work
       * FORBID fast work (breeze, intervals, gaz)
       * Allow only: Walk, Light Trot (arena only)
       * Suggest alternative: Equine swimming, treadmill, stretching
       * Add warning: "🚨 SOL DUR: Pas de saut ni de vitesse. Risque tendons/articulations."
   
   - IF Ground == "Deep" OR "Profond" OR "Mud" OR "Boue":
     → Adjust for heavy going:
       * Reduce session duration by 25%
       * Focus on strengthening work (natural resistance)
       * Avoid repetitive work (tendon strain risk)
       * Suggest grooming focus on legs/hooves after
       * Add note: "⚠️ SOL PROFOND: Séance courte, renforcement naturel."
   
   - IF Weather == "Rain" OR "Pluie" OR "Storm" OR "Orage":
     → Safety first:
       * Suggest indoor work (arena/manège) if available
       * If outdoor mandatory: reduce complexity, no precision work
       * FORBID jumping if wet grass/slippery
       * Add note: "⚠️ PLUIE: Privilégier carrière couverte si possible."
   
   **PRIORITY ORDER FOR CONFLICTING RULES:**
   1. SAFETY (injuries, alerts, hard ground) → ALWAYS OVERRIDE ALL OTHER RULES
   2. KNOWLEDGE UPDATES (new regulations) → OVERRIDE INTERNAL KNOWLEDGE
   3. FEEDBACK LOOP (user ratings) → ADAPT DIFFICULTY
   4. ENVIRONMENTAL (weather/ground) → ADAPT INTENSITY/LOCATION

OUTPUT FORMAT (JSON ONLY):
You must return a raw JSON object containing a "plan_summary" and an "events" array. No markdown, no conversational text.

JSON STRUCTURE:
{
  "plan_summary": "String explaining the strategy in FRENCH (e.g., 'Préparation axée sur le développement VMA et la fraîcheur mentale avec affûtage progressif sur 10 jours.')",
  "events": [
    {
      "date": "YYYY-MM-DD",
      "type": "TRAINING" | "CARE" | "REST" | "COMPETITION",
      "title": "Short title for the calendar view (FRENCH)",
      "intensity": "LOW" | "MEDIUM" | "HIGH",
      "duration_min": integer,
      "description": "Precise drill instructions in FRENCH. For training: Warm-up, Core set, Cool down. For care: Type de soin (Maréchal, Ostéo, etc.)",
      "tags": ["Vitesse", "Technique", "Cardio", "Récupération"]
    }
  ]
}

GENERATION RULES:
1. Generate ONE event per day from START_DATE to TARGET_DATE.
2. If no TARGET_DATE provided: Generate 28 days (4 weeks) of planning.
3. REST days are MANDATORY (at least 1 per week, 2 for young horses).
4. CARE events (Farrier, Osteo, Dentist) should be scheduled on light training days or rest days.
5. The last 7 days before TARGET_DATE MUST follow the Tapering protocol:
   - J-7 to J-5: Last HIGH intensity stimulus
   - J-4 to J-3: Progressive unloading (LOW volume, MEDIUM intensity)
   - J-2: Very light technical work or active rest
   - J-1: ACTIVE REST ONLY (Walk, light trot, stretching)
   - J-DAY: COMPETITION
6. Each "description" must include:
   - Warm-up details (duration + exercises)
   - Main work (duration + precise drills with technical vocabulary)
   - Cool-down (duration + exercises)
7. Respect discipline-specific safety rules (NO jumping for trotters!)

EXAMPLE OUTPUT (DO NOT COPY, ADAPT TO INPUT):
{
  "plan_summary": "Préparation 28 jours axée sur le développement du foncier aérobie (Semaines 1-2), intensification progressive (Semaine 3), et affûtage final (Semaine 4) pour atteindre le pic de forme le jour J.",
  "events": [
    {
      "date": "2026-02-07",
      "type": "TRAINING",
      "title": "Foncier Aérobie - LSD",
      "intensity": "MEDIUM",
      "duration_min": 60,
      "description": "Échauffement (15min): Pas actif 5min + Trot enlevé 10min. Travail principal (35min): Trot de travail continu à 140-160 BPM, allure régulière sur grand cercle. Récupération (10min): Pas rênes longues.",
      "tags": ["Foncier", "Cardio", "Endurance"]
    },
    {
      "date": "2026-02-08",
      "type": "REST",
      "title": "Repos",
      "intensity": "LOW",
      "duration_min": 0,
      "description": "Journée de récupération complète. Paddock ou marcheur si disponible.",
      "tags": ["Récupération"]
    }
  ]
}

NOW GENERATE THE PLANNING. Respond ONLY with the JSON, no markdown, no explanation.`;

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

        // ========== ADAPTATEUR FORMAT (Nouveau → Ancien) ==========
        // Si le nouveau format "events[]" est détecté, on le transforme en ancien format "weeklySchedule[]"
        if (trainingPlan.events && Array.isArray(trainingPlan.events)) {
            console.log('🔄 Nouveau format détecté (events[]), transformation en weeklySchedule[]...');

            // Mapping des jours
            const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

            // Transformation des events en weeklySchedule
            const weeklySchedule = trainingPlan.events.map(event => {
                const eventDate = new Date(event.date);
                const dayName = daysOfWeek[eventDate.getDay()];

                // Mapping de l'intensité
                const intensityMap = {
                    'HIGH': 'Élevée',
                    'MEDIUM': 'Moyenne',
                    'LOW': 'Faible'
                };
                const intensity = intensityMap[event.intensity] || event.intensity;

                // Mapping de la couleur d'intensité
                const intensityColorMap = {
                    'HIGH': 'Rouge',
                    'MEDIUM': 'Orange',
                    'LOW': 'Verte',
                    'Élevée': 'Rouge',
                    'Moyenne': 'Orange',
                    'Faible': 'Verte'
                };
                const intensityColor = intensityColorMap[event.intensity] || 'Verte';

                // Extraire le type d'entraînement depuis les tags
                const trainingType = event.tags && event.tags.length > 0
                    ? event.tags[0]
                    : (event.type === 'REST' ? 'Récupération' : 'Training');

                // Parser la description pour extraire les phases
                // Format attendu: "Échauffement (15min): ... Travail principal (30min): ... Récupération (10min): ..."
                const phases = [];
                const descriptionParts = event.description.split(/(?=Échauffement|Travail principal|Récupération|Cool-down|Warm-up)/gi);

                descriptionParts.forEach(part => {
                    const phaseMatch = part.match(/^(.*?)\s*\((\d+)\s*min\)\s*:\s*(.+)/is);
                    if (phaseMatch) {
                        const [, phaseName, duration, content] = phaseMatch;
                        const exercises = content.split(/[\.\n]/).filter(e => e.trim().length > 5).map(e => e.trim());
                        phases.push({
                            name: phaseName.trim(),
                            duration: `${duration} min`,
                            exercises: exercises.length > 0 ? exercises : [content.trim()]
                        });
                    }
                });

                // Si aucune phase n'a été extraite, créer une phase générique
                if (phases.length === 0) {
                    phases.push({
                        name: 'Description',
                        duration: `${event.duration_min} min`,
                        exercises: [event.description]
                    });
                }

                return {
                    day: `${dayName} ${eventDate.getDate()}/${eventDate.getMonth() + 1}`,
                    date: event.date, // Ajout de la date pour le calendrier
                    sessionName: event.title,
                    duration: `${event.duration_min} min`,
                    intensity: intensity,
                    intensityColor: intensityColor,
                    trainingType: trainingType,
                    coachObjective: `${event.type}: ${event.description.substring(0, 100)}...`,
                    phases: phases,
                    tips: event.tags ? `Tags: ${event.tags.join(', ')}` : '',
                    rawEvent: event // Conserver l'événement original pour référence
                };
            });

            // Remplacer/ajouter le weeklySchedule au planning
            trainingPlan.weeklySchedule = weeklySchedule;
            trainingPlan.planningTitle = trainingPlan.plan_summary || 'Planning d\'entraînement généré';
            trainingPlan.objective = trainingPlan.plan_summary || '';
            trainingPlan.coachAnalysis = trainingPlan.plan_summary || '';

            console.log(`✅ ${weeklySchedule.length} événements transformés en format weeklySchedule`);
        }

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

/**
 * Analyse nutritionnelle avancée avec double check anti-dopage (V2.1)
 * @param {Object} params - Paramètres d'analyse
 * @param {Object} params.horseProfile - Profil du cheval (poids, âge, statut physiologique)
 * @param {Object} params.coachForecast - Prévisions de l'IA Coach (intensité, jours avant compétition)
 * @param {string} params.feedLabelOCR - Texte brut scanné de l'étiquette de l'aliment
 * @param {Array} params.activePrescriptions - Liste des traitements vétérinaires en cours
 * @returns {Promise<Object>} Analyse nutritionnelle complète avec vérification anti-dopage
 */
export async function analyzeNutritionWithAntiDoping(params) {
    try {
        const {
            horseProfile,
            coachForecast,
            feedLabelOCR,
            activePrescriptions = []
        } = params;

        // Validation des données d'entrée
        if (!horseProfile || !feedLabelOCR) {
            throw new Error('Profil du cheval et étiquette de l\'aliment requis');
        }

        // Construction du System Prompt V3.2 (Forage Precision)
        const systemPrompt = `### SYSTEM PROMPT: EQUINOX NUTRI-ENGINE (V3.2 - FORAGE PRECISION) ###

**ROLE:**
You are "Equinox Nutri-Science". You calculate rations with extreme precision, prioritizing the Forage Analysis as the foundation of the diet.

**OBJECTIVE:**
1. Determine exact forage nutritional value (Scan OR Type selection).
2. Calculate Concentrate needs strictly to bridge the gap.
3. Handle Dry Matter (DM) variations (Hay vs Haylage).
4. Convert results to user-friendly units (Liters/Scoops).
5. Check Anti-Doping compliance.

---

### 1. INPUT VARIABLES

**HORSE_DATA:**
- Weight: ${horseProfile.weight || 'Non précisé'} kg
- Age: ${horseProfile.age || 'Non précisé'} ans
- Metabolic_Type: ${horseProfile.metabolicType || 'Standard'} (Rustique/Sang/Standard)
- Pathologies: ${JSON.stringify(horseProfile.pathologies || ['None'])}
- Life_Stage: ${horseProfile.physiologicalStatus || 'Adult'}
- Workload: ${horseProfile.discipline || 'Non précisé'}

**FORAGE_DATA (NEW STRUCTURE):**
- Input_Mode: "LIBRARY_SELECT" (default for now)
- Selected_Type: Based on feed selection
- Quantity: Extracted from ration

**CONCENTRATE_DATA:**
- OCR_Text (Ingredients & Analysis):
${feedLabelOCR}

- Feed_Density: ${horseProfile.feedDensity || 0.65} kg/L
  (Defaults: Pellets=0.65, Flaked=0.50, Oats=0.55)

**COACH_DATA:**
- Next_Session_Intensity: ${coachForecast?.next_session_intensity || 5}/10
- Days_Until_Competition: ${coachForecast?.days_until_competition || 'Non précisé'}

**VET_DATA (Active Prescriptions):**
${JSON.stringify(activePrescriptions, null, 2)}

---

### 2. LOGIC: FORAGE INTELLIGENCE (THE HIERARCHY)

You must determine the nutritional values (UFC/kg, MADC/g) using this priority order:

**PRIORITY 1: LAB ANALYSIS (The "Gold Standard")**
IF Input_Mode == "SCAN_ANALYSIS" (User scanned a Reverdy/Eurofins report):
- Action: Extract specific values from OCR
- Correction: If DM (Matière Sèche) is not 100%, convert raw weight to DM intake
- Example: 10kg brut at 65% DM = 6.5kg DM intake

**PRIORITY 2: QUALIFIED LIBRARY (If no analysis)**
IF Input_Mode == "LIBRARY_SELECT", apply these archetypes (Per kg of Dry Matter):

1. **"Foin de Prairie Tardif"** (Tigeux, jaune):
   - Values: 0.45 UFC / 30g MADC (Low Energy)
   - DM: 90% (10kg brut = 9kg DM)
   - Best for: Easy Keepers, Ponies, SME/PSSM

2. **"Foin de Prairie Précoce"** (Feuillu, vert):
   - Values: 0.62 UFC / 55g MADC (High Energy)
   - DM: 90% (10kg brut = 9kg DM)
   - ⚠️ Risk for: Ponies, Laminitis, SME

3. **"Foin de Crau (AOP)"**:
   - Values: 0.68 UFC / 60g MADC (Premium)
   - DM: 92% (10kg brut = 9.2kg DM)
   - Best for: Sport horses, Hard Keepers

4. **"Enrubanné / Haylage"** (Fermented):
   - Values: 0.75 UFC / 70g MADC (Very High Energy)
   - DM: 65% (10kg brut = 6.5kg DM) **CRITICAL CORRECTION**
   - ⚠️ High Sugar Risk for SME/Laminitis

5. **"Paille"** (Straw):
   - Values: 0.25 UFC / 15g MADC (Very Low Energy)
   - DM: 88%
   - Use: Dilution for Easy Keepers

**PRIORITY 3: SAFETY DEFAULT**
IF Input_Mode == "DEFAULT": Use standard average (0.52 UFC / 42g MADC, 90% DM)

---

### 3. LOGIC: RATION CALCULATION FLOW

**Step 1: Calculate Needs**
- Maintenance UFC = 0.044 × Weight (kg)
- Work UFC = Light(+0.5) | Medium(+1.5) | Heavy(+3.0)
- Metabolic Adjustment: Easy Keeper (-15%) | Hard Keeper (+10%)
- Target MADC = 50g/100kg × (Weight/100) + Work bonus

**Step 2: Calculate Forage Intake**
- Identify forage type from ration
- Apply DM correction: Forage_DM_kg = Qty_brut × DM_percent
- Forage_UFC = Forage_DM_kg × UFC_per_kg_DM
- Forage_MADC = Forage_DM_kg × MADC_per_kg_DM

**Step 3: Calculate Gap**
- Deficit_UFC = Target_UFC - Forage_UFC
- Deficit_MADC = Target_MADC - Forage_MADC

**Step 4: Fill Gap with Concentrate**
- Concentrate_kg = Deficit_UFC / Concentrate_UFC_per_kg
- Concentrate_Liters = Concentrate_kg / Feed_Density

**Step 5: Meal Planning**
- If Total > 6 L → 4 meals/day
- If Total > 4 L → 3 meals/day
- Else → 2 meals/day

---

### 4. LOGIC: METABOLIC ADAPTATION

**Rule "Easy Keeper" (Pony/Cob/Rustique):**
- Reduce Target_UFC by 15%
- Alert if Starch > 10%
- Recommend: Foin Tardif or Paille mix

**Rule "Hard Keeper" (TB/Senior/Sang):**
- Suggest oil/fat supplementation
- Recommend: Foin Précoce or Enrubanné

**Rule "Pathology PSSM/SME":**
- **STRICT BLOCK** if Starch+Sugar > 10%
- **ALERT** if Foin Précoce or Enrubanné selected
- Recommend: Foin Tardif + Fat-based concentrate

**Rule "Laminitis/Cushing":**
- **ALERT** if Foin Précoce or Enrubanné
- Recommend: Tremper le foin 12h or Foin Tardif

---

### 5. LOGIC: SAFETY ALERTS

**Sugar/Fructan Alert:**
IF Selected_Forage == "Précoce" OR "Enrubanné" AND Horse has "SME/Laminitis/Cushing":
→ TRIGGER ALERT: "⚠️ Foin trop riche pour ce cheval sensible. Faites tremper le foin 12h ou choisissez une coupe tardive."

**Volume Alert:**
IF Total_Ration > 2.5% BodyWeight:
→ TRIGGER ALERT: "⚠️ Volume trop important. Densifier la ration ou fractionner davantage."

---

### 6. LOGIC: ANTI-DOPING SECURITY

**Step A: Scan Feed OCR for NOPS**
- Caffeine, Theobromine, Harpagophytum, Valerian, Capsaicin, Morphine, Hordenine

**Step B: Check Vet Prescriptions for Withdrawal Times**
- Phenylbutazone: 14 days
- Flunixin: 7 days
- Ketoprofen: 7 days
- Dexamethasone: 7 days
- Omeprazole: 24 hours

**Result:** If ANY risk → anti_doping_safe = FALSE

---

### 7. OUTPUT FORMAT (JSON ONLY)

Return ONLY valid JSON. No markdown. No explanations outside JSON.

{
  "status": "SUCCESS",
  "meta": {
    "profile_type_detected": "String (Easy Keeper, Hard Keeper, Standard)",
    "calculation_method": "INRA 2011 + FORAGE PRECISION V3.2",
    "timestamp": "${new Date().toISOString()}"
  },

  "forage_analysis": {
    "source_used": "LIBRARY_PRESET" | "ANALYSIS_SCAN" | "DEFAULT",
    "forage_type_detected": "String (ex: Foin de Prairie Tardif)",
    "quality_description": "String (ex: Coupe tardive, faible énergie)",
    "nutritional_values_used": {
      "UFC_per_kg_DM": float,
      "MADC_per_kg_DM": float,
      "dry_matter_percent": float
    },
    "dry_matter_correction": "String (ex: 10kg brut = 9kg MS)",
    "forage_contribution": {
      "UFC_from_forage": float,
      "MADC_from_forage": float
    }
  },

  "nutritional_calculation": {
    "target_UFC": float,
    "target_UFC_adjusted": float,
    "adjustment_reason": "String",
    "actual_UFC": float,
    "balance_status": "OK" | "DEFICIT" | "EXCESS",
    
    "target_MADC_g": float,
    "actual_MADC_g": float,
    "protein_status": "OK" | "DEFICIT" | "EXCESS"
  },

  "security_check": {
    "anti_doping_safe": boolean,
    "feed_analysis": {
      "status": "SAFE" | "RISK",
      "detected_substances": ["String"],
      "risk_level": "NONE" | "LOW" | "HIGH"
    },
    "veterinary_check": {
      "status": "SAFE" | "RISK",
      "active_molecule_alert": "String or null",
      "days_remaining": number or null
    },
    "alerts": ["String"]
  },

  "ui_display_data": {
    "recommended_total_qty_kg": float,
    "feed_density_used": float,
    "display_recommendation_liters": float,
    
    "meal_planning": {
      "meals_per_day": integer,
      "liters_per_meal": float,
      "meal_schedule": "String"
    },
    
    "forage_advice": "String (ex: Votre foin est très riche. J'ai réduit les granulés de 30%.)"
  },

  "health_alerts": {
    "pathology_warnings": ["String"],
    "forage_warnings": ["String"],
    "Ca_P_ratio": float,
    "Ca_P_status": "OPTIMAL" | "IMBALANCED",
    "ulcer_risk": boolean,
    "ulcer_risk_reason": "String or null"
  },

  "expert_advice": "String (Comprehensive advice including forage quality impact)"
}

**CRITICAL RULES:**
1. ALWAYS prioritize forage analysis (Library > Default)
2. ALWAYS apply DM correction (especially for Haylage at 65% DM)
3. Calculate concentrate needs AFTER forage contribution
4. IF ANY anti-doping risk → anti_doping_safe = false
5. ALWAYS convert Kg to Liters using feed_density
6. ALWAYS provide meal_planning with specific quantities
7. Apply metabolic adaptations based on profile_type
8. Alert if forage type is incompatible with pathology

NOW ANALYZE THE DATA. Respond ONLY with the JSON, no markdown, no explanation.`;

        console.log('🧪 Analyse nutritionnelle avancée avec anti-dopage...');
        const text = await callGeminiAPI('gemini-2.0-flash', systemPrompt, {
            temperature: 0.2, // Bas pour être précis et factuel
            maxOutputTokens: 4096
        });

        console.log('✅ Réponse brute analyse:', text.substring(0, 200) + '...');

        // Nettoyage du texte
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        // Parser le JSON
        const analysisResult = JSON.parse(cleanedText);

        // Validation de la réponse V3.2
        if (!analysisResult.security_check || !analysisResult.nutritional_calculation) {
            throw new Error('Format de réponse invalide de l\'IA (V3.2)');
        }

        // Vérifier que forage_analysis est présent (V3.2)
        if (!analysisResult.forage_analysis) {
            console.warn('⚠️ forage_analysis manquant, analyse de fourrage non fournie');
        } else {
            console.log('🌾 Fourrage analysé:', analysisResult.forage_analysis.forage_type_detected);
            console.log('📊 Contribution fourrage:', analysisResult.forage_analysis.forage_contribution);
        }

        // Vérifier que ui_display_data est présent
        if (!analysisResult.ui_display_data || !analysisResult.ui_display_data.display_recommendation_liters) {
            console.warn('⚠️ ui_display_data manquant, conversion Kg→L non fournie');
        }

        console.log('✅ Analyse V3.2 réussie:', analysisResult.security_check.anti_doping_safe ? 'SAFE' : 'RISK DETECTED');
        console.log('📊 Recommandation:', analysisResult.ui_display_data?.display_recommendation_liters, 'L');

        return {
            success: true,
            data: analysisResult,
            generatedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse nutritionnelle:', error);

        const errMsg = error?.message || error?.error || JSON.stringify(error);
        let errorMessage = 'Erreur inconnue';

        if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key')) {
            errorMessage = 'Clé API Gemini invalide';
        } else if (errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            errorMessage = 'Quota Gemini épuisé. Réessayez plus tard.';
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
 * Extrait les informations d'un cheval depuis une photo de document (Carnet, Fiche SIRE)
 * @param {Object} params - Paramètres d'analyse
 * @param {string} params.imageBase64 - Image en base64
 * @param {string} params.mimeType - Type MIME
 * @returns {Promise<Object>} Données du cheval extraites
 */
export async function extractMareDataFromImage(params) {
    try {
        const { imageBase64, mimeType = 'image/jpeg' } = params;

        if (!imageBase64) {
            throw new Error('Image requise pour l\'analyse');
        }

        const systemPrompt = `Tu es un expert en identification équine et lecture de documents officiels (Carnets SIRE, Fiches Haras Nationaux).
Ta mission est d'extraire les informations d'identification d'un cheval à partir de la photo de son document.

⚠️ RÈGLES CRITIQUES DE DISTINCTION SIRE/UELN :
- Le Numéro SIRE est COURT (9 caractères en France). Format habituel : 2 lettres + 6 chiffres + 1 lettre (avant 2002) OU 8 chiffres + 1 lettre.
- Le Numéro UELN est LONG (15 chiffres). Il commence souvent par "250" pour la France. C'est le "N° d'identification unique".

Champs à extraire :
1. NOM du cheval
2. Numéro SIRE (Le numéro COURT à 9 char)
3. Numéro UELN (Le numéro LONG à 15 char, si présent)
4. Sexe (Femelle, Jument, Male, Entier, Hongre)
5. Race (Selle Français, facteur SF, KWPN, etc.)
6. Père (Sire)
7. Mère (Dam)
8. Date de naissance

FORMAT DE SORTIE (JSON strict uniquement) :
{
  "name": "String (ex: Noblesse du Val)",
  "sireNumber": "String (9 caractères max, ex: 12345678X)",
  "ueln": "String (15 chiffres, ex: 250001123456789)",
  "sex": "Jument/Etalon/Hongre",
  "breed": "String",
  "sire": "String (Nom du père)",
  "dam": "String (Nom de la mère)",
  "birthDate": "String (ex: 2012-05-20) ou Année seule"
}

Si une information est illisible ou absente, mets null.
Réponds UNIQUEMENT avec le JSON.`;

        console.log('🐴 Analyse document cheval avec Gemini Vision...');
        const text = await callGeminiVisionAPI('gemini-2.0-flash', systemPrompt, imageBase64, mimeType, {
            temperature: 0.1, // Très bas pour extraction factuelle
            maxOutputTokens: 2048
        });

        console.log('✅ Réponse brute analyse:', text.substring(0, 100) + '...');

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
        console.error('❌ Erreur analyse document:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Adapte dynamiquement le planning d'entraînement en fonction du feedback post-séance
 * @param {Object} params - Paramètres d'adaptation
 * @param {number} params.prev_session_intensity - Intensité prévue (1-10)
 * @param {number} params.actual_user_rpe - RPE réel du cavalier (1-10)
 * @param {string} params.horse_recovery_status - État de récupération ("Frais", "Normal", "Fatigué", "Épuisé")
 * @param {Array} params.next_sessions_queue - Liste des 3 prochaines séances (J+1, J+2, J+3)
 * @param {Object} params.horse - Informations du cheval
 * @returns {Promise<Object>} Planning adapté avec modifications
 */
export async function adaptTrainingPlan(params) {
    try {
        const {
            prev_session_intensity,
            actual_user_rpe,
            horse_recovery_status,
            next_sessions_queue,
            horse
        } = params;

        // Validation des données d'entrée
        if (!prev_session_intensity || !actual_user_rpe || !horse_recovery_status || !next_sessions_queue) {
            throw new Error('Paramètres manquants pour l\'adaptation du planning');
        }

        // Construction du System Prompt selon la spécification
        const systemPrompt = `### SYSTEM PROMPT: DYNAMIC TRAINING ADAPTATION (FEEDBACK LOOP) ###

**ROLE:**
Tu es un Expert en Physiologie Sportive Équine et Data Scientist.
Ta mission est d'analyser la charge interne (Ressenti) vs la charge externe (Prévu) pour réajuster le planning futur.

**INPUT DATA (CONTEXTE):**
Tu recevras un objet JSON contenant :
1. prev_session_intensity: ${prev_session_intensity} (Intensité qui était prévue : 1-10)
2. actual_user_rpe: ${actual_user_rpe} (Ressenti réel du cavalier : 1-10)
3. horse_recovery_status: "${horse_recovery_status}" (Observation : "Frais", "Normal", "Fatigué", "Épuisé")
4. next_sessions_queue: ${JSON.stringify(next_sessions_queue, null, 2)} (Liste des 3 prochaines séances prévues J+1, J+2, J+3)

**INFORMATIONS CHEVAL:**
- Nom: ${horse?.name || 'Non précisé'}
- Âge: ${horse?.age || 'Non précisé'} ans
- Race: ${horse?.breed || 'Non précisée'}
- Discipline: ${horse?.discipline || 'Non précisée'}

**LOGIC RULES (ALGORITHME DE DÉCISION):**

**CASE A: ADAPTATION NEUTRE (Conformité)**
IF actual_user_rpe IS EQUAL TO prev_session_intensity (+/- 1)
THEN:
   - Status: "OK"
   - Action: Ne rien changer au planning. Le cheval encaisse la charge comme prévu.

**CASE B: ADAPTATION À LA BAISSE (Récupération forcée)**
IF actual_user_rpe > prev_session_intensity (+ 2 points ou plus)
OR IF horse_recovery_status == "Fatigué"
THEN:
   - Status: "OVERREACHING_DETECTED"
   - Action:
     1. Modifier J+1 : Si J+1 est une séance intense (Galop/Saut), la remplacer par "Active Recovery" (Trotting léger ou Marche).
     2. Décaler la séance clé : Repousser la séance intense prévue à J+3.
   - Message au cavalier : "Attention, votre cheval semble marquer le coup. J'ai allégé le programme de demain pour favoriser la surcompensation."

**CASE C: ALERTE ROUGE (Sécurité)**
IF actual_user_rpe >= 9
OR IF horse_recovery_status == "Épuisé"
THEN:
   - Status: "DANGER_FLAG"
   - Action:
     1. Supprimer toutes les séances intenses pour 72h.
     2. Remplacer par "Repos" ou "Soins".
   - Message au cavalier : "Alerte : Indicateurs de fatigue critique. Repos complet conseillé. Surveillez la température et l'appétit."

**CASE D: ADAPTATION À LA HAUSSE (Optimisation)**
IF actual_user_rpe < prev_session_intensity (- 2 points)
AND horse_recovery_status == "Frais"
THEN:
   - Status: "UNDERTRAINING"
   - Action: Augmenter légèrement l'intensité ou la durée de la séance J+2 (+10%).

**OUTPUT FORMAT (JSON ONLY):**
Réponds uniquement avec un objet JSON structuré ainsi :
{
  "analysis_status": "OK" | "WARNING" | "CRITICAL",
  "reasoning": "Explication courte pour le frontend (une phrase)",
  "modifications_applied": boolean,
  "updated_next_sessions": [
      // Objet session J+1 mis à jour ou identique
      // Objet session J+2 mis à jour ou identique
      // Objet session J+3 mis à jour ou identique
  ]
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

        console.log('🧠 Adaptation dynamique du planning avec Gemini...');
        const text = await callGeminiAPI('gemini-2.0-flash', systemPrompt, {
            temperature: 0.3, // Bas pour être précis et cohérent
            maxOutputTokens: 4096
        });

        console.log('✅ Réponse brute adaptation:', text.substring(0, 200) + '...');

        // Nettoyage du texte
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        // Parser le JSON
        const adaptationResult = JSON.parse(cleanedText);

        // Validation de la réponse
        if (!adaptationResult.analysis_status || !adaptationResult.reasoning) {
            throw new Error('Format de réponse invalide de l\'IA');
        }

        console.log('✅ Adaptation réussie:', adaptationResult.analysis_status);
        return {
            success: true,
            data: adaptationResult,
            generatedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Erreur lors de l\'adaptation du planning:', error);

        const errMsg = error?.message || error?.error || JSON.stringify(error);
        let errorMessage = 'Erreur inconnue';

        if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key')) {
            errorMessage = 'Clé API Gemini invalide';
        } else if (errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            errorMessage = 'Quota Gemini épuisé. Réessayez plus tard.';
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

export default {
    callGeminiVisionAPI,
    generateTrainingPlan,
    generateQuickTips,
    analyzeProgress,
    adaptTrainingPlan,
    testGeminiConnection,
    chatWithAssistant,
    estimateWeightFromImage,
    extractNutritionFromImage,
    analyzeNutritionWithAntiDoping,
    extractMareDataFromImage
};
