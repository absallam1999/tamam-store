import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import arTranslation from "./locales/ar/translation";
import enTranslation from "./locales/en/translation";

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
  // Check localStorage first
  const stored = localStorage.getItem("fleet-supervisor-language");
  if (stored && (stored === "ar" || stored === "en")) {
    return stored;
  }

  // If no stored preference
  return "ar";
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: "ar",
    supportedLngs: ["ar", "en"],
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "fleet-supervisor-language",
      caches: ["localStorage"],
    },
    // Force Arabic if no preference is set
    returnNull: false,
    returnEmptyString: false,
  });

export default i18n;
