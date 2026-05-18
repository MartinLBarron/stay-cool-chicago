// SVG icon paths keyed by exact center type string from the City API.
// Icons sourced from Lucide (lucide.dev), viewBox 0 0 24 24.
// Usage: typeIcon('Library')  → full <svg> string, safe to set as innerHTML.

const PATHS = {
  // book-open
  'Library': `
    <path d="M12 7v14"/>
    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>`,

  // droplets
  'Park District Spray Feature': `
    <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
    <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>`,

  // house
  'Park District Facility': `
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`,

  // shield
  'Police District': `
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>`,

  // building (grid of windows) — Regional = larger primary facility
  'Regional Senior Center': `
    <path d="M12 10h.01"/>
    <path d="M12 14h.01"/>
    <path d="M12 6h.01"/>
    <path d="M16 10h.01"/>
    <path d="M16 14h.01"/>
    <path d="M16 6h.01"/>
    <path d="M8 10h.01"/>
    <path d="M8 14h.01"/>
    <path d="M8 6h.01"/>
    <path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>
    <rect x="4" y="2" width="16" height="20" rx="2"/>`,

  // building-2 (lower-rise with wing) — Satellite = smaller outpost
  'Satellite Senior Center': `
    <path d="M10 12h4"/>
    <path d="M10 8h4"/>
    <path d="M14 21v-3a2 2 0 0 0-4 0v3"/>
    <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/>
    <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>`,

  // graduation-cap
  'Chicago Community College': `
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
    <path d="M22 10v6"/>
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>`,

  // heart-handshake
  'Community Service Center': `
    <path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"/>`,
};

const FALLBACK = `<rect x="3" y="3" width="18" height="18" rx="2"/>`;

const COLORS = {
  'Library':                    '#1d4ed8', // blue
  'Park District Spray Feature':'#0891b2', // cyan
  'Park District Facility':     '#15803d', // green
  'Police District':            '#1e3a8a', // dark indigo
  'Regional Senior Center':     '#7c3aed', // violet
  'Satellite Senior Center':    '#be185d', // rose
  'Chicago Community College':  '#b45309', // amber
  'Community Service Center':   '#dc2626', // red
};

export function typeColor(type) {
  return COLORS[type] ?? '#0a2a55';
}

export function typeIcon(type, size = 36) {
  const paths = PATHS[type] ?? FALLBACK;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true" focusable="false">${paths}</svg>`;
}
