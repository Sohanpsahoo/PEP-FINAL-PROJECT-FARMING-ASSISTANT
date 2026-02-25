import React, { createContext, useState, useContext, useEffect } from 'react';
import { getLanguage, setLanguage } from '../utils/translate';

// Create a context for language
const LanguageContext = createContext();

/**
 * Provider component for language context
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Provider component
 */
export function LanguageProvider({ children }) {
  const [language, setCurrentLanguage] = useState(getLanguage());

  const changeLanguage = (newLanguage) => {
    setCurrentLanguage(newLanguage);
    setLanguage(newLanguage);
  };

  useEffect(() => {
    const storedLanguage = localStorage.getItem('ammachi_language');
    if (storedLanguage) {
      setCurrentLanguage(storedLanguage);
      setLanguage(storedLanguage);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Custom hook to use the language context
 * @returns {Object} - Language context value
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}