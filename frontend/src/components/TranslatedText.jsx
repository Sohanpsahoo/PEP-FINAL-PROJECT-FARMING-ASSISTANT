import React from 'react';
import { translate } from '../utils/translate';
import { useLanguage } from '../context/LanguageContext';

/**
 * Component that renders text translated according to the current language setting
 * @param {Object} props - Component props
 * @param {string} props.text - The text to translate
 * @param {string} props.as - HTML element to render (default: span)
 * @param {Object} props.props - Additional props to pass to the element
 * @returns {JSX.Element} - Translated text element
 */
const TranslatedText = ({ text, as = 'span', ...props }) => {
  const { language } = useLanguage();
  const translatedText = translate(text);
  const Element = as;
  return <Element {...props}>{translatedText}</Element>;
};

export default TranslatedText;