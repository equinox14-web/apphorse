// Configuration pour API REST v1
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_AI_KEY;
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';

if (!API_KEY) {
    console.warn("⚠️ Aucune clé API Gemini trouvée (VITE_GEMINI_API_KEY). L'analyse d'image ne fonctionnera pas.");
}

console.log("Gemini Vision Module Loaded (REST Mode). API Key Present:", !!API_KEY);

/**
 * Convertit un fichier (blob) en Base64 pour l'API REST
 */
function fileToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // result is like "data:image/jpeg;base64,....."
            const base64Data = reader.result.split(',')[1];
            resolve({
                mimeType: file.type,
                data: base64Data // Raw base64 string
            });
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Analyse une image d'ordonnance vétérinaire via API REST v1
 * @param {File} imageFile - Le fichier image à analyser
 * @returns {Promise<Array>} - Liste des médicaments détectés
 */
export async function analyzePrescription(imageFile) {
    console.log("🚀 Démarrage analysePrescription (REST). Fichier:", imageFile.name, imageFile.type, imageFile.size);

    // MODE MOCK / TEST (Pour valider l'UI sans clé API)
    if (imageFile.name.toLowerCase().includes('test') || imageFile.name.toLowerCase().includes('mock')) {
        console.log("⚠️ MODE TEST DÉTECTÉ : Retour de données factices.");
        await new Promise(r => setTimeout(r, 1500)); // Simulation délai
        return [
            { name: "Equipalazone (TEST)", dosage: "2 sachets", frequency: "Matin et Soir", duration: 5, start_date: new Date().toISOString().split('T')[0] },
            { name: "Sputolysin (TEST)", dosage: "1 mesure", frequency: "Matin", duration: 10, start_date: new Date().toISOString().split('T')[0] }
        ];
    }

    if (!API_KEY) {
        console.error("❌ CLÉ API MANQUANTE DANS LE SERVICE GEMINI VISION");
        throw new Error("Clé API Gemini manquant. Vérifiez votre .env");
    }

    try {
        console.log("💊 Analyse de l'ordonnance avec Gemini 2.0 Flash...");

        const fileData = await fileToBase64(imageFile);
        const today = new Date().toISOString().split('T')[0];

        const prompt = `Tu es "Equinox Vet Guard", un assistant IA expert en santé équine et pharmacologie vétérinaire.
        
OBJECTIF : Analyser cette image d'ordonnance vétérinaire pour extraire les données de soins.

RÈGLES DE SÉCURITÉ :
- Tu n'es PAS vétérinaire. Ne pose pas de diagnostic.
- Extrais fidèlement ce qui est écrit. En cas de doute sur un nom ou une dose, ne l'invente pas.

MODE 1 : ANALYSE D'ORDONNANCE
Tu dois répondre UNIQUEMENT au format JSON strict suivant (sans texte avant ni après, pas de markdown) :

{
  "is_prescription": true,
  "horse_name": "Nom du cheval si présent (ex: Spirit)",
  "medications": [
    {
      "name": "Nom du médicament (ex: Équipalazone)",
      "dosage": "Dosage précis (ex: 2 sachets)",
      "frequency": "Fréquence (ex: Matin et Soir)",
      "duration": "Durée en jours (entier, ex: 5)",
      "administration": "Voie d'administration (ex: Orale, IV, IM)",
      "start_date": "YYYY-MM-DD", // Utilise la date du jour (${today}) si non précisée
      "notes": "Instructions spéciales (ex: Dans la ration)"
    }
  ],
  "analysis_summary": "Un résumé très court et rassurant de ce que contient l'ordonnance en français."
}

Assure-toi que le JSON est valide. Si ce n'est pas une ordonnance ou si aucun médicament n'est trouvé, retourne {"medications": [], "analysis_summary": "Impossible de lire l'ordonnance"}.`;

        // Construction de la requête REST
        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: fileData.mimeType,
                            data: fileData.data
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.2, // Faible température pour extraction de données
                maxOutputTokens: 2048
            }
        };

        const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Réponse Gemini vide ou invalide');
        }

        const text = data.candidates[0].content.parts[0].text;
        console.log("📝 Réponse brute Gemini :", text);

        // Nettoyage du JSON
        let jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Parsing
        const parsedData = JSON.parse(jsonString);

        if (parsedData.medications && Array.isArray(parsedData.medications)) {
            // Nouveau format Vet Guard
            return parsedData.medications.map(med => ({
                ...med,
                summary: parsedData.analysis_summary,
                detectedHorse: parsedData.horse_name
            }));
        } else if (Array.isArray(parsedData)) {
            // Ancien format (fallback)
            return parsedData;
        } else {
            console.warn("⚠️ Format inattendu:", parsedData);
            return [];
        }

    } catch (error) {
        console.error("❌ Erreur lors de l'analyse Gemini (REST) :", error);
        throw new Error(`Echec Gemini: ${error.message || error.toString()}`);
    }
}
