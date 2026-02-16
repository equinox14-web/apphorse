/**
 * 🏇 EXEMPLES DE TEST - COURSES DE GALOP
 * 
 * Tests spécifiques pour les 3 sous-disciplines de galop:
 * - PLAT (Flat Racing)
 * - HAIES (Hurdles)  
 * - STEEPLE (Steeplechase)
 */

import { generateTrainingPlan } from '../services/geminiService';

// ========================================
// TEST 1: PLAT (Flat Racing) - Prix de l'Arc de Triomphe
// ========================================
export async function testGalop_PLAT_ArcDeTriomphe() {
    console.log('🏁 TEST: GALOP PLAT - Prix de l\'Arc de Triomphe (Groupe 1)');

    const params = {
        horse: {
            name: "Almanzor",
            age: 4,
            breed: "Pur-Sang",
            estimatedWeight: 480
        },
        rider: {
            name: "Christophe Soumillon",
            level: "Amateur/Pro"
        },
        discipline: "Galop",
        level: "Compétition",
        frequency: 5,
        focus: "Préparation Prix de l'Arc de Triomphe (Groupe 1, PLAT). Développer vitesse pure et explosivité. Travail boîtes de départ. Pas d'obstacles.",
        targetDate: "2026-10-04",
        eventName: "Prix de l'Arc de Triomphe (Groupe 1 - PLAT)"
    };

    const result = await generateTrainingPlan(params);

    if (result.success) {
        console.log('✅ Planning PLAT généré avec succès!');

        // VÉRIFICATIONS CRITIQUES PLAT
        const planText = JSON.stringify(result.data).toLowerCase();

        // 1. Vérifier AUCUN obstacle/saut
        const hasForbiddenKeywords = planText.includes('obstacle')
            || planText.includes('saut')
            || planText.includes('haie')
            || planText.includes('steeple');

        if (hasForbiddenKeywords) {
            console.error('🚨 ERREUR CRITIQUE: Obstacles détectés dans planning PLAT!');
        } else {
            console.log('✅ SÉCURITÉ OK: Aucun obstacle (correct pour PLAT)');
        }

        // 2. Vérifier présence vocabulaire PLAT
        const hasCorrectVocabulary = planText.includes('canter')
            || planText.includes('breeze')
            || planText.includes('gaz')
            || planText.includes('déboulé')
            || planText.includes('boîtes');

        if (hasCorrectVocabulary) {
            console.log('✅ VOCABULAIRE OK: Termes spécifiques PLAT détectés');
        } else {
            console.warn('⚠️ ATTENTION: Peu de vocabulaire spécifique PLAT');
        }

        // 3. Vérifier soins tendons après gaz
        const hasTendonCare = planText.includes('tendon')
            || planText.includes('argile')
            || planText.includes('glace');

        if (hasTendonCare) {
            console.log('✅ SOINS OK: Surveillance tendons présente');
        } else {
            console.warn('⚠️ ATTENTION: Soins tendons non mentionnés');
        }

        return result.data;
    } else {
        console.error('❌ Erreur:', result.error);
        return null;
    }
}

// ========================================
// TEST 2: HAIES (Hurdles) - Prix de Noël
// ========================================
export async function testGalop_HAIES_PrixDeNoel() {
    console.log('🚧 TEST: GALOP HAIES - Prix de Noël');

    const params = {
        horse: {
            name: "Binocle",
            age: 5,
            breed: "AQPS",
            estimatedWeight: 495
        },
        rider: {
            name: "Ruby Walsh",
            level: "Amateur/Pro"
        },
        discipline: "Galop",
        level: "Compétition",
        frequency: 5,
        focus: "Préparation Prix de Noël (HAIES). Focus mécanisation et fluidité sur obstacles. Travail balais. Vitesse d'exécution critique.",
        targetDate: "2026-12-25",
        eventName: "Prix de Noël (HAIES - Auteuil)"
    };

    const result = await generateTrainingPlan(params);

    if (result.success) {
        console.log('✅ Planning HAIES généré avec succès!');

        const planText = JSON.stringify(result.data).toLowerCase();

        // VÉRIFICATIONS CRITIQUES HAIES

        // 1. Vérifier présence travail obstacles
        const hasHurdleWork = planText.includes('haie')
            || planText.includes('balai')
            || planText.includes('obstacle')
            || planText.includes('mécanisation');

        if (hasHurdleWork) {
            console.log('✅ SPÉCIFICITÉ OK: Travail haies/obstacles présent');
        } else {
            console.warn('⚠️ ATTENTION: Peu de travail spécifique haies');
        }

        // 2. Vérifier vocabulaire HAIES
        const hasHurdleVocabulary = planText.includes('fluidité')
            || planText.includes('réception')
            || planText.includes('rythme')
            || planText.includes('balais');

        if (hasHurdleVocabulary) {
            console.log('✅ VOCABULAIRE OK: Termes spécifiques HAIES détectés');
        } else {
            console.warn('⚠️ ATTENTION: Vocabulaire HAIES limité');
        }

        // 3. Vérifier que ce n'est PAS du steeple (obstacles fixes)
        const hasSteepleConcepts = planText.includes('bullfinch')
            || planText.includes('rivière')
            || planText.includes('mur');

        if (hasSteepleConcepts) {
            console.error('🚨 ERREUR: Confusion HAIES/STEEPLE - obstacles fixes détectés!');
        } else {
            console.log('✅ DIFFÉRENCIATION OK: Pas de confusion HAIES/STEEPLE');
        }

        return result.data;
    } else {
        console.error('❌ Erreur:', result.error);
        return null;
    }
}

// ========================================
// TEST 3: STEEPLE (Steeplechase) - Grand Steeple-Chase de Paris
// ========================================
export async function testGalop_STEEPLE_GrandSteeple() {
    console.log('🌄 TEST: GALOP STEEPLE - Grand Steeple-Chase de Paris');

    const params = {
        horse: {
            name: "Al Capone II",
            age: 7,
            breed: "AQPS",
            estimatedWeight: 510
        },
        rider: {
            name: "James Reveley",
            level: "Amateur/Pro"
        },
        discipline: "Galop",
        level: "Compétition",
        frequency: 6,
        focus: "Préparation Grand Steeple-Chase de Paris (STEEPLE). Cross-country avec obstacles fixes variés. Focus courage et franchise. Schooling rivière, mur, bullfinch.",
        targetDate: "2026-05-17",
        eventName: "Grand Steeple-Chase de Paris (STEEPLE - Auteuil)"
    };

    const result = await generateTrainingPlan(params);

    if (result.success) {
        console.log('✅ Planning STEEPLE généré avec succès!');

        const planText = JSON.stringify(result.data).toLowerCase();

        // VÉRIFICATIONS CRITIQUES STEEPLE

        // 1. Vérifier présence obstacles fixes variés
        const hasSteeplechaseObstacles = planText.includes('rivière')
            || planText.includes('mur')
            || planText.includes('bullfinch')
            || planText.includes('talus')
            || planText.includes('schooling');

        if (hasSteeplechaseObstacles) {
            console.log('✅ OBSTACLES OK: Obstacles fixes variés détectés');
        } else {
            console.warn('⚠️ ATTENTION: Peu d\'obstacles fixes spécifiques STEEPLE');
        }

        // 2. Vérifier vocabulaire STEEPLE
        const hasSteeplechaseVocabulary = planText.includes('courage')
            || planText.includes('franchise')
            || planText.includes('tenue')
            || planText.includes('trajectoire')
            || planText.includes('sécurité');

        if (hasSteeplechaseVocabulary) {
            console.log('✅ VOCABULAIRE OK: Termes spécifiques STEEPLE détectés');
        } else {
            console.warn('⚠️ ATTENTION: Vocabulaire STEEPLE limité');
        }

        // 3. Vérifier focus fond (endurance)
        const hasStaminaWork = planText.includes('fond')
            || planText.includes('tenue')
            || planText.includes('endurance')
            || planText.includes('distance');

        if (hasStaminaWork) {
            console.log('✅ ENDURANCE OK: Travail de fond présent');
        } else {
            console.warn('⚠️ ATTENTION: Peu de travail de fond/tenue');
        }

        // 4. Vérifier priorité sécurité sur vitesse en training
        const hasSafetyFocus = planText.includes('sécurité')
            || planText.includes('calme')
            || planText.includes('trajectoire');

        if (hasSafetyFocus) {
            console.log('✅ SÉCURITÉ OK: Priorité trajectoire sûre en training');
        } else {
            console.warn('⚠️ ATTENTION: Aspect sécurité peu mentionné');
        }

        return result.data;
    } else {
        console.error('❌ Erreur:', result.error);
        return null;
    }
}

// ========================================
// TEST 4: GALOP Générique (détection auto sous-discipline)
// ========================================
export async function testGalop_AutoDetection() {
    console.log('🤖 TEST: GALOP - Auto-détection sous-discipline');

    const params = {
        horse: {
            name: "Mystery Runner",
            age: 5,
            breed: "Pur-Sang",
            estimatedWeight: 490
        },
        rider: {
            name: "Test Jockey",
            level: "Amateur/Pro"
        },
        discipline: "Galop",
        level: "Compétition",
        frequency: 4,
        focus: "Préparation générale course. Développer performance.", // PAS de mention explicite PLAT/HAIES/STEEPLE
        targetDate: null,
        eventName: "Course générique"
    };

    const result = await generateTrainingPlan(params);

    if (result.success) {
        console.log('✅ Planning GALOP générique généré avec succès!');

        const planText = JSON.stringify(result.data).toLowerCase();

        // Détecter quelle sous-discipline a été choisie par défaut
        let detectedType = 'UNKNOWN';

        if ((planText.includes('breeze') || planText.includes('boîtes')) &&
            !planText.includes('obstacle') && !planText.includes('haie')) {
            detectedType = 'PLAT';
        } else if (planText.includes('haie') || planText.includes('balai')) {
            detectedType = 'HAIES';
        } else if (planText.includes('bullfinch') || planText.includes('rivière') ||
            planText.includes('schooling')) {
            detectedType = 'STEEPLE';
        }

        console.log(`🔍 Sous-discipline détectée: ${detectedType}`);
        console.log('   (Défaut attendu: PLAT si contexte ambigu)');

        return { data: result.data, detectedType };
    } else {
        console.error('❌ Erreur:', result.error);
        return null;
    }
}

// ========================================
// FONCTION DE TEST GLOBALE GALOP
// ========================================
export async function runGalopTests() {
    console.log('\n🏇 DÉMARRAGE DES TESTS COURSES DE GALOP\n');
    console.log('='.repeat(60));

    const tests = [
        { name: 'PLAT - Arc de Triomphe', fn: testGalop_PLAT_ArcDeTriomphe },
        { name: 'HAIES - Prix de Noël', fn: testGalop_HAIES_PrixDeNoel },
        { name: 'STEEPLE - Grand Steeple', fn: testGalop_STEEPLE_GrandSteeple },
        { name: 'Auto-Détection', fn: testGalop_AutoDetection }
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

        // Pause entre les tests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DES TESTS GALOP');
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
// CHECKLIST DE VALIDATION GALOP
// ========================================
export function validateGalopPlan(plan, expectedType) {
    const planText = JSON.stringify(plan).toLowerCase();

    const checks = {
        type: expectedType,
        passed: [],
        failed: [],
        warnings: []
    };

    // Checks communs
    if (planText.includes('tendon') || planText.includes('argile') || planText.includes('glace')) {
        checks.passed.push('✅ Soins tendons présents');
    } else {
        checks.warnings.push('⚠️ Soins tendons non mentionnés');
    }

    // Checks spécifiques par type
    if (expectedType === 'PLAT') {
        // PLAT ne doit PAS avoir d'obstacles
        if (planText.includes('obstacle') || planText.includes('saut') || planText.includes('haie')) {
            checks.failed.push('❌ CRITIQUE: Obstacles détectés pour PLAT!');
        } else {
            checks.passed.push('✅ Aucun obstacle (correct PLAT)');
        }

        // PLAT doit avoir vocabulaire spécifique
        if (planText.includes('breeze') || planText.includes('canter') || planText.includes('boîtes')) {
            checks.passed.push('✅ Vocabulaire PLAT correct');
        } else {
            checks.warnings.push('⚠️ Vocabulaire PLAT limité');
        }
    }

    if (expectedType === 'HAIES') {
        // HAIES doit avoir du travail obstacles
        if (planText.includes('haie') || planText.includes('balai') || planText.includes('mécanisation')) {
            checks.passed.push('✅ Travail haies présent');
        } else {
            checks.failed.push('❌ Manque travail haies');
        }

        // HAIES ne doit PAS avoir obstacles fixes
        if (planText.includes('bullfinch') || planText.includes('rivière')) {
            checks.failed.push('❌ Confusion HAIES/STEEPLE: obstacles fixes détectés');
        } else {
            checks.passed.push('✅ Pas de confusion HAIES/STEEPLE');
        }
    }

    if (expectedType === 'STEEPLE') {
        // STEEPLE doit avoir obstacles variés
        if (planText.includes('bullfinch') || planText.includes('rivière') || planText.includes('mur')) {
            checks.passed.push('✅ Obstacles fixes variés présents');
        } else {
            checks.warnings.push('⚠️ Peu d\'obstacles fixes spécifiques');
        }

        // STEEPLE doit mentionner sécurité
        if (planText.includes('sécurité') || planText.includes('calme') || planText.includes('trajectoire')) {
            checks.passed.push('✅ Focus sécurité présent');
        } else {
            checks.warnings.push('⚠️ Aspect sécurité peu mentionné');
        }
    }

    // Affichage
    console.log(`\n📋 VALIDATION ${expectedType}:`);
    checks.passed.forEach(p => console.log(p));
    checks.warnings.forEach(w => console.log(w));
    checks.failed.forEach(f => console.log(f));

    return checks;
}

// ========================================
// USAGE
// ========================================
// Pour lancer les tests courses de galop:
// import { runGalopTests } from './utils/test_galop_examples';
// runGalopTests();

// Pour tester un type spécifique:
// import { testGalop_PLAT_ArcDeTriomphe } from './utils/test_galop_examples';
// const result = await testGalop_PLAT_ArcDeTriomphe();

// Pour valider un planning:
// import { validateGalopPlan } from './utils/test_galop_examples';
// validateGalopPlan(myPlan, 'PLAT');
