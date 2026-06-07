// Advisory banner — shared across all pages.
// Call initAdvisory(lang, copy) once per page load.

import { fetchAdvisory } from './data.js';

const WARN_ICON = `<svg width="24" height="24" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
  <path d="M8 1 L1 14 H15 Z" fill="currentColor"/>
  <rect x="7.2" y="5.5" width="1.6" height="4" style="fill:var(--advisory-icon-inner)"/>
  <circle cx="8" cy="11.5" r="0.95" style="fill:var(--advisory-icon-inner)"/>
</svg>`;

/**
 * Fetch advisory and render into #advisory-container.
 * Returns the advisory object so callers can branch on severity.
 */
export async function initAdvisory(lang, copy) {
  let advisory;
  try {
    advisory = await fetchAdvisory();
  } catch {
    advisory = { active: false, level: 'none' };
  }
  renderAdvisory(advisory, lang, copy);
  return advisory;
}

export function renderAdvisory(advisory, lang, copy) {
  const container = document.getElementById('advisory-container');
  if (!container) return;

  if (!advisory?.active || advisory.level === 'none') {
    container.hidden = true;
    container.innerHTML = '';
    return;
  }

  const t = copy[lang] || copy.en;

  const labelMap = {
    advisory:  t.advisoryLabel,
    warning:   t.warningLabel,
    emergency: t.emergencyLabel,
  };
  const label    = labelMap[advisory.level] || t.advisoryLabel;
  const liveMode = advisory.level === 'emergency' ? 'assertive' : 'polite';

  // Build the secondary detail line (temp · feels-like · through expiry)
  const detailParts = [];
  if (advisory.highF)      detailParts.push(`${advisory.highF}°F`);
  if (advisory.feelsLikeF) detailParts.push(`${t.feelsLike} ${advisory.feelsLikeF}°F`);
  const expiryStr = formatExpiry(advisory.expires);
  if (expiryStr)           detailParts.push(`${t.through} ${expiryStr}`);
  const detail = detailParts.join(' · ');

  let html;

  if (advisory.level === 'emergency') {
    // Full-width yellow takeover block
    html = `
      <div class="advisory-banner" data-level="emergency"
           role="alert" aria-live="assertive" aria-atomic="true">
        <span class="advisory-icon" aria-hidden="true">${WARN_ICON}</span>
        <div class="advisory-body">
          <div class="advisory-label">${escHtml(label.toUpperCase())}</div>
          ${advisory.highF
            ? `<div class="advisory-temp">${advisory.highF}°F</div>`
            : ''}
          ${detail
            ? `<div class="advisory-detail">${escHtml(detail)}</div>`
            : ''}
        </div>
      </div>`;
  } else {
    // Advisory / warning strip
    html = `
      <div class="advisory-banner" data-level="${advisory.level}"
           role="alert" aria-live="${liveMode}" aria-atomic="true">
        <span class="advisory-icon" aria-hidden="true">${WARN_ICON}</span>
        <div class="advisory-body">
          <div class="advisory-label">${escHtml(label.toUpperCase())}</div>
          ${detail
            ? `<div class="advisory-detail">${escHtml(detail)}</div>`
            : ''}
        </div>
      </div>`;
  }

  container.innerHTML = html;
  container.hidden = false;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatExpiry(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const h  = d.getHours();
  const m  = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  const time = m === 0
    ? `${h12} ${ap}`
    : `${h12}:${String(m).padStart(2, '0')} ${ap}`;
  return `${DAYS[d.getDay()]} ${time}`;
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
