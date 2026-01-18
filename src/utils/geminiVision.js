import { GoogleGenerativeAI } from "@google/generative-ai";

// Récupération de la clé API depuis les variables d'environnement
// Supporte VITE_GEMINI_API_KEY ou VITE_GOOGLE_AI_KEY
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_AI_KEY;

if (!API_KEY) {
    console.warn("⚠️ Aucune clé API Gemini trouvée (VITE_GEMINI_API_KEY). L'analyse d'image ne fonctionnera pas.");
}

// Initialisation du client
const genAI = new GoogleGenerativeAI(API_KEY || "dummy_key");

console.log("Gemini Vision Module Loaded. API Key Present:", !!API_KEY);

/**
 * Convertit un fichier (blob) en format compatible Gemini (Base64)
 */
function fileToGenerativePart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                },
            });
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Analyse une image d'ordonnance vétérinaire
 * @param {File} imageFile - Le fichier image à analyser
 * @returns {Promise<Array>} - Liste des médicaments détectés
 */
export async function analyzePrescription(imageFile) {
    console.log("🚀 Démarrage analysePrescription. Fichier:", imageFile.name, imageFile.type, imageFile.size);

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
        throw new Error("Clé API Gemini (VITE_GEMINI_API_KEY) manquante. Renommez votre image avec 'test' pour simuler.");
    }

    try {
        console.log("💊 Analyse de l'ordonnance en cours avec Gemini 1.5 Flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

        const imagePart = await fileToGenerativePart(imageFile);

        const today = new Date().toISOString().split('T')[0];

        const prompt = `Tu es un assistant vétérinaire expert.
        Analyse cette image d'ordonnance vétérinaire.
        Extrais les médicaments prescrits et retourne-les UNIQUEMENT sous format JSON strict, sans texte autour.
        
        Structure attendue (Array d'objets) :
        [
          { 
            "name": "Nom du produit (ex: Equipalazone)", 
            "dosage": "Dosage (ex: 2 sachets)", 
            "frequency": "Fréquence (ex: Matin et Soir)", 
            "duration": 5, // Nombre de jours (entier)
            "start_date": "YYYY-MM-DD" // Date de début. Si non trouvée, utilise : ${today}
          }
        ]
        
        Assure-toi que le JSON est valide. Si aucun médicament n'est trouvé, retourne [].`;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        console.log("📝 Réponse brute Gemini :", text);

        // Nettoyage du JSON (retirer les balises markdown ```json ... ``` ou ```)
        let jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Parsing
        const parsedData = JSON.parse(jsonString);

        if (!Array.isArray(parsedData)) {
            console.warn("⚠️ Le format retourné n'est pas un tableau", parsedData);
            return [parsedData]; // Tenter de wrapper si objet unique
        }

        return parsedData;

    } catch (error) {
        console.error("❌ Erreur lors de l'analyse Gemini :", error);
        // Retourner le vrai message d'erreur pour debug
        throw new Error(`Echec Gemini: ${error.message || error.toString()}`);
    }
}
