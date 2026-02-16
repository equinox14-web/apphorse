/**
 * Phase 3 Migration - Exemples d'intégration
 * 
 * Ce fichier montre comment utiliser le système de migration dans différents contextes
 */

// ============================================================================
// EXEMPLE 1: Usage basique dans un composant React
// ============================================================================

import React, { useEffect } from 'react';
import { useMigration } from '@/hooks';

function MyComponent({ horses }) {
  const {
    summary,
    isLoading,
    totalOldPhotos,
    migrate,
    loadSummary,
  } = useMigration();

  useEffect(() => {
    loadSummary(horses);
  }, [horses, loadSummary]);

  const handleMigrate = async () => {
    const results = await migrate(horses);
    if (results) {
      alert(`✅ ${results.totalMigrated} photos migrées!`);
    }
  };

  if (isLoading) return <div>Chargement...</div>;

  if (totalOldPhotos === 0) {
    return <div>✅ Aucune migration nécessaire</div>;
  }

  return (
    <div>
      <p>{totalOldPhotos} photos à migrer</p>
      <button onClick={handleMigrate}>
        Commencer la migration
      </button>
    </div>
  );
}

// ============================================================================
// EXEMPLE 2: Utilisation directe du service (sans hook)
// ============================================================================

import { migrationService } from '@/services';
import { useAuth } from '@/context/AuthContext';

async function migrateProgrammatically(userId, horses) {
  try {
    // 1. Voir résumé
    const summary = migrationService.getMigrationSummary(userId, horses);
    console.log(`📸 ${summary.totalOldPhotos} photos à migrer`);

    // 2. Vérifier si migration nécessaire
    if (summary.totalOldPhotos === 0) {
      console.log('✅ Pas de migration nécessaire');
      return;
    }

    // 3. Lancer migration avec callback de progression
    const results = await migrationService.migrateAllUserPhotos(
      userId,
      horses,
      (progress) => {
        // Appelé pour chaque photo
        const percentage = (progress.overallMigrated / progress.totalPhotos) * 100;
        console.log(
          `📊 ${progress.horseName}: ${progress.horseProgress.current}/${progress.horseProgress.total} | ` +
          `Total: ${progress.overallMigrated}/${progress.totalPhotos} (${percentage.toFixed(1)}%)`
        );
      }
    );

    // 4. Traiter résultats
    console.log('✅ Migration terminée:', results);
    console.log(`  - Total: ${results.totalPhotos}`);
    console.log(`  - Réussies: ${results.totalMigrated}`);
    console.log(`  - Échouées: ${results.totalFailed}`);
    console.log(`  - Taux succès: ${results.successRate.toFixed(1)}%`);

    // 5. Optionnel: Supprimer anciennes données
    if (results.totalMigrated > 0) {
      for (const horse of horses) {
        const deleted = migrationService.deleteOldLocalStoragePhotos(horse.id);
        if (deleted) {
          console.log(`🧹 Données anciennes supprimées pour ${horse.name}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur migration:', error);
  }
}

// ============================================================================
// EXEMPLE 3: Migration d'un seul cheval (granular control)
// ============================================================================

async function migrateOneHorse(userId, horseId, horseName) {
  try {
    console.log(`🐴 Migration pour ${horseName}...`);

    const result = await migrationService.migrateAllPhotosForHorse(
      userId,
      horseId,
      (progress) => {
        const { current, total } = progress.horseProgress;
        const pct = (current / total) * 100;
        console.log(`  ${current}/${total} (${pct.toFixed(0)}%)`);
      }
    );

    console.log(`✅ ${result.horseName}: ${result.totalMigrated}/${result.totalPhotos} photos`);

    // Cleanup après migration réussie
    if (result.totalMigrated === result.totalPhotos) {
      migrationService.deleteOldLocalStoragePhotos(horseId);
      console.log(`🧹 Nettoyage localStorage pour ${horseName}`);
    }

  } catch (error) {
    console.error(`❌ Erreur migration ${horseName}:`, error);
  }
}

// ============================================================================
// EXEMPLE 4: Integration avec PhotoMigrationWizard (interface UI)
// ============================================================================

import PhotoMigrationWizard from '@/components/migration/PhotoMigrationWizard';

function SettingsPage({ horses }) {
  const [showWizard, setShowWizard] = React.useState(false);

  const handleMigrationComplete = (results) => {
    console.log('Migration complétée via wizard:', results);
    // Rafraîchir l'app, recharger données, etc.
  };

  return (
    <div>
      <button onClick={() => setShowWizard(true)}>
        ⚙️ Migration photos
      </button>

      {showWizard && (
        <PhotoMigrationWizard
          horses={horses}
          onComplete={handleMigrationComplete}
          onClose={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// EXEMPLE 5: Vérifications avant migration
// ============================================================================

function isMigrationAvailable(userId, horses) {
  try {
    const summary = migrationService.getMigrationSummary(userId, horses);

    return {
      available: summary.totalOldPhotos > 0,
      totalPhotos: summary.totalOldPhotos,
      horses: summary.horseDetails,
      estimatedTime: `${Math.ceil(summary.totalOldPhotos * 0.5 / 60)} minutes`,
    };
  } catch (error) {
    console.error('Erreur vérification:', error);
    return { available: false, error: error.message };
  }
}

// Usage:
const migrationInfo = isMigrationAvailable(userId, horses);
if (migrationInfo.available) {
  console.log(`${migrationInfo.totalPhotos} photos (${migrationInfo.estimatedTime})`);
}

// ============================================================================
// EXEMPLE 6: Monitoring et logging
// ============================================================================

class MigrationMonitor {
  constructor(userId, horses) {
    this.userId = userId;
    this.horses = horses;
    this.startTime = null;
    this.stats = {};
  }

  async run() {
    this.startTime = Date.now();
    
    try {
      const results = await migrationService.migrateAllUserPhotos(
        this.userId,
        this.horses,
        this.onProgress.bind(this)
      );

      this.stats = {
        ...results,
        duration: Date.now() - this.startTime,
        avgTimePerPhoto: (Date.now() - this.startTime) / results.totalPhotos,
      };

      this.logStats();
      return results;

    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.logError(error);
      throw error;
    }
  }

  onProgress(progress) {
    const elapsed = Date.now() - this.startTime;
    const remaining = (progress.totalPhotos - progress.overallMigrated) * 
                     (elapsed / (progress.overallMigrated || 1));
    
    console.log(`
      🐴 ${progress.horseName} (${progress.horseIndex + 1}/${progress.totalHorses})
      📸 ${progress.horseProgress.current}/${progress.horseProgress.total}
      ✅ ${progress.overallMigrated}/${progress.totalPhotos}
      ⏱️ ${(elapsed / 1000).toFixed(0)}s | ${(remaining / 1000).toFixed(0)}s remaining
    `);
  }

  logStats() {
    console.log(`
      ✨ MIGRATION COMPLETED
      ✅ Total: ${this.stats.totalMigrated}/${this.stats.totalPhotos}
      ❌ Failed: ${this.stats.totalFailed}
      📊 Success rate: ${this.stats.successRate.toFixed(1)}%
      ⏱️ Duration: ${(this.stats.duration / 1000).toFixed(1)}s
      ⚡ Avg per photo: ${this.stats.avgTimePerPhoto.toFixed(0)}ms
    `);
  }

  logError(error) {
    console.error(`
      ❌ MIGRATION ERROR
      Message: ${error.message}
      Time: ${(Date.now() - this.startTime) / 1000}s
    `);
  }
}

// Usage:
const monitor = new MigrationMonitor(userId, horses);
await monitor.run();

// ============================================================================
// EXEMPLE 7: Conditional migration (auto-migrate si besoin)
// ============================================================================

import { useEffect, useState } from 'react';

function AutoMigrateOnFirstVisit({ userId, horses, children }) {
  const [hasMigrated, setHasMigrated] = useState(false);
  const { totalOldPhotos, migrate } = useMigration();

  useEffect(() => {
    const check = localStorage.getItem('migrationCompleted');
    
    if (!check && totalOldPhotos > 0) {
      // Auto-migrate on first visit
      console.log('🤖 Auto-migration triggered');
      migrate(horses).then(() => {
        localStorage.setItem('migrationCompleted', Date.now());
        setHasMigrated(true);
      });
    } else {
      setHasMigrated(true);
    }
  }, [totalOldPhotos, migrate, horses]);

  if (!hasMigrated) {
    return <div>⏳ Migration en cours...</div>;
  }

  return children;
}

// Usage in App.jsx:
<AutoMigrateOnFirstVisit userId={currentUser.uid} horses={horses}>
  <Dashboard />
</AutoMigrateOnFirstVisit>

// ============================================================================
// EXEMPLE 8: Error recovery avec retry logic
// ============================================================================

async function migrateWithRetry(userId, horses, maxRetries = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentative ${attempt}/${maxRetries}`);

      const results = await migrationService.migrateAllUserPhotos(
        userId,
        horses,
        (progress) => {
          // Update UI
        }
      );

      if (results.totalFailed === 0) {
        console.log('✅ Migration réussie!');
        return results;
      } else {
        throw new Error(
          `${results.totalFailed} photos échouées. Retry...`
        );
      }

    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Tentative ${attempt} échouée:`, error.message);
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        const delay = 1000 * Math.pow(2, attempt - 1);
        console.log(`⏳ Attente ${delay}ms avant retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Migration échouée après ${maxRetries} tentatives: ${lastError.message}`);
}

// ============================================================================
// EXPORT - Utilitaires available pour autres fichiers
// ============================================================================

export {
  migrateProgrammatically,
  migrateOneHorse,
  isMigrationAvailable,
  MigrationMonitor,
  migrateWithRetry,
};
