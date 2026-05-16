// Developer testing panel — include on every page during development.
// This is a plain (non-module) script so it runs synchronously and can set
// window.__advisoryOverride and window.__timeOverride before ES modules load.
//
// Remove <script> tags referencing this file before production launch.

(function () {
  'use strict';

  var LS = '__devPanel';
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var LOCS = {
    downtown:  { lat: 41.8781, lng: -87.6298, label: 'Downtown' },
    northside: { lat: 41.9650, lng: -87.6500, label: 'North Side' },
    southside: { lat: 41.7500, lng: -87.6200, label: 'South Side' },
    westside:  { lat: 41.8800, lng: -87.7500, label: 'West Side' },
  };

  var ADV_DEFAULTS = {
    none:      { highF: 95,  feelsLikeF: 102 },
    advisory:  { highF: 95,  feelsLikeF: 102 },
    warning:   { highF: 100, feelsLikeF: 108 },
    emergency: { highF: 105, feelsLikeF: 115 },
  };

  // ── State ─────────────────────────────────────────────────────────────────

  var defaults = {
    advisory:    'none',
    highF:       95,
    feelsLikeF:  102,
    timeEnabled: false,
    dow:         new Date().getDay(),
    hour:        14,
    min:         0,
    location:    'real',
    panelOpen:   false,
  };

  var s;
  try { s = Object.assign({}, defaults, JSON.parse(localStorage.getItem(LS) || '{}')); }
  catch (e) { s = Object.assign({}, defaults); }

  // ── Apply overrides synchronously (before ES modules run) ─────────────────

  if (s.advisory !== 'none') {
    var expires = new Date(Date.now() + 12 * 3600000).toISOString();
    window.__advisoryOverride = {
      active: true, level: s.advisory,
      highF: s.highF, feelsLikeF: s.feelsLikeF, expires: expires,
    };
  }

  if (s.timeEnabled) {
    var d = new Date();
    var delta = s.dow - d.getDay();
    if (delta < 0) delta += 7;
    d.setDate(d.getDate() + delta);
    d.setHours(s.hour, s.min, 0, 0);
    window.__timeOverride = d.toISOString();
  }

  if (s.location !== 'real') {
    if (s.location === 'clear') {
      sessionStorage.removeItem('userLat');
      sessionStorage.removeItem('userLng');
      sessionStorage.removeItem('userLabel');
    } else if (LOCS[s.location]) {
      var loc = LOCS[s.location];
      sessionStorage.setItem('userLat',   loc.lat);
      sessionStorage.setItem('userLng',   loc.lng);
      sessionStorage.setItem('userLabel', loc.label);
    }
  }

  // ── Build panel UI after DOM is ready ─────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {

    // Styles — scoped to #__dp so they don't bleed into the app
    var css = document.createElement('style');
    css.textContent = [
      '#__dp-toggle{background:#1a1a2e;color:#e0e0ff;border:none;padding:5px 9px;',
        'font:700 11px/1 monospace;letter-spacing:.06em;cursor:pointer;',
        'border-radius:4px;min-height:36px;vertical-align:middle}',
      '#__dp-toggle:hover{background:#2a2a5e}',
      '#__dp{position:fixed;top:0;right:0;z-index:99999;width:268px;',
        'max-height:100dvh;overflow-y:auto;',
        'background:#1a1a2e;color:#e0e0ff;font:12px/1.4 monospace;',
        'border:1px solid #3a3a6e;border-radius:6px;overflow:hidden;',
        'box-shadow:0 4px 24px rgba(0,0,0,.5)}',
      '#__dp header{background:#0f0f20;padding:8px 12px;font-size:11px;',
        'font-weight:700;letter-spacing:.1em;color:#8888cc;text-transform:uppercase}',
      '#__dp section{padding:10px 12px;border-top:1px solid #2a2a4e}',
      '#__dp .lbl{font-size:10px;font-weight:700;letter-spacing:.08em;',
        'color:#8888cc;text-transform:uppercase;margin-bottom:6px}',
      '#__dp .row{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px}',
      '#__dp button.chip{background:#2a2a4e;color:#c0c0ff;border:1px solid #3a3a6e;',
        'padding:4px 8px;font:700 10px monospace;cursor:pointer;border-radius:3px;',
        'transition:background .1s}',
      '#__dp button.chip.on{background:#4a4aee;color:#fff;border-color:#6a6aff}',
      '#__dp button.chip:hover{background:#3a3a6e}',
      '#__dp button.chip.on:hover{background:#5a5aff}',
      '#__dp .num{width:48px;background:#0f0f20;color:#e0e0ff;border:1px solid #3a3a6e;',
        'padding:3px 6px;font:12px monospace;text-align:right}',
      '#__dp select{background:#0f0f20;color:#e0e0ff;border:1px solid #3a3a6e;',
        'padding:3px 4px;font:11px monospace}',
      '#__dp input[type=time]{background:#0f0f20;color:#e0e0ff;border:1px solid #3a3a6e;',
        'padding:3px 4px;font:11px monospace}',
      '#__dp label.chk{display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11px}',
      '#__dp .warn{color:#ffcc44;font-size:10px;margin-top:4px;line-height:1.4}',
      '#__dp .actions{display:flex;gap:6px;padding:10px 12px;border-top:1px solid #2a2a4e}',
      '#__dp .btn-apply{flex:1;background:#2255cc;color:#fff;border:none;',
        'padding:7px;font:700 11px monospace;cursor:pointer;border-radius:3px}',
      '#__dp .btn-apply:hover{background:#3366dd}',
      '#__dp .btn-reset{background:#2a2a4e;color:#c0c0ff;border:1px solid #3a3a6e;',
        'padding:7px 10px;font:700 11px monospace;cursor:pointer;border-radius:3px}',
      '#__dp .btn-reset:hover{background:#3a3a6e}',
    ].join('');
    document.head.appendChild(css);

    // Toggle button — place it right after the lang-toggle in the header
    var toggle = document.createElement('button');
    toggle.id = '__dp-toggle';
    toggle.textContent = 'DEV';
    var langBtn = document.getElementById('lang-toggle');
    if (langBtn && langBtn.parentNode) {
      langBtn.parentNode.insertBefore(toggle, langBtn.nextSibling);
    } else {
      // Fallback: fixed top-right if no header found
      toggle.style.cssText = 'position:fixed;top:12px;right:12px;z-index:99999;';
      document.body.appendChild(toggle);
    }

    // Panel — fixed overlay dropping from top-right
    var panel = document.createElement('div');
    panel.id = '__dp';
    panel.style.display = s.panelOpen ? 'block' : 'none';
    panel.innerHTML = buildHTML();
    document.body.appendChild(panel);

    wireUp(panel);

    toggle.addEventListener('click', function () {
      var open = panel.style.display === 'none';
      panel.style.display = open ? 'block' : 'none';
      s.panelOpen = open;
      save();
    });
  });

  // ── HTML template ──────────────────────────────────────────────────────────

  function buildHTML() {
    var advLevels   = ['none', 'advisory', 'warning', 'emergency'];
    var advLabels   = ['Off season', 'Advisory', 'Warning', 'Emergency'];
    var locKeys     = ['real', 'downtown', 'northside', 'southside', 'westside', 'clear'];
    var locLabels   = ['Real geo', 'Downtown', 'North Side', 'South Side', 'West Side', 'Clear'];

    function chips(keys, labels, current, ns) {
      return keys.map(function (k, i) {
        return '<button class="chip' + (k === current ? ' on' : '') + '" data-ns="' + ns + '" data-val="' + k + '">' + labels[i] + '</button>';
      }).join('');
    }

    var timeHHMM = pad(s.hour) + ':' + pad(s.min);

    var dayOpts = DAYS.map(function (d, i) {
      return '<option value="' + i + '"' + (i === s.dow ? ' selected' : '') + '>' + d + '</option>';
    }).join('');

    var advActive = s.advisory !== 'none';

    return [
      '<header>Dev Panel</header>',

      // Advisory
      '<section>',
        '<div class="lbl">Advisory</div>',
        '<div class="row">', chips(advLevels, advLabels, s.advisory, 'advisory'), '</div>',
        '<div class="row" id="__dp-temps" style="', advActive ? '' : 'display:none', 'align-items:center;gap:6px">',
          '<span style="font-size:10px;color:#8888cc;">Temp</span>',
          '<input class="num" id="__dp-highF" type="number" min="85" max="120" value="', s.highF, '">',
          '<span style="font-size:10px;color:#8888cc;">Feels</span>',
          '<input class="num" id="__dp-feelsLikeF" type="number" min="85" max="130" value="', s.feelsLikeF, '">',
          '<span style="font-size:10px;color:#8888cc;">°F</span>',
        '</div>',
      '</section>',

      // Time
      '<section>',
        '<div class="lbl">Day &amp; Time</div>',
        '<label class="chk">',
          '<input type="checkbox" id="__dp-timeEnabled"', s.timeEnabled ? ' checked' : '', '>',
          'Override time',
        '</label>',
        '<div id="__dp-timepick" style="margin-top:6px;display:flex;gap:6px;align-items:center;', s.timeEnabled ? '' : 'opacity:.4;pointer-events:none;', '">',
          '<select id="__dp-dow">', dayOpts, '</select>',
          '<input type="time" id="__dp-time" value="', timeHHMM, '">',
        '</div>',
        '<div class="warn" id="__dp-timewarn" style="', s.timeEnabled ? '' : 'display:none', '">',
          'hoursToday reflects this day\'s schedule from the API.',
        '</div>',
      '</section>',

      // Location
      '<section>',
        '<div class="lbl">Location</div>',
        '<div class="row">', chips(locKeys, locLabels, s.location, 'location'), '</div>',
        '<div class="warn" id="__dp-locwarn" style="', s.location === 'clear' ? '' : 'display:none', '">',
          'No location — app will redirect to Search.',
        '</div>',
      '</section>',

      // Actions
      '<div class="actions">',
        '<button class="btn-apply" id="__dp-apply">⟳ Apply &amp; Reload</button>',
        '<button class="btn-reset" id="__dp-reset">Reset</button>',
      '</div>',
    ].join('');
  }

  // ── Wire controls ──────────────────────────────────────────────────────────

  function wireUp(panel) {
    // Chip buttons
    panel.addEventListener('click', function (e) {
      var btn = e.target.closest('button.chip');
      if (!btn) return;
      var ns  = btn.dataset.ns;
      var val = btn.dataset.val;

      // Deselect siblings
      panel.querySelectorAll('button.chip[data-ns="' + ns + '"]').forEach(function (b) {
        b.classList.remove('on');
      });
      btn.classList.add('on');
      s[ns] = val;

      if (ns === 'advisory') {
        var active = val !== 'none';
        panel.querySelector('#__dp-temps').style.display = active ? '' : 'none';
        // Auto-fill sensible defaults when switching level
        if (active && ADV_DEFAULTS[val]) {
          s.highF = ADV_DEFAULTS[val].highF;
          s.feelsLikeF = ADV_DEFAULTS[val].feelsLikeF;
          panel.querySelector('#__dp-highF').value = s.highF;
          panel.querySelector('#__dp-feelsLikeF').value = s.feelsLikeF;
        }
      }
      if (ns === 'location') {
        panel.querySelector('#__dp-locwarn').style.display = val === 'clear' ? '' : 'none';
      }
      save();
    });

    // Temp inputs
    panel.querySelector('#__dp-highF').addEventListener('input', function () {
      s.highF = parseInt(this.value, 10) || 95;
      save();
    });
    panel.querySelector('#__dp-feelsLikeF').addEventListener('input', function () {
      s.feelsLikeF = parseInt(this.value, 10) || 102;
      save();
    });

    // Time checkbox
    panel.querySelector('#__dp-timeEnabled').addEventListener('change', function () {
      s.timeEnabled = this.checked;
      var pick = panel.querySelector('#__dp-timepick');
      var warn = panel.querySelector('#__dp-timewarn');
      pick.style.opacity = this.checked ? '1' : '.4';
      pick.style.pointerEvents = this.checked ? '' : 'none';
      warn.style.display = this.checked ? '' : 'none';
      save();
    });

    // Day select
    panel.querySelector('#__dp-dow').addEventListener('change', function () {
      s.dow = parseInt(this.value, 10);
      save();
    });

    // Time input
    panel.querySelector('#__dp-time').addEventListener('change', function () {
      var parts = this.value.split(':');
      s.hour = parseInt(parts[0], 10) || 0;
      s.min  = parseInt(parts[1], 10) || 0;
      save();
    });

    // Apply & Reload
    panel.querySelector('#__dp-apply').addEventListener('click', function () {
      save();
      window.location.reload();
    });

    // Reset
    panel.querySelector('#__dp-reset').addEventListener('click', function () {
      localStorage.removeItem(LS);
      window.__advisoryOverride = undefined;
      window.__timeOverride = undefined;
      window.location.reload();
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function save() { localStorage.setItem(LS, JSON.stringify(s)); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

})();
