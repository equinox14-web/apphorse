import React from 'react';
import Card from './Card';
import Button from './Button';
import { Download, Share, Smartphone } from 'lucide-react';
import { usePWA } from '../context/PWAContext';

const InstallAppCard = () => {
    const { isInstalled, openInstructions, canInstall, isIOS } = usePWA();

    // Do not show if already installed
    if (isInstalled) return null;

    // Do not show if we can't install AND it's not iOS (e.g. desktop Firefox or Safari where we can't prompt easily, unless we want to show generic help)
    // Actually, spreading awareness is good. Let's show it if:
    // 1. We have a prompt captured (canInstall)
    // 2. OR we are on iOS (manual steps)
    // 3. OR we are on Desktop Chrome/Edge (usually captured by canInstall)

    // If we have neither prompt nor iOS, maybe hide it to avoid confusion or just disable? 
    // Let's hide it if we literally can't do anything (no deferredPrompt and not iOS).
    // Always show if not installed to allow manual instructions or waiting for prompt
    // if (!canInstall && !isIOS) return null; // Removed to ensure visibility on mobile

    return (
        <Card
            accent={true}
            style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white'
            }}
        >
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
