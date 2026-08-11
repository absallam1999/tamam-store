import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  useEffect(() => {
    // Ensure Arabic is the default if no preference is saved
    const savedLang = localStorage.getItem('store-language');
    
    if (!savedLang) {
      // No language saved yet - set Arabic as default
      localStorage.setItem('store-language', 'ar');
      i18n.changeLanguage('ar');
    }
    
    // Apply direction based on current language
    const currentLang = savedLang || 'ar';
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
    
    // Listen for language changes
    const handleLanguageChanged = (lng: string) => {
      document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
      localStorage.setItem('store-language', lng);
    };
    
    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
};