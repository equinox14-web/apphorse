import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // Ensure this is set in your .env
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Analyses a feed label image using Gemini Vision Pro.
 * Extract nutritional values (UFC, MADC) and density if available.
 * 
 * @param {File} imageFile - The image file object from the input
 * @returns {Promise<Object>} JSON object with nutritional info
 */
export async function analyzeFeedLabel(imageFile) {
    if (!API_KEY) {
        console.error("Gemini API Key is missing");
        throw new Error("API Key Missing");
    }

    try {
        // Use the powerful preview model for Vision
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Convert file(s) to base64
        // Support both single file and array of files
        let imageParts = [];
        if (Array.isArray(imageFile)) {
            imageParts = await Promise.all(imageFile.map(f => fileToGenerativePart(f)));
        } else {
            imageParts = [await fileToGenerativePart(imageFile)];
        }

        const prompt = `
      You are an expert Equine Nutritionist. Analyze this feed label image.
      Extract the following nutritional values per KG of product.
      If values are per LB or other unit, convert to KG.
      
      IMPORTANT - CATEGORY IDENTIFICATION:
      STRICT THRESHOLDS - Do NOT confuse complete feeds with CMV:
      
      - "CMV" (Complément Minéral Vitaminé) ONLY IF ALL conditions met:
        * Calcium > 150 g/kg AND Phosphorus > 50 g/kg (VERY HIGH)
        * UFC < 0.2 (almost no energy)
        * Label explicitly says "CMV", "Minéral", "Vitaminé"
        * Dosage is in scoops (20-50g/day for 500kg horse)
        * Examples: "Horse Master CMV", "Reverdy CMV Elevage"
        
      - "MELANGE" (Complete feed - pellets/muesli):
        * UFC between 0.8 and 1.2
        * Ca between 5 and 25 g/kg (MODERATE, not extreme)
        * Given in Liters (2-5L/day)
        * Examples: "Dynavena Elevage", "Royal Horse", "Reverdy Adult Mix"
        
      - "COMPLEMENT" = Feed supplement (UFC 0.3-0.8)
      - "CEREALE" = Pure grains (oats, barley, corn)
      - "FOURRAGE" = Hay, haylage
      
      OUTPUT FORMAT JSON:
      {
        "name": "Product Name",
        "brand": "Brand Name",
        "category": "CMV" (if mineral/vitamin supplement), "COMPLEMENT", "MELANGE", "CEREALE", "FOURRAGE",
        "density": Number (estimate if not present, default 0.65 for pellets, 0.5 for muesli, 0.9 for liquid/mineral),
        "scoop_weight": Number (weight of 1 scoop/dosage cap in grams, if indicated. e.g. "1 mesure = 25g" -> 25),
        "daily_dose_g": Number (average daily dose in grams for 500kg horse, if indicated),
        "ufc": Number (Energy INRA, if not present estimate based on ingredients: 0.85 default for feed, <0.1 for CMV),
        "madc": Number (Protein INRA g/kg, estimate MADC = Crude Protein * 0.8),
        "cellulose": Number (% Crude Fiber),
        "mat": Number (% Crude Protein),
        "starch": Number (% Amidon if present),
        "sugar": Number (% Sucre if present),
        "calcium": Number (g/kg),
        "phosphorus": Number (g/kg),
        "magnesium": Number (g/kg),
        "sodium": Number (g/kg),
        "zinc": Number (mg/kg),
        "copper": Number (mg/kg),
        "selenium": Number (mg/kg),
        "lysine": Number (g/kg)
      }
      
      CATEGORIZATION RULES (APPLY STRICTLY):
      1. If label contains "CMV" OR "Minéral" in name AND (Ca > 150 g/kg OR P > 50 g/kg) AND UFC < 0.2 => category = "CMV"
      2. If product is pure grain (only oats, barley, or corn) => category = "CEREALE"
      3. If UFC > 0.8 and contains mixed ingredients => category = "MELANGE"
      4. If UFC between 0.3 and 0.8 => category = "COMPLEMENT"
      5. DEFAULT: If unsure and UFC > 0.8 => category = "MELANGE" (NOT CMV)
    `;

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        // Clean and parse JSON
        const jsonString = text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error analyzing label:", error);
        throw error;
    }
}

/**
 * Search for feed nutritional information by name using AI.
 * No image required - purely text-based search.
 * 
 * @param {string} feedName - The name of the feed to search for
 * @returns {Promise<Object>} JSON object with nutritional info
 */
export async function searchFeedByName(feedName) {
    if (!API_KEY) {
        console.error("Gemini API Key is missing");
        throw new Error("API Key Missing");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Tu es un expert en nutrition équine avec accès aux fiches techniques officielles des fabricants d'aliments pour chevaux.

🎯 TÂCHE PRIORITAIRE : Recherche la FICHE TECHNIQUE OFFICIELLE du produit "${feedName}" sur le site web du fabricant.

📋 SITES FABRICANTS À CONSULTER EN PRIORITÉ :
1. **Dynavena** : https://www.dynavena.com/ → Section "Nos produits" → Fiches techniques PDF
2. **Reverdy** : https://www.reverdy.fr/ → Gamme produits → Analyses nutritionnelles
3. **Royal Horse / Cavalor** : https://www.cavalor.com/ → Product datasheets
4. **Horse Master** : https://www.horsemaster.com/ → Fiches produits
5. **Paskacheval** : https://www.paskacheval.com/ → Catalogue produits
6. **Destrier** : https://www.destrier.fr/ → Gamme aliments
7. **Versele-Laga** : https://www.versele-laga.com/ → Horse nutrition
8. **Agrobs** : https://www.agrobs.de/ → Product specifications
9. **Dodson & Horrell** : https://www.dodsonandhorrell.com/ → Nutritional info

🔍 MÉTHODOLOGIE DE RECHERCHE :
1. **Identifier le fabricant** depuis le nom du produit
2. **Chercher la fiche technique PDF** ou page produit officielle
3. **Extraire les valeurs EXACTES** de la fiche (UFC, MADC, Ca, P, densité)
4. **Vérifier la cohérence** : UFC entre 0.8-1.2 pour MELANGE, Ca<20g pour aliment complet
5. **Citer la source** : Mentionner "Fiche technique [Marque] [Produit]" dans description

⚠️ RÈGLES ABSOLUES :
- ✅ PRIORITÉ : Fiches techniques officielles des fabricants
- ✅ Utiliser les valeurs EXACTES publiées (pas d'estimation si fiche trouvée)
- ✅ Vérifier que c'est bien le bon produit (pas une variante)
- ✅ Indiquer la source précise dans "description"
- ❌ NE JAMAIS inventer de valeurs si la fiche existe
- ❌ NE PAS confondre les produits d'une même gamme

📊 EXEMPLES DE FICHES TECHNIQUES CONNUES :
- "Dynavena Elevage" → Fiche technique Dynavena : UFC 0.95, MADC 110g, Ca 12g, P 7g, densité 0.6
- "Reverdy Adult Energie" → Fiche Reverdy : UFC 1.1, MADC 95g, Ca 11g, P 7g, densité 0.55
- "Cavalor Perfomix" → Datasheet Cavalor : UFC 1.0, MADC 100g, Ca 10g, P 6g
- "Dynavena Sport" UFC 1.05, MADC 115g, Ca 13g, P 7.5g
- "Dynavena Sérénité" → UFC 0.85, MADC 95g, Ca 10g, P 6g

🏷️ CATÉGORISATION (selon fiche technique) :
1. **CMV** : Ca > 150 g/kg ET P > 50 g/kg ET UFC < 0.2 ET nom contient "CMV" ou "Minéral"
   → Exemples : "Horse Master CMV Elevage", "Paskacheval CMV Sport"
2. **MELANGE** : UFC 0.7-1.2, aliment complet commercial (granulés/muesli)
   → Exemples : "Dynavena Elevage", "Reverdy Adult", "Cavalor Perfomix"
3. **CEREALE** : Grain pur sans additif
   → Exemples : "Avoine aplatie", "Orge concassé", "Maïs floconné"
4. **COMPLEMENT** : UFC 0.3-0.7, supplément alimentaire
   → Exemples : "Pulpe de betterave", "Son de blé", "Graines de lin"

📤 FORMAT DE RÉPONSE (JSON STRICT, SANS MARKDOWN) :
{
  "name": "NOM COMMERCIAL EXACT (tel qu'écrit sur la fiche)",
  "brand": "MARQUE EXACTE",
  "ufc": valeur_numerique_precise_de_la_fiche_ou_null,
  "madc": valeur_numerique_grammes_de_la_fiche_ou_null,
  "ca": calcium_grammes_par_kg_ou_null,
  "p": phosphore_grammes_par_kg_ou_null,
  "density": densité_kg_par_litre_ou_null,
  "unit": "L",
  "category": "CMV" ou "MELANGE" ou "CEREALE" ou "COMPLEMENT",
  "scoopWeight": poids_dosette_grammes_si_CMV_seulement,
  "description": "Source: Fiche technique [Marque] [Produit]",
  "notFound": boolean (true si la fiche technique n'a pas été trouvée)
}

🚨 RÈGLE DE SÉCURITÉ CRITIQUE : 
- ⛔ **INTERDICTION D'INVENTER** : Si tu ne trouves pas la fiche technique officielle du fabricant, tu ne dois pas inventer de valeurs.
- ⛔ **PAS D'ESTIMATION** : Dans ce cas, mets "notFound": true et laisse les valeurs numériques à null.
- ⛔ **MESSAGE UTILISATEUR** : Si notFound est true, mets dans la description : "Fiche technique non trouvée. Veuillez scanner l'étiquette de votre sac pour une analyse précise."
- ✅ **FIABILITÉ** : On préfère dire "Je ne sais pas" plutôt que de donner des données erronées.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean and parse JSON
        const jsonString = text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error searching feed by name:", error);
        throw error;
    }
}

/**
 * Calculates optimal diet plan using Gemini Expert INRA knowledge.
 * Takes broad profile including Age and Physiological Status.
 * 
 * @param {Object} horseProfile - { weight, age, type, physiological_status, workload }
 * @param {Array} availableFeeds - List of feeds available (scanned or ref)
 * @returns {Promise<Object>} Advice and proposed quantities
 */
export async function getExpertRationAdvice(horseProfile, availableFeeds) {
    if (!API_KEY) throw new Error("API Key Missing");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
Tu es un expert en nutrition équine utilisant strictement le système INRA (tables des besoins).
Pour calculer les Apports Nutritionnels Conseillés (ANC), tu dois impérativement ajuster les coefficients selon le stade physiologique reçu en input.

INPUT PROFILE:
${JSON.stringify(horseProfile, null, 2)}

AVAILABLE FEEDS:
${JSON.stringify(availableFeeds, null, 2)}

### RÈGLES DE CALCUL DYNAMIQUES :

1. CROISSANCE (Si Age < 4 ans) :
   - Les besoins en protéines (MADC) et minéraux (Ca/P) sont prioritaires pour le squelette.
   - Utilise les tables "Cheval en croissance" INRA. Ne sous-estime pas la Lysine.

2. REPRODUCTION (Si statut = Gestation ou Lactation) :
   - Gestation (Mois 1-8) : Besoins proches de l'entretien.
   - Gestation (Mois 9-11) : Augmente significativement les besoins énergétiques (UFC) et protéiques.
   - Lactation (Mois 1-3) : C'est le pic absolu de besoins (souvent x2 par rapport à l'entretien). Attention à ne pas surcharger en amidon, privilégie les matières grasses et fibres de qualité.

3. VIEUX CHEVAUX (Si Age > 18 ans) :
   - Considère une assimilation réduite. Augmente légèrement les apports protéiques de qualité pour éviter la fonte musculaire.
   - Vérifie que la ration est "facile à mâcher" (Suggère des floconnés ou mash si besoin).

4. TRAVAIL :
   - Ajuste les UFC strictement selon l'intensité déclarée (ex: Cheval de course = Travail Intense = besoins énergétiques très élevés).

### STRATÉGIE NUTRITIONNELLE SELON LA DISCIPLINE (Règles d'Or) :

1. PROFIL "ÉLEVAGE" (Poulinière, Poulain, Étalon) :
   - OBJECTIF : Construction tissulaire & Squelette.
   - PRIORITÉ : MADC (Protéines Digestibles).
   - RÈGLE : Le ratio Protéines/Énergie (MADC/UFC) doit être ÉLEVÉ (supérieur à 100g MADC/UFC pour un poulain).
   - ALIMENTATION : Privilégie les aliments riches en acides aminés (Lysine, Méthionine). Ne cherche pas à "engraisser" avec de l'amidon inutile.

2. PROFIL "SPORT & COURSES" (Trot, Galop, Complet niveau Élite) :
   - OBJECTIF : Puissance explosive & Récupération.
   - PRIORITÉ : UFC (Énergie) & Glucides rapides (Amidon contrôlé).
   - RÈGLE : Le ratio MADC/UFC est plus faible (autour de 75-80g MADC/UFC).
   - ALIMENTATION :
     * Si "Course/Explosif" : Accepte un taux d'amidon plus élevé (carburant rapide), mais fractionne impérativement les repas pour éviter l'acidose (Max 200g amidon/100kg PV par repas).
     * Si "Endurance" : Privilégie l'énergie venant des Lipides (Huiles) pour l'effort long.

3. PROFIL "LOISIR / RETRAITE" :
   - OBJECTIF : Maintien du poids sans excitation.
   - RÈGLE : Basse énergie, Protéines de maintien.
   - ALIMENTATION : Fibres prioritaires. Évite les excès de glucides (risque de fourbure/Cushing).

### TA MISSION :
À partir des aliments scannés et du profil précis ci-dessus :
1. Calcule les besoins précis (Cible UFC/MADC).
2. Détermine les quantités pour combler ces besoins (priorité Fourrage 1.5-2% PV).
3. Si le cheval est un "Cas critique" (Poulain, Lactation), ajoute un AVERTISSEMENT de sécurité dans le JSON de sortie si la ration proposée semble déséquilibrée (ex: carence en Calcium pour un poulain).

Output JSON (Keep this structure):
{
  "analysis": {
     "needs_ufc": Number,
     "needs_madc": Number,
     "status_comment": "String explaining the specific needs for this status and discipline"
  },
  "proposed_ration": [
     { "feed_name": "String", "qty_kg": Number, "role": "Forage/Concentrate/Supplement" }
  ],
  "warnings": ["Warning 1", "Warning 2"]
}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error thinking:", error);
        throw error;
    }
}

/**
 * Analyses a forage lab report (Reverdy, Eurofins) using Gemini Vision.
 * Ends up with exact nutritional values per kg Dry Matter.
 * 
 * @param {Array<File>} imageFiles - Array of image files of the report
 * @returns {Promise<Object>} JSON object with forage analysis
 */
export async function analyzeForageDocs(imageFiles) {
    if (!API_KEY) throw new Error("API Key Missing");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Convert files to base64
        let imageParts = [];
        if (Array.isArray(imageFiles)) {
            imageParts = await Promise.all(imageFiles.map(f => fileToGenerativePart(f)));
        } else {
            imageParts = [await fileToGenerativePart(imageFiles)];
        }

        const prompt = `
      You are an expert Equine Nutritionist. Analyze this forage lab report (Hay/Haylage analysis).
      Extract the following nutritional values.
      
      CRITICAL: You must identify if values are on "Raw Matter" (Brut) or "Dry Matter" (Matière Sèche / MS).
      ALWAYS CONVERT VALUES TO: PER KG OF DRY MATTER (MS).
      
      Look for:
      - UFC (Unité Fourragère Cheval)
      - MADC (Matières Azotées Digestibles Cheval) or MAT (Matières Azotées Totales)
      - Dry Matter % (Matière Sèche / MS)
      - Calcium (Ca)
      - Phosphorus (P)
      - Sugar/WSC (Sucres solubles) - Important for SME
      
      Output strictly valid JSON:
      {
        "success": true,
        "lab_name": "String (ex: Reverdy, Eurofins)",
        "sample_date": "String (if present)",
        "forage_type": "String (ex: Foin de Prairie)",
        "dry_matter_percent": Number (ex: 85.5),
        "ufc_per_kg_dm": Number (ex: 0.55),
        "madc_per_kg_dm": Number (ex: 42),
        "calcium_g_per_kg_dm": Number,
        "phosphorus_g_per_kg_dm": Number,
        "sugar_percent_dm": Number (or null),
        "quality_assessment": "String (Brief assessment: Good/Poor/Rich)"
      }
      
      If MADC is missing but MAT is present, estimate MADC = MAT * 0.6 (approx for forage).
    `;

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error analyzing forage docs:", error);
        throw error;
    }
}

async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
}
