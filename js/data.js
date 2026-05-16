// Data-fetching layer.
// All other modules import from here — nothing calls the PHP endpoints directly.

const WALK_PACE_MPH = 3.0; // ~20 min/mile, conservative for elderly users
const MILES_PER_DEGREE_LAT = 69.0;

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchCenters() {
  const simTime = window.__timeOverride;
  const url = simTime
    ? `/api/centers.php?day=${new Date(simTime).getDay()}`
    : '/api/centers.php';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`centers API returned ${res.status}`);
  return res.json();
}

export async function fetchAdvisory() {
  if (window.__advisoryOverride) return window.__advisoryOverride;
  const res = await fetch('/api/advisory.php');
  if (!res.ok) throw new Error(`advisory API returned ${res.status}`);
  return res.json();
}

export async function fetchAmenities() {
  const res = await fetch('/data/amenities.json');
  if (!res.ok) return {};
  return res.json();
}

/**
 * Compute walk/transit times from a user location to a single center.
 * Returns null if either position is missing.
 */
export function computeTravelTimes(userLat, userLng, centerLat, centerLng) {
  if (!userLat || !userLng || !centerLat || !centerLng) return null;
  const distMi     = haversineMiles(userLat, userLng, centerLat, centerLng);
  const walkMin    = Math.round((distMi / WALK_PACE_MPH) * 60);
  const transitMin = Math.round(walkMin * 0.6);
  return { distMi, walkMin, transitMin };
}

/**
 * Sort centers by straight-line distance from userLat/userLng.
 * Attaches walkMin and transitMin to each center object.
 */
export function sortByDistance(centers, userLat, userLng) {
  return centers
    .filter(c => c.lat && c.lng)
    .map(c => {
      const distMi = haversineMiles(userLat, userLng, c.lat, c.lng);
      const walkMin = Math.round((distMi / WALK_PACE_MPH) * 60);
      // Transit is estimated as 60% of walk time (accounts for wait + speed)
      const transitMin = Math.round(walkMin * 0.6);
      return { ...c, distMi, walkMin, transitMin };
    })
    .sort((a, b) => a.distMi - b.distMi);
}

/**
 * Returns true if a center is currently open based on its hoursToday string.
 * Handles formats like "9 AM – 8 PM", "9:00 AM - 8:00 PM", "9 AM to 9 PM".
 * Defaults to true when the string cannot be parsed (don't hide centers silently).
 */
export function isOpenNow(hoursToday) {
  if (!hoursToday) return true;

  const now = window.__timeOverride ? new Date(window.__timeOverride) : new Date();
  const parsed = parseHoursRange(hoursToday);
  if (!parsed) return true;

  const { openH, openM, closeH, closeM } = parsed;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes  = openH  * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

/**
 * Returns a human-readable closing time string, e.g. "8 PM".
 */
export function closingTimeLabel(hoursToday) {
  if (!hoursToday) return '';
  const parsed = parseHoursRange(hoursToday);
  if (!parsed) return '';
  const { closeH, closeM } = parsed;
  const suffix = closeH >= 12 ? 'PM' : 'AM';
  const h = closeH > 12 ? closeH - 12 : (closeH === 0 ? 12 : closeH);
  return closeM === 0 ? `${h} ${suffix}` : `${h}:${String(closeM).padStart(2, '0')} ${suffix}`;
}

/**
 * Returns opening time label, e.g. "9 AM".
 */
export function openingTimeLabel(hoursToday) {
  if (!hoursToday) return '';
  const parsed = parseHoursRange(hoursToday);
  if (!parsed) return '';
  const { openH, openM } = parsed;
  const suffix = openH >= 12 ? 'PM' : 'AM';
  const h = openH > 12 ? openH - 12 : (openH === 0 ? 12 : openH);
  return openM === 0 ? `${h} ${suffix}` : `${h}:${String(openM).padStart(2, '0')} ${suffix}`;
}

// ── Internals ─────────────────────────────────────────────────────────────────

function haversineMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return (deg * Math.PI) / 180; }

function parseHoursRange(str) {
  // Normalize separators: en-dash, hyphen, "to"
  const normalized = str.replace(/[–—]/g, '-').replace(/\bto\b/i, '-');
  const parts = normalized.split('-');
  if (parts.length < 2) return null;

  const open  = parseTime(parts[0].trim());
  const close = parseTime(parts[1].trim());
  if (!open || !close) return null;

  return { openH: open.h, openM: open.m, closeH: close.h, closeM: close.m };
}

function parseTime(str) {
  // Matches "9 AM", "9:30 AM", "9:00AM", "21:00"
  const match = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2] ?? '0', 10);
  const period = (match[3] ?? '').toUpperCase();

  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;

  return { h, m };
}
