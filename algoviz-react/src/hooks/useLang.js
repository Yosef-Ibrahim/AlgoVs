import { useState, useEffect } from 'react';

const STORAGE_KEY = 'fcai_visualizer_lang';
const VALID_LANGS = ['js', 'python', 'cpp', 'java', 'csharp'];

export function useLang(defaultLang = 'js') {
  const [lang, setLangState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID_LANGS.includes(stored)) return stored;
    } catch (_) { /* localStorage blocked in some envs */ }
    return defaultLang;
  });

  const setLang = (newLang) => {
    if (!VALID_LANGS.includes(newLang)) return;
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (_) { /* ignore */ }
  };

  return [lang, setLang];
}