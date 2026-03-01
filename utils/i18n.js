import * as Localization from 'expo-localization';
import * as i18n from 'i18n-js';

import en from './locales/en.json';
import ro from './locales/ro.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import cz from './locales/cz.json';

// Prepare I18n instance (use fallback object if import failed)
// Support both `import i18n from 'i18n-js'` and `import * as i18n from 'i18n-js'`
let I18n = i18n && (i18n.default || i18n);

if (!I18n || typeof I18n !== 'object') {
  // eslint-disable-next-line no-console
  console.warn('i18n-js import missing or unexpected; using fallback translator');
  I18n = {};
}

// Ensure translations container exists
I18n.translations = I18n.translations || { en };
// Attach provided locales
I18n.translations = { ...I18n.translations, en, ro, es, fr, cz };

// Provide a safe .t() implementation if missing
if (typeof I18n.t !== 'function') {
  I18n.t = (key, opts) => {
    const parts = key.split('.');
    const lang = (I18n.locale || 'en').split('-')[0];
    let cur = (I18n.translations && (I18n.translations[lang] || I18n.translations.en)) || {};
    for (const p of parts) { cur = cur ? cur[p] : null; }
    if (cur && typeof cur === 'string') {
      return cur.replace(/\{(\w+)\}/g, (_, name) => (opts && opts[name]) || '');
    }
    return key;
  };
}

// Use device locale (expo-localization) with a navigator fallback for web
const detected = (Localization && Localization.locale) || (typeof navigator !== 'undefined' && navigator.language) || 'en';

// Normalize to language code only (e.g. 'en', 'ro')
const short = detected.split('-')[0];
I18n.locale = short;

I18n.fallbacks = true;

export function t(key, opts) {
  return I18n.t(key, opts);
}

export function locale() {
  return I18n.locale;
}

export default I18n;
