import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import Button from '../common/Button';

const TrialModeWarning = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const userPlans = JSON.parse(localStorage.getItem('subscriptionPlan') || '[]');
    const isTrial = userPlans.includes('pro_trial');

    if (!isTrial) return null;

    const startStr = localStorage.getItem('trialStartDate');
    if (!startStr) return null;

    const start = parseInt(startStr);
    const now = Date.now();
    const daysPassed = (now - start) / (1000 * 60 * 60 * 24);
    const daysLeft = Math.max(0, Math.ceil(30 - daysPassed));

    return (
        <div style={{
            position: 'fixed',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#f97316', // orange-500
            color: 'white',
            padding: '0.6rem 1.2rem',
            borderRadius: '999px',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)',
            zIndex: 9990,
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        }}>
            <Trophy size={16} />
            <span>{t('trial.text', { days: daysLeft })}</span>
            <Button
                size="small"
                onClick={() => navigate('/settings')}
                style={{
                    marginLeft: '0.5rem',
                    background: 'white',
                    color: '#f97316',
                    border: 'none',
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.8rem'
                }}
            >
                {t('trial.subscribe')}
            </Button>
        </div>
    );
};

export default TrialModeWarning;
