// Language detection, persistence, and DOM string-swapping.
// Every page imports initLang() — it's the only call needed.

import copy from './copy.js';

const SUPPORTED = ['en', 'es'];
const LS_KEY    = 'lang';

export function getLang() {
  const stored = localStorage.getItem(LS_KEY);
  if (stored && SUPPORTED.includes(stored)) return stored;

  // Detect from browser Accept-Language list
  const preferred = (navigator.languages || [navigator.language || 'en'])
    .map(l => l.split('-')[0].toLowerCase())
    .find(l => SUPPORTED.includes(l));

  return preferred || 'en';
}

export function setLang(lang) {
  if (SUPPORTED.includes(lang)) localStorage.setItem(LS_KEY, lang);
}

export function getCopy(lang) {
  return copy[lang] || copy.en;
}

/**
 * Walk the DOM and replace text / attributes for all i18n-annotated elements.
 *
 *   data-i18n="key"              → el.textContent = copy[lang][key]
 *   data-i18n-placeholder="key"  → el.placeholder  = copy[lang][key]
 *   data-i18n-aria-label="key"   → el.ariaLabel    = copy[lang][key]
 *   data-i18n-title              (on any el)        → document.title = copy[lang][key]
 */
export function applyLang(lang, root = document) {
  const t = getCopy(lang);
  document.documentElement.lang = lang;

  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key in t) el.textContent = t[key];
  });

  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key in t) el.placeholder = t[key];
  });

  root.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria-label');
    if (key in t) el.setAttribute('aria-label', t[key]);
  });

  const titleEl = root.querySelector('[data-i18n-title]');
  if (titleEl) {
    const key = titleEl.getAttribute('data-i18n-title');
    if (key in t) document.title = t[key];
  }
}

/**
 * One-call setup: detect language, apply strings, wire toggle button.
 * Returns the active language string.
 */
export function initLang(toggleBtnId = 'lang-toggle') {
  const lang = getLang();
  applyLang(lang);

  const btn = document.getElementById(toggleBtnId);
  if (btn) {
    btn.addEventListener('click', () => {
      const next = getLang() === 'en' ? 'es' : 'en';
      setLang(next);
      applyLang(next);
    });
  }

  return lang;
}
