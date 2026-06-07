# Journal

## 2026-06-07

**User:** Examine this project. I believe it currently estimates walking distance as an estimate of straightline distance divided by 20 minutes. Confirm that. Then I want to change that and use the open streetmaps directions api instead. Then, we want to replace transit time with driving time and use the same api for that estimate as well.

**Assistant:** Confirmed: walking time was computed as haversine (straight-line) distance ÷ 3.0 mph (≈ 20 min/mile). Transit was 60% of walk time. No routing API was used.

Changed:
- `js/data.js`: Removed `computeTravelTimes`. Added `fetchTableTimes` (OSRM table endpoint — one request for many centers) and `fetchSingleRouteTimes` (OSRM route endpoint — for the detail page). Both use `router.project-osrm.org` with `foot` profile for walking and `driving` for car. `sortByDistance` now attaches haversine-based `driveMin` instead of `transitMin` as an initial fallback.
- `js/copy.js`: Renamed `minTransit`/`transit` → `minDrive`/`drive` in EN ("min drive" / "Drive") and ES ("min en auto" / "Auto").
- `center.html`: Updated stat label to `data-i18n="minDrive"`, element id to `stat-drive`. Now shows "—" on load and fills in asynchronously when OSRM responds.
- `home.html`: Awaits `fetchTableTimes` for top 3 centers before rendering the hero card, so displayed times are always real route times.
- `list.html`: Renders with haversine fallback immediately, then re-renders walk times when `fetchTableTimes` completes for all centers.

## 2026-06-07 (continued)

**User:** Replace the stay cool square logo (the one to the left of "Stay cool chicago" in the title bar and the one used for the favicon) with a snowflake icon.

**Assistant:** Replaced the square thermometer-style logo with a geometric 6-arm snowflake SVG across all pages, and added an SVG favicon.

- Replaced inline SVG in all 6 pages that show the brand-mark header (`index.html`, `center.html`, `home.html`, `list.html`, `search.html`, `about.html`). `index.html` uses `width="28"`, others use `width="22"`.
- New snowflake: 6 arms drawn using SVG `transform="rotate(N 12 12)"` — one arm pointing right with two sets of angled branches, rotated 60° for each of the 6 arms. viewBox changed from `0 0 28 28` to `0 0 24 24` to match the new geometry.
- Created `/assets/icons/favicon.svg` — same snowflake design on navy (#0a2a55) background with rounded corners.
- Added `<link rel="icon" type="image/svg+xml" href="/assets/icons/favicon.svg">` to all 7 HTML pages (including `map.html`). The PNG favicon stays as a fallback for browsers that don't support SVG favicons (and Apple touch icon unchanged).

## 2026-06-07 (continued)

**User:** Rearrange files so public files are in a /public folder, non-public files above it. Domain will point at /public.

**Assistant:** Reorganized into a proper public/private split using `git mv`:

**Moved to `public/`** (web root): all HTML pages, `admin.php`, `api/`, `assets/`, `css/`, `js/`, `sw.js`, `manifest.json`, `.htaccess`, `data/amenities.json`, `data/centers-fallback.json` (service worker pre-caches this).

**Stays above web root**: `.admin-credentials`, `cache/` (PHP read/write), `data/analytics.json` (PHP read/write), `plans/`, `JOURNAL.md`.

**PHP path updates** (depth shifted by one `..`):
- `public/admin.php`: `.admin-credentials` → `/../.admin-credentials`
- `public/api/advisory.php`: `/../cache/` → `/../../cache/`
- `public/api/analytics.php`: `/../data/analytics.json` → `/../../data/analytics.json`
- `public/api/centers.php`: `/../cache/` → `/../../cache/` (fallback path unchanged since `centers-fallback.json` also moved into `public/data/`)

No HTML or JS changes needed — all browser paths are web-root-relative and work unchanged.

To run locally, serve from `public/`: `php -S localhost:8080 -t public`

## 2026-05-20

**User:** On the center screen there is a section for "what's available" (amenities). I don't have an outside source for amenities so let's remove that section (for now. Leave the scaffolding, just remove it from the display)

**Assistant:** Added `hidden` attribute to the `.detail-amenities` div in `center.html` (line 93). All scaffolding — the container div, `amenities-content` div, `renderAmenities` function, `AMENITY_SVG` map, `AMENITY_KEYS`, and supporting JS — remains intact for when a data source is available.
