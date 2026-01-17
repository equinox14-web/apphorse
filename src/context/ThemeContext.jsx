import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext();

export const useTheme = () => {
    return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
    const location = useLocation();
    const isLandingPage = location.pathname === '/';

    // Themes: 'saddle', 'forest', 'ocean', 'berry', 'minimalist' (default)
    const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'minimalist');
    // Mode: 'light' (default), 'dark'
    const [mode, setMode] = useState(() => localStorage.getItem('app_mode') || 'light');

    useEffect(() => {
        // If on landing page, force light mode and saddle theme
        const effectiveTheme = isLandingPage ? 'saddle' : theme;
        const effectiveMode = isLandingPage ? 'light' : mode;

        // Apply attributes to the root HTML element
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        document.documentElement.setAttribute('data-mode', effectiveMode);

        // Persist only if not forced by landing page (don't overwrite settings)
        if (!isLandingPage) {
            localStorage.setItem('app_theme', theme);
            localStorage.setItem('app_mode', mode);
        }
    }, [theme, mode, isLandingPage]);

    const toggleMode = () => {
        setMode(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, mode, toggleMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
