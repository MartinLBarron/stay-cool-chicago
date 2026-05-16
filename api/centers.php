<?php
date_default_timezone_set('America/Chicago');
header('Content-Type: application/json; charset=utf-8');

$cacheFile    = __DIR__ . '/../cache/centers.json';
$fallbackFile = __DIR__ . '/../data/centers-fallback.json';
$cacheTTL     = 300; // 5 minutes

// ?day=N lets the dev panel override the day-of-week (0=Sun … 6=Sat).
// When a day override is present, skip cache entirely so the result isn't
// written over the real cached response.
$devDay = isset($_GET['day']) ? (int)$_GET['day'] : -1;
$useDevDay = ($devDay >= 0 && $devDay <= 6);
$dow = $useDevDay ? $devDay : (int)date('w');

// Serve cache if fresh (only when NOT using a day override)
if (!$useDevDay && file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTTL) {
    echo file_get_contents($cacheFile);
    exit;
}

// Fetch from City of Chicago Data Portal
$apiUrl = 'https://data.cityofchicago.org/resource/msrk-w9ih.json?$limit=300';
$ctx = stream_context_create([
    'http' => [
        'timeout' => 8,
        'header'  => "User-Agent: StayCoolChicago/1.0 (staycoolchicago.org)\r\n",
    ],
    'ssl' => ['verify_peer' => true],
]);

$raw = @file_get_contents($apiUrl, false, $ctx);

if ($raw === false || !($records = json_decode($raw, true))) {
    echo file_get_contents($fallbackFile);
    exit;
}

$normalized = [];
foreach ($records as $r) {
    // City API returns GeoJSON: location.coordinates = [lng, lat]
    $coords = $r['location']['coordinates'] ?? null;
    $lat = $coords ? (float)$coords[1] : null;
    $lng = $coords ? (float)$coords[0] : null;

    // Also accept flat latitude/longitude fields if present
    if (!$lat && isset($r['latitude']))  $lat = (float)$r['latitude'];
    if (!$lng && isset($r['longitude'])) $lng = (float)$r['longitude'];

    if (!$lat || !$lng) continue;

    $name = trim($r['site_name'] ?? '');
    if (!$name) continue;

    $rawHours   = $r['hours_of_operation'] ?? '';
    $hoursToday = parseTodayHours($rawHours, $dow);

    $normalized[] = [
        'id'           => slugify($name),
        'name'         => $name,
        'type'         => $r['site_type'] ?? 'Community center',
        'address'      => buildAddress($r),
        'phone'        => $r['phone'] ?? '',
        'hoursToday'   => $hoursToday,
        'hoursRaw'     => $rawHours,  // keep raw for debugging
        'lat'          => $lat,
        'lng'          => $lng,
    ];
}

if (empty($normalized)) {
    echo file_get_contents($fallbackFile);
    exit;
}

$json = json_encode($normalized, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
// Only write to cache for real (non-dev) responses
if (!$useDevDay) @file_put_contents($cacheFile, $json);
echo $json;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildAddress(array $r): string {
    $street = trim($r['address'] ?? '');
    $city   = trim($r['city']   ?? 'Chicago');
    $state  = trim($r['state']  ?? 'IL');
    $zip    = trim($r['zip']    ?? $r['zip_code'] ?? '');
    $parts  = array_filter([$street, $city, $state . ($zip ? ' ' . $zip : '')]);
    return implode(', ', $parts);
}

function slugify(string $str): string {
    $str = strtolower($str);
    $str = preg_replace('/[^a-z0-9]+/', '-', $str);
    return trim($str, '-');
}

/**
 * Parse today's open hours from a weekly schedule string.
 *
 * Handles the two real formats found in the City dataset:
 *
 *   Format A (space-separated):
 *     "M-F 8am-8pm; Sat 9am-3pm; Closed Sun"
 *
 *   Format B (colon-separated, comma day-list):
 *     "M, W: 10AM-6PM;  TU, TH: 12PM-8PM; F, SA: 9AM-5PM; SU: 1PM-5PM"
 *
 * Returns a normalised "H AM – H PM" string, "Closed", or "" if unparseable.
 */
function parseTodayHours(string $raw, int $dow): string {
    if (!$raw) return '';

    // Expanded day-name → dow map, covering both formats
    $dayMap = [
        'su' => 0, 'sun' => 0, 'sunday'    => 0,
        'm'  => 1, 'mo'  => 1, 'mon' => 1,  'monday'    => 1,
        'tu' => 2, 'tue' => 2, 'tues' => 2, 'tuesday'   => 2,
        'w'  => 3, 'we'  => 3, 'wed' => 3,  'wednesday' => 3,
        'th' => 4, 'thu' => 4, 'thur' => 4, 'thursday'  => 4,
        'f'  => 5, 'fr'  => 5, 'fri' => 5,  'friday'    => 5,
        'sa' => 6, 'sat' => 6,              'saturday'  => 6,
    ];

    // Split on semicolons; fall back to commas for "M-W 9AM-5PM, Th-F 9AM-8PM" style strings
    if (strpos($raw, ';') !== false) {
        $segments = preg_split('/\s*;\s*/', $raw);
    } else {
        $segments = preg_split('/\s*,\s*/', $raw);
    }

    foreach ($segments as $seg) {
        $seg = trim($seg);
        if (!$seg) continue;

        // Normalise "and" / "&" between day names so parseDaySpec sees a uniform comma list
        $seg = preg_replace('/\s*&\s*/', ',', $seg);
        $seg = preg_replace('/\s+and\s+/i', ',', $seg);

        // "Daily …"
        if (preg_match('/^daily\s*[:\-]?\s*(.+)/i', $seg, $m)) {
            return normaliseHours($m[1]);
        }

        // "Closed [days]" at start — e.g. "Closed Sun"
        if (preg_match('/^closed\s+(.*)/i', $seg, $m)) {
            $days = parseDaySpec(trim($m[1]), $dayMap);
            if (in_array($dow, $days, true)) return 'Closed';
            continue;
        }

        // "[days] Closed" at end — e.g. "Sat,Sun Closed"
        if (preg_match('/^(.+?)\s+Closed\s*$/i', $seg, $m)) {
            $days = parseDaySpec(trim($m[1]), $dayMap);
            if (in_array($dow, $days, true)) return 'Closed';
            continue;
        }

        // Format B: "DAYSPEC: TIMERANGE"  e.g. "M, W: 10AM-6PM" or "M-F: 8:30 a.m. to 4:30 p.m."
        if (preg_match('/^([A-Za-z][A-Za-z,\s\-]*?):\s*(\d.+)/i', $seg, $m)) {
            $days = parseDaySpec(trim($m[1]), $dayMap);
            if (in_array($dow, $days, true)) {
                return normaliseHours($m[2]);
            }
            continue;
        }

        // Format A: "DAYSPEC TIMERANGE"  e.g. "M-F 8am-8pm" or "Sat,Sun 9AM-2PM"
        if (preg_match('/^([A-Za-z][A-Za-z,\s\-]*?)\s+(\d.+)/i', $seg, $m)) {
            $days = parseDaySpec(trim($m[1]), $dayMap);
            if (in_array($dow, $days, true)) {
                return normaliseHours($m[2]);
            }
        }
    }

    return '';
}

/**
 * Parse a day specification into an array of dow ints.
 *
 * Handles:
 *   "M, W"    → [1, 3]      (comma-separated list)
 *   "M-F"     → [1,2,3,4,5] (range)
 *   "SA"      → [6]          (single)
 */
function parseDaySpec(string $spec, array $dayMap): array {
    $spec = trim($spec);

    // Comma-separated list: "M, W" / "TU, TH" / "M, W, F"
    if (strpos($spec, ',') !== false) {
        $days = [];
        foreach (preg_split('/[\s,]+/', $spec) as $part) {
            $part = trim($part);
            if (!$part) continue;
            $key = strtolower($part);
            if (isset($dayMap[$key])) $days[] = $dayMap[$key];
        }
        return $days;
    }

    // Range: "M-F" / "Mon-Fri" / "M-Sun" (wrap-around handled)
    if (preg_match('/^([A-Za-z]+)-([A-Za-z]+)$/', $spec, $m)) {
        $start = $dayMap[strtolower($m[1])] ?? null;
        $end   = $dayMap[strtolower($m[2])] ?? null;
        if ($start !== null && $end !== null) {
            // Wrap-around: "Sat-Sun" (6→0) or "M-Sun" (1→0)
            if ($start <= $end) return range($start, $end);
            return array_merge(range($start, 6), range(0, $end));
        }
    }

    // Single day
    $key = strtolower($spec);
    if (isset($dayMap[$key])) return [$dayMap[$key]];

    return [];
}

/**
 * Normalise a raw time-range string like "8am-8pm" → "8 AM – 8 PM".
 */
function normaliseHours(string $raw): string {
    $raw = trim($raw);
    // Strip holiday notes after the time range — handles both "; Holiday…" and ": Holiday…"
    $raw = preg_replace('/\s*[;:]\s*(holiday|closed).*/i', '', $raw);
    // Normalise "a.m."/"p.m." dots so formatTime can match
    $raw = preg_replace('/\ba\.m\./i', 'am', $raw);
    $raw = preg_replace('/\bp\.m\./i', 'pm', $raw);
    $raw = trim($raw);

    // Already a clean range like "9 AM – 8 PM"
    if (preg_match('/^\d/', $raw) === 0) return $raw;

    // Separate open and close times (hyphen, en-dash, or "to")
    $parts = preg_split('/\s*[–\-]\s*|\s+to\s+/i', $raw, 2);
    if (count($parts) < 2) return $raw;

    $open  = formatTime($parts[0]);
    $close = formatTime($parts[1]);
    if (!$open || !$close) return $raw;

    return "$open – $close";
}

/**
 * Format a time like "8am", "8:30am", "8:00 AM" → "8 AM" / "8:30 AM".
 */
function formatTime(string $t): string {
    $t = trim($t);
    if (!preg_match('/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i', $t, $m)) return '';

    $h      = (int)$m[1];
    $min    = isset($m[2]) ? (int)$m[2] : 0;
    $period = strtoupper($m[3] ?? '');

    if (!$period) $period = ($h >= 8 && $h < 12) ? 'AM' : 'PM'; // reasonable guess

    $minStr = $min ? ':' . str_pad($min, 2, '0', STR_PAD_LEFT) : '';
    return "{$h}{$minStr} {$period}";
}
