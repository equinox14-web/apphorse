import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';
import Button from './Button';
import { useTranslation } from 'react-i18next'; // Import i18n

const PWAPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const { t } = useTranslation(); // Use translation hook

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        // Detect if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (isStandalone) return;

        // Custom Android Prompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show prompt only if not dismissed recently (could use localStorage)
            if (!localStorage.getItem('pwa_prompt_dismissed')) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Show iOS prompt immediately if not installed and not dismissed
        if (ios && !localStorage.getItem('pwa_prompt_dismissed')) {
            setShowPrompt(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    if (!showPrompt) return null;

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
                onClick={handleDismiss}
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
                    {t('pwa_ios_step1')} <Share size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /><br />
                    {t('pwa_ios_step2_pre')} <strong>"{t('pwa_ios_step2_strong')}"</strong> <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </div>
            ) : (
                <Button
                    onClick={handleInstallClick}
                    style={{ width: '100%', justifyContent: 'center', background: '#2563eb' }}
                >
                    {t('pwa_install_button')}
                </Button>
            )}
        </div>
    );
};

export default PWAPrompt;
