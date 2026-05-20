# PRD: Stay Cool Chicago
**staycoolchicago.org** · v1.0 · Owner: Martin Barron · Target launch: June 1, 2026

---

## 1. Problem Statement

During Chicago heat emergencies, vulnerable residents — elderly, unhoused, and low-income populations — need to quickly find a free, air-conditioned place to rest. Existing city resources (311, city website) are not optimized for mobile, are hard to navigate under cognitive stress, and do not integrate real-time directions or transit information. People may not know cooling centers exist, or may not be able to reach one without help.

**Stay Cool Chicago** is a mobile-first, accessibility-focused web app that surfaces the nearest open cooling center in as few taps as possible, provides clear directions (walking or transit), and communicates urgency when a heat advisory is active.

---

## 2. Target Users

**Primary:** Vulnerable Chicago residents during heat events
- Elderly individuals, especially those living alone without AC
- Unhoused individuals seeking shelter from extreme heat
- Low-income residents without reliable AC

**Secondary:**
- Neighbors and community workers helping others find centers
- People with limited English (Spanish speakers in v1)

**User context:** Mobile phone, possibly slow connection, possibly first time using the site, under heat stress. Optimize for speed, large text, and minimal cognitive load.

---

## 3. Design Direction

**Visual style:** Civic Service — Chicago Blue palette
- Background: `#eaf1f8` (cool paper)
- Ink: `#0a2a55` (navy)
- Advisory accent: `#b9281b` (red)
- Font: Public Sans (system fallback: -apple-system, Helvetica Neue)

**Tone:** Warm, reassuring, community-care. Clear without being clinical.

**Layout:** Mobile-first, single column. All interactive elements ≥ 44×44px. Body text ≥ 16px. No color-only status communication.

---

## 4. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Vanilla HTML / CSS / JavaScript | No framework needed; simpler to maintain solo; static-friendly |
| Backend | PHP (thin proxy) | IONOS shared hosting constraint; minimal backend needed |
| Maps | Leaflet.js + OpenStreetMap | No API key, no billing risk, unlimited tile requests |
| Hosting | IONOS shared hosting | Existing account; static files + PHP CGI |
| Domain | staycoolchicago.org | |
| PWA | Web App Manifest + Service Worker | Installable, fast on 3G, cache-first shell |
| Analytics | Plausible (or none) | Privacy-conscious, no cookie banner; decision deferred |

**Architecture:** Static HTML/CSS/JS served directly. PHP used only for two thin proxy endpoints that handle CORS and short-term caching of external API responses. No database. No build toolchain required.

---

## 5. Data Architecture

### 5.1 Cooling Centers
- **Primary:** Chicago Data Portal REST API — dataset `msrk-w9ih`
  - Endpoint: `https://data.cityofchicago.org/resource/msrk-w9ih.json`
  - Fields used: name, address, phone, hours, latitude, longitude, facility type
  - PHP proxy caches response for 5 minutes to reduce external calls
- **Fallback:** `/data/centers-fallback.json` — static snapshot updated at start of each heat season; used when API is unreachable
- **Supplemental amenities:** `/data/amenities.json` — manually maintained by owner, keyed by center ID/name
  - Fields: `wheelchair`, `pets`, `wifi`, `water`, `restrooms`, `seating`, `notes`
  - Updated via SFTP; rendered when present, omitted gracefully when absent

### 5.2 Heat Advisory
- **Source:** NWS CAP Alerts API
  - Endpoint: `https://api.weather.gov/alerts/active?area=IL`
  - Filtered to Cook County (`FIPS6:017031`) and event types: `Excessive Heat Warning`, `Heat Advisory`, `Excessive Heat Watch`
  - PHP proxy caches for 10 minutes
- **Severity mapping:**
  - `Heat Advisory` → level `advisory`
  - `Excessive Heat Watch` → level `warning`
  - `Excessive Heat Warning` → level `emergency`
  - No matching alert → level `none`

### 5.3 PHP Proxy Endpoints

```
GET /api/centers.php
  → Fetches City Data Portal, caches 5 min, returns JSON array of centers
  → On failure: returns contents of centers-fallback.json

GET /api/advisory.php
  → Fetches NWS alerts for Cook County, caches 10 min
  → Returns: { active: bool, level: "none"|"advisory"|"warning"|"emergency",
               headline: string, expires: ISO8601 string,
               highF: int, feelsLikeF: int }
```

---

## 6. Screen Inventory

### Screen 1: Welcome
**URL:** `/` (index page, shown on first load or when location is unknown)

**Purpose:** Fast entry point. Two primary actions, one tertiary.

**Elements:**
- Heat advisory strip (shown when `advisory.active = true`): severity-colored, shows temperature + "feels like" + expiry
- App name: "Stay Cool Chicago" / "Chicago Fresco" (ES)
- Headline: "Free places to cool down, near you."
- Subhead: "Free, air-conditioned places to rest and hydrate — open across Chicago."
- **Primary CTA:** "Find nearest cooling center" (full-width, filled button) — requests geolocation; if granted, goes to Home screen; if denied, goes to Search screen
- **Secondary CTA:** "See all on the map" (full-width, outlined button) — goes to Map screen
- **Tertiary:** "Need a ride? Call 311" (text link with phone icon) — `tel:311` deep link
- Footer: "A neighbor-built service · City of Chicago data"

**Acceptance criteria:**
- Primary CTA triggers browser geolocation prompt
- If geolocation succeeds → navigate to Home screen with nearest center pre-loaded
- If geolocation fails/denied → navigate to Search screen
- "See all on the map" always goes directly to Map screen
- "Call 311" initiates phone call on mobile
- Advisory strip absent when `level = "none"`

---

### Screen 2: Search
**URL:** `/search` (or state within SPA)

**Purpose:** Location entry when geolocation is unavailable or denied.

**Elements:**
- Back button (returns to Welcome)
- Heading: "Where are you?"
- Subhead: "Type a street, ZIP, or pick a neighborhood."
- Text input: "Street, ZIP code, or landmark" (geocodes via Nominatim OSM API)
- "Use my location" button — re-attempts geolocation
- Neighborhood grid (2 columns, 8 neighborhoods): Pilsen, Little Village, Englewood, Austin, Humboldt Park, Uptown, South Shore, Hyde Park
- "Skip and browse the map" (text link)

**Acceptance criteria:**
- Selecting a neighborhood centers the map on that area and goes to Home/list filtered to nearby centers
- Text search geocodes via Nominatim, then shows Home screen for that location
- "Use my location" re-triggers geolocation flow
- "Skip" goes to Map with no location selected

---

### Screen 3: Home (Nearest Center)
**URL:** `/` (post-location state)

**Purpose:** Show the single most important piece of information: the closest open center.

**Elements:**
- Heat advisory banner (full-width, severity-colored)
- Location label: "Near [neighborhood name]"
- Heading: "Find a cool place."
- Subhead: "A safe, free place to rest indoors."
- **Hero card** (nearest open center):
  - "Open now" chip with green dot + closing time
  - Center name (large, bold)
  - Facility type + address
  - Walk time (minutes) + transit time (minutes) in 2-column grid
  - **"Get Directions" button** — deep links to Google Maps (Android) or Apple Maps (iOS) with destination pre-filled
  - "Call" button — `tel:` link to center phone
  - "Share" button — Web Share API, falls back to clipboard copy
- **"Others nearby" section:** 2–3 additional centers as compact rows (walk time, name, type, closing time, tap to go to detail)
- "See all centers" button → Map screen
- Care footer: "Check on a neighbor today. Especially if they live alone or don't have AC."
- Footer: "A neighbor-built service · City of Chicago data"

**Acceptance criteria:**
- Nearest center = closest center by walking distance where `open = true` at current time
- Walk/transit times computed from user location to center coordinates (straight-line distance formula for walk; transit time from center data or estimated from distance)
- "Get directions" deep link format:
  - Google Maps: `https://www.google.com/maps/dir/?api=1&destination=[lat],[lng]&travelmode=walking`
  - Apple Maps: `maps://maps.apple.com/?daddr=[lat],[lng]`
  - Detect platform via user agent; show appropriate link; show both as fallback on desktop
- If no centers are open at current time, show "No centers are open right now" message with 311 call button

---

### Screen 4: Map
**URL:** `/map`

**Purpose:** Visual overview of all centers; spatial browsing.

**Elements:**
- Full-screen Leaflet map, OSM tiles
- Numbered pin markers for each center (open = filled navy, closed = outlined/gray)
- "You are here" dot (blue pulsing circle) at user location if available
- Top chrome bar: back button + "Cooling centers — N open now"
- Advisory band overlay (when active)
- "Locate me" button (bottom right)
- Bottom sheet: shows nearest center card (compact) with "Get directions" CTA; tap card to go to Center Detail

**Acceptance criteria:**
- Map initialized to user location (or Chicago city center if unknown)
- Auto-zoom to fit all open centers within viewport on load
- Tapping a pin selects that center in the bottom sheet
- Closed centers shown as gray/muted pins, not removed
- Bottom sheet is scrollable (multiple centers)

---

### Screen 5: Center Detail
**URL:** `/center/[id]`

**Purpose:** Full information for a specific center before committing to the trip.

**Elements:**
- Back button
- Center name (large)
- Facility type badge
- Address (tap to open in maps)
- Hours today (or "Closed today")
- "Open now" / "Opens at [time]" / "Closed" status chip
- Walk time + transit time from user location
- **"Get Directions" button** (primary, full-width)
- **"Call Center" button** (secondary)
- Amenities list (from supplemental JSON when available): wheelchair accessible, pets OK, Wi-Fi, free water, seating, restrooms — shown as icon + label chips; section omitted if no amenity data
- "Call to confirm details" note when amenity data is absent
- "Not right for you? See other centers nearby" → back to Home/list

**Acceptance criteria:**
- Amenity chips rendered from `/data/amenities.json` matched by center ID
- If no amenity entry exists for this center: show "Call center to confirm available amenities" with phone link instead
- Hours shown in human-readable format, e.g. "9 AM – 8 PM"
- Status chip computed from current time vs. hours

---

## 7. Advisory Severity UI States

| Level | Trigger | Visual |
|---|---|---|
| `none` | No NWS alert active | No advisory strip anywhere |
| `advisory` | Heat Advisory | Red (`#b9281b`) strip, white text, triangle icon, temperature shown |
| `warning` | Excessive Heat Watch | Red strip + pulsing animation on icon |
| `emergency` | Excessive Heat Warning | Full-width takeover block (not just strip), high-contrast yellow `#ffd700` background + black text, bold "EXTREME HEAT EMERGENCY" |

All severity levels include: headline, temperature, feels-like temperature, expiry time ("Through Friday 8 PM").

---

## 8. Internationalisation (EN/ES)

- Language toggle in page header (persistent, not buried in a menu)
- Default: English; detect browser `Accept-Language` for Spanish speakers, default to ES if `es` or `es-*` is primary
- Language selection stored in `localStorage`
- All UI strings maintained in a single `/js/copy.js` file with `en` and `es` keys — same structure as the design prototype's `COPY` object
- Center name, address, and phone are not translated (proper nouns)
- Facility type labels translated (e.g. "Public library" → "Biblioteca pública")
- Advisory copy translated
- Deep-link URLs are language-agnostic (destination coordinates do not change)

---

## 9. Accessibility Requirements

**Standard:** WCAG 2.1 Level AA minimum.

**Specifics for this audience:**
- Body text: ≥ 16px; headings ≥ 24px
- Touch targets: ≥ 44×44px for all interactive elements
- Color contrast: ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI components
- Do not rely on color alone to convey status (open/closed, advisory level) — always pair with text or icon
- Support browser text-size zoom to 200% without horizontal scroll on mobile
- All images and icons have meaningful `alt` text or `aria-label`
- Logical tab order; keyboard navigable
- Advisory banner announced via `aria-live="polite"` (or `assertive` for `emergency` level)
- "Skip to main content" link at top of page

---

## 10. PWA

- **Web App Manifest** (`/manifest.json`): name, short_name, icons (192px, 512px), theme color (`#0a2a55`), background color (`#eaf1f8`), display `standalone`, start URL `/`
- **Service Worker** (`/sw.js`): cache-first strategy for app shell (HTML, CSS, JS, fonts, manifest); network-first for API calls; stale-while-revalidate for map tiles
- **Install prompt:** Browser-native "Add to Home Screen" — no custom prompt in v1
- **Goal:** App loads and shows last-known data even on 3G or brief offline; does not hard-fail

---

## 11. Directions Deep Links

Platform detection via `navigator.userAgent`:

```js
function getDirectionsURL(lat, lng) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) return `maps://maps.apple.com/?daddr=${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}
```

Desktop fallback: show both "Open in Google Maps" and "Open in Apple Maps" as separate links.

---

## 12. 311 Integration

- Welcome screen tertiary action: "Need a ride? Call 311" → `tel:311`
- Home screen quick action: "Call for a ride · 311 · free if you can't walk" → `tel:311`
- Presented as a plain phone link; no additional integration needed

---

## 13. Analytics

Decision deferred. Options in priority order:
1. **Plausible Analytics** — privacy-first, no cookies, no GDPR banner, $9/mo, one `<script>` tag
2. **None** — acceptable for v1 if Plausible cost is a concern

If analytics enabled, track: pageviews, "Get directions" clicks, "Call 311" clicks, language toggle events. No PII collected.

---

## 14. Out of Scope (v1)

- In-app turn-by-turn routing (deferred; deep links cover the use case)
- Languages beyond EN/ES
- Real-time CTA bus arrival times
- Admin web interface for supplemental JSON (flat file + SFTP)
- User accounts or saved centers
- Push notifications ("heat advisory issued near you")
- Center capacity data (not available in city dataset)

---

## 15. File Structure

```
/
├── index.html              # Welcome screen (and SPA entry point)
├── map.html                # Map screen
├── search.html             # Search screen
├── center.html             # Center detail screen (populated by JS from query param)
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── css/
│   └── main.css            # All styles (Chicago Blue palette, mobile-first)
├── js/
│   ├── copy.js             # EN/ES string tables
│   ├── data.js             # API fetch + fallback logic
│   ├── advisory.js         # NWS advisory fetch + severity logic
│   ├── map.js              # Leaflet map init and pin rendering
│   ├── directions.js       # Platform detection + deep link builder
│   └── app.js              # Page routing, language toggle, geolocation flow
├── data/
│   ├── centers-fallback.json   # Static snapshot of city centers data
│   └── amenities.json          # Supplemental amenity data (manually maintained)
├── api/
│   ├── centers.php         # Proxy: Chicago Data Portal → cached JSON
│   └── advisory.php        # Proxy: NWS alerts → normalized advisory object
└── assets/
    ├── icons/              # PWA icons (192, 512px)
    └── fonts/              # Self-hosted Public Sans (optional, for offline)
```

---

## 16. Launch Milestones (June 1 Target)

| Week | Milestone |
|---|---|
| May 15–18 | PHP API proxies working (`centers.php`, `advisory.php`); `centers-fallback.json` populated; `amenities.json` skeleton created |
| May 19–22 | Welcome + Home screens built in HTML/CSS/JS; geolocation flow; EN/ES toggle |
| May 23–25 | Map screen (Leaflet + pins); Center Detail screen; deep-link directions |
| May 26–27 | Search screen; advisory severity states; off-season state |
| May 28–29 | PWA manifest + service worker; accessibility audit; mobile QA |
| May 30 | Final content review (copy, amenities JSON); staging on IONOS |
| May 31 | Go live at staycoolchicago.org |
