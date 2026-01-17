import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';
// Force rebuild: 2026-01-01

// Detect if the user is a bot/crawler
const isBot = navigator.userAgent && /bot|google|baidu|bing|msn|duckduckgo|teoma|slurp|yandex/i.test(navigator.userAgent);

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: en
            },
            fr: {
                translation: fr
            }
        },
        // For bots, we ignore navigator to let fallbackLng (fr) take over (or htmlTag)
        detection: {
            order: isBot ? ['htmlTag'] : ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage', 'cookie'],
        },
        fallbackLng: 'fr',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
