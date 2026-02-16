/**
 * 🧪 EXEMPLES DE TEST - EQUINOX ELITE AI COACH
 * 
 * Ce fichier contient des exemples concrets d'utilisation du système Equinox Elite
 * pour différentes disciplines et niveaux.
 */

import { generateTrainingPlan } from '../services/geminiService';

// ========================================
// EXEMPLE 1: CSO Amateur Elite
// ========================================
export async function testCSO_AmateurElite() {
    console.log('🏅 TEST: CSO Amateur Elite - Préparation Grand Prix');

    const params = {
        horse: {
            name: "Noblesse du Val",
            age: 8,
            breed: "Selle Français",
            estimatedWeight: 520
        },
        rider: {
            name: "Sophie Martin",
            level: "Amateur/Pro"
        },
        discipline: "CSO",
        level: "Compétition",
        frequency: 4,
        focus: "Préparation Grand Prix 140cm à Fontainebleau dans 3 semaines. Focus sur l'explosivité et la technique.",
        targetDate: "2026-03-01",
        eventName: "Grand Prix Fontainebleau 140cm"
    };

    const result = await generateTrainingPlan(params);

    if (result.success) {
        console.log('✅ Planning généré avec succès!');
        console.log('📋 Titre:', result.data.planningTitle);
        console.log('🎯 Objectif:', result.data.objective);
        console.log('📅 Nombre de séances:', result.data.weeklySchedule?.length || result.data.events?.length);

        // Vérifier que le tapering est bien appliqué
        if (result.data.tapering) {
            console.log('🔥 Tapering:', result.data.tapering);
        }

        return result.data;
    } else {
        console.error('❌ Erreur:', result.error);
        return null;
    }
}

// ========================================
// EXEMPLE 2: Trotteur Groupe 1
// ========================================
export async function testTrot_Groupe1() {
    console.log('🏁 TEST: Trotteur Groupe 1 - Préparation Prix d\'Amérique');

    const params = {
        horse: {
            name: "Davidson du Pont",
            age: 5,
            breed: "Trotteur Français",
            estimatedWeight: 480
        },
        rider: {
            name: "Jean Dupont",
            level: "Amateur/Pro"
        },
        discipline: "Trot",
        level: "Compétition",
        frequency: 5,
        focus: "Préparation Prix d'Amérique. Développer la vitesse de pointe et la récupération cardiaque. AUCUN SAUT.",
        targetDate: "2026-02-28",
        eventName: "Prix d'Amérique (Groupe 1)"
    };

    const result = await generateTrainingPlan(params);

    if (result.success) {
        console.log('✅ Planning généré avec succès!');

        // VÉRIFICATION CRITIQUE: Pas de sauts pour les trotteurs
        const hasForbiddenKeywords = JSON.stringify(result.data).toLowerCase().includes('saut');
        if (hasForbiddenKeywords) {
            console.error('🚨 ERREUR SÉCURITÉ: Le planning contient des sauts pour un TROTTEUR!');
        } else {
            console.log('✅ SÉCURITÉ OK: Aucun saut détecté (correct pour trotteur)');
        }

        return result.data;
    } else {
        console.error('❌ Erreur:', result.error);
        return null;
    }
}

// ========================================
// EXEMPLE 3: Endurance Longue Distance
// ========================================
export async function testEndurance_LongDistance() {
    console.log('🏃 TEST: Endurance - Préparation 160km');

    const params = {
        horse: {
            name: "Sahara Wind",
            age: 9,
            breed: "Arabe",
            estimatedWeight: 420
        },
        rider: {
            name: "Marie Lefevre",
            level: "Amateur/Pro"
        },
        discipline: "Endurance",
        level: "Compétition",
        frequency: 6,
        focus: "Préparation raid d'endurance 160km. Focus sur cardio, récupération et gestion de l'effort.",
        targetDate: "2026-04-15",
        eventName: "Raid de Florac 160km"
    };

    const result = await generateTrainingPlan(params);

    if (result.success) {
        console.log('✅ Planning généré avec succès!');

        // Vérifier que le planning inclut bien du travail de récupération cardiaque
        const hasCardioRecovery = JSON.stringify(result.data).toLowerCase().includes('récupération cardiaque')
            || JSON.stringify(result.data).toLowerCase().includes('bpm');

        if (hasCardioRecovery) {
            console.log('✅ SPÉCIFICITÉ OK: Travail cardiaque détecté (correct pour endurance)');
        } else {
            console.warn('⚠️ ATTENTION: Peu de références au travail cardiaque');
        }

        return result.data;
    } else {
        console.error('❌ Erreur:', result.error);
        return null;
    }
}

// ========================================
// EXEMPLE 4: Jeune Cheval Dressage
// ========================================
export async function testDressage_JeuneCheval() {
    console.log('🎭 TEST: Dressage - Jeune cheval');

    const params = {
        horse: {
            name: "Prince Noir",
            age: 4,
            breed: "Lusitanien",
            estimatedWeight: 500
        },
        rider: {
            name: "Claire Dubois",
            level: "Galop 5-7"
        },
        discipline: "Dressage",
        level: "Jeune",
        frequency: 3,
        focus: "Développement progressif du jeune cheval. Assouplissement, transitions, début d'épaule en dedans. Séances courtes.",
        targetDate: null, // Pas de compétition immédiate
        eventName: null
    };

    const result = await generateTrainingPlan(params);

    if (result.success) {
        console.log('✅ Planning généré avec succès!');

        // Vérifier que les séances respectent la règle des jeunes chevaux (30-40min max)
        const events = result.data.events || result.data.weeklySchedule;
        if (events) {
            const longSessions = events.filter(e => {
                const duration = parseInt(e.duration_min || e.duration);
                return duration > 45;
            });

            if (longSessions.length > 0) {
                console.warn('⚠️ ATTENTION: Certaines séances sont longues pour un jeune cheval:', longSessions.length);
            } else {
                console.log('✅ ADAPTATION OK: Séances courtes adaptées au jeune cheval');
            }
        }

        return result.data;
    } else {
        console.error('❌ Erreur:', result.error);
        return null;
    }
}

// ========================================
// EXEMPLE 5: Loisir Débutant
// ========================================
export async function testLoisir_Debutant() {
    console.log('🌄 TEST: Loisir - Cavalier débutant');

    const params = {
        horse: {
            name: "Bella",
            age: 12,
            breed: "ONC",
            estimatedWeight: 540
        },
        rider: {
            name: "Thomas Novice",
            level: "Galop 1-4"
        },
        discipline: "Loisir",
        level: "Intermédiaire",
        frequency: 2,
        focus: "Reprise de confiance après une pause. Exercices simples et sécuritaires. Focus sur la détente et le plaisir.",
        targetDate: null,
        eventName: null
    };

    const result = await generateTrainingPlan(params);

    if (result.success) {
        console.log('✅ Planning généré avec succès!');

        // Vérifier que les exercices sont adaptés au niveau débutant
        const planText = JSON.stringify(result.data).toLowerCase();
        const hasComplexExercises = planText.includes('enchaînement complexe')
            || planText.includes('technique avancée');

        if (hasComplexExercises) {
            console.warn('⚠️ ATTENTION: Exercices peut-être trop complexes pour débutant');
        } else {
            console.log('✅ ADAPTATION OK: Exercices simples pour cavalier débutant');
        }

        return result.data;
    } else {
        console.error('❌ Erreur:', result.error);
        return null;
    }
}

// ========================================
// FONCTION DE TEST GLOBALE
// ========================================
export async function runAllTests() {
    console.log('\n🚀 DÉMARRAGE DES TESTS EQUINOX ELITE\n');
    console.log('='.repeat(60));

    const tests = [
        { name: 'CSO Amateur Elite', fn: testCSO_AmateurElite },
        { name: 'Trotteur Groupe 1', fn: testTrot_Groupe1 },
        { name: 'Endurance 160km', fn: testEndurance_LongDistance },
        { name: 'Dressage Jeune Cheval', fn: testDressage_JeuneCheval },
        { name: 'Loisir Débutant', fn: testLoisir_Debutant }
    ];

    const results = [];

    for (const test of tests) {
        console.log(`\n📝 Test: ${test.name}`);
        console.log('-'.repeat(60));

        try {
            const result = await test.fn();
            results.push({
                name: test.name,
                success: !!result,
                data: result
            });
        } catch (error) {
            console.error(`❌ Exception dans ${test.name}:`, error);
            results.push({
                name: test.name,
                success: false,
                error: error.message
            });
        }

        // Pause entre les tests pour éviter d'overload l'API
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Résumé des tests
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(60));

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`✅ Succès: ${successCount}/${tests.length}`);
    console.log(`❌ Échecs: ${failCount}/${tests.length}`);

    if (failCount > 0) {
        console.log('\n⚠️ Tests échoués:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.name}: ${r.error || 'Erreur inconnue'}`);
        });
    }

    return results;
}

// ========================================
// USAGE
// ========================================
// Pour lancer les tests:
// import { runAllTests } from './utils/test_ai_coach_examples';
// runAllTests();

// Pour tester un cas spécifique:
// import { testCSO_AmateurElite } from './utils/test_ai_coach_examples';
// const result = await testCSO_AmateurElite();
