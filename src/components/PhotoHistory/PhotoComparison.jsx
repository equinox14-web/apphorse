/**
 * PhotoComparison Component
 * Comparateur avant/après avec slider interactif
 * Support touch (deux doigts sur mobile)
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Composant de comparaison avant/après
 */
const PhotoComparison = ({
  beforePhoto,
  afterPhoto,
  beforeLabel = 'Avant',
  afterLabel = 'Après',
  compact = false
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  /**
   * Calculer position du slider
   */
  const handleMove = (clientX) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let x = clientX - rect.left;

    // Clamp between 0 and container width
    x = Math.max(0, Math.min(x, rect.width));

    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.clamp(percentage, 0, 100));
  };

  /**
   * Event handlers
   */
  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (isDragging) handleMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleTouchStart = () => setIsDragging(true);
  const handleTouchEnd = () => setIsDragging(false);

  /**
   * Quick navigation buttons
   */
  const handleQuickMove = (direction) => {
    setSliderPosition((prev) => {
      const newPos = direction === 'left' ? prev - 10 : prev + 10;
      return Math.max(0, Math.min(100, newPos));
    });
  };

  /**
   * Effect for mouse/touch events
   */
  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // Validation
  if (!beforePhoto?.url || !afterPhoto?.url) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
        <p className="font-semibold">Photos manquantes</p>
        <p className="text-sm">
          Veuillez sélectionner deux photos pour la comparaison
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${compact ? 'p-0' : 'p-4'}`}>
      {/* Container comparaison */}
      <div
        ref={containerRef}
        className="relative w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700 cursor-col-resize select-none"
        style={{ aspectRatio: '16/9', minHeight: compact ? '200px' : '400px' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Image Avant */}
        <div className="absolute inset-0">
          <img
            src={beforePhoto.url}
            alt={beforeLabel}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Image Après (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={afterPhoto.url}
            alt={afterLabel}
            className="w-full h-full object-cover"
            style={{ width: `${(containerRef.current?.offsetWidth || 0) * (100 / sliderPosition)}px` }}
            draggable={false}
          />
        </div>

        {/* Labels */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Avant label */}
          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg text-sm font-medium">
            {beforeLabel}
          </div>

          {/* Après label */}
          <div
            className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-lg text-sm font-medium"
            style={{ opacity: sliderPosition > 20 ? 1 : 0.5 }}
          >
            {afterLabel}
          </div>
        </div>

        {/* Slider handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-blue-400 z-20 flex items-center justify-center"
          style={{ left: `${sliderPosition}%`, cursor: 'col-resize' }}
          draggable={false}
        >
          {/* Handle visual */}
          <div className="absolute w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center -ml-6 pointer-events-none">
            <div className="flex gap-1">
              <ChevronLeft size={16} className="text-black" />
              <ChevronRight size={16} className="text-black" />
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        {!beforePhoto.url || !afterPhoto.url ? (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : null}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        {/* Left button */}
        <button
          onClick={() => handleQuickMove('left')}
          disabled={sliderPosition === 0}
          className="p-2 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
          title="Voir plus l'avant"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Percentage display */}
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">
            {Math.round(sliderPosition)}% Après
          </p>
          <p className="text-xs text-gray-500">
            Glissez ou cliquez pour comparer
          </p>
        </div>

        {/* Right button */}
        <button
          onClick={() => handleQuickMove('right')}
          disabled={sliderPosition === 100}
          className="p-2 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
          title="Voir plus l'après"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Metadata comparison */}
      {(beforePhoto.weight || afterPhoto.weight || beforePhoto.bcs || afterPhoto.bcs) && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          {/* Poids */}
          {(beforePhoto.weight || afterPhoto.weight) && (
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-2">⚖️ Poids</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">{beforeLabel}</p>
                  <p className="font-semibold text-gray-900">
                    {beforePhoto.weight || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">{afterLabel}</p>
                  <p className="font-semibold text-gray-900">
                    {afterPhoto.weight || '-'}
                  </p>
                </div>
              </div>

              {beforePhoto.weight && afterPhoto.weight && (
                <div className="mt-2 text-xs">
                  <p
                    className={
                      afterPhoto.weight > beforePhoto.weight
                        ? 'text-red-600 font-semibold'
                        : afterPhoto.weight < beforePhoto.weight
                          ? 'text-green-600 font-semibold'
                          : 'text-gray-600'
                    }
                  >
                    {afterPhoto.weight > beforePhoto.weight
                      ? `+${(afterPhoto.weight - beforePhoto.weight).toFixed(1)}kg`
                      : afterPhoto.weight < beforePhoto.weight
                        ? `${(afterPhoto.weight - beforePhoto.weight).toFixed(1)}kg`
                        : 'Sans changement'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* BCS */}
          {(beforePhoto.bcs || afterPhoto.bcs) && (
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-2">📊 BCS</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">{beforeLabel}</p>
                  <p className="font-semibold text-gray-900">
                    {beforePhoto.bcs || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">{afterLabel}</p>
                  <p className="font-semibold text-gray-900">
                    {afterPhoto.bcs || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info dates */}
      <div className="text-center text-xs text-gray-500">
        <p>
          {beforeLabel}:{' '}
          {new Date(beforePhoto.capturedAt).toLocaleDateString('fr-FR')}
        </p>
        <p>
          {afterLabel}:{' '}
          {new Date(afterPhoto.capturedAt).toLocaleDateString('fr-FR')}
        </p>
      </div>
    </div>
  );
};

export default PhotoComparison;
