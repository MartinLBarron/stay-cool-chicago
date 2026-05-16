<?php
header('Content-Type: application/json; charset=utf-8');

$cacheFile = __DIR__ . '/../cache/advisory.json';
$cacheTTL  = 600; // 10 minutes

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTTL) {
    echo file_get_contents($cacheFile);
    exit;
}

// NWS requires a descriptive User-Agent or returns 403
$ctx = stream_context_create([
    'http' => [
        'timeout' => 8,
        'header'  => "User-Agent: StayCoolChicago/1.0 (staycoolchicago.org)\r\nAccept: application/geo+json\r\n",
    ],
    'ssl' => ['verify_peer' => true],
]);

$url = 'https://api.weather.gov/alerts/active?area=IL';
$raw = @file_get_contents($url, false, $ctx);

$result = [
    'active'     => false,
    'level'      => 'none',
    'headline'   => '',
    'expires'    => null,
    'highF'      => null,
    'feelsLikeF' => null,
];

if ($raw !== false && ($data = json_decode($raw, true))) {
    $heatEvents = [
        'Excessive Heat Warning' => 'emergency',
        'Excessive Heat Watch'   => 'warning',
        'Heat Advisory'          => 'advisory',
    ];
    $severityRank = ['advisory' => 1, 'warning' => 2, 'emergency' => 3];

    $bestRank  = 0;
    $bestAlert = null;
    $bestLevel = 'none';

    foreach ($data['features'] ?? [] as $feature) {
        $props    = $feature['properties'] ?? [];
        $event    = $props['event'] ?? '';
        $areaDesc = $props['areaDesc'] ?? '';

        if (!isset($heatEvents[$event])) continue;

        // Limit to Cook County / Chicago metro
        if (stripos($areaDesc, 'Cook') === false && stripos($areaDesc, 'Chicago') === false) continue;

        $level = $heatEvents[$event];
        $rank  = $severityRank[$level];

        if ($rank > $bestRank) {
            $bestRank  = $rank;
            $bestLevel = $level;
            $bestAlert = $props;
        }
    }

    if ($bestAlert) {
        $result['active']   = true;
        $result['level']    = $bestLevel;
        $result['headline'] = $bestAlert['headline'] ?? $bestAlert['event'] ?? '';
        $result['expires']  = $bestAlert['expires']  ?? null;

        // Best-effort temperature extraction from description text
        $desc = $bestAlert['description'] ?? '';
        if (preg_match('/highs?\s+(?:near|around|up to)?\s*(\d{2,3})/i', $desc, $m)) {
            $result['highF'] = (int) $m[1];
        }
        if (preg_match('/feels?\s+like\s+(?:up\s+to\s+)?(\d{2,3})/i', $desc, $m)) {
            $result['feelsLikeF'] = (int) $m[1];
        }
    }
}

$json = json_encode($result, JSON_PRETTY_PRINT);
@file_put_contents($cacheFile, $json);
echo $json;
