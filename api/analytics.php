<?php
date_default_timezone_set('America/Chicago');
header('Content-Type: application/json');
header('Cache-Control: no-store');

define('DATA_FILE', __DIR__ . '/../data/analytics.json');
define('MAX_DAYS',  90);

$method = $_SERVER['REQUEST_METHOD'];

// ── POST: record a page view ──────────────────────────────────────────────────
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    $page = preg_replace('/[^a-z0-9_-]/', '', strtolower($body['page'] ?? ''));
    if (!$page) { echo json_encode(['ok' => false]); exit; }

    $date = date('Y-m-d');
    $data = load();

    $data[$date][$page] = ($data[$date][$page] ?? 0) + 1;

    // Unique visitor: hash IP with date so raw IP is never stored,
    // and the same person on different days doesn't link across days.
    $vh = substr(hash('sha256', $date . ($_SERVER['REMOTE_ADDR'] ?? '')), 0, 16);
    if (!in_array($vh, $data[$date]['_visitors'] ?? [], true)) {
        $data[$date]['_visitors'][] = $vh;
    }

    if ($page === 'center' && !empty($body['centerId'])) {
        $cid = substr(preg_replace('/[^a-zA-Z0-9_-]/', '', $body['centerId']), 0, 64);
        $data[$date]['_centers'][$cid] = ($data[$date]['_centers'][$cid] ?? 0) + 1;
        if (!empty($body['centerName'])) {
            $data['_names'][$cid] = substr($body['centerName'], 0, 80);
        }
    }

    save($data);
    echo json_encode(['ok' => true]);
    exit;
}

// ── GET: return stats ─────────────────────────────────────────────────────────
if ($method === 'GET') {
    echo json_encode(load());
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'method not allowed']);

// ── Helpers ───────────────────────────────────────────────────────────────────
function load() {
    if (!file_exists(DATA_FILE)) return [];
    $d = json_decode(file_get_contents(DATA_FILE), true);
    return is_array($d) ? $d : [];
}

function save(array $data) {
    krsort($data);
    $days  = array_filter(array_keys($data), fn($k) => preg_match('/^\d{4}-\d{2}-\d{2}$/', $k));
    foreach (array_slice(array_values($days), MAX_DAYS) as $old) unset($data[$old]);
    file_put_contents(DATA_FILE, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
}
