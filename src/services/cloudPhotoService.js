import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';

/**
 * Service de gestion des photos dans le cloud Firebase
 * Centralise tous les uploads, downloads et suppressions
 */
export const cloudPhotoService = {
  /**
   * Upload une photo vers Firebase Storage et enregistre dans Firestore
   * @param {string} userId - UID de l'utilisateur
   * @param {string} horseId - ID du cheval
   * @param {File} file - Fichier image/vidéo
   * @returns {Promise<{id, url, metadata}>} ID du document et URL de download
   */
  uploadPhoto: async (userId, horseId, file) => {
    if (!userId || !horseId) {
      throw new Error('UserId et horseId sont requis');
    }

    try {
      // 1. Compresser l'image si c'est une image
      const processedFile = file.type.includes('image/') 
        ? await compressImage(file)
        : file;

      // 2. Générer un nom de fichier unique avec timestamp
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // 3. Créer référence Firebase Storage
      const storageRef = ref(storage, `users/${userId}/horses/${horseId}/media/${fileName}`);

      // 4. Upload le fichier
      console.log(`📤 Upload déclaré pour: ${fileName}`);
      const uploadResult = await uploadBytes(storageRef, processedFile);

      // 5. Obtenir l'URL de téléchargement
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 6. Enregistrer métadonnées dans Firestore
      const mediaCollection = collection(db, `users/${userId}/horses/${horseId}/media`);
      const docRef = await addDoc(mediaCollection, {
        type: file.type.includes('video') ? 'video' : 'image',
        fileName: file.name,
        size: processedFile.size,
        mimeType: file.type,
        url: downloadURL,
        storageRef: uploadResult.ref.fullPath,
        uploadedAt: serverTimestamp(),
        uploadedBy: userId,
        createdAt: new Date().toISOString()
      });

      console.log(`✅ Photo uploadée: ${fileName}`);

      return {
        id: docRef.id,
        url: downloadURL,
        fileName: file.name,
        type: file.type
      };
    } catch (error) {
      console.error('❌ Erreur upload photo:', error);
      throw error;
    }
  },

  /**
   * Récupère un stream en temps réel des photos d'un cheval
   * @param {string} userId - UID de l'utilisateur
   * @param {string} horseId - ID du cheval
   * @param {Function} callback - Fonction appelée avec la liste des photos
   * @returns {Function} Fonction pour désabonner l'écouteur
   */
  getPhotosStream: (userId, horseId, callback) => {
    if (!userId || !horseId) {
      console.error('UserId et horseId sont requis');
      callback([]);
      return () => {};
    }

    try {
      const mediaCollection = collection(db, `users/${userId}/horses/${horseId}/media`);
      const q = query(mediaCollection, orderBy('uploadedAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const photos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convertir Timestamp Firestore en Date
            uploadedAt: doc.data().uploadedAt?.toDate?.() || new Date(doc.data().uploadedAt)
          }));
          callback(photos);
        },
        (error) => {
          console.error('❌ Erreur lecture photos:', error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('❌ Erreur setup stream:', error);
      callback([]);
      return () => {};
    }
  },

  /**
   * Récupère les photos une seule fois (non-streaming)
   * @param {string} userId - UID de l'utilisateur
   * @param {string} horseId - ID du cheval
   * @returns {Promise<Array>} Liste des photos
   */
  getPhotos: async (userId, horseId) => {
    if (!userId || !horseId) {
      throw new Error('UserId et horseId sont requis');
    }

    try {
      const mediaCollection = collection(db, `users/${userId}/horses/${horseId}/media`);
      const q = query(mediaCollection, orderBy('uploadedAt', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erreur récupération photos:', error);
      throw error;
    }
  },

  /**
   * Supprime une photo du cloud
   * @param {string} userId - UID de l'utilisateur
   * @param {string} horseId - ID du cheval
   * @param {string} photoId - ID du document Firestore
   * @param {string} storageRef - Path complet dans Storage
   */
  deletePhoto: async (userId, horseId, photoId, storageRef) => {
    if (!userId || !horseId || !photoId || !storageRef) {
      throw new Error('Tous les paramètres sont requis');
    }

    try {
      // 1. Supprimer de Firebase Storage
      console.log(`🗑️ Suppression de Storage: ${storageRef}`);
      const fileRef = ref(storage, storageRef);
      await deleteObject(fileRef);

      // 2. Supprimer document Firestore
      const photoDocRef = doc(db, `users/${userId}/horses/${horseId}/media/${photoId}`);
      await deleteDoc(photoDocRef);

      console.log('✅ Photo supprimée');
    } catch (error) {
      console.error('❌ Erreur suppression photo:', error);
      throw error;
    }
  },

  /**
   * Supprime TOUTES les photos d'un cheval
   * @param {string} userId - UID de l'utilisateur
   * @param {string} horseId - ID du cheval
   */
  deleteAllPhotos: async (userId, horseId) => {
    if (!userId || !horseId) {
      throw new Error('UserId et horseId sont requis');
    }

    try {
      // 1. Lister tous les fichiers Storage
      const storageRef = ref(storage, `users/${userId}/horses/${horseId}/media`);
      const fileList = await listAll(storageRef);

      // 2. Supprimer tous les fichiers
      for (const file of fileList.items) {
        await deleteObject(file);
      }

      // 3. Supprimer tous les documents Firestore
      const mediaCollection = collection(db, `users/${userId}/horses/${horseId}/media`);
      const snapshot = await getDocs(mediaCollection);

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      console.log(`✅ Toutes les photos supprimées (${fileList.items.length} fichiers)`);
    } catch (error) {
      console.error('❌ Erreur suppression batch:', error);
      throw error;
    }
  },

  /**
   * Sauvegarde une photo de profil spécifique du cheval
   * @param {string} userId - UID
   * @param {string} horseId - ID du cheval
   * @param {File} file - Fichier image
   * @returns {Promise<string>} URL de la photo
   */
  uploadProfilePhoto: async (userId, horseId, file) => {
    try {
      const compressed = await compressImage(file);
      const storageRef = ref(storage, `users/${userId}/horses/${horseId}/profile.jpg`);

      await uploadBytes(storageRef, compressed);
      const url = await getDownloadURL(storageRef);

      console.log('✅ Photo profil sauvegardée');
      return url;
    } catch (error) {
      console.error('❌ Erreur photo profil:', error);
      throw error;
    }
  }
};

/**
 * Compresse une image pour réduire la taille
 * Redimensionne à max 1024x1024 et JPEG 70% quality
 * @param {File} file - Fichier image
 * @returns {Promise<Blob>} Image compressée
 */
const compressImage = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Dimensions max
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let { width, height } = img;

        // Calculer nouvelles dimensions
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en blob JPEG avec compression 70%
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression échouée'));
            } else {
              resolve(blob);
            }
          },
          'image/jpeg',
          0.7
        );
      };

      img.onerror = () => {
        reject(new Error('Impossible de charger l\'image'));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Erreur lecture fichier'));
    };

    reader.readAsDataURL(file);
  });
};

export default cloudPhotoService;
