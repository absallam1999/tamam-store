import { useTranslation } from 'react-i18next';
import { useCallback, useEffect } from 'react';

export function useLanguage() {
  const { i18n, t } = useTranslation();

  // Force Arabic if somehow language is undefined
  useEffect(() => {
    if (!i18n.language || !['ar', 'en'].includes(i18n.language)) {
      i18n.changeLanguage('ar');
    }
  }, [i18n]);

  const currentLanguage = (i18n.language || 'ar') as 'ar' | 'en';
  const isRTL = currentLanguage === 'ar';

  const changeLanguage = useCallback((lang: 'ar' | 'en') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('store-language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [i18n]);

  const toggleLanguage = useCallback(() => {
    const newLang = currentLanguage === 'ar' ? 'en' : 'ar';
    changeLanguage(newLang);
  }, [currentLanguage, changeLanguage]);

  return {
    currentLanguage,
    isRTL,
    changeLanguage,
    toggleLanguage,
    t,
  };
}