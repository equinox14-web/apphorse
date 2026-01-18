import { useState, useCallback } from 'react';
import { generateTrainingPlan, generateQuickTips, analyzeProgress } from '../services/geminiService';

/**
 * Hook pour gérer les interactions avec l'IA Gemini
 */
export function useTrainingAI() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [trainingPlan, setTrainingPlan] = useState(null);

    /**
     * Génère un planning d'entraînement
     */
    const generatePlan = useCallback(async (params) => {
        setLoading(true);
        setError(null);

        try {
            console.log('📊 Paramètres envoyés à Gemini:', params);

            const result = await generateTrainingPlan(params);

            if (result.success) {
                setTrainingPlan(result.data);
                return { success: true, data: result.data };
            } else {
                const errorMsg = result.error || 'Erreur lors de la génération';
                setError(errorMsg);
                return { success: false, error: errorMsg };
            }

        } catch (err) {
            const errorMsg = err.message || 'Erreur inattendue';
            console.error('❌ Erreur dans useTrainingAI:', err);
            setError(errorMsg);
            return { success: false, error: errorMsg };

        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Obtient des conseils rapides
     */
    const getTips = useCallback(async (params) => {
        setLoading(true);
        setError(null);

        try {
            const result = await generateQuickTips(params);

            if (result.success) {
                return { success: true, tips: result.tips };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }

        } catch (err) {
            const errorMsg = err.message || 'Erreur inattendue';
            setError(errorMsg);
            return { success: false, error: errorMsg };

        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Analyse la progression
     */
    const analyze = useCallback(async (params) => {
        setLoading(true);
        setError(null);

        try {
            const result = await analyzeProgress(params);

            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }

        } catch (err) {
            const errorMsg = err.message || 'Erreur inattendue';
            setError(errorMsg);
            return { success: false, error: errorMsg };

        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Réinitialise l'état
     */
    const reset = useCallback(() => {
        setTrainingPlan(null);
        setError(null);
        setLoading(false);
    }, []);

    return {
        loading,
        error,
        trainingPlan,
        generatePlan,
        getTips,
        analyze,
        reset
    };
}
