import { cloudPhotoService } from './cloudPhotoService';

/**
 * Service de migration des photos localStorage → Cloud Firebase
 * Gère le transfert batch des photos anciennes vers le cloud
 */
export const migrationService = {
  /**
   * Récupère les anciennes photos stockées en localStorage pour un cheval
   * Format ancien: localStorage['horse_media_{id}'] = JSON array avec Base64
   * @param {string} horseId - ID du cheval
   * @returns {Array} Array of old photo objects
   */
  getOldPhotosFromLocalStorage: (horseId) => {
    try {
      const key = `horse_media_${horseId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error(`❌ Erreur lecture localStorage [horse_media_${horseId}]:`, err);
      return [];
    }
  },

  /**
   * Convertit un Data URL (Base64) en Blob
   * @param {string} dataUrl - Data URL format: "data:image/jpeg;base64,..."
   * @param {string} fileName - Nom du fichier pour le Blob
   * @returns {Blob} Blob object
   */
  dataUrlToBlob: (dataUrl, fileName) => {
    try {
      // Extraire la partie Base64
      const arr = dataUrl.split(',');
      if (arr.length < 2) {
        throw new Error('Invalid data URL format');
      }

      // Déterminer le MIME type
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      // Convertir Base64 en bytes
      const bstr = atob(arr[1]);
      const n = bstr.length;
      const u8arr = new Uint8Array(n);

      for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
      }

      return new Blob([u8arr], { type: mimeType });
    } catch (err) {
      console.error('❌ Erreur conversion dataUrl → Blob:', err);
      throw err;
    }
  },

  /**
   * Migre une seule photo de localStorage vers le cloud
   * @param {Object} oldPhoto - Photo object ancien format
   * @param {string} userId - UID utilisateur
   * @param {string} horseId - ID cheval
   * @returns {Promise<Object>} {success, photoId, url, error}
   */
  migratePhotoToCloud: async (oldPhoto, userId, horseId) => {
    try {
      // Vérifier les données
      if (!oldPhoto.url || !userId || !horseId) {
        throw new Error('Missing required data for migration');
      }

      // Vérifier si c'est une Data URL (Base64)
      if (!oldPhoto.url.startsWith('data:')) {
        console.warn('⚠️ Photo n\'est pas en Base64, skipped:', oldPhoto.fileName);
        return {
          success: false,
          error: 'Not a Base64 data URL',
          photoId: null,
          url: null,
        };
      }

      console.log(`📤 Migration: ${oldPhoto.fileName || 'unknown'}`);

      // Convertir Base64 → Blob
      const blob = migrationService.dataUrlToBlob(
        oldPhoto.url,
        oldPhoto.fileName || `photo_${Date.now()}.jpg`
      );

      // Créer un File object avec le timestamp original si disponible
      const timestamp = oldPhoto.date
        ? new Date(oldPhoto.date).getTime()
        : Date.now();

      const fileName = oldPhoto.fileName || `photo_${timestamp}.jpg`;
      const file = new File([blob], fileName, { type: blob.type });

      // Upload via cloudPhotoService
      const result = await cloudPhotoService.uploadPhoto(
        userId,
        horseId,
        file
      );

      console.log(`✅ Photo migrée: ${fileName} → ${result.url.substring(0, 50)}...`);

      return {
        success: true,
        photoId: result.id,
        url: result.url,
        error: null,
        originalDate: oldPhoto.date,
        originalMetadata: oldPhoto, // Garder les métadonnées anciennes
      };
    } catch (err) {
      console.error(`❌ Erreur migration photo:`, err);
      return {
        success: false,
        error: err.message,
        photoId: null,
        url: null,
      };
    }
  },

  /**
   * Migre toutes les photos d'un cheval avec callback progress
   * @param {string} userId - UID utilisateur
   * @param {string} horseId - ID cheval
   * @param {Function} onProgress - Callback(current, total, success, error)
   * @returns {Promise<Object>} {total, migrated, failed, results}
   */
  migrateAllPhotosForHorse: async (userId, horseId, onProgress = null) => {
    try {
      if (!userId || !horseId) {
        throw new Error('userId et horseId requis');
      }

      // Récupérer les anciennes photos
      const oldPhotos = migrationService.getOldPhotosFromLocalStorage(horseId);

      if (oldPhotos.length === 0) {
        console.log('✅ Aucune photo à migrer pour ce cheval');
        return {
          total: 0,
          migrated: 0,
          failed: 0,
          results: [],
          message: 'Aucune photo à migrer',
        };
      }

      console.log(`🚀 Début migration: ${oldPhotos.length} photos`, {
        userId,
        horseId,
      });

      const results = [];
      let migratedCount = 0;
      let failedCount = 0;

      // Migrer avec délai entre les uploads (éviter throttling)
      for (let i = 0; i < oldPhotos.length; i++) {
        const oldPhoto = oldPhotos[i];

        try {
          const result = await migrationService.migratePhotoToCloud(
            oldPhoto,
            userId,
            horseId
          );

          results.push(result);

          if (result.success) {
            migratedCount++;
          } else {
            failedCount++;
          }

          // Callback progress
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: oldPhotos.length,
              migratedCount,
              failedCount,
              currentPhoto: oldPhoto.fileName || `Photo ${i + 1}`,
              success: result.success,
              error: result.error,
            });
          }

          // Délai de 500ms entre uploads (éviter throttling Firebase)
          if (i < oldPhotos.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (err) {
          failedCount++;
          console.error(`❌ Erreur migration photo ${i + 1}:`, err);

          if (onProgress) {
            onProgress({
              current: i + 1,
              total: oldPhotos.length,
              migratedCount,
              failedCount,
              currentPhoto: oldPhoto.fileName || `Photo ${i + 1}`,
              success: false,
              error: err.message,
            });
          }
        }
      }

      console.log(`✅ Migration complétée: ${migratedCount}/${oldPhotos.length} réussies`);

      return {
        total: oldPhotos.length,
        migrated: migratedCount,
        failed: failedCount,
        results,
        message: `${migratedCount}/${oldPhotos.length} photos migrées avec succès`,
      };
    } catch (err) {
      console.error('❌ Erreur migration batch:', err);
      throw err;
    }
  },

  /**
   * Migre toutes les photos pour tous les chevaux d'un utilisateur
   * @param {string} userId - UID utilisateur
   * @param {Array} horses - Array de chevaux
   * @param {Function} onProgress - Callback globale
   * @returns {Promise<Object>} Résultats globaux
   */
  migrateAllUserPhotos: async (userId, horses, onProgress = null) => {
    try {
      if (!userId || !horses || horses.length === 0) {
        throw new Error('userId et horses array requis');
      }

      console.log(`🚀 Début migration globale pour ${horses.length} chevaux`);

      const allResults = [];
      let totalPhotos = 0;
      let totalMigrated = 0;
      let totalFailed = 0;

      for (let horseIndex = 0; horseIndex < horses.length; horseIndex++) {
        const horse = horses[horseIndex];

        console.log(`\n📍 Migration cheval ${horseIndex + 1}/${horses.length}: ${horse.name}`);

        try {
          const result = await migrationService.migrateAllPhotosForHorse(
            userId,
            horse.id,
            (progress) => {
              // Callback de la migration du cheval
              if (onProgress) {
                onProgress({
                  horseIndex: horseIndex + 1,
                  totalHorses: horses.length,
                  horseName: horse.name,
                  horseProgress: progress,
                  overallMigrated: totalMigrated + progress.migratedCount,
                  overallFailed: totalFailed + progress.failedCount,
                });
              }
            }
          );

          allResults.push({
            horseId: horse.id,
            horseName: horse.name,
            ...result,
          });

          totalPhotos += result.total;
          totalMigrated += result.migrated;
          totalFailed += result.failed;
        } catch (err) {
          console.error(`❌ Erreur migration cheval ${horse.name}:`, err);
          allResults.push({
            horseId: horse.id,
            horseName: horse.name,
            total: 0,
            migrated: 0,
            failed: 0,
            error: err.message,
          });
        }
      }

      console.log(`\n✅ Migration globale terminée:`);
      console.log(`   Total photos: ${totalPhotos}`);
      console.log(`   Migrées: ${totalMigrated}`);
      console.log(`   Échouées: ${totalFailed}`);

      return {
        totalPhotos,
        totalMigrated,
        totalFailed,
        horses: allResults,
        successRate: totalPhotos > 0 ? ((totalMigrated / totalPhotos) * 100).toFixed(1) : 0,
      };
    } catch (err) {
      console.error('❌ Erreur migration globale:', err);
      throw err;
    }
  },

  /**
   * Nettoie les anciennes photos localStorage après migration réussie
   * ⚠️ À utiliser APRÈS vérification que la migration a réussi
   * @param {string} horseId - ID du cheval
   * @returns {boolean} true si suppression réussie
   */
  deleteOldLocalStoragePhotos: (horseId) => {
    try {
      const key = `horse_media_${horseId}`;
      const hasData = localStorage.getItem(key);

      if (!hasData) {
        console.log(`ℹ️ Aucune donnée localStorage à supprimer pour [${key}]`);
        return true;
      }

      localStorage.removeItem(key);
      console.log(`🗑️ Anciennes photos localStorage supprimées: [${key}]`);
      return true;
    } catch (err) {
      console.error(`❌ Erreur suppression localStorage [${key}]:`, err);
      return false;
    }
  },

  /**
   * Vérifie si oldPhotos existent pour un cheval
   * @param {string} horseId - ID du cheval
   * @returns {boolean} true si photos existent
   */
  hasOldPhotos: (horseId) => {
    const photos = migrationService.getOldPhotosFromLocalStorage(horseId);
    return photos.length > 0;
  },

  /**
   * Récupère le nombre de photos à migrer pour un cheval
   * @param {string} horseId - ID du cheval
   * @returns {number} Nombre de photos anciennes
   */
  getOldPhotosCount: (horseId) => {
    const photos = migrationService.getOldPhotosFromLocalStorage(horseId);
    return photos.length;
  },

  /**
   * Récupère le nombre total de photos à migrer pour un utilisateur
   * @param {Array} horses - Array de chevaux avec .id
   * @returns {number} Nombre total de photos anciennes
   */
  getTotalOldPhotosCount: (horses) => {
    if (!horses || !Array.isArray(horses)) return 0;

    let total = 0;
    for (const horse of horses) {
      total += migrationService.getOldPhotosCount(horse.id);
    }
    return total;
  },

  /**
   * Obtient un résumé de la migration avant de commencer
   * @param {string} userId - UID utilisateur
   * @param {Array} horses - Array de chevaux
   * @returns {Object} Summary pour affichage
   */
  getMigrationSummary: (userId, horses) => {
    try {
      const summary = {
        userId,
        totalHorses: horses ? horses.length : 0,
        horsesWithOldPhotos: 0,
        totalOldPhotos: 0,
        horseDetails: [],
      };

      if (horses && Array.isArray(horses)) {
        for (const horse of horses) {
          const count = migrationService.getOldPhotosCount(horse.id);
          if (count > 0) {
            summary.horsesWithOldPhotos++;
            summary.totalOldPhotos += count;
            summary.horseDetails.push({
              id: horse.id,
              name: horse.name,
              oldPhotosCount: count,
            });
          }
        }
      }

      return summary;
    } catch (err) {
      console.error('❌ Erreur résumé migration:', err);
      return {
        error: err.message,
        totalOldPhotos: 0,
      };
    }
  },
};
