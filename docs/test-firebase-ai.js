// Test simple pour vérifier que Firebase AI fonctionne
// Collez ce code dans la console du navigateur sur http://localhost:5173

(async function testFirebaseAI() {
    try {
        console.log('🧪 Test Firebase AI - Début');

        // Import dynamique des modules nécessaires
        const { ai } = await import('/src/firebase.js');
        const { getGenerativeModel } = await import('firebase/ai');

        console.log('✅ Modules importés');
        console.log('📦 AI Service:', ai);

        if (!ai) {
            console.error('❌ PROBLÈME : Firebase AI n\'est pas initialisé !');
            console.log('👉 Solution : Activez Firebase AI dans la console Firebase');
            return;
        }

        console.log('✅ Firebase AI est initialisé');

        // Tester la création d'un modèle
        const model = getGenerativeModel(ai, {
            model: "gemini-2.0-flash-exp"
        });

        console.log('✅ Modèle Gemini créé avec succès');
        console.log('📦 Modèle:', model);

        // Test simple avec du texte
        console.log('⏳ Test avec une simple question...');
        const result = await model.generateContent("Réponds juste 'OK' si tu me reçois");
        const response = await result.response;
        const text = response.text();

        console.log('✅ Réponse reçue:', text);
        console.log('🎉 Firebase AI fonctionne parfaitement !');

        return { success: true, response: text };

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
        console.error('📝 Message d\'erreur:', error.message);
        console.error('📋 Stack:', error.stack);

        // Analyser l'erreur
        if (error.message.includes('permission') || error.message.includes('forbidden')) {
            console.log('👉 L\'API Firebase AI n\'est probablement pas activée');
            console.log('👉 Allez sur https://console.firebase.google.com/ et activez Firebase AI');
        } else if (error.message.includes('quota')) {
            console.log('👉 Quota dépassé ou billing non activé');
            console.log('👉 Vérifiez votre compte Google Cloud');
        } else if (error.message.includes('not found') || error.message.includes('404')) {
            console.log('👉 Le modèle Gemini n\'est pas disponible');
            console.log('👉 Assurez-vous d\'utiliser la bonne région et le bon modèle');
        }

        return { success: false, error: error.message };
    }
})();
