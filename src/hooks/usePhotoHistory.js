/**
 * Hook: usePhotoHistory
 * Charge et gère l'historique de photos d'un cheval
 * Supporte la suppression, upload, et metadata
 */

import { useEffect, useState, useCallback } from 'react';
import firestoreService from '../../services/firestoreService';
import cloudPhotoService from '../../services/cloudPhotoService';

/**
 * Préparer les données de photos pour affichage
 */
function preparePhotoData(photos = []) {
  return photos
    .filter((p) => p.id && p.url)
    .map((p) => ({
      id: p.id,
      url: p.url,
      thumbnailUrl: p.thumbnailUrl || p.url,
      capturedAt: p.capturedAt || p.date || p.uploadedAt,
      uploadedAt: p.uploadedAt,
      date: new Date(p.capturedAt || p.date || p.uploadedAt).toLocaleDateString('fr-FR'),
      weight: p.horseDataSnapshot?.weight,
      bcs: p.horseDataSnapshot?.bcs,
      notes: p.metadata?.notes || '',
      fileName: p.metadata?.fileName || `photo_${p.id}`,
      size: p.metadata?.size,
      cloudPath: p.cloudPath || ''
    }))
    .sort((a, b) => (b.capturedAt || b.uploadedAt) - (a.capturedAt || a.uploadedAt));
}

/**
 * Hook pour charger et gérer l'historique de photos
 * @param {string} userId - UID utilisateur
 * @param {string} horseId - ID du cheval
 * @returns {Object} {photos, loading, error, uploadPhoto, deletePhoto, etc}
 */
export const usePhotoHistory = (userId, horseId) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  /**
   * Charger les photos initiales
   */
  const loadPhotos = useCallback(async () => {
    if (!userId || !horseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Charger depuis Firestore
      const horseData = await firestoreService.getDoc(
        `horses/${userId}`,
        horseId
      );

      if (horseData?.photos && Array.isArray(horseData.photos)) {
        const prepared = preparePhotoData(horseData.photos);
        setPhotos(prepared);
        console.log(`📸 ${prepared.length} photos chargées`);
      } else {
        setPhotos([]);
      }
    } catch (err) {
      console.error('❌ Erreur loading photos:', err);
      setError(err.message);
      // Fallback localStorage
      try {
        const local = JSON.parse(
          localStorage.getItem(`horse_media_${horseId}`) || '[]'
        );
        const prepared = preparePhotoData(local);
        setPhotos(prepared);
      } catch (e) {
        setPhotos([]);
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

    loadPhotos();

    // Écouter les changements
    try {
      const unsubscribe = firestoreService.listenToDoc(
        `horses/${userId}`,
        horseId,
        (horseData) => {
          if (horseData?.photos) {
            const prepared = preparePhotoData(horseData.photos);
            setPhotos(prepared);
            console.log(`🔄 Photos mises à jour: ${prepared.length}`);
          }
        }
      );

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (err) {
      console.warn('⚠️ Listener failed, using data');
      return undefined;
    }
  }, [userId, horseId, loadPhotos]);

  /**
   * Uploader une nouvelle photo
   */
  const uploadPhoto = useCallback(
    async (file, metadata = {}) => {
      if (!userId || !horseId) {
        throw new Error('Missing userId or horseId');
      }

      try {
        setUploading(true);

        // Upload via cloudPhotoService
        const uploadResult = await cloudPhotoService.uploadPhoto(
          userId,
          horseId,
          file,
          metadata
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        // Ajouter à Firestore
        const newPhoto = {
          id: uploadResult.photoId,
          url: uploadResult.url,
          cloudPath: uploadResult.cloudPath,
          uploadedAt: new Date().toISOString(),
          capturedAt: metadata.capturedAt || new Date().toISOString(),
          metadata: {
            fileName: file.name,
            size: file.size,
            mimeType: file.type,
            ...metadata
          },
          horseDataSnapshot: metadata.horseSnapshot
        };

        // Ajouter à l'array photos
        await firestoreService.addArrayElement(
          `horses/${userId}`,
          horseId,
          'photos',
          newPhoto
        );

        // Update local state
        const updated = preparePhotoData([...photos, newPhoto]);
        setPhotos(updated);

        console.log('✅ Photo uploadée:', uploadResult.photoId);
        return { success: true, ...uploadResult };
      } catch (err) {
        console.error('❌ Erreur uploadPhoto:', err);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [userId, horseId, photos]
  );

  /**
   * Supprimer une photo
   */
  const deletePhoto = useCallback(
    async (photoId) => {
      if (!userId || !horseId) return;

      try {
        const photo = photos.find((p) => p.id === photoId);
        if (!photo) {
          throw new Error('Photo not found');
        }

        // Supprimer du cloud
        if (photo.cloudPath) {
          try {
            await cloudPhotoService.deletePhoto(
              userId,
              photoId,
              photo.cloudPath
            );
          } catch (err) {
            console.warn('⚠️ Cloud delete failed:', err);
            // Continue with local delete
          }
        }

        // Supprimer de Firestore array
        const photoObject = photos.find((p) => p.id === photoId);
        if (photoObject) {
          await firestoreService.removeArrayElement(
            `horses/${userId}`,
            horseId,
            'photos',
            photoObject
          );
        }

        // Update local state
        const updated = photos.filter((p) => p.id !== photoId);
        setPhotos(updated);

        console.log('✅ Photo supprimée:', photoId);
        return { success: true };
      } catch (err) {
        console.error('❌ Erreur deletePhoto:', err);
        throw err;
      }
    },
    [userId, horseId, photos]
  );

  /**
   * Obtenir les photos par mois
   */
  const getPhotosByMonth = useCallback(() => {
    const byMonth = {};

    photos.forEach((photo) => {
      const date = new Date(photo.capturedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!byMonth[monthKey]) {
        byMonth[monthKey] = [];
      }
      byMonth[monthKey].push(photo);
    });

    return Object.entries(byMonth)
      .map(([monthKey, items]) => ({
        monthKey,
        month: new Date(monthKey + '-01').toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric'
        }),
        count: items.length,
        photos: items
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [photos]);

  /**
   * Rechercher des photos
   */
  const searchPhotos = useCallback(
    (query) => {
      if (!query) return photos;

      const lower = query.toLowerCase();
      return photos.filter((p) => {
        const date = new Date(p.capturedAt).toLocaleDateString('fr-FR').toLowerCase();
        const fileName = p.fileName.toLowerCase();
        const notes = (p.notes || '').toLowerCase();

        return date.includes(lower) || fileName.includes(lower) || notes.includes(lower);
      });
    },
    [photos]
  );

  return {
    // Data
    photos,
    photosByMonth: getPhotosByMonth(),
    totalPhotos: photos.length,

    // Status
    loading,
    error,
    uploading,

    // Methods
    uploadPhoto,
    deletePhoto,
    searchPhotos,
    refetch: loadPhotos,

    // Helpers
    getPhotosByMonth
  };
};

export default usePhotoHistory;
