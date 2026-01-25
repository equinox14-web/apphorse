import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = ({ variant = 'default' }) => {
    const { t, i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    if (variant === 'header') {
        return (
            <div className="language-switcher-header">
                <button
                    className={i18n.language === 'fr' ? 'active' : ''}
                    onClick={() => changeLanguage('fr')}
                >
                    FR
                </button>
                <span className="separator">|</span>
                <button
                    className={i18n.language === 'en' ? 'active' : ''}
                    onClick={() => changeLanguage('en')}
                >
                    EN
                </button>
            </div>
        );
    }

    return (
        <div className="language-switcher">
            <span>{t('language')}: </span>
            <div className="language-buttons">
                <button
                    className={i18n.language === 'fr' ? 'active' : ''}
                    onClick={() => changeLanguage('fr')}
                >
                    FR
                </button>
                <button
                    className={i18n.language === 'en' ? 'active' : ''}
                    onClick={() => changeLanguage('en')}
                >
                    EN
                </button>
            </div>
        </div>
    );
};

export default LanguageSwitcher;
