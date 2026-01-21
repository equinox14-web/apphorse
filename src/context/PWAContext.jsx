import React, { createContext, useContext, useState, useEffect } from 'react';

const PWAContext = createContext();

export const usePWA = () => useContext(PWAContext);

export const PWAProvider = ({ children }) => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false); // Controls the global popup
    const [showInstructions, setShowInstructions] = useState(false); // Controls generic instructions modal (iOS or Manual Android)

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        // Detect if already installed
        const checkInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
            setIsInstalled(isStandalone);
        };
        checkInstalled();
        window.matchMedia('(display-mode: standalone)').addEventListener('change', checkInstalled);

        // Capture beforeinstallprompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Auto-show prompt if not dismissed recently
            if (!localStorage.getItem('pwa_prompt_dismissed')) {
                setShowInstallPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // For iOS, if not installed and not dismissed, show prompt (instructions)
        if (ios && !localStorage.getItem('pwa_prompt_dismissed') && !isInstalled) {
            setShowInstallPrompt(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkInstalled);
        };
    }, [isInstalled]);

    const install = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setShowInstallPrompt(false);
            }
        } else if (isIOS) {
            // On iOS, we can't programmatically install, so we show the instructions
            setShowInstructions(true);
        }
    };

    const dismissPrompt = () => {
        setShowInstallPrompt(false);
        localStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    const closeInstructions = () => {
        setShowInstructions(false);
    };

    // Open instructions manually (e.g. from a help button)
    const openInstructions = () => {
        // Always show the modal first (Unified Experience)
        setShowInstructions(true);
    };

    return (
        <PWAContext.Provider value={{
            isInstalled,
            isIOS,
            canInstall: !!deferredPrompt || isIOS, // We "can" install on iOS via manual steps
            install,
            dismissPrompt,
            showInstallPrompt,
            showInstructions, // Renamed from showIOSInstructions
            closeInstructions, // Renamed from closeIOSInstructions
            openInstructions,
            deferredPrompt // Expose for UI logic
        }}>
            {children}
        </PWAContext.Provider>
    );
};
