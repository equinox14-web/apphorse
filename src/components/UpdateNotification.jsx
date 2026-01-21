import React, { useState } from 'react';
import { RefreshCw, X, Wifi, WifiOff, Loader2 } from 'lucide-react';

export default function UpdateNotification({
    needRefresh,
    offlineReady,
    onUpdate,
    onDismiss
}) {
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await onUpdate();
        } catch (e) {
            console.error("Update failed", e);
            setLoading(false);
        }
    };

    // Ne rien afficher si aucune mise à jour n'est disponible
    // On masque la notification "Mode hors ligne prêt" pour ne garder que "Nouvelle version"
    if (!needRefresh) {
        return null;
    }

    return (
        <div
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] animate-slide-up"
            role="alert"
            aria-live="assertive"
        >
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl shadow-2xl border border-violet-400/30 backdrop-blur-sm overflow-hidden min-w-[320px] max-w-[420px]">
                {/* Barre de progression animée */}
                <div className="h-1 bg-violet-400/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/60 to-white/0 animate-shimmer" />
                </div>

                <div className="p-4 flex items-center gap-4">
                    {/* Icône */}
                    <div className="flex-shrink-0">
                        {needRefresh ? (
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse-slow">
                                <RefreshCw className={`w-6 h-6 text-white ${loading ? 'animate-spin' : ''}`} />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <WifiOff className="w-6 h-6 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base leading-tight mb-1">
                            {needRefresh ? 'Nouvelle version disponible' : 'Mode hors ligne activé'}
                        </h3>
                        <p className="text-sm text-violet-100 leading-snug">
                            {needRefresh
                                ? 'Cliquez pour mettre à jour l\'application'
                                : 'L\'application fonctionne maintenant hors ligne'}
                        </p>
                    </div>

                    {/* Bouton d'action */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        {needRefresh ? (
                            <>
                                <button
                                    onClick={handleUpdate}
                                    disabled={loading}
                                    className="px-4 py-2 bg-white text-violet-600 rounded-lg font-medium text-sm hover:bg-violet-50 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
                                    aria-label="Recharger l'application"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                    {loading ? 'Mise à jour...' : 'Recharger'}
                                </button>
                                <button
                                    onClick={onDismiss}
                                    disabled={loading}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 disabled:opacity-50"
                                    aria-label="Fermer la notification"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onDismiss}
                                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium text-sm hover:bg-white/30 active:scale-95 transition-all duration-200"
                                aria-label="Fermer la notification"
                            >
                                OK
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Animations CSS personnalisées */}
            <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translate(-50%, 100px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }

        @keyframes shimmer {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(100%);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
        </div>
    );
}
