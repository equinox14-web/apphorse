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
      
      Output strictly valid JSON with no markdown:
      {
        "name": "Product Name",
        "brand": "Brand Name",
        "category": "GRANULE" (or "CEREALE", "COMPLEMENT", "MINERAL"),
        "density": Number (estimate if not present, default 0.65 for pellets, 0.5 for muesli),
        "ufc": Number (Energy INRA, if not present estimate based on ingredients: 0.85 default),
        "madc": Number (Protein INRA g/kg, if 'Proteine Brute' is present, estimate MADC = Crude Protein * 0.8),
        "cellulose": Number (% Crude Fiber),
        "mat": Number (% Crude Protein),
        "starch": Number (% Amidon if present),
        "sugar": Number (% Sucre if present)
      }
    `;

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        // Clean and parse JSON
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error analyzing label:", error);
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
