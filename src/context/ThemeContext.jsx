import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { scheduleSyncToFirestore } from '../services/firestoreSync';

const ThemeContext = createContext();

export const useTheme = () => {
    return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
    const location = useLocation();
    const { currentUser } = useAuth();
    const isLandingPage = location.pathname === '/';

    // Themes: 'saddle', 'forest', 'ocean', 'berry', 'minimalist' (default)
    const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'minimalist');
    // Mode: 'light' (default), 'dark'
    const [mode, setMode] = useState(() => localStorage.getItem('app_mode') || 'light');

    // 0. Listen for cloud data restoration (Login sync)
    useEffect(() => {
        const handleDataRefreshed = () => {
            console.log("🎨 ThemeContext: Données restaurées, mise à jour du thème...");
            const savedTheme = localStorage.getItem('app_theme');
            const savedMode = localStorage.getItem('app_mode');

            // Only update state if different to avoid loops, though React handles this well
            if (savedTheme && savedTheme !== theme) setTheme(savedTheme);
            if (savedMode && savedMode !== mode) setMode(savedMode);
        };

        window.addEventListener('equinox_data_refreshed', handleDataRefreshed);
        return () => window.removeEventListener('equinox_data_refreshed', handleDataRefreshed);
    }, [theme, mode]);

    useEffect(() => {
        // 1. Calculate Effective Theme (Visuals)
        // If on landing page, force light mode and saddle theme
        const effectiveTheme = isLandingPage ? 'saddle' : theme;
        const effectiveMode = isLandingPage ? 'light' : mode;

        // 2. Apply attributes to the root HTML element
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        document.documentElement.setAttribute('data-mode', effectiveMode);

        // 3. Persist User Preference locally
        localStorage.setItem('app_theme', theme);
        localStorage.setItem('app_mode', mode);

        // 4. Persist to Cloud (Firestore)
        if (currentUser?.uid) {
            scheduleSyncToFirestore(currentUser.uid);
        }

    }, [theme, mode, isLandingPage, currentUser]);

    const toggleMode = () => {
        setMode(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, mode, toggleMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
