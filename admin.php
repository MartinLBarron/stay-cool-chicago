<?php
// ── Session auth ──────────────────────────────────────────────────────────────
// Credentials live in .admin-credentials (gitignored, deploy via SFTP).
// Generate with (single outer quotes prevent bash from expanding ! in passwords):
//   php -r 'echo password_hash("yourpassword", PASSWORD_DEFAULT) . PHP_EOL;' > .admin-credentials
session_start();

if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: /admin.php');
    exit;
}

$cfg = __DIR__ . '/.admin-credentials';
if (!file_exists($cfg)) {
    http_response_code(503);
    exit('Admin not configured. Visit admin-setup.php first.');
}
$parts = explode(':', trim(file_get_contents($cfg)), 2);
$_hash = trim(end($parts)); // last segment = the bcrypt hash

$loginErr = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    if (password_verify($_POST['password'], $_hash)) {
        $_SESSION['admin_authed'] = true;
        session_write_close();
        header('Location: /admin.php');
        exit;
    }
    $loginErr = 'Incorrect password.';
}

if (empty($_SESSION['admin_authed'])) {
    ?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Admin Login — Stay Cool Chicago</title>
  <link rel="stylesheet" href="css/main.css">
  <style>
    .login-wrap { max-width:360px; margin:80px auto; padding:0 var(--page-pad); }
    .login-wrap h1 { font-size:1.25rem; font-weight:800; margin-bottom:24px; }
    .login-wrap label { display:block; font-size:0.8125rem; font-weight:700;
                        text-transform:uppercase; letter-spacing:.06em;
                        color:var(--color-ink-mute); margin-bottom:5px; }
    .login-wrap input { display:block; width:100%; padding:12px; margin-bottom:16px;
                        border:1.5px solid var(--color-hair); font-size:1rem;
                        font-family:inherit; box-sizing:border-box; }
    .login-wrap input:focus { outline:3px solid var(--color-ink); outline-offset:2px; }
    .login-err { color:#b9281b; font-size:0.875rem; font-weight:700; margin-bottom:16px; }
  </style>
</head>
<body>
  <div class="login-wrap">
    <h1>Stay Cool Chicago — Admin</h1>
    <?php if ($loginErr): ?>
      <p class="login-err"><?= htmlspecialchars($loginErr) ?></p>
    <?php endif; ?>
    <form method="post">
      <label for="p">Password</label>
      <input id="p" type="password" name="password" autocomplete="current-password" required autofocus>
      <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;">
        Sign in
      </button>
    </form>
  </div>
</body>
</html><?php
    exit;
}
// ── End Auth ──────────────────────────────────────────────────────────────────
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin — Stay Cool Chicago</title>
  <meta name="robots" content="noindex, nofollow" />
  <link rel="stylesheet" href="css/main.css" />
  <style>
    .admin-header {
      padding: 16px var(--page-pad);
      border-bottom: 1px solid var(--color-hair);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .admin-title {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--color-ink-mute);
    }

    .section {
      padding: 28px var(--page-pad) 0;
    }
    .section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-ink-mute);
      margin-bottom: 14px;
    }

    /* Summary cards */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
    }
    .summary-card {
      background: var(--color-paper);
      border: 1.5px solid var(--color-hair);
      padding: 16px;
    }
    .summary-card .value {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1;
      color: var(--color-ink);
    }
    .summary-card .label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-ink-mute);
      margin-top: 6px;
    }

    /* Stats table */
    .stats-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .stats-table th {
      text-align: left;
      padding: 8px 10px;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--color-ink-mute);
      border-bottom: 1.5px solid var(--color-hair);
    }
    .stats-table td {
      padding: 10px 10px;
      border-bottom: 1px solid var(--color-hair);
      color: var(--color-ink);
    }
    .stats-table tr:last-child td { border-bottom: none; }
    .stats-table td:not(:first-child) {
      text-align: right;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .stats-table th:not(:first-child) { text-align: right; }

    /* Bar */
    .bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .bar-label { font-size: 0.875rem; color: var(--color-ink); min-width: 140px; flex-shrink: 0; }
    .bar-track { flex: 1; height: 8px; background: var(--color-hair); }
    .bar-fill  { height: 100%; background: var(--color-ink); }
    .bar-count { font-size: 0.875rem; font-weight: 700; min-width: 36px; text-align: right; }

    .empty { color: var(--color-ink-mute); font-size: 0.9375rem; padding: 24px 0; }
  </style>
</head>
<body>

  <div class="page" style="max-width:860px;margin:0 auto;">

    <div class="admin-header">
      <a class="brand-mark" href="index.html" aria-label="Stay Cool Chicago — home">
        <svg width="20" height="20" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
          <rect x="2" y="2" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="14" cy="14" r="5" fill="none" stroke="currentColor" stroke-width="2"/>
          <line x1="14" y1="4"  x2="14" y2="7"  stroke="currentColor" stroke-width="2" stroke-linecap="square"/>
          <line x1="14" y1="21" x2="14" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="square"/>
          <line x1="4"  y1="14" x2="7"  y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="square"/>
          <line x1="21" y1="14" x2="24" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="square"/>
        </svg>
        <span class="brand-name">Stay Cool Chicago</span>
      </a>
      <span class="admin-title">Admin</span>
      <a href="admin.php?logout=1"
         style="font-size:0.75rem;font-weight:700;color:var(--color-ink-mute);text-decoration:none;">
        Sign out
      </a>
    </div>

    <main id="main" style="padding-bottom:60px;">

      <div id="loading" style="padding:48px var(--page-pad);text-align:center;color:var(--color-ink-mute);">
        Loading analytics…
      </div>

      <div id="dashboard" hidden>

        <!-- Summary -->
        <div class="section">
          <div class="section-title">Overview</div>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="value" id="total-7"></div>
              <div class="label">Views, last 7 days</div>
            </div>
            <div class="summary-card">
              <div class="value" id="uniq-7"></div>
              <div class="label">Unique visitors, last 7 days</div>
            </div>
            <div class="summary-card">
              <div class="value" id="total-30"></div>
              <div class="label">Views, last 30 days</div>
            </div>
            <div class="summary-card">
              <div class="value" id="uniq-30"></div>
              <div class="label">Unique visitors, last 30 days</div>
            </div>
            <div class="summary-card">
              <div class="value" id="total-all"></div>
              <div class="label">Views, all time</div>
            </div>
            <div class="summary-card">
              <div class="value" id="days-active"></div>
              <div class="label">Days with activity</div>
            </div>
          </div>
        </div>

        <!-- Page breakdown -->
        <div class="section" style="margin-top:32px;">
          <div class="section-title">Page views — last 7 days</div>
          <div id="page-bars"></div>
        </div>

        <!-- Top centers -->
        <div class="section" style="margin-top:32px;">
          <div class="section-title">Top centers — last 7 days</div>
          <div id="top-centers"></div>
        </div>

        <!-- Daily table -->
        <div class="section" style="margin-top:32px;">
          <div class="section-title">Daily breakdown — last 14 days</div>
          <div style="overflow-x:auto;">
            <table class="stats-table" id="daily-table"></table>
          </div>
        </div>

      </div><!-- /#dashboard -->

    </main>
  </div>

  <script>
    const PAGE_LABELS = {
      index:  'Welcome',
      home:   'Nearest center',
      search: 'Search',
      map:    'Map',
      list:   'All centers',
      center: 'Center detail',
      about:  'About',
    };
    const PAGE_KEYS = Object.keys(PAGE_LABELS);

    fetch('/api/analytics.php')
      .then(r => r.json())
      .then(render)
      .catch(() => {
        document.getElementById('loading').textContent = 'Could not load analytics.';
      });

    function render(data) {
      document.getElementById('loading').hidden    = true;
      document.getElementById('dashboard').hidden  = false;

      const names     = data['_names'] || {};
      const dayKeys   = Object.keys(data)
        .filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k))
        .sort()
        .reverse(); // newest first

      const last7  = dayKeys.slice(0, 7);
      const last30 = dayKeys.slice(0, 30);

      function sumPages(days) {
        return days.reduce((n, d) => {
          return n + PAGE_KEYS.reduce((s, p) => s + (data[d]?.[p] || 0), 0);
        }, 0);
      }

      // Unique visitors: sum daily uniques (same IP on different days counts separately)
      function sumUnique(days) {
        return days.reduce((n, d) => n + (data[d]?.['_visitors']?.length || 0), 0);
      }

      // Summary cards
      document.getElementById('total-7').textContent     = fmt(sumPages(last7));
      document.getElementById('uniq-7').textContent      = fmt(sumUnique(last7));
      document.getElementById('total-30').textContent    = fmt(sumPages(last30));
      document.getElementById('uniq-30').textContent     = fmt(sumUnique(last30));
      document.getElementById('total-all').textContent   = fmt(sumPages(dayKeys));
      document.getElementById('days-active').textContent = dayKeys.length;

      // Page bars (last 7 days)
      const pageTotals = {};
      PAGE_KEYS.forEach(p => {
        pageTotals[p] = last7.reduce((n, d) => n + (data[d]?.[p] || 0), 0);
      });
      const maxPage = Math.max(1, ...Object.values(pageTotals));
      const barsEl  = document.getElementById('page-bars');
      barsEl.innerHTML = PAGE_KEYS
        .sort((a, b) => pageTotals[b] - pageTotals[a])
        .map(p => `
          <div class="bar-row">
            <div class="bar-label">${PAGE_LABELS[p]}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${Math.round(pageTotals[p] / maxPage * 100)}%"></div>
            </div>
            <div class="bar-count">${fmt(pageTotals[p])}</div>
          </div>`).join('');

      // Top centers (last 7 days)
      const centerTotals = {};
      last7.forEach(d => {
        Object.entries(data[d]?.['_centers'] || {}).forEach(([id, n]) => {
          centerTotals[id] = (centerTotals[id] || 0) + n;
        });
      });
      const topCenters = Object.entries(centerTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      const centersEl = document.getElementById('top-centers');
      if (!topCenters.length) {
        centersEl.innerHTML = '<div class="empty">No center detail views yet.</div>';
      } else {
        const maxC = Math.max(1, topCenters[0][1]);
        centersEl.innerHTML = topCenters.map(([id, n]) => `
          <div class="bar-row">
            <div class="bar-label" style="min-width:200px;">${esc(names[id] || id)}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${Math.round(n / maxC * 100)}%"></div>
            </div>
            <div class="bar-count">${fmt(n)}</div>
          </div>`).join('');
      }

      // Daily table (last 14 days)
      const last14  = dayKeys.slice(0, 14).reverse(); // oldest → newest for table
      const tableEl = document.getElementById('daily-table');
      if (!last14.length) {
        tableEl.innerHTML = '<tr><td class="empty">No data yet.</td></tr>';
      } else {
        const cols = PAGE_KEYS.filter(p => last14.some(d => data[d]?.[p]));
        tableEl.innerHTML = `
          <thead>
            <tr>
              <th>Date</th>
              <th>Views</th>
              <th>Unique</th>
              ${cols.map(p => `<th>${PAGE_LABELS[p]}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${last14.reverse().map(d => { // newest first in table
              const row    = data[d] || {};
              const total  = PAGE_KEYS.reduce((n, p) => n + (row[p] || 0), 0);
              const unique = row['_visitors']?.length || 0;
              return `<tr>
                <td>${d}</td>
                <td>${fmt(total)}</td>
                <td>${unique ? fmt(unique) : '–'}</td>
                ${cols.map(p => `<td>${row[p] ? fmt(row[p]) : '–'}</td>`).join('')}
              </tr>`;
            }).join('')}
          </tbody>`;
      }
    }

    function fmt(n) { return Number(n).toLocaleString(); }
    function esc(s) {
      return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
  </script>

</body>
</html>
