import React from 'react';
import { X, Share, PlusSquare, Download } from 'lucide-react';
import Button from './Button';
import { useTranslation } from 'react-i18next';
import { usePWA } from '../context/PWAContext';

const PWAPrompt = () => {
    const {
        showInstallPrompt,
        dismissPrompt,
        install,
        isIOS,
        showInstructions,
        closeInstructions,
        deferredPrompt // Get deferredPrompt
    } = usePWA();

    const { t } = useTranslation();

    // 1. The Small Popup (Bottom Right)
    // Shows automatically if not dismissed
    if (showInstallPrompt) {
        return (
            <div style={{
                position: 'fixed', bottom: '20px', right: '20px', left: 'auto',
                background: 'white', padding: '1.5rem', borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                zIndex: 9999, border: '1px solid #f3f4f6',
                width: 'calc(100% - 40px)', maxWidth: '380px',
                animation: 'slideUp 0.3s ease-out'
            }}>
                <button
                    onClick={dismissPrompt}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                >
                    <X size={20} />
                </button>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <img src="/Logo_equinox.png" alt="Icon" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{t('pwa_install_title')}</h3>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
                            {t('pwa_install_desc')}
                        </p>
                    </div>
                </div>

                {isIOS ? (
                    <div style={{ fontSize: '0.9rem', color: '#4b5563', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>
                            Installation sur iPhone/iPad :
                        </div>
                        <ol style={{ paddingLeft: '1.2rem', margin: 0 }}>
                            <li style={{ marginBottom: '0.5rem' }}>
                                Appuyez sur <Share size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> <strong>Partager</strong>
                            </li>
                            <li>
                                Sélectionnez <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> <strong>Sur l&apos;écran d&apos;accueil</strong>
                            </li>
                        </ol>
                    </div>
                ) : (
                    <Button
                        onClick={install}
                        style={{ width: '100%', justifyContent: 'center', background: '#2563eb' }}
                    >
                        <Download size={18} style={{ marginRight: '0.5rem' }} />
                        {t('pwa_install_button')}
                    </Button>
                )}
            </div>
        );
    }

    // 2. The iOS Instructions Modal (Center Screen)
    // Triggered explicitly via the button we will add to Dashboard
    // 2. The Generic Instructions Modal (Center Screen)
    // Triggered explicitly via the button we will add to Dashboard
    if (showInstructions) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.5)', zIndex: 10000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem'
            }} onClick={closeInstructions}>
                <div style={{
                    background: 'white', borderRadius: '24px', padding: '2rem',
                    width: '100%', maxWidth: '400px',
                    position: 'relative',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                }} onClick={e => e.stopPropagation()}>
                    <button
                        onClick={closeInstructions}
                        style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                    >
                        <X size={24} />
                    </button>

                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <img src="/Logo_equinox.png" alt="App Icon" style={{ width: '64px', height: '64px', borderRadius: '16px', marginBottom: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Installer l'Application</h2>
                        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                            {isIOS
                                ? "Pour une meilleure expérience sur votre iPhone"
                                : "Pour un accès rapide et hors ligne"}
                        </p>
                    </div>

                    {deferredPrompt ? (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e3a8a', marginBottom: '0.5rem' }}>Prêt à installer</h3>
                                    <p style={{ color: '#3b82f6', fontSize: '0.95rem' }}>
                                        Cliquez ci-dessous pour lancer l'installation automatique.
                                    </p>
                                </div>
                                <Button onClick={install} style={{ width: '100%', justifyContent: 'center', height: '50px', fontSize: '1.1rem' }}>
                                    <Download size={20} style={{ marginRight: '0.5rem' }} /> Installer maintenant
                                </Button>
                                <button onClick={closeInstructions} style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#9ca3af', textDecoration: 'underline', cursor: 'pointer' }}>
                                    Non merci
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{
                                background: '#f3f4f6', borderRadius: '16px', padding: '1.5rem',
                                display: 'flex', flexDirection: 'column', gap: '1rem'
                            }}>
                                {isIOS ? (
                                    // iOS Instructions
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 'bold' }}>1</div>
                                            <div style={{ flex: 1, fontSize: '0.95rem' }}>
                                                Appuyez sur le bouton <strong>Partager</strong> <Share size={16} style={{ display: 'inline', marginTop: '-2px' }} /> dans la barre de navigation.
                                            </div>
                                        </div>
                                        <div style={{ width: '1px', height: '16px', background: '#d1d5db', marginLeft: '16px' }}></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 'bold' }}>2</div>
                                            <div style={{ flex: 1, fontSize: '0.95rem' }}>
                                                Faites défiler vers le bas et appuyez sur <strong>Sur l&apos;écran d&apos;accueil</strong> <PlusSquare size={16} style={{ display: 'inline', marginTop: '-2px' }} />.
                                            </div>
                                        </div>
                                        <div style={{ width: '1px', height: '16px', background: '#d1d5db', marginLeft: '16px' }}></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 'bold' }}>3</div>
                                            <div style={{ flex: 1, fontSize: '0.95rem' }}>
                                                Appuyez sur <strong>Ajouter</strong> en haut à droite.
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    // Android / Chrome Manual Instructions
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 'bold' }}>1</div>
                                            <div style={{ flex: 1, fontSize: '0.95rem' }}>
                                                Appuyez sur le menu du navigateur (souvent <strong>3 points</strong> ⋮ en haut à droite).
                                            </div>
                                        </div>
                                        <div style={{ width: '1px', height: '16px', background: '#d1d5db', marginLeft: '16px' }}></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 'bold' }}>2</div>
                                            <div style={{ flex: 1, fontSize: '0.95rem' }}>
                                                Sélectionnez <strong>Installer l'application</strong> ou <strong style={{ whiteSpace: 'nowrap' }}>Ajouter à l'écran d'accueil</strong>.
                                            </div>
                                        </div>
                                        <div style={{ width: '1px', height: '16px', background: '#d1d5db', marginLeft: '16px' }}></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 'bold' }}>3</div>
                                            <div style={{ flex: 1, fontSize: '0.95rem' }}>
                                                Confirmez en appuyant sur <strong>Installer</strong>.
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <Button onClick={closeInstructions} style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}>
                                J'ai compris
                            </Button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return null;
};

export default PWAPrompt;
