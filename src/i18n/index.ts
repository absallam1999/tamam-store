import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import arTranslation from './locales/ar/translation';
import enTranslation from './locales/en/translation';

const resources = {
  ar: {
    translation: arTranslation,
  },
  en: {
    translation: enTranslation,
  },
};

// Get initial language with proper priority
const getInitialLanguage = (): string => {
  // 1. Check localStorage first
  const stored = localStorage.getItem('store-language');
  if (stored && (stored === 'ar' || stored === 'en')) {
    return stored;
  }
  
  // 2. If no stored preference, default to Arabic
  return 'ar';
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(), // Set initial language explicitly
    fallbackLng: 'ar',
    supportedLngs: ['ar', 'en'],
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'store-language',
      caches: ['localStorage'],
    },
    // Force Arabic if no preference is set
    returnNull: false,
    returnEmptyString: false,
  });

export default i18n;