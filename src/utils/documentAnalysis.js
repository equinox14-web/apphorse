/**
 * Analyse un carnet d'identification de cheval avec Google Gemini API
 * @param {string} base64Image - Image en format base64
 * @returns {Promise<Object>} - Données extraites du carnet
 */
export async function analyzeHorseDocument(base64Image) {
    try {
        console.log('🔵 [Cortex Vision] Début de l\'analyse...');

        // Récupérer la clé API depuis les variables d'environnement
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

        if (!apiKey || apiKey === 'VOTRE_CLE_API_ICI') {
            console.error('❌ [Cortex Vision] Clé API Gemini non configurée');
            throw new Error("La clé API Gemini n'est pas configurée. Veuillez ajouter VITE_GEMINI_API_KEY dans votre fichier .env");
        }

        console.log('✅ [Cortex Vision] Clé API Gemini trouvée');

        // Préparer l'image (supprimer le préfixe data:image si présent)
        const imageData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
        console.log('✅ [Cortex Vision] Image préparée, taille:', imageData.length, 'caractères');

        // Créer le prompt détaillé pour l'extraction d'informations
        const prompt = `Tu es un assistant IA expert en analyse de documents équestres. Analyse cette image d'un carnet d'identification de cheval (livret SIRE français ou passeport équin européen).

Extrait UNIQUEMENT les informations suivantes si elles sont clairement visibles dans le document :
- Nom du cheval
- Race (ex: Selle Français, Pure Race Espagnole, Pur-Sang, etc.)
- Âge ou année de naissance (calcule l'âge si nécessaire, nous sommes en 2026)
- Robe/Couleur (ex: Alezan, Bai, Noir, Gris, etc.)
- Sexe (Jument/Femelle, Étalon/Mâle, Hongre/Castré)
- Numéro UELN (Universal Equine Life Number) : format 15 caractères (ex: 250259600123456 ou FR123456789ABCD)
- Numéro SIRE : numéro d'identification français (ex: 1234567A, 12345678)
- Père (Sire) : Nom du père ex: "ARMITAGES BOY"
- Mère (Dam) : Nom de la mère ex: "DAME BLANCHE"
- Père de la Mère (Dam's Sire) : Souvent indiqué après "par" sous la mère ex: "CLINTON"

IMPORTANT : 
- Réponds UNIQUEMENT avec un objet JSON valide
- Si une information n'est pas visible ou lisible, utilise null
- N'ajoute AUCUN texte avant ou après le JSON
- Pour le sexe, utilise uniquement : "F" (jument), "M" (étalon), ou "H" (hongre)
- Pour l'âge, fournis un nombre entier
- Pour l'UELN, garde TOUS les caractères sans espaces (15 caractères exactement)
- Pour le SIRE, garde le format exact avec lettres et chiffres
- Sois précis et conservateur : en cas de doute, mets null

Format de réponse attendu :
{
  "name": "nom du cheval ou null",
  "breed": "race ou null",
  "age": nombre entier ou null,
  "color": "couleur ou null",
  "gender": "F", "M", "H" ou null,
  "ueln": "numéro UELN ou null",
  "sireNumber": "numéro SIRE ou null",
  "pedigree": {
    "sire": "Nom du père ou null",
    "dam": "Nom de la mère ou null",
    "damsSire": "Nom du père de la mère ou null"
  }
}`;

        console.log('⏳ [Cortex Vision] Envoi de la requête à Gemini API...');

        // Appel à l'API Google Gemini
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: "image/jpeg",
                                    data: imageData
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        topP: 0.95,
                        topK: 40,
                        maxOutputTokens: 1024,
                    }
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ [Cortex Vision] Erreur API:', errorData);
            throw new Error(`Erreur API Gemini: ${response.status} - ${errorData.error?.message || 'Erreur inconnue'}`);
        }

        console.log('✅ [Cortex Vision] Réponse reçue de Gemini');

        const data = await response.json();
        const text = data.candidates[0]?.content?.parts[0]?.text;

        if (!text) {
            console.error('❌ [Cortex Vision] Réponse vide de Gemini');
            throw new Error("Aucune réponse de Gemini");
        }

        console.log('📝 [Cortex Vision] Texte brut reçu:', text);

        // Parser la réponse JSON
        let extractedData;
        try {
            // Nettoyer le texte pour extraire uniquement le JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                extractedData = JSON.parse(jsonMatch[0]);
                console.log('✅ [Cortex Vision] JSON parsé avec succès:', extractedData);
            } else {
                console.error('❌ [Cortex Vision] Aucun JSON trouvé dans la réponse');
                throw new Error("No JSON found in response");
            }
        } catch (parseError) {
            console.error("❌ [Cortex Vision] Erreur de parsing JSON:", parseError);
            console.log("📝 [Cortex Vision] Réponse brute de Gemini:", text);
            throw new Error("Impossible d'extraire les données du document. Veuillez réessayer avec une image plus claire.");
        }

        // Validation et nettoyage des données
        const cleanedData = {
            name: extractedData.name && extractedData.name !== "null" ? extractedData.name : null,
            breed: extractedData.breed && extractedData.breed !== "null" ? extractedData.breed : null,
            age: extractedData.age && !isNaN(extractedData.age) ? parseInt(extractedData.age) : null,
            color: extractedData.color && extractedData.color !== "null" ? extractedData.color : null,
            gender: ["F", "M", "H"].includes(extractedData.gender) ? extractedData.gender : null,
            ueln: extractedData.ueln && extractedData.ueln !== "null" ? extractedData.ueln.replace(/\s/g, '') : null,
            sireNumber: extractedData.sireNumber && extractedData.sireNumber !== "null" ? extractedData.sireNumber.replace(/\s/g, '') : null,
            pedigree: {
                sire: extractedData.pedigree?.sire && extractedData.pedigree.sire !== "null" ? extractedData.pedigree.sire : '',
                dam: extractedData.pedigree?.dam && extractedData.pedigree.dam !== "null" ? extractedData.pedigree.dam : '',
                ds: extractedData.pedigree?.damsSire && extractedData.pedigree.damsSire !== "null" ? extractedData.pedigree.damsSire : ''
            }
        };

        console.log('✅ [Cortex Vision] Données nettoyées:', cleanedData);
        console.log('🔍 [Cortex Vision] SIRE Number extrait:', extractedData.sireNumber);
        console.log('🔍 [Cortex Vision] SIRE Number nettoyé:', cleanedData.sireNumber);

        // Vérifier qu'au moins une donnée a été extraite
        const hasData = Object.values(cleanedData).some(value => value !== null);
        if (!hasData) {
            console.warn('⚠️ [Cortex Vision] Aucune donnée extraite');
            throw new Error("Aucune information n'a pu être extraite du document. Assurez-vous que l'image est claire et contient un carnet d'identification de cheval.");
        }

        console.log('🎉 [Cortex Vision] Analyse terminée avec succès');

        return {
            success: true,
            data: cleanedData
        };

    } catch (error) {
        console.error("❌ [Cortex Vision] Erreur lors de l'analyse du document:", error);
        console.error("❌ [Cortex Vision] Stack trace:", error.stack);
        return {
            success: false,
            error: error.message || "Erreur inconnue lors de l'analyse du document."
        };
    }
}

/**
 * Convertit un fichier image en base64
 * @param {File} file - Fichier image
 * @returns {Promise<string>} - Image en base64
 */
export function imageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}
