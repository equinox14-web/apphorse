/**
 * 🐎 EXEMPLES DE TEST - COURSES DE TROT
 * 
 * Tests spécifiques pour les 2 sous-disciplines de trot:
 * - ATTELÉ (Harness Racing)
 * - MONTÉ (Ridden Trot)
 */

import { generateTrainingPlan } from '../services/geminiService';

// ========================================
// TEST 1: ATTELÉ - Prix d'Amérique
// ========================================
export async function testTrot_ATTELE_PrixAmerique() {
    console.log('🏁 TEST: TROT ATTELÉ - Prix d\'Amérique (Groupe 1)');

    const params = {
        horse: {
            name: "Bold Eagle",
            age: 5,
            breed: "Trotteur Français",
            estimatedWeight: 485
        },
        rider: {
            name: "Franck Nivard",
            level: "Amateur/Pro"
        },
        discipline: "Trot",
        level: "Compétition",
        frequency: 6,
        focus: "Préparation Prix d'Amérique (ATTELÉ). Heats sur piste, travail vitesse et propulsion. Sulky. Réduction 1'15\"/km visée.",
        targetDate: "2026-01-26",
        eventName: "Prix d'Amérique (Groupe 1 - ATTELÉ)"
    };

    const result = await generateTrainingPlan(params);

    if (result.success) {
        console.log('✅ Planning ATTELÉ généré avec succès!');

        const planText = JSON.stringify(result.data).toLowerCase();

        // VÉRIFICATIONS CRITIQUES ATTELÉ

        // 1. Vérifier AUCUN galop/obstacle/saut
        const hasForbiddenKeywords = planText.includes('galop')
            || planText.includes('obstacle')
            || planText.includes('saut')
            || planText.includes('cso');

        if (hasForbiddenKeywords) {
            console.error('🚨 ERREUR CRITIQUE: Galop/Obstacles détectés pour TROTTEUR!');
        } else {
            console.log('✅ SÉCURITÉ OK: Aucun galop/obstacle (correct pour TROT)');
        }

        // 2. Vérifier vocabulaire TROT ATTELÉ
        const hasCorrectVocabulary = planText.includes('heat')
            || planText.includes('promenade')
            || planText.includes('ligne droite')
            || planText.includes('intervalle')
            || planText.includes('trot de chasse')
            || planText.includes('sulky')
            || planText.includes('attelé');

        if (hasCorrectVocabulary) {
            console.log('✅ VOCABULAIRE OK: Termes spécifiques TROT ATTELÉ détectés');
        } else {
            console.warn('⚠️ ATTENTION: Peu de vocabulaire spécifique TROT ATTELÉ');
        }

        // 3. Vérifier notation vitesse (réduction kilométrique)
        const hasSpeedNotation = planText.includes('1\'')
            || planText.includes('au km')
            || planText.includes('réduction')
            || planText.includes('km/min');

        if (hasSpeedNotation) {
            console.log('✅ VITESSE OK: Notation réduction kilométrique présente');
        } else {
            console.warn('⚠️ ATTENTION: Réduction kilométrique non mentionnée');
        }

        // 4. Vérifier focus propulsion/traction
        const hasTractionFocus = planText.includes('propulsion')
            || planText.includes('traction')
            || planText.includes('sulky')
            || planText.includes('bouche');

        if (hasTractionFocus) {
            console.log('✅ BIOMÉCANIQUE OK: Focus propulsion/traction présent');
        } else {
            console.warn('⚠️ ATTENTION: Aspect propulsion peu mentionné');
        }

        return result.data;
    } else {
        console.error('❌ Erreur:', result.error);
        return null;
    }
}

// ========================================
// TEST 2: MONTÉ - Prix de Cornulier
// ========================================
export async function testTrot_MONTE_PrixCornulier() {
    console.log('🏇 TEST: TROT MONTÉ - Prix de Cornulier');

    const params = {
        horse: {
            name: "Bilto du Vivier",
            age: 6,
            breed: "Trotteur Français",
            estimatedWeight: 490
        },
        rider: {
            name: "Matthieu Abrivard",
            level: "Amateur/Pro"
        },
        discipline: "Trot",
        level: "Compétition",
        frequency: 5,
        focus: "Préparation Prix de Cornulier (MONTÉ). Travail gainage dorsal, côtes, équilibre jockey. Portage et souplesse sous la selle.",
        targetDate: "2026-06-07",
        eventName: "Prix de Cornulier (Groupe 1 - MONTÉ)"
    };

    const result = await generateTrainingPlan(params);

    if (result.success) {
        console.log('✅ Planning MONTÉ généré avec succès!');

        const planText = JSON.stringify(result.data).toLowerCase();

        // VÉRIFICATIONS CRITIQUES MONTÉ

        // 1. Vérifier AUCUN galop/obstacle
        const hasForbiddenKeywords = planText.includes('galop')
            || planText.includes('obstacle')
            || planText.includes('saut');

        if (hasForbiddenKeywords) {
            console.error('🚨 ERREUR CRITIQUE: Galop/Obstacles pour TROTTEUR MONTÉ!');
        } else {
            console.log('✅ SÉCURITÉ OK: Aucun galop/obstacle');
        }

        // 2. Vérifier vocabulaire TROT MONTÉ
        const hasRiddenVocabulary = planText.includes('monté')
            || planText.includes('gainage')
            || planText.includes('portage')
            || planText.includes('dorsal')
            || planText.includes('jockey')
            || planText.includes('selle')
            || planText.includes('équilibre');

        if (hasRiddenVocabulary) {
            console.log('✅ VOCABULAIRE OK: Termes spécifiques TROT MONTÉ détectés');
        } else {
            console.warn('⚠️ ATTENTION: Vocabulaire TROT MONTÉ limité');
        }

        // 3. Vérifier travail spécifique MONTÉ (dos, côtes, équilibre)
        const hasRiddenWork = planText.includes('côte')
            || planText.includes('dos')
            || planText.includes('gainage')
            || planText.includes('assis')
            || planText.includes('souplesse');

        if (hasRiddenWork) {
            console.log('✅ SPÉCIFICITÉ OK: Travail MONTÉ présent (côtes/dos/gainage)');
        } else {
            console.warn('⚠️ ATTENTION: Peu de travail spécifique MONTÉ');
        }

        // 4. Ne DOIT PAS confondre avec ATTELÉ
        const hasHarnessConcepts = planText.includes('sulky')
            || planText.includes('attelé')
            || planText.includes('traction');

        if (hasHarnessConcepts) {
            console.error('🚨 ERREUR: Confusion MONTÉ/ATTELÉ - sulky détecté!');
        } else {
            console.log('✅ DIFFÉRENCIATION OK: Pas de confusion MONTÉ/ATTELÉ');
        }

        return result.data;
    } else {
        console.error('❌ Erreur:', result.error);
        return null;
    }
}

// ========================================
// TEST 3: TROT Générique (détection auto)
// ========================================
export async function testTrot_AutoDetection() {
    console.log('🤖 TEST: TROT - Auto-détection sous-discipline');

    const params = {
        horse: {
            name: "Mystery Trotter",
            age: 5,
            breed: "Trotteur Français",
            estimatedWeight: 480
        },
        rider: {
            name: "Test Driver",
            level: "Amateur/Pro"
        },
        discipline: "Trot",
        level: "Compétition",
        frequency: 5,
        focus: "Préparation course. Développer vitesse.", // PAS de mention ATTELÉ/MONTÉ
        targetDate: null,
        eventName: "Course générique"
    };

    const result = await generateTrainingPlan(params);

    if (result.success) {
        console.log('✅ Planning TROT générique généré avec succès!');

        const planText = JSON.stringify(result.data).toLowerCase();

        // Détecter quelle sous-discipline a été choisie par défaut
        let detectedType = 'UNKNOWN';

        if (planText.includes('sulky') || planText.includes('attelé') ||
            planText.includes('propulsion')) {
            detectedType = 'ATTELÉ';
        } else if (planText.includes('monté') || planText.includes('gainage') ||
            planText.includes('portage') || planText.includes('jockey')) {
            detectedType = 'MONTÉ';
        }

        console.log(`🔍 Sous-discipline détectée: ${detectedType}`);
        console.log('   (Défaut attendu: ATTELÉ si contexte ambigu)');

        // Vérifier qu'il n'y a PAS de galop ni obstacles
        const hasForbidden = planText.includes('galop')
            || planText.includes('obstacle')
            || planText.includes('saut');

        if (hasForbidden) {
            console.error('🚨 CRITIQUE: Galop/Obstacles pour TROTTEUR!');
        } else {
            console.log('✅ SÉCURITÉ OK: Aucun galop/obstacle');
        }

        return { data: result.data, detectedType };
    } else {
        console.error('❌ Erreur:', result.error);
        return null;
    }
}

// ========================================
// TEST 4: Vérification Interdictions TROT
// ========================================
export async function testTrot_ForbiddenKeywords() {
    console.log('⚠️ TEST: TROT - Vérification interdictions strictes');

    const params = {
        horse: {
            name: "Safety Check",
            age: 5,
            breed: "Trotteur Français",
            estimatedWeight: 485
        },
        rider: {
            name: "Test Jockey",
            level: "Amateur/Pro"
        },
        discipline: "Trot",
        level: "Jeune",
        frequency: 3,
        focus: "Développement jeune trotteur. Régularité et technique.",
        targetDate: null,
        eventName: "Entraînement"
    };

    const result = await generateTrainingPlan(params);

    if (result.success) {
        console.log('✅ Planning généré');

        const planText = JSON.stringify(result.data).toLowerCase();

        // Liste complète des mots interdits
        const forbiddenWords = [
            'galop',
            'canter',
            'obstacle',
            'saut',
            'cso',
            'jump',
            'haie',
            'steeple',
            'bullfinch'
        ];

        const foundForbidden = [];
        forbiddenWords.forEach(word => {
            if (planText.includes(word)) {
                foundForbidden.push(word);
            }
        });

        if (foundForbidden.length > 0) {
            console.error(`🚨 MOTS INTERDITS DÉTECTÉS: ${foundForbidden.join(', ')}`);
            console.error('   → ÉCHEC CRITIQUE pour un TROTTEUR!');
        } else {
            console.log('✅ SÉCURITÉ PARFAITE: Aucun mot interdit détecté');
        }

        // Vérifier présence mots obligatoires
        const requiredWords = ['trot', 'heat', 'promenade', 'ligne'];
        const foundRequired = requiredWords.filter(word => planText.includes(word));

        console.log(`📋 Mots obligatoires trouvés: ${foundRequired.join(', ')}`);

        if (foundRequired.length < 2) {
            console.warn('⚠️ ATTENTION: Peu de vocabulaire TROT spécifique');
        } else {
            console.log('✅ VOCABULAIRE OK: Termes TROT présents');
        }

        return {
            success: foundForbidden.length === 0,
            forbiddenFound: foundForbidden,
            requiredFound: foundRequired,
            data: result.data
        };
    } else {
        console.error('❌ Erreur:', result.error);
        return null;
    }
}

// ========================================
// FONCTION DE TEST GLOBALE TROT
// ========================================
export async function runTrotTests() {
    console.log('\n🐎 DÉMARRAGE DES TESTS COURSES DE TROT\n');
    console.log('='.repeat(60));

    const tests = [
        { name: 'ATTELÉ - Prix d\'Amérique', fn: testTrot_ATTELE_PrixAmerique },
        { name: 'MONTÉ - Prix de Cornulier', fn: testTrot_MONTE_PrixCornulier },
        { name: 'Auto-Détection', fn: testTrot_AutoDetection },
        { name: 'Interdictions Strictes', fn: testTrot_ForbiddenKeywords }
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
    console.log('📊 RÉSUMÉ DES TESTS TROT');
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
// CHECKLIST DE VALIDATION TROT
// ========================================
export function validateTrotPlan(plan, expectedType) {
    const planText = JSON.stringify(plan).toLowerCase();

    const checks = {
        type: expectedType,
        passed: [],
        failed: [],
        warnings: []
    };

    // Checks CRITIQUES communs TOUS types TROT
    const forbiddenWords = ['galop', 'canter', 'obstacle', 'saut', 'cso', 'jump'];
    const foundForbidden = forbiddenWords.filter(word => planText.includes(word));

    if (foundForbidden.length > 0) {
        checks.failed.push(`❌ CRITIQUE: Mots interdits détectés: ${foundForbidden.join(', ')}`);
    } else {
        checks.passed.push('✅ Aucun mot interdit (galop/obstacle/saut)');
    }

    // Vocabulaire TROT général
    if (planText.includes('heat') || planText.includes('promenade') || planText.includes('ligne')) {
        checks.passed.push('✅ Vocabulaire TROT général présent');
    } else {
        checks.warnings.push('⚠️ Vocabulaire TROT limité');
    }

    // Checks spécifiques par type
    if (expectedType === 'ATTELÉ') {
        // ATTELÉ doit avoir vocabulaire spécifique
        if (planText.includes('sulky') || planText.includes('attelé') || planText.includes('propulsion')) {
            checks.passed.push('✅ Vocabulaire ATTELÉ correct');
        } else {
            checks.warnings.push('⚠️ Vocabulaire ATTELÉ limité');
        }

        // Ne doit PAS avoir vocabulaire MONTÉ
        if (planText.includes('gainage') || planText.includes('portage') || planText.includes('jockey en équilibre')) {
            checks.failed.push('❌ Confusion ATTELÉ/MONTÉ: vocabulaire MONTÉ détecté');
        } else {
            checks.passed.push('✅ Pas de confusion ATTELÉ/MONTÉ');
        }
    }

    if (expectedType === 'MONTÉ') {
        // MONTÉ doit avoir vocabulaire spécifique
        if (planText.includes('gainage') || planText.includes('portage') || planText.includes('dorsal')) {
            checks.passed.push('✅ Vocabulaire MONTÉ correct');
        } else {
            checks.warnings.push('⚠️ Vocabulaire MONTÉ limité');
        }

        // Ne doit PAS avoir vocabulaire ATTELÉ
        if (planText.includes('sulky') || planText.includes('traction')) {
            checks.failed.push('❌ Confusion MONTÉ/ATTELÉ: sulky détecté');
        } else {
            checks.passed.push('✅ Pas de confusion MONTÉ/ATTELÉ');
        }

        // Doit avoir travail spécifique MONTÉ
        if (planText.includes('côte') || planText.includes('équilibre')) {
            checks.passed.push('✅ Travail spécifique MONTÉ présent');
        } else {
            checks.warnings.push('⚠️ Peu de travail spécifique MONTÉ');
        }
    }

    // Affichage
    console.log(`\n📋 VALIDATION TROT ${expectedType}:`);
    checks.passed.forEach(p => console.log(p));
    checks.warnings.forEach(w => console.log(w));
    checks.failed.forEach(f => console.log(f));

    return checks;
}

// ========================================
// USAGE
// ========================================
// Pour lancer les tests courses de trot:
// import { runTrotTests } from './utils/test_trot_examples';
// runTrotTests();

// Pour tester un type spécifique:
// import { testTrot_ATTELE_PrixAmerique } from './utils/test_trot_examples';
// const result = await testTrot_ATTELE_PrixAmerique();

// Pour valider un planning:
// import { validateTrotPlan } from './utils/test_trot_examples';
// validateTrotPlan(myPlan, 'ATTELÉ');
