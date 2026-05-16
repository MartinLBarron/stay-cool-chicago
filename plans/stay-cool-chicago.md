# Plan: Stay Cool Chicago

> Source PRD: PRD.md · staycoolchicago.org · Launch June 1, 2026

## Architectural decisions

Decisions that apply across all phases:

- **Routes:** `/` (Welcome → Home post-geolocation), `/map`, `/search`, `/center?id=[center-id]`
- **PHP endpoints:** `GET /api/centers.php` (5-min cache), `GET /api/advisory.php` (10-min cache)
- **Data fallback:** `/data/centers-fallback.json` used when City API is unreachable
- **Supplemental data:** `/data/amenities.json` keyed by center ID, SFTP-maintained
- **Center model:** `{ id, name, type, address, phone, lat, lng, hoursToday, open, walkMin, transitMin }`
- **Advisory model:** `{ active, level: "none"|"advisory"|"warning"|"emergency", headline, highF, feelsLikeF, expires }`
- **i18n:** Single `/js/copy.js` file with `en`/`es` key objects; language in `localStorage`
- **User location:** Held in memory (not persisted); passed between pages via `sessionStorage` as `{ lat, lng, label }`
- **No build step:** All JS is plain ES modules loaded with `<script type="module">`; no bundler

---

## Phase 1: Data plumbing

**Delivers:** The two PHP proxy endpoints and all JS data-fetching logic are working and verifiable in the browser. Every later phase consumes these without changes.

### What to build

Wire up the complete data layer end-to-end:

- `api/centers.php` — fetches `https://data.cityofchicago.org/resource/msrk-w9ih.json`, caches the response to a temp file for 5 minutes, returns a normalized JSON array. On any failure, reads and returns `data/centers-fallback.json` instead.
- `api/advisory.php` — fetches `https://api.weather.gov/alerts/active?area=IL`, filters to Cook County and the three heat-event types, maps to the advisory model, caches 10 minutes.
- `data/centers-fallback.json` — a real snapshot of Chicago cooling center data with enough records to develop against (aim for 10–15 real centers with lat/lng).
- `data/amenities.json` — skeleton file with 2–3 entries showing the full shape (`wheelchair`, `pets`, `wifi`, `water`, `restrooms`, `seating`, `notes`).
- `js/copy.js` — complete EN/ES string tables covering all copy from the PRD.
- `js/data.js` — exports `fetchCenters()` and `fetchAdvisory()` that call the PHP endpoints.
- `css/main.css` — design tokens only: Chicago Blue palette as CSS custom properties, base typography (Public Sans via Google Fonts), reset, mobile-first container.
- A minimal `index.html` that imports the JS modules and logs the fetched centers + advisory object to the console, confirming the pipeline works.

### Acceptance criteria

- [ ] `GET /api/centers.php` returns a JSON array with at least name, address, lat, lng, phone, hoursToday per center
- [ ] `GET /api/advisory.php` returns the advisory model shape with correct `level` value
- [ ] Pulling `api/centers.php` twice within 5 minutes does not trigger a second upstream request (cache works)
- [ ] Removing internet access (or pointing to a bad URL) causes `centers.php` to return `centers-fallback.json` contents without error
- [ ] `fetchCenters()` and `fetchAdvisory()` resolve correctly in the browser console on `index.html`
- [ ] CSS custom properties for palette and typography are present in `main.css` and applied to `<body>`

---

## Phase 2: Welcome screen + geolocation flow

**Delivers:** A fully styled, navigable Welcome screen. A user can land on the site, see an advisory banner if one is active, and tap either primary action to begin finding a center. Navigation targets are stubs — they just need to exist.

### What to build

- `index.html` — Welcome screen UI in full Chicago Blue civic style:
  - Advisory strip (reads live from `fetchAdvisory()`; hidden when `level = "none"`)
  - App name / logo mark
  - Hero headline + subhead
  - "Find nearest cooling center" primary button — triggers `navigator.geolocation.getCurrentPosition()`, then navigates to `/home?lat=…&lng=…` on success or `/search` on denial/error
  - "See all on the map" secondary button → `/map`
  - "Need a ride? Call 311" tertiary link → `tel:311`
  - Footer attribution
- `home.html` — stub page that reads `lat`/`lng` from the query string, saves to `sessionStorage`, and shows "Loading nearest center…" (replaced in Phase 3)
- `map.html` — stub page (replaced in Phase 4)
- `search.html` — stub page (replaced in Phase 5)
- Language toggle in the header — reads `localStorage`, swaps all strings via `copy.js`, persists selection
- Browser `Accept-Language` detection sets default language on first visit

### Acceptance criteria

- [ ] Advisory strip appears in the correct severity color when `advisory.active = true`; absent when `level = "none"`
- [ ] "Find nearest center" triggers the browser geolocation prompt
- [ ] Successful geolocation navigates to `/home?lat=…&lng=…` and `sessionStorage` contains the coordinates
- [ ] Denied/errored geolocation navigates to `/search`
- [ ] "See all on the map" navigates to `/map`
- [ ] "Call 311" link is `tel:311`
- [ ] Language toggle switches all visible strings between EN and ES; preference persists on page reload
- [ ] Spanish `Accept-Language` browser header defaults the page to ES on first visit
- [ ] Page is readable at 200% browser text zoom with no horizontal overflow

---

## Phase 3: Home screen (nearest center)

**Delivers:** The core user journey is complete. A user with location can see the nearest open center, its walk and transit times, and get directions. This is the most-used screen for the primary audience.

### What to build

Replace `home.html` stub with the full Home screen:

- Reads `lat`/`lng` from `sessionStorage` (falls back to query params)
- Calls `fetchCenters()`, sorts by straight-line distance to user coords, filters to open centers
- Walk time computed from distance (assume 20 min/mile walking pace)
- Transit time: use value from center data if present, otherwise estimate as `walkMin * 0.6` rounded
- Hero card for the nearest open center:
  - "Open now" chip with green dot + closing time
  - Name, type, address
  - Walk / transit time 2-column grid
  - "Get Directions" button — platform-detects iOS vs Android vs desktop, builds correct deep-link URL
  - "Call" button (`tel:` link)
  - "Share" button (Web Share API with `navigator.share()` fallback to clipboard copy)
- "Others nearby" list — next 2 closest open centers as compact tappable rows; tap → `/center?id=…`
- "See all centers" button → `/map`
- Advisory banner (same component as Welcome, reused from a shared partial)
- "No centers open right now" empty state with 311 call button
- "Check on a neighbor" care footer
- `js/directions.js` — platform detection + deep-link builder

### Acceptance criteria

- [ ] Centers sorted by distance; nearest open center is the hero card
- [ ] Walk time and transit time shown correctly for the hero center
- [ ] "Get directions" opens Google Maps on Android, Apple Maps on iOS, shows both links on desktop
- [ ] "Call" button triggers phone dialer with center's number
- [ ] "Share" invokes native share sheet on mobile; copies URL to clipboard on desktop
- [ ] "Others nearby" shows exactly 2 additional open centers; tapping navigates to center detail stub
- [ ] If all centers are closed, empty state with 311 link is shown instead of the hero card
- [ ] Advisory banner reflects current severity from `fetchAdvisory()`

---

## Phase 4: Map screen

**Delivers:** Users can visually browse all centers across the city, tap pins to learn more, and get directions from the map — completing the "See all on the map" flow from the Welcome screen.

### What to build

Replace `map.html` stub with the full Map screen:

- Full-viewport Leaflet map with OSM tile layer
- On load: fetch centers, plot a custom pin marker per center
  - Open centers: filled navy circle with center number
  - Closed centers: gray outlined circle
- Auto-fit map bounds to contain all open centers on load
- If `sessionStorage` has user coords: show pulsing "You are here" circle; center map on user
- Top chrome bar (fixed): back button → Welcome, title "Cooling centers", count of open centers
- Advisory band overlay (when active) — same shared component
- "Locate me" button (bottom-right): re-requests geolocation, pans map to user
- Bottom sheet (fixed, bottom): shows compact card for the nearest/selected center
  - Walk time, center name, type, closing time
  - "Get Directions" button
  - Tap card body → `/center?id=…`
- Tapping a pin: updates bottom sheet to that center's data

### Acceptance criteria

- [ ] All centers from `fetchCenters()` appear as pins at correct lat/lng
- [ ] Open and closed centers are visually distinct (color + label)
- [ ] Map auto-zooms to fit all open centers on load
- [ ] User location dot shown and map panned to it when coords are available
- [ ] Tapping a pin updates the bottom sheet without page reload
- [ ] "Get Directions" in bottom sheet generates correct deep link for selected center
- [ ] "Locate me" button re-fires geolocation and pans to result
- [ ] Advisory band shows/hides based on live advisory data

---

## Phase 5: Search screen + Center detail

**Delivers:** The two remaining screens that complete every navigation path. Users without GPS can find centers, and any user can drill into a center's full details before making the trip.

### What to build

**Search screen** — replace `search.html` stub:

- Back button → Welcome
- "Where are you?" heading + subhead
- Text input with search icon — on submit, geocode via Nominatim (`https://nominatim.openstreetmap.org/search`) and navigate to `/home?lat=…&lng=…` with result coords
- "Use my location" button — re-triggers geolocation flow → `/home?lat=…&lng=…`
- Neighborhood grid (2 columns, 8 neighborhoods with hardcoded lat/lng centroids) — tap → `/home?lat=…&lng=…`
- "Skip and browse the map" link → `/map`

**Center detail screen** — `center.html`:

- Reads `id` from query param; fetches all centers, finds match by ID
- Center name (large), facility type badge
- Address — tappable, opens in maps app via deep link
- Hours today in human-readable format ("9 AM – 8 PM")
- Status chip: "Open now" / "Opens at [time]" / "Closed today" — computed from current time vs. hours string
- Walk and transit times from `sessionStorage` coords (if available)
- "Get Directions" primary button
- "Call Center" secondary button
- Amenities section: loads `/data/amenities.json`, matches by center ID
  - If match found: render amenity chips (wheelchair, pets, Wi-Fi, water, restrooms, seating)
  - If no match: show "Call center to confirm available amenities" with phone link
- "Not right for you? See other centers nearby" link → `/home` (preserving location)
- Back button → previous page (`history.back()`)

### Acceptance criteria

- [ ] Nominatim text search with a Chicago street or ZIP code returns a valid lat/lng and navigates to Home screen for that location
- [ ] Each neighborhood tile navigates to Home screen sorted around that neighborhood's centroid
- [ ] "Use my location" on Search re-triggers geolocation and navigates to Home on success
- [ ] Center detail loads correct center data by `?id=` param
- [ ] Status chip correctly shows "Open now", "Opens at", or "Closed" based on current time
- [ ] Amenity chips render when `amenities.json` has an entry for this center; fallback message shown otherwise
- [ ] Address tap opens in platform maps app
- [ ] "Get Directions" deep link uses center's lat/lng
- [ ] "See other centers" returns to Home preserving user location

---

## Phase 6: Advisory severity states + off-season

**Delivers:** The app correctly handles the full range of advisory conditions — including the most urgent emergency state — and degrades gracefully when there is no active advisory.

### What to build

Extend the shared advisory banner component across all screens:

- **`level = "none"`:** No advisory strip rendered on any screen
- **`level = "advisory"`:** Red (`#b9281b`) strip, white text, triangle warning icon, headline + temperature + feels-like + expiry. `aria-live="polite"` on the container.
- **`level = "warning"`:** Same as advisory, plus CSS `animation: pulse` on the icon (subtle opacity oscillation)
- **`level = "emergency"`:** Full-width block (not a strip) replacing the top of the page: yellow `#ffd700` background, black text, bold "EXTREME HEAT EMERGENCY" label, large temperature, expiry. `aria-live="assertive"` on the container.

No new page — these are states of the existing banner component, parameterized by `advisory.level`.

Also:

- Off-season state: with `level = "none"`, Welcome screen headline softens to "Find a cool place near you." (no urgency framing); centers still shown normally
- "Skip to main content" anchor link at the very top of every page pointing to `#main`; all `<main>` elements have `id="main"`

### Acceptance criteria

- [ ] With `level = "none"`: no advisory UI appears on any screen
- [ ] With `level = "advisory"`: red strip with triangle icon, headline, temperature, and expiry appears on all screens
- [ ] With `level = "warning"`: red strip + pulsing icon animation
- [ ] With `level = "emergency"`: yellow takeover block, black text, "EXTREME HEAT EMERGENCY", `aria-live="assertive"`
- [ ] Advisory container has correct `aria-live` value per severity level
- [ ] "Skip to main content" link is the first focusable element on every page; pressing Tab from page load focuses it; activating it moves focus to `#main`
- [ ] Off-season Welcome headline uses non-urgent copy when `level = "none"`
- [ ] Advisory severity can be tested by temporarily overriding `fetchAdvisory()` return value in the console

---

## Phase 7: PWA, accessibility audit, and deploy

**Delivers:** A production-ready, installable app deployed to staycoolchicago.org. Every screen passes a basic accessibility check. The app loads on slow connections and survives brief offline periods.

### What to build

**PWA:**

- `manifest.json`: `name`, `short_name`, `start_url`, `display: "standalone"`, `theme_color: "#0a2a55"`, `background_color: "#eaf1f8"`, icons at 192×192 and 512×512
- `sw.js`: cache-first for app shell (HTML, CSS, JS, manifest, icons, Public Sans font files); network-first with stale-while-revalidate fallback for `api/` calls; stale-while-revalidate for OSM map tiles
- `<link rel="manifest">` and `<meta name="theme-color">` in all HTML files

**Accessibility audit pass (fix any failures):**

- All interactive elements: verify `aria-label` or visible text label
- All SVG icons: `aria-hidden="true"` if decorative, or `role="img" aria-label="…"` if meaningful
- Color contrast: spot-check advisory states, open/closed chips, muted text against backgrounds
- Touch targets: verify ≥ 44×44px on all buttons and links in mobile viewport
- Tab order: walk through each screen with keyboard only
- Text zoom: verify 200% browser zoom produces no horizontal scroll on any screen

**Deploy:**

- Remove design prototype files from repo root (`design-canvas.jsx`, `dir-*.jsx`, `ios-frame.jsx`, `tweaks-panel.jsx`, and prototype `index.html`)
- Add `<meta>` tags: `description`, `og:title`, `og:description`, `og:image` (placeholder)
- Add favicon (32×32 civic mark in navy)
- SFTP all files to IONOS; confirm PHP endpoints respond correctly on the live domain
- Smoke test all five screens on a real mobile device over cellular

### Acceptance criteria

- [ ] `manifest.json` valid; Chrome DevTools Application panel shows "Installable"
- [ ] Service worker registers and caches the app shell on first load
- [ ] Second load with network throttled to "Slow 3G" shows the page in under 5 seconds
- [ ] With network fully offline: app shell loads; last-cached center data is shown; map tiles show cached tiles or graceful placeholder
- [ ] All five screens pass browser accessibility tree inspection with no critical errors
- [ ] Tab-only navigation reaches all interactive elements on every screen in logical order
- [ ] 200% browser text zoom: no horizontal scroll, no text clipped or overflowing on any screen
- [ ] All five screens load correctly at staycoolchicago.org over HTTPS
- [ ] Design prototype files are absent from the deployed site
- [ ] "Get directions" deep link works correctly on a real iPhone and a real Android device
