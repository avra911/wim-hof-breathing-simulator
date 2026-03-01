import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

// 1. Importăm fișierele de limbă
import en from './locales/en.json';
import ro from './locales/ro.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import cz from './locales/cz.json';
import de from './locales/de.json';
import zh from './locales/zh.json';

// 2. Inițializăm I18n cu toate traducerile
const i18n = new I18n({
  en,
  ro,
  es,
  fr,
  cz,
  de,
  zh
});

// 3. Setări de fallback (dacă lipsește un cuvânt în română, îl ia din engleză)
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// 4. Detectăm inteligent limba telefonului
// getLocales()[0].languageCode returnează doar primele litere (ex: 'ro' din 'ro-RO')
const deviceLanguage = getLocales()[0].languageCode; 
i18n.locale = 'deviceLanguage';

// 5. Exportăm funcția de traducere
export function t(key, opts) {
  return i18n.t(key, opts);
}

export default i18n;