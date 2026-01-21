import React from 'react';
import Card from './Card';
import Button from './Button';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWA } from '../context/PWAContext';

const InstallAppCard = () => {
    const { isInstalled, openInstructions, canInstall, isIOS } = usePWA();
    const [isVisible, setIsVisible] = React.useState(true);

    // Debug: We removed the strict 'isInstalled' check to ensure visibility for your test.
    // Instead, we allow the user to dismiss it manually.
    if (!isVisible) return null;

    // Optional: Auto-hide if installed, but user says it doesn't show up when it should.
    // if (isInstalled) return null;

    return (
        <Card
            accent={true}
            style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                position: 'relative'
            }}
        >
            <button
                onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
                style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                    width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'white'
                }}
            >
                <X size={14} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    minWidth: '48px', height: '48px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Smartphone size={24} color="white" />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>
                        Installer l'App
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                        {isIOS
                            ? "Ajoutez l'app à l'écran d'accueil pour un accès rapide."
                            : "Installez l'application pour une meilleure expérience."
                        }
                    </p>
                </div>
            </div>

            <Button
                onClick={openInstructions}
                style={{
                    marginTop: '1rem',
                    width: '100%',
                    background: 'white',
                    color: '#2563eb',
                    border: 'none',
                    justifyContent: 'center'
                }}
            >
                {isIOS ? (
                    <><Share size={16} style={{ marginRight: '0.5rem' }} /> Voir comment faire</>
                ) : (
                    <><Download size={16} style={{ marginRight: '0.5rem' }} /> Installer maintenant</>
                )}
            </Button>
        </Card>
    );
};

export default InstallAppCard;
