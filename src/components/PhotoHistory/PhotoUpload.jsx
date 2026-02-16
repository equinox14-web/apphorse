/**
 * PhotoUpload Component
 * Permet d'uploader une nouvelle photo avec capture de metadata
 * Support pour drag-drop et sélection fichier
 */

import React, { useRef, useState, useCallback } from 'react';
import { Upload, Camera, X, AlertCircle, CheckCircle } from 'lucide-react';
import usePhotoHistory from '../../hooks/usePhotoHistory';

const PhotoUpload = ({ userId, horseId, horseData = {}, onSuccess, compact = false }) => {
  const { uploadPhoto, uploading } = usePhotoHistory(userId, horseId);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [metadata, setMetadata] = useState({
    notes: '',
    capturedAt: new Date().toISOString().split('T')[0]
  });
  const [status, setStatus] = useState(null); // success, error

  /**
   * Gérer sélection fichier
   */
  const handleFileSelect = useCallback((file) => {
    if (!file.type.startsWith('image/')) {
      setStatus({
        type: 'error',
        message: 'Veuillez sélectionner une image'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatus({
        type: 'error',
        message: 'Image trop voluminense (max 10MB)'
      });
      return;
    }

    // Prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview({
        file,
        src: e.target.result
      });
      setStatus(null);
    };
    reader.readAsDataURL(file);
  }, []);

  /**
   * Drag & drop
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  /**
   * Uploader la photo
   */
  const handleUpload = useCallback(async () => {
    if (!preview?.file) return;

    try {
      setStatus(null);

      const result = await uploadPhoto(preview.file, {
        notes: metadata.notes,
        capturedAt: new Date(metadata.capturedAt).toISOString(),
        horseSnapshot: {
          weight: horseData.currentWeight,
          bcs: horseData.bcs
        }
      });

      setStatus({
        type: 'success',
        message: 'Photo uploadée avec succès'
      });

      // Réinitialiser
      setTimeout(() => {
        setPreview(null);
        setMetadata({ notes: '', capturedAt: new Date().toISOString().split('T')[0] });
        setStatus(null);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.message || 'Erreur lors de l\'upload'
      });
    }
  }, [preview, metadata, horseData, uploadPhoto, onSuccess]);

  // Pas de preview = formulaire sélection
  if (!preview) {
    return (
      <div
        className={`border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50 transition ${
          dragActive ? 'border-blue-500 bg-blue-100' : ''
        } ${compact ? 'p-4' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
          className="hidden"
        />

        {/* Contenu */}
        <div className="text-center">
          <div className="flex justify-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Upload size={28} className="text-blue-600" />
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Camera size={28} className="text-green-600" />
            </div>
          </div>

          <p className="font-semibold text-gray-900 mb-2">
            Ajouter une photo
          </p>
          <p className="text-gray-600 text-sm mb-4">
            Glissez-déposez une image ou cliquez pour sélectionner
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
          >
            Sélectionner une image
          </button>

          <p className="text-xs text-gray-500 mt-4">
            ⓘ JPEG ou PNG, max 10MB
          </p>
        </div>

        {/* Statut */}
        {status && (
          <div
            className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
              status.type === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {status.type === 'error' ? (
              <AlertCircle size={18} />
            ) : (
              <CheckCircle size={18} />
            )}
            {status.message}
          </div>
        )}
      </div>
    );
  }

  // Avec preview = formulaire metadata
  return (
    <div className="space-y-4 border border-gray-200 rounded-lg p-6 bg-white">
      {/* Preview */}
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
        <img
          src={preview.src}
          alt="Preview"
          className="w-full h-full object-cover"
        />

        {/* Close btn */}
        <button
          onClick={() => {
            setPreview(null);
            setMetadata({ notes: '', capturedAt: new Date().toISOString().split('T')[0] });
            setStatus(null);
          }}
          className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
        >
          <X size={20} />
        </button>

        {/* Loading */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Metadata form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date capturée */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de capture
          </label>
          <input
            type="date"
            value={metadata.capturedAt.split('T')[0]}
            onChange={(e) =>
              setMetadata((p) => ({ ...p, capturedAt: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Poids snapshot */}
        {horseData.currentWeight && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poids (snapshot)
            </label>
            <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium">
              ⚖️ {horseData.currentWeight} kg
            </div>
          </div>
        )}

        {/* BCS snapshot */}
        {horseData.bcs && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              BCS (snapshot)
            </label>
            <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium">
              📊 {horseData.bcs}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (optionnel)
        </label>
        <textarea
          value={metadata.notes}
          onChange={(e) =>
            setMetadata((p) => ({ ...p, notes: e.target.value }))
          }
          placeholder="Ex: Photo de profil pour suivi BCS..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Statut */}
      {status && (
        <div
          className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
            status.type === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {status.type === 'error' ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle size={18} />
          )}
          {status.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setPreview(null);
            setMetadata({ notes: '', capturedAt: new Date().toISOString().split('T')[0] });
            setStatus(null);
          }}
          disabled={uploading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Annuler
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload size={18} />
              Upload la photo
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <p className="text-xs text-gray-500 text-center">
        💡 Le poids et BCS actuels seront sauvegardés avec la photo
      </p>
    </div>
  );
};

export default PhotoUpload;
