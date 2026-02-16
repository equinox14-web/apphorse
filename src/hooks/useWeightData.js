/**
 * Hook: useWeightData
 * Charge et sync les données de pesée en temps réel
 * Calcule les statistiques (moyenne, tendance, écart)
 */

import { useEffect, useState, useCallback } from 'react';
import firestoreService from '../services/firestoreService';

// ============================================================================
// CALCULATIONS
// ============================================================================

/**
 * Calculer la moyenne du poids
 */
function calculateAverage(measurements) {
  if (measurements.length === 0) return 0;
  const sum = measurements.reduce((acc, m) => acc + (m.weight || 0), 0);
  return Math.round((sum / measurements.length) * 10) / 10;
}

/**
 * Calculer la tendance sur les N derniers enregistrements
 */
function calculateTrend(measurements, windowSize = 7) {
  if (measurements.length < 2) return 0;

  const recent = measurements.slice(-windowSize);
  const first = recent[0]?.weight || 0;
  const last = recent[recent.length - 1]?.weight || 0;

  return Math.round((last - first) * 10) / 10; // kg
}

/**
 * Calculer l'écart-type (variation)
 */
function calculateDeviation(measurements) {
  if (measurements.length < 2) return 0;

  const avg = calculateAverage(measurements);
  const variance =
    measurements.reduce((acc, m) => {
      const diff = (m.weight || 0) - avg;
      return acc + diff * diff;
    }, 0) / measurements.length;

  return Math.round(Math.sqrt(variance) * 10) / 10;
}

/**
 * Calculer les statistiques complètes
 */
function calculateStats(measurements) {
  const valid = measurements.filter((m) => m.weight && !isNaN(m.weight));

  if (valid.length === 0) {
    return {
      count: 0,
      average: 0,
      min: 0,
      max: 0,
      deviation: 0,
      trend7days: 0,
      trend30days: 0,
    };
  }

  const weights = valid.map((m) => m.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);

  return {
    count: valid.length,
    average: calculateAverage(valid),
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    deviation: calculateDeviation(valid),
    trend7days: calculateTrend(valid, 7),
    trend30days: calculateTrend(valid, 30),
    lastMeasurement: valid[valid.length - 1],
    firstMeasurement: valid[0],
  };
}

/**
 * Préparer les données pour le graphique
 */
function prepareChartData(measurements) {
  return measurements
    .filter((m) => m.weight && !isNaN(m.weight) && m.timestamp)
    .map((m) => ({
      timestamp: m.timestamp,
      date: new Date(m.timestamp).toLocaleDateString('fr-FR'),
      weight: parseFloat(m.weight),
      bcs: m.bcs ? parseFloat(m.bcs) : undefined,
      notes: m.notes || '',
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook pour charger et suivre les données de pesée
 * @param {string} userId - UID de l'utilisateur
 * @param {string} horseId - ID du cheval
 * @returns {Object} {measurements, stats, chartData, loading, error, refetch}
 */
export const useWeightData = (userId, horseId) => {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  /**
   * Charger les données initiales
   */
  const loadData = useCallback(async () => {
    if (!userId || !horseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Charger tous les enregistrements de pesée
      const data = await firestoreService.getDoc(
        `horses/${userId}/${horseId}`,
        'measurements'
      );

      if (data && Array.isArray(data)) {
        const sorted = data.sort((a, b) => a.timestamp - b.timestamp);
        setMeasurements(sorted);
        setStats(calculateStats(sorted));
      } else {
        setMeasurements([]);
        setStats(calculateStats([]));
      }
    } catch (err) {
      console.error('❌ Erreur loading weight data:', err);
      setError(err.message);
      // Fallback: localStorage
      try {
        const local = JSON.parse(
          localStorage.getItem(`horse_measurements_${horseId}`) || '[]'
        );
        setMeasurements(local);
        setStats(calculateStats(local));
      } catch (e) {
        setMeasurements([]);
        setStats(calculateStats([]));
      }
    } finally {
      setLoading(false);
    }
  }, [userId, horseId]);

  /**
   * Setup real-time listener
   */
  useEffect(() => {
    if (!userId || !horseId) return;

    loadData();

    // Écouter les changements en temps réel
    const path = `horses/${userId}/${horseId}/measurements`;
    let unsubscribe;

    try {
      unsubscribe = firestoreService.listenToDoc(
        `horses/${userId}`,
        horseId,
        (horseData) => {
          if (horseData && horseData.measurements) {
            const sorted = horseData.measurements.sort(
              (a, b) => a.timestamp - b.timestamp
            );
            setMeasurements(sorted);
            setStats(calculateStats(sorted));
            console.log(`🔄 Measurements mises à jour: ${sorted.length} enregistrements`);
          }
        }
      );
    } catch (err) {
      console.warn('⚠️ Real-time listener failed, using polling');
      // Fallback: poll chaque 30s
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (path) firestoreService.unsubscribe(path);
    };
  }, [userId, horseId, loadData]);

  /**
   * Ajouter une mesure
   */
  const addMeasurement = useCallback(
    async (measurementData) => {
      if (!userId || !horseId) return null;

      try {
        const newMeasurement = {
          id: `m_${Date.now()}`,
          timestamp: Date.now(),
          ...measurementData,
          weight: parseFloat(measurementData.weight),
          bcs: measurementData.bcs ? parseFloat(measurementData.bcs) : undefined,
        };

        // Ajouter à Firestore
        await firestoreService.addArrayElement(
          `horses/${userId}`,
          horseId,
          'measurements',
          newMeasurement
        );

        // Update local state
        const updated = [...measurements, newMeasurement].sort(
          (a, b) => a.timestamp - b.timestamp
        );
        setMeasurements(updated);
        setStats(calculateStats(updated));

        console.log('✅ Enregistrement de pesée ajouté');
        return newMeasurement;
      } catch (err) {
        console.error('❌ Erreur addMeasurement:', err);
        throw err;
      }
    },
    [userId, horseId, measurements]
  );

  /**
   * Supprimer une mesure
   */
  const deleteMeasurement = useCallback(
    async (measurementId) => {
      if (!userId || !horseId) return;

      try {
        const measurement = measurements.find((m) => m.id === measurementId);
        if (!measurement) {
          throw new Error('Measurement not found');
        }

        await firestoreService.removeArrayElement(
          `horses/${userId}`,
          horseId,
          'measurements',
          measurement
        );

        const updated = measurements.filter((m) => m.id !== measurementId);
        setMeasurements(updated);
        setStats(calculateStats(updated));

        console.log('✅ Enregistrement supprimé');
      } catch (err) {
        console.error('❌ Erreur deleteMeasurement:', err);
        throw err;
      }
    },
    [userId, horseId, measurements]
  );

  /**
   * Mettre à jour une mesure
   */
  const updateMeasurement = useCallback(
    async (measurementId, updates) => {
      if (!userId || !horseId) return null;

      try {
        const measurement = measurements.find((m) => m.id === measurementId);
        if (!measurement) {
          throw new Error('Measurement not found');
        }

        // Supprimer l'ancienne
        await firestoreService.removeArrayElement(
          `horses/${userId}`,
          horseId,
          'measurements',
          measurement
        );

        // Ajouter la nouvelle
        const updatedMeasurement = {
          ...measurement,
          ...updates,
          weight: updates.weight ? parseFloat(updates.weight) : measurement.weight,
          bcs: updates.bcs ? parseFloat(updates.bcs) : measurement.bcs,
        };

        await firestoreService.addArrayElement(
          `horses/${userId}`,
          horseId,
          'measurements',
          updatedMeasurement
        );

        // Update local state
        const idx = measurements.findIndex((m) => m.id === measurementId);
        const updated = [...measurements];
        updated[idx] = updatedMeasurement;
        updated.sort((a, b) => a.timestamp - b.timestamp);

        setMeasurements(updated);
        setStats(calculateStats(updated));

        console.log('✅ Enregistrement mis à jour');
        return updatedMeasurement;
      } catch (err) {
        console.error('❌ Erreur updateMeasurement:', err);
        throw err;
      }
    },
    [userId, horseId, measurements]
  );

  return {
    // Data
    measurements,
    stats,
    chartData: prepareChartData(measurements),

    // Status
    loading,
    error,

    // Methods
    addMeasurement,
    deleteMeasurement,
    updateMeasurement,
    refetch: loadData,

    // Helpers
    calculateAverage: () => calculateAverage(measurements),
    calculateTrend: (window) => calculateTrend(measurements, window),
    calculateDeviation: () => calculateDeviation(measurements),
  };
};

export default useWeightData;
