import { useState, useCallback } from 'react';
import { migrationService } from '../services/migrationService';
import { useAuth } from '../context/AuthContext';

/**
 * Hook pour gérer la migration des photos
 * Utilisé par PhotoMigrationWizard et autres composants
 *
 * @returns {Object} Migration state et méthodes
 */
export function useMigration() {
  const { currentUser } = useAuth();
  
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Charger résumé des photos à migrer
  const loadSummary = useCallback(async (horses) => {
    if (!currentUser?.uid || !horses) return;

    setIsLoading(true);
    setError(null);

    try {
      const summaryData = migrationService.getMigrationSummary(
        currentUser.uid,
        horses
      );
      setSummary(summaryData);
    } catch (err) {
      console.error('Erreur chargement résumé:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.uid]);

  // Migrer toutes les photos de l'utilisateur
  const migrate = useCallback(async (horses) => {
    if (!currentUser?.uid || !horses) {
      setError('Utilisateur ou chevaux manquants');
      return null;
    }

    setIsMigrating(true);
    setError(null);
    setProgress(null);

    try {
      const migrationResults = await migrationService.migrateAllUserPhotos(
        currentUser.uid,
        horses,
        setProgress
      );

      setResults(migrationResults);
      return migrationResults;
    } catch (err) {
      console.error('Erreur migration:', err);
      setError(err.message);
      return null;
    } finally {
      setIsMigrating(false);
    }
  }, [currentUser?.uid]);

  // Migrer photos pour un seul cheval
  const migrateHorse = useCallback(async (horseId) => {
    if (!currentUser?.uid || !horseId) {
      setError('Utilisateur ou cheval manquants');
      return null;
    }

    setIsMigrating(true);
    setError(null);

    try {
      const horseResults = await migrationService.migrateAllPhotosForHorse(
        currentUser.uid,
        horseId,
        setProgress
      );

      return horseResults;
    } catch (err) {
      console.error(`Erreur migration cheval ${horseId}:`, err);
      setError(err.message);
      return null;
    } finally {
      setIsMigrating(false);
    }
  }, [currentUser?.uid]);

  // Supprimer anciennes données localStorage
  const cleanup = useCallback((horseId) => {
    try {
      const deleted = migrationService.deleteOldLocalStoragePhotos(horseId);
      return deleted;
    } catch (err) {
      console.error('Erreur cleanup:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // Vérifier si cheval a photos à migrer
  const hasPhotos = useCallback((horseId) => {
    try {
      return migrationService.hasOldPhotos(horseId);
    } catch (err) {
      console.error('Erreur vérification photos:', err);
      return false;
    }
  }, []);

  // Reset état
  const reset = useCallback(() => {
    setSummary(null);
    setProgress(null);
    setResults(null);
    setError(null);
  }, []);

  return {
    // État
    summary,
    isLoading,
    isMigrating,
    progress,
    results,
    error,

    // Méthodes
    loadSummary,
    migrate,
    migrateHorse,
    cleanup,
    hasPhotos,
    reset,

    // Infos utiles
    totalOldPhotos: summary?.totalOldPhotos || 0,
    migrationProgress: {
      current: progress?.overallMigrated || 0,
      total: progress?.totalPhotos || 0,
      percentage: progress ? (progress.overallMigrated / progress.totalPhotos) * 100 : 0,
      horse: progress?.horseName || '',
    },
  };
}
