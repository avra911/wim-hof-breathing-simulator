import { Platform } from 'react-native';
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

// 3. Setări de fallback (dacă lipsește un cuvânt, îl ia din engleză)
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// 4. Detectare blindată a limbii (Web vs. Nativ)
let deviceLanguage = 'en';

try {
  if (Platform.OS === 'web') {
    // Pe Web (Brave/Chrome/GitHub Pages), citim direct din browser.
    // navigator.language returnează ex: "ro-RO" sau "en-US", noi luăm doar prima parte.
    deviceLanguage = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
  } else {
    // Pe Android / iOS, folosim modulul de la Expo
    const locales = getLocales();
    if (locales && locales.length > 0) {
      deviceLanguage = locales[0].languageCode;
    }
  }
} catch (e) {
  console.log("Eroare la detectarea limbii:", e);
}

// Setăm limba detectată în instanța i18n
i18n.locale = deviceLanguage;

// 5. Exportăm funcția de traducere
export function t(key, opts) {
  return i18n.t(key, opts);
}

export default i18n;