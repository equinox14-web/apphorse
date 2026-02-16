/**
 * PhotoGallery Component
 * Affiche les photos en grille avec filtrage par date
 * Support pour sélection et suppression
 */

import React, { useState, useCallback } from 'react';
import {
  Grid,
  Search,
  X,
  Trash2,
  Calendar,
  Weight,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import usePhotoHistory from '../../hooks/usePhotoHistory';

const PhotoGallery = ({ userId, horseId, compact = false }) => {
  const {
    photos,
    photosByMonth,
    loading,
    error,
    deletePhoto,
    searchPhotos
  } = usePhotoHistory(userId, horseId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [expandedMonths, setExpandedMonths] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // grid | timeline
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = searchQuery ? searchPhotos(searchQuery) : photos;

  const toggleMonth = useCallback((monthKey) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  }, []);

  const handleDelete = useCallback(
    async (photoId) => {
      try {
        await deletePhoto(photoId);
        setDeleteConfirm(null);
        console.log('✅ Photo supprimée');
      } catch (err) {
        console.error('❌ Erreur suppression:', err);
      }
    },
    [deletePhoto]
  );

  // États
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des photos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-semibold">Erreur de chargement</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Grid size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 font-semibold">Aucune photo</p>
        <p className="text-gray-500 text-sm mt-2">
          Commencez par uploader la première photo
        </p>
      </div>
    );
  }

  // Mode Grille (par défaut)
  if (viewMode === 'grid') {
    return (
      <div className={`space-y-4 ${compact ? 'p-0' : 'p-4'}`}>
        {/* Contrôles */}
        <div className={`flex gap-2 ${compact ? 'flex-col' : 'items-center justify-between'}`}>
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Rechercher par date ou nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('timeline')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              Timeline
            </button>
            <span className="text-gray-600 text-sm whitespace-nowrap">
              {filtered.length} photo{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Grille de photos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {filtered.map((photo) => (
            <div
              key={photo.id}
              className="relative group cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              {/* Image */}
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group-hover:border-blue-400 transition">
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.fileName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  loading="lazy"
                />

                {/* Overlay supprimer */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(photo.id);
                    }}
                    className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition"
                    title="Supprimer"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Badge date */}
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {new Date(photo.capturedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </div>
              </div>

              {/* Metadata */}
              {!compact && (
                <div className="mt-1 text-xs text-gray-600 truncate">
                  {photo.weight && <span className="block">⚖️ {photo.weight}kg</span>}
                  {photo.bcs && <span className="block">📊 BCS {photo.bcs}</span>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal détail photo */}
        {selectedPhoto && (
          <PhotoModal
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            onDelete={() => {
              setDeleteConfirm(selectedPhoto.id);
              setSelectedPhoto(null);
            }}
          />
        )}

        {/* Confirmation supprimer */}
        {deleteConfirm && (
          <ConfirmDeleteModal
            photoId={deleteConfirm}
            onConfirm={() => handleDelete(deleteConfirm)}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </div>
    );
  }

  // Mode Timeline
  return (
    <div className="space-y-4 p-4">
      {/* Contrôles */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Timeline</h3>
        <button
          onClick={() => setViewMode('grid')}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
        >
          Grille
        </button>
      </div>

      {/* Timeline par mois */}
      <div className="space-y-3">
        {photosByMonth.map(({ monthKey, month, count, photos: monthPhotos }) => (
          <div key={monthKey} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header mois */}
            <button
              onClick={() => toggleMonth(monthKey)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-600" />
                <span className="font-semibold text-gray-900">{month}</span>
                <span className="text-gray-600 text-sm">({count})</span>
              </div>

              {expandedMonths[monthKey] ? (
                <ChevronUp size={20} className="text-gray-600" />
              ) : (
                <ChevronDown size={20} className="text-gray-600" />
              )}
            </button>

            {/* Photos du mois */}
            {expandedMonths[monthKey] && (
              <div className="p-3 border-t border-gray-200 bg-white space-y-2">
                {monthPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="flex gap-3 p-2 border border-gray-100 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    {/* Thumbnail */}
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.fileName}
                      className="w-16 h-16 object-cover rounded"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm">
                        {photo.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(photo.capturedAt).toLocaleString('fr-FR')}
                      </p>

                      {/* Metadata */}
                      <div className="flex gap-3 mt-1 text-xs text-gray-600">
                        {photo.weight && (
                          <span className="flex items-center gap-1">
                            <Weight size={14} /> {photo.weight}kg
                          </span>
                        )}
                        {photo.bcs && (
                          <span className="flex items-center gap-1">
                            <Zap size={14} /> BCS {photo.bcs}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete btn */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(photo.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal détail */}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onDelete={() => {
            setDeleteConfirm(selectedPhoto.id);
            setSelectedPhoto(null);
          }}
        />
      )}

      {/* Confirmation supprimer */}
      {deleteConfirm && (
        <ConfirmDeleteModal
          photoId={deleteConfirm}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

/**
 * Modal d'affichage détail photo
 */
const PhotoModal = ({ photo, onClose, onDelete }) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">{photo.fileName}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 overflow-auto">
          <img
            src={photo.url}
            alt={photo.fileName}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Metadata */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Date</p>
              <p className="font-medium text-gray-900">
                {new Date(photo.capturedAt).toLocaleString('fr-FR')}
              </p>
            </div>

            {photo.weight && (
              <div>
                <p className="text-gray-600">Poids</p>
                <p className="font-medium text-gray-900">{photo.weight} kg</p>
              </div>
            )}

            {photo.bcs && (
              <div>
                <p className="text-gray-600">BCS</p>
                <p className="font-medium text-gray-900">{photo.bcs}</p>
              </div>
            )}

            {photo.size && (
              <div>
                <p className="text-gray-600">Taille</p>
                <p className="font-medium text-gray-900">
                  {(photo.size / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
            )}
          </div>

          {photo.notes && (
            <div className="mt-3">
              <p className="text-gray-600">Notes</p>
              <p className="font-medium text-gray-900">{photo.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Fermer
          </button>
          <button
            onClick={onDelete}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium flex items-center justify-center gap-2"
          >
            <Trash2 size={18} /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal de confirmation suppression
 */
const ConfirmDeleteModal = ({ photoId, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm">
        <h3 className="font-semibold text-lg text-gray-900 mb-2">
          Supprimer cette photo ?
        </h3>
        <p className="text-gray-600 text-sm mb-6">
          Cette action est irréversible. La photo sera supprimée du cloud.
        </p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoGallery;
