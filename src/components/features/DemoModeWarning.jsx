import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const DemoModeWarning = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Only render if demo mode is active
    const isDemoMode = localStorage.getItem('app_demo_mode') === 'true';

    // We must call hooks unconditionally at the top level, 
    // but the logic inside them can depend on state/props.
    // Ideally, this component is only rendered when needed, 
    // OR we always call hooks and handle logic inside.

    // However, since we're extracting this to a component, 
    // simply rendering <DemoModeWarning /> conditionally in the parent is fine,
    // as mounting/unmounting a component is different from conditional hooks inside a component.

    const expiresAt = parseInt(localStorage.getItem('app_demo_expires') || '0');
    // Initialize with current calculation
    const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((expiresAt - Date.now()) / 60000))); // Minutes

    useEffect(() => {
        if (!isDemoMode) return;

        const timer = setInterval(() => {
            const remaining = expiresAt - Date.now();
            if (remaining <= 0) {
                // EXPIRED
                clearInterval(timer);
                localStorage.clear();
                alert(t('demo.expired'));
                window.location.href = '/signup';
            } else {
                setTimeLeft(Math.floor(remaining / 60000));
            }
        }, 1000 * 60); // Check every minute (or refresh on mount)
        return () => clearInterval(timer);
    }, [isDemoMode, expiresAt, t]); // Dependencies added

    if (!isDemoMode) return null;

    const days = Math.floor(timeLeft / 1440);
    const hours = Math.floor((timeLeft % 1440) / 60);
    const minutes = timeLeft % 60;

    // Progress base on 7 days (10080 minutes)
    const totalMinutes = 7 * 24 * 60;
    const progress = Math.min(100, (timeLeft / totalMinutes) * 100);

    return (
        <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            height: '6px',
            background: '#1f2937',
            zIndex: 99999
        }}>
            <div style={{
                height: '100%',
                background: '#fbbf24',
                width: `${progress}%`,
                transition: 'width 1s linear'
            }} />
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '20px',
                background: '#fbbf24',
                color: '#1f2937',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                {t('demo.bar_text', { days, hours, minutes })}
            </div>
        </div>
    );
};

export default DemoModeWarning;
