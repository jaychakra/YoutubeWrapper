// =========================================================
//  earlyJS — Runs BEFORE page content via
//  injectedJavaScriptBeforeContentLoaded.
//  Suppresses Shorts and junk UI instantly via CSS.
// =========================================================
const earlyJS = `
(function() {
  try {
    var css = [
      'ytm-reel-shelf-renderer',
      'ytd-reel-shelf-renderer',
      'yt-reel-shelf-view-model',
      'reel-shelf-view-model',
      'ytm-shorts-lockup-view-model',
      'ytm-shorts-lockup-view-model-v2',
      'ytm-reel-item-renderer',
      'ytd-reel-item-renderer',
      '[aria-label="Shorts"]',
      'a[href^="/shorts"]',
      'a[href*="/shorts/"]',
      '.pivot-shorts',
      'ytm-pivot-bar-item-renderer:has(a[href^="/shorts"])',
      'ytm-pivot-bar-item-renderer:has(a[href*="/shorts/"])',
      'ytm-pivot-bar-item-renderer:has(.pivot-shorts)',
      'ytm-pivot-bar-item-renderer:has(a[href="/"])',
      'ytm-pivot-bar-item-renderer:has(a[href="https://m.youtube.com"])',
      'ytm-pivot-bar-item-renderer:has(a[href="https://m.youtube.com/"])',
      'ytm-pivot-bar-item-renderer:has([aria-label="Home"])',
      'ytm-pivot-bar-item-renderer:has([aria-label*="Home"])',
      'ytm-pivot-bar-item-renderer:has(.pivot-home)',
      'ytm-rich-section-renderer:has(ytm-reel-shelf-renderer)',
      'ytm-rich-section-renderer:has(ytd-reel-shelf-renderer)',
      'ytm-rich-section-renderer:has(yt-reel-shelf-view-model)',
      'ytm-rich-section-renderer:has(reel-shelf-view-model)',
      'ytm-rich-section-renderer:has(a[href^="/shorts"])',
      'ytm-rich-section-renderer:has(a[href*="/shorts/"])',
      'ytm-rich-section-renderer:has([aria-label*="Shorts"])',
      'ytm-rich-section-renderer:has([aria-label*="shorts"])',
      'ytm-rich-shelf-renderer:has(a[href*="/shorts"])',
      'ytm-feed-filter-chip-bar-renderer',
      'ytm-slim-video-action-bar-renderer',
      'yt-video-metadata-carousel-view-model',
      'ytm-chip-cloud-renderer',
      '.slim-owner-subscribe-button',
      'a[href^="intent://"]'
    ].join(', ') + ' { display: none !important; }';

    var style = document.createElement('style');
    style.id = 'kidsyt-css-block';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  } catch(e) {}
})();
true;
`;

const injectedJS = `
(function() {

// =========================================================
//  COMMUNICATION & REACT CONSOLE BRIDGE
// =========================================================
function send(msg) {
  try {
    var str = typeof msg === 'string' ? msg : JSON.stringify(msg);
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(str);
    } else {
      setTimeout(function() {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(str);
          }
        } catch(e) {}
      }, 500);
    }
  } catch(e) {}
}

function logSubscribedChannels() {
  if (subscribedNames.size === 0 && subscribedUrls.size === 0) return;
  var names = Array.from(subscribedNames);
  names.sort();
  send({
    type: 'SUBSCRIPTIONS_LIST',
    total: names.length,
    names: names,
    urls: Array.from(subscribedUrls)
  });
}

// Clean up any residual on-screen debug elements to keep the UI clean
try {
  var oldDbg = document.getElementById('kidsyt-dbg');
  if (oldDbg) oldDbg.remove();
} catch(e) {}

function dbg(statusMsg) {
  send({ type: 'STATUS', msg: statusMsg });
}


// =========================================================
//  REMOVAL OF SHORTS & UI CLUTTER
// =========================================================
var SHORTS_SELECTORS = [
  'ytm-reel-shelf-renderer',
  'ytd-reel-shelf-renderer',
  'yt-reel-shelf-view-model',
  'reel-shelf-view-model',
  'ytm-shorts-lockup-view-model',
  'ytm-shorts-lockup-view-model-v2',
  'ytm-reel-item-renderer',
  'ytd-reel-item-renderer',
  '[aria-label="Shorts"]',
  'a[href^="/shorts"]',
  'a[href*="/shorts/"]'
];

var CLUTTER_SELECTORS = [
  'ytm-feed-filter-chip-bar-renderer',
  'ytm-slim-video-action-bar-renderer',
  'yt-video-metadata-carousel-view-model',
  'ytm-chip-cloud-renderer',
  '.slim-owner-subscribe-button',
  'a[href^="intent://"]'
];

function adjustBottomBarLayout() {
  try {
    var bar = document.querySelector('ytm-pivot-bar-renderer, [role="tablist"]');
    if (!bar) return;

    var tabs = bar.querySelectorAll('ytm-pivot-bar-item-renderer, [role="tab"]');
    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      var text = (t.innerText || t.textContent || '').trim().toLowerCase();
      var aria = (t.getAttribute('aria-label') || '').toLowerCase();
      var link = t.querySelector('a');
      var href = (link ? link.getAttribute('href') : '') || '';

      var isSub = text.indexOf('subscript') !== -1 || aria.indexOf('subscript') !== -1 || href.indexOf('subscript') !== -1;
      var isYou = text.indexOf('you') !== -1 || text.indexOf('library') !== -1 || aria.indexOf('you') !== -1 || aria.indexOf('library') !== -1;

      // Keep only Subscriptions and You/Library (split 50/50)
      if (isSub || isYou) {
        t.style.removeProperty('display');
        t.style.setProperty('flex', '1', 'important');
        continue;
      }

      // Hide Home, Shorts, and any other buttons completely
      t.style.setProperty('display', 'none', 'important');
    }
  } catch(e) {}
}

function removeShortsAndClutter() {
  try {
    // 1. Hide Shorts shelves, view models, and their section wrappers
    for (var i = 0; i < SHORTS_SELECTORS.length; i++) {
      var elements = document.querySelectorAll(SHORTS_SELECTORS[i]);
      for (var j = 0; j < elements.length; j++) {
        var el = elements[j];
        if (el.closest('ytm-pivot-bar-renderer, [role="tablist"]')) {
          continue; // Bottom bar handled separately
        }
        el.style.setProperty('display', 'none', 'important');
        var parentSection = el.closest('ytm-rich-section-renderer, ytd-rich-section-renderer, ytm-rich-shelf-renderer');
        if (parentSection) {
          parentSection.style.setProperty('display', 'none', 'important');
        }
      }
    }

    // 2. Hide any shelf whose header says "Shorts"
    var headers = document.querySelectorAll('ytm-rich-shelf-header-renderer, .rich-shelf-header');
    for (var h = 0; h < headers.length; h++) {
      var headerText = (headers[h].textContent || '').trim().toLowerCase();
      if (headerText.indexOf('shorts') !== -1) {
        var hSec = headers[h].closest('ytm-rich-section-renderer, ytd-rich-section-renderer, ytm-rich-shelf-renderer') || headers[h];
        hSec.style.setProperty('display', 'none', 'important');
      }
    }

    // 3. Adjust bottom navigation bar (Subscriptions and You only)
    adjustBottomBarLayout();

    // 4. Redirect any top logo links to subscriptions instead of home
    var topLogos = document.querySelectorAll('a[href="/"], a.mobile-topbar-header-endpoint, ytm-home-logo a');
    for (var l = 0; l < topLogos.length; l++) {
      topLogos[l].setAttribute('href', '/feed/subscriptions');
    }

    // 5. Hide UI clutter
    for (var c = 0; c < CLUTTER_SELECTORS.length; c++) {
      var clutterEls = document.querySelectorAll(CLUTTER_SELECTORS[c]);
      for (var d = 0; d < clutterEls.length; d++) {
        clutterEls[d].style.setProperty('display', 'none', 'important');
      }
    }
  } catch(e) {}
}


// =========================================================
//  MULTI-CHANNEL DETECTION HELPER
// =========================================================
function isMultiChannelName(str) {
  if (!str) return false;
  if (str.indexOf(',') !== -1) return true;
  if (/\\s+(and|&)\\s+/i.test(str)) return true;
  return false;
}


// =========================================================
//  SUBSCRIPTION WHITELIST — State & Storage (Profile-Scoped)
// =========================================================
var subscribedNames = new Set();
var subscribedUrls  = new Set();
var subsLoaded      = false;

var CACHE_KEY = 'kidsyt_subs_v9';

// Wipe contaminated legacy caches from previous versions so stale/unscoped channels are purged
try {
  var legacyKeys = [
    'kidsyt_subs_v8',
    'kidsyt_subs_v7',
    'kidsyt_subs_v6',
    'kidsyt_subscriptions_v5',
    'kidsyt_subscriptions_v4',
    'kidsyt_subscriptions_v3',
    'kidsyt_subscriptions_v2',
    'kidsyt_subscriptions'
  ];
  for (var lk = 0; lk < legacyKeys.length; lk++) {
    localStorage.removeItem(legacyKeys[lk]);
  }
} catch(e) {}

function loadCache() {
  try {
    var raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      var data = JSON.parse(raw);
      if (data && data.names && data.names.length > 0) {
        subscribedNames.clear();
        subscribedUrls.clear();
        for (var i = 0; i < data.names.length; i++) subscribedNames.add(data.names[i]);
        if (data.urls) {
          for (var j = 0; j < data.urls.length; j++) subscribedUrls.add(data.urls[j]);
        }
        subsLoaded = true;
        return true;
      }
    }
  } catch(e) {}
  return false;
}

function saveCache() {
  try {
    if (subscribedNames.size === 0 && subscribedUrls.size === 0) return;
    var payload = JSON.stringify({
      timestamp: Date.now(),
      names: Array.from(subscribedNames),
      urls:  Array.from(subscribedUrls)
    });
    localStorage.setItem(CACHE_KEY, payload);
  } catch(e) {}
}

function replaceSubscriptions(freshNames, freshUrls, source) {
  if ((!freshNames || freshNames.size === 0) && (!freshUrls || freshUrls.size === 0)) return;

  // Auto-populate names from handles like /@channelname if names were sparse
  if (freshUrls) {
    var iter = freshUrls.values();
    var it = iter.next();
    while (!it.done) {
      var u = it.value;
      if (u && u.indexOf('/@') === 0) {
        var cleanHandle = u.replace('/@', '').toLowerCase().trim();
        if (cleanHandle.length > 1) freshNames.add(cleanHandle);
      }
      it = iter.next();
    }
  }

  subscribedNames = freshNames;
  subscribedUrls = freshUrls;
  subsLoaded = true;
  saveCache();
  dbg('Synced ' + (subscribedNames.size || subscribedUrls.size) + ' channels (' + source + ')');
  logSubscribedChannels();
  sweepExistingCards();
  guardWatchPage();
}


// =========================================================
//  EXTRACT TITLES & CHANNELS FROM ANY JSON NODE
// =========================================================
function extractTitleFromNode(obj) {
  if (!obj || typeof obj !== 'object') return null;
  var fields = ['title', 'formattedTitle', 'displayName', 'ownerText', 'shortBylineText', 'longBylineText', 'channelTitle', 'author'];
  for (var i = 0; i < fields.length; i++) {
    var val = obj[fields[i]];
    if (!val) continue;
    if (typeof val === 'string' && val.trim().length > 0) return val.trim();
    if (val.simpleText && val.simpleText.trim().length > 0) return val.simpleText.trim();
    if (val.runs && val.runs[0] && val.runs[0].text && val.runs[0].text.trim().length > 0) return val.runs[0].text.trim();
  }
  return null;
}

function collectChannelsFromObj(obj, namesSet, urlsSet) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (var i = 0; i < obj.length; i++) {
      collectChannelsFromObj(obj[i], namesSet, urlsSet);
    }
    return;
  }

  var title = extractTitleFromNode(obj);

  var be = (obj.navigationEndpoint && obj.navigationEndpoint.browseEndpoint) || obj.browseEndpoint;
  if (be) {
    var base = be.canonicalBaseUrl || '';
    var bId = be.browseId || '';
    var isChannel = (
      (base && (base.indexOf('/@') === 0 || base.indexOf('/channel/') === 0 || base.indexOf('/c/') === 0 || base.indexOf('/user/') === 0)) ||
      (bId && bId.indexOf('UC') === 0)
    );
    if (isChannel) {
      if (base) {
        urlsSet.add(base.toLowerCase().trim());
        namesSet.add(base.replace('/@', '').toLowerCase().trim());
      }
      if (bId) {
        urlsSet.add(bId.toLowerCase().trim());
        urlsSet.add(('/channel/' + bId).toLowerCase().trim());
      }
      if (title) {
        namesSet.add(title.toLowerCase().trim());
      }
    }
  }

  if (obj.channelId && typeof obj.channelId === 'string' && obj.channelId.indexOf('UC') === 0) {
    urlsSet.add(obj.channelId.toLowerCase().trim());
    urlsSet.add(('/channel/' + obj.channelId).toLowerCase().trim());
    if (title) {
      namesSet.add(title.toLowerCase().trim());
    }
  }

  var keys = Object.keys(obj);
  for (var k = 0; k < keys.length; k++) {
    collectChannelsFromObj(obj[keys[k]], namesSet, urlsSet);
  }
}

function extractChannelFromAnchor(linkEl, namesSet, urlsSet) {
  if (!linkEl) return;
  var href = linkEl.getAttribute('href') || '';
  if (href && (href.indexOf('/@') !== -1 || href.indexOf('/channel/') !== -1)) {
    var cleanHref = href.split('?')[0].toLowerCase().trim();
    urlsSet.add(cleanHref);

    var name = (linkEl.textContent || '').trim();
    if (!name) name = (linkEl.getAttribute('aria-label') || '').trim();
    if (!name) name = (linkEl.getAttribute('title') || '').trim();
    if (!name) {
      var img = linkEl.querySelector('img');
      if (img) name = (img.getAttribute('alt') || '').trim();
    }
    if (!name && cleanHref.indexOf('/@') === 0) {
      name = cleanHref.replace('/@', '').trim();
    }
    if (name && name.length > 1 && name.length < 80) {
      namesSet.add(name.toLowerCase());
    }
  }
}

// Helper to extract JSON assigned to a variable in HTML scripts
function extractJsonFromHtml(html, varName) {
  if (!html) return null;
  var markers = [
    'var ' + varName + ' = ',
    varName + ' = ',
    'window["' + varName + '"] = ',
    "window['" + varName + "'] = "
  ];
  var startPos = -1;
  for (var m = 0; m < markers.length; m++) {
    var idx = html.indexOf(markers[m]);
    if (idx !== -1) {
      startPos = idx + markers[m].length;
      break;
    }
  }
  if (startPos === -1) return null;

  var jsonStart = html.indexOf('{', startPos);
  if (jsonStart === -1) return null;

  var depth = 0;
  var inString = false;
  var stringChar = '';
  var escape = false;

  for (var i = jsonStart; i < html.length; i++) {
    var ch = html[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\\\' && inString) {
      escape = true;
      continue;
    }
    if (inString) {
      if (ch === stringChar) {
        inString = false;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      continue;
    }
    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.substring(jsonStart, i + 1));
        } catch(e) {
          return null;
        }
      }
    }
  }
  return null;
}

// Method 1: Same-origin HTML fetch of /feed/subscriptions (Fastest, active profile scoped)
function fetchSubscriptionsPageHtml(namesSet, urlsSet) {
  return fetch('https://m.youtube.com/feed/subscriptions', {
    credentials: 'include'
  })
  .then(function(res) {
    if (!res.ok) return false;
    return res.text();
  })
  .then(function(html) {
    if (!html) return false;

    // 1. Parse ytInitialData JSON from HTML using balanced-brace extraction
    var data = extractJsonFromHtml(html, 'ytInitialData');
    if (data) {
      collectChannelsFromObj(data, namesSet, urlsSet);
    }

    // 2. Direct regex fallback on raw HTML
    // canonicalBaseUrl: /@handle
    var urlRe = new RegExp('"canonicalBaseUrl":\\\\s*"(/@([a-zA-Z0-9_.-]+))"', 'g');
    var um;
    while ((um = urlRe.exec(html)) !== null) {
      urlsSet.add(um[1].toLowerCase().trim());
      namesSet.add(um[2].toLowerCase().trim());
    }

    // UC channelId or browseId
    var idRe = new RegExp('"(?:channelId|browseId)":\\\\s*"(UC[a-zA-Z0-9_-]{20,24})"', 'g');
    var im;
    while ((im = idRe.exec(html)) !== null) {
      var cid = im[1].toLowerCase().trim();
      urlsSet.add(cid);
      urlsSet.add('/channel/' + cid);
    }

    // Direct href links (if any rendered)
    var hrefRe = new RegExp('href="(/(@[a-zA-Z0-9_.-]+|channel/UC[a-zA-Z0-9_-]+))"', 'g');
    var hm;
    while ((hm = hrefRe.exec(html)) !== null) {
      var u = hm[1].toLowerCase().trim();
      urlsSet.add(u);
      if (u.indexOf('/@') === 0) {
        namesSet.add(u.replace('/@', '').toLowerCase().trim());
      }
    }

    return namesSet.size > 0 || urlsSet.size > 0;
  })
  .catch(function() { return false; });
}

// Method 2: InnerTube API with active profile delegation (FEsubscriptions ONLY, NEVER FEchannels)
function getSApiSidHash() {
  return new Promise(function(resolve) {
    try {
      var cookies = (document.cookie || '').split(';');
      var sapisid = '';
      for (var i = 0; i < cookies.length; i++) {
        var parts = cookies[i].trim().split('=');
        var name = parts[0];
        if (name === 'SAPISID' || name === '__Secure-3PAPISID' || name === '__Secure-1PAPISID') {
          sapisid = parts.slice(1).join('=');
          break;
        }
      }
      if (!sapisid || !window.crypto || !window.crypto.subtle) {
        resolve(null);
        return;
      }
      var timestamp = Math.floor(Date.now() / 1000);
      var origin = window.location.origin || 'https://m.youtube.com';
      var data = timestamp + ' ' + sapisid + ' ' + origin;
      var encoder = new TextEncoder();
      var msgBuffer = encoder.encode(data);
      window.crypto.subtle.digest('SHA-1', msgBuffer).then(function(hashBuffer) {
        var hashArray = Array.from(new Uint8Array(hashBuffer));
        var hashHex = hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
        resolve(timestamp + '_' + hashHex);
      }).catch(function() {
        resolve(null);
      });
    } catch(e) {
      resolve(null);
    }
  });
}

function fetchSubscriptionsFromInnerTube(namesSet, urlsSet) {
  if (typeof window.ytcfg === 'undefined' || !window.ytcfg.get) {
    return Promise.resolve(false);
  }

  var apiKey = window.ytcfg.get('INNERTUBE_API_KEY');
  var context = window.ytcfg.get('INNERTUBE_CONTEXT');
  if (!apiKey || !context) {
    return Promise.resolve(false);
  }

  return getSApiSidHash().then(function(authHash) {
    var headers = {
      'Content-Type': 'application/json',
      'X-YouTube-Client-Name': '2',
      'X-YouTube-Client-Version': (context && context.client && context.client.clientVersion) || '2.20240101'
    };
    if (authHash) {
      headers['Authorization'] = 'SAPISIDHASH ' + authHash;
      headers['X-Origin'] = window.location.origin || 'https://m.youtube.com';
    }

    var idToken = window.ytcfg.get('ID_TOKEN');
    if (idToken) {
      headers['X-YouTube-Identity-Token'] = idToken;
    }
    var visitorData = window.ytcfg.get('VISITOR_DATA');
    if (visitorData) {
      headers['X-Goog-Visitor-Id'] = visitorData;
    }

    var delegator = window.ytcfg.get('DELEGATED_SESSION_ID');
    if (delegator) {
      headers['X-Goog-PageId'] = delegator;
      try {
        context.user = context.user || {};
        context.user.onBehalfOfUser = delegator;
      } catch(e) {}
    }

    // ONLY fetch FEsubscriptions (Subscriptions feed of active profile). NEVER FEchannels!
    return fetch('https://m.youtube.com/youtubei/v1/browse?key=' + apiKey, {
      method: 'POST',
      credentials: 'include',
      headers: headers,
      body: JSON.stringify({
        context: context,
        browseId: 'FEsubscriptions'
      })
    })
    .then(function(res) {
      if (!res.ok) return false;
      return res.json();
    })
    .then(function(data) {
      if (data) {
        collectChannelsFromObj(data, namesSet, urlsSet);
      }
      return namesSet.size > 0 || urlsSet.size > 0;
    })
    .catch(function() { return false; });
  }).catch(function() { return false; });
}

// Method 3: Background iframe to /feed/subscriptions
function loadSubscriptionsViaIframe(onDone) {
  try {
    var old = document.getElementById('kidsyt-subs-frame');
    if (old) old.remove();

    var ifr = document.createElement('iframe');
    ifr.id = 'kidsyt-subs-frame';
    ifr.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    ifr.src = 'https://m.youtube.com/feed/subscriptions';

    var namesSet = new Set();
    var urlsSet  = new Set();
    var finished = false;

    function finish(res) {
      if (finished) return;
      finished = true;
      try { ifr.remove(); } catch(e) {}
      if (res && (namesSet.size > 0 || urlsSet.size > 0)) {
        replaceSubscriptions(namesSet, urlsSet, 'Active-Profile-Iframe');
      }
      if (onDone) onDone(namesSet.size > 0 || urlsSet.size > 0);
    }

    function scanIframe() {
      try {
        var win = ifr.contentWindow;
        if (win && win.ytInitialData) {
          collectChannelsFromObj(win.ytInitialData, namesSet, urlsSet);
        }

        var doc = ifr.contentDocument || (win && win.document);
        if (doc) {
          if (doc.documentElement) {
            var html = doc.documentElement.innerHTML || '';
            var data = extractJsonFromHtml(html, 'ytInitialData');
            if (data) collectChannelsFromObj(data, namesSet, urlsSet);
          }
          var links = doc.querySelectorAll('a[href*="/@"], a[href*="/channel/"], a[href*="/c/"]');
          for (var i = 0; i < links.length; i++) {
            extractChannelFromAnchor(links[i], namesSet, urlsSet);
          }
        }
      } catch(e) {}
    }

    ifr.onload = function() {
      scanIframe();
      var attempts = 0;
      var pollId = setInterval(function() {
        attempts++;
        scanIframe();
        if (attempts >= 10 || namesSet.size > 0 || urlsSet.size > 0) {
          clearInterval(pollId);
          finish(namesSet.size > 0 || urlsSet.size > 0);
        }
      }, 500);
    };

    setTimeout(function() { finish(namesSet.size > 0 || urlsSet.size > 0); }, 9000);
    (document.body || document.documentElement).appendChild(ifr);
  } catch(e) {
    if (onDone) onDone(false);
  }
}

var _isSyncing = false;
function refreshSubscriptions() {
  if (_isSyncing) return;
  _isSyncing = true;

  var freshNames = new Set();
  var freshUrls  = new Set();

  // Try 1: Fast same-origin HTML fetch
  fetchSubscriptionsPageHtml(freshNames, freshUrls).then(function(ok1) {
    if (ok1 && (freshNames.size > 0 || freshUrls.size > 0)) {
      replaceSubscriptions(freshNames, freshUrls, 'Active-Profile-HTML');
      _isSyncing = false;
      return;
    }

    // Try 2: InnerTube API with active profile delegation
    fetchSubscriptionsFromInnerTube(freshNames, freshUrls).then(function(ok2) {
      if (ok2 && (freshNames.size > 0 || freshUrls.size > 0)) {
        replaceSubscriptions(freshNames, freshUrls, 'InnerTube-FEsubscriptions');
        _isSyncing = false;
        return;
      }

      // Try 3: Background iframe
      loadSubscriptionsViaIframe(function() {
        _isSyncing = false;
      });
    });
  });
}

function scanCurrentPageSubscriptions() {
  if (window.location.pathname.indexOf('/feed/subscriptions') !== 0) return;
  var freshNames = new Set();
  var freshUrls  = new Set();
  try {
    if (window.ytInitialData) {
      collectChannelsFromObj(window.ytInitialData, freshNames, freshUrls);
    }
    var links = document.querySelectorAll('a[href*="/@"], a[href*="/channel/"], a[href*="/c/"]');
    for (var i = 0; i < links.length; i++) {
      extractChannelFromAnchor(links[i], freshNames, freshUrls);
    }
  } catch(e) {}

  if (freshNames.size > 0 || freshUrls.size > 0) {
    replaceSubscriptions(freshNames, freshUrls, 'Subscriptions-Tab');
  }
}


// =========================================================
//  CHANNEL MATCHING LOGIC
// =========================================================
function isSubscribed(name, url) {
  if (!subsLoaded) return false; // DEFAULT DENY: Block if subscriptions not loaded yet

  if (name && isMultiChannelName(name)) return false;

  if (name) {
    var n = name.toLowerCase().trim();
    if (subscribedNames.has(n)) return true;
    var cleanN = n.replace(/^[@\\s]+/, '').replace(/[\\.\\s]+$/, '');
    if (subscribedNames.has(cleanN)) return true;
  }

  if (url) {
    var u = url.toLowerCase().trim();
    if (subscribedUrls.has(u)) return true;
    var cleanU = u.replace(/^\\//, '');
    if (subscribedUrls.has(cleanU) || subscribedUrls.has('/' + cleanU)) return true;

    var iter = subscribedUrls.values();
    var next = iter.next();
    while (!next.done) {
      var val = next.value;
      if (val && val.length > 3) {
        if (u.indexOf(val) !== -1 || val.indexOf(u) !== -1) {
          return true;
        }
      }
      next = iter.next();
    }
  }

  return false;
}


// =========================================================
//  HOME FEED VIDEO FILTERING
// =========================================================
var CARD_SELECTOR = [
  'ytm-rich-item-renderer',
  'ytd-rich-item-renderer',
  'ytm-video-with-context-renderer',
  'yt-lockup-view-model',
  'ytm-video-renderer',
  'ytm-compact-video-renderer',
  'ytm-media-item'
].join(', ');

function hideCard(card) {
  if (!card) return;
  card.style.setProperty('display', 'none', 'important');
  var parent = card.closest('ytm-rich-item-renderer, ytd-rich-item-renderer, ytm-video-with-context-renderer');
  if (parent && parent !== card) {
    parent.style.setProperty('display', 'none', 'important');
  }
}

function showCard(card) {
  if (!card) return;
  card.style.removeProperty('display');
  var parent = card.closest('ytm-rich-item-renderer, ytd-rich-item-renderer, ytm-video-with-context-renderer');
  if (parent && parent !== card) {
    parent.style.removeProperty('display');
  }
}

function findVideoCard(startEl) {
  if (!startEl) return null;
  var card = startEl.closest('ytm-rich-item-renderer, ytd-rich-item-renderer, ytm-video-with-context-renderer, ytm-video-renderer, ytm-compact-video-renderer, ytm-media-item');
  if (card) return card;
  card = startEl.closest('yt-lockup-view-model');
  if (card) {
    var parentItem = card.closest('ytm-rich-item-renderer, ytd-rich-item-renderer, ytm-video-with-context-renderer');
    return parentItem || card;
  }
  return startEl.closest(CARD_SELECTOR) || startEl;
}

function getCardChannelInfo(card) {
  var name = null;
  var url = null;
  var isShort = false;

  // 1. Is this a Shorts video card?
  if (
    (card.matches && card.matches('ytm-reel-item-renderer, ytd-reel-item-renderer')) ||
    card.querySelector('a[href^="/shorts"], a[href*="/shorts/"], ytm-reel-item-renderer, ytd-reel-item-renderer, [overlay-style="SHORTS"]')
  ) {
    return { isShort: true, name: null, url: null, isMultiple: false };
  }

  // 2. Channel anchor links inside card
  var links = card.querySelectorAll('a[href*="/@"], a[href*="/channel/"], a[href*="/c/"], a[href*="/user/"]');
  for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute('href') || '';
    if (href.indexOf('/watch') === -1 && href.indexOf('/shorts') === -1) {
      url = href;
      var text = links[i].textContent || '';
      if (text.trim().length > 0) name = text.trim();
      var aria = links[i].getAttribute('aria-label') || '';
      if (!name && aria) {
        name = aria.replace(/[\\.\\s]*Go to channel[\\.\\s]*$/i, '').trim();
      }
      break;
    }
  }

  // 3. Metadata view model (modern Lit elements)
  if (!name) {
    var metaModel = card.querySelector('yt-content-metadata-view-model');
    if (metaModel) {
      var firstRow = metaModel.querySelector('.yt-content-metadata-view-model__metadata-row');
      if (firstRow) {
        var firstText = firstRow.querySelector('.yt-content-metadata-view-model__metadata-text') || firstRow;
        name = firstText.textContent ? firstText.textContent.trim() : null;
      }
    }
  }

  // 4. Byline badge renderer
  if (!name) {
    var byline = card.querySelector('ytm-badge-and-byline-renderer, .video-meta-block, .media-item-metadata');
    if (byline) {
      var span = byline.querySelector('span');
      name = span ? span.textContent.trim() : byline.textContent.trim();
    }
  }

  // 5. Fallback: Parse card text content
  if (!name) {
    try {
      var allSpans = card.querySelectorAll('span, div');
      for (var s = 0; s < allSpans.length; s++) {
        var st = allSpans[s].textContent ? allSpans[s].textContent.trim() : '';
        if (!st || st.length > 50 || st.length < 2) continue;
        if (/\\d+\\s*(views?|watching|subscribers?)/i.test(st)) continue;
        if (/\\d+\\s*(second|minute|hour|day|week|month|year)s?\\s*ago/i.test(st)) continue;
        if (/^\\d+:\\d+(:\\d+)?$/.test(st)) continue;
        if (card.querySelector('a[href*="/watch"]') && card.querySelector('a[href*="/watch"]').textContent.indexOf(st) !== -1) continue;
        name = st;
        break;
      }
    } catch(e) {}
  }

  if (name) name = name.trim();
  if (url) url = url.trim().toLowerCase();

  return { name: name, url: url, isShort: isShort, isMultiple: false };
}

function getCardTitle(card) {
  try {
    var titleEl = card.querySelector('h3, [class*="title"], #video-title');
    if (titleEl && titleEl.textContent) {
      var t = titleEl.textContent.trim();
      if (t) return t;
    }
    var watchA = card.querySelector('a[href*="/watch"]');
    if (watchA) {
      var aria = watchA.getAttribute('aria-label');
      if (aria) return aria.trim();
      if (watchA.textContent && watchA.textContent.trim()) return watchA.textContent.trim();
    }
  } catch(e) {}
  return '';
}

function processCard(card) {
  if (!card || !card.isConnected) return;

  var pathname = window.location.pathname;
  var isSubPage = pathname.indexOf('/feed/subscriptions') === 0;

  var watchLink = card.querySelector('a[href*="/watch?v="], a[href^="/watch"]');
  var currentVideoHref = watchLink ? (watchLink.getAttribute('href') || '') : '';

  // Skip if already processed for this exact page and video
  if (card.dataset && card.dataset.kidsytPath === pathname && card.dataset.kidsytVideo === currentVideoHref && card.dataset.kidsytChecked) {
    return;
  }

  var info = getCardChannelInfo(card);

  // Shorts are ALWAYS hidden (Home, Subscriptions, Explore, etc.)
  if (info.isShort) {
    hideCard(card);
    if (card.dataset) {
      card.dataset.kidsytPath = pathname;
      card.dataset.kidsytVideo = currentVideoHref;
      card.dataset.kidsytChecked = 'shorts';
    }
    var shortsLink = card.querySelector('a[href*="/shorts"]');
    var sHref = shortsLink ? (shortsLink.getAttribute('href') || '') : '';
    send({
      type: 'BLOCKED_CONTENT',
      reason: 'Shorts',
      channelName: info.name || '',
      channelUrl: info.url || '',
      videoUrl: sHref ? ('https://m.youtube.com' + sHref) : '',
      title: getCardTitle(card) || 'Shorts'
    });
    return;
  }

  // --- ON SUBSCRIPTIONS TAB ---
  if (isSubPage) {
    // Every regular video in Subscriptions feed is from a subscribed channel!
    showCard(card);
    if (card.dataset) {
      card.dataset.kidsytPath = pathname;
      card.dataset.kidsytVideo = currentVideoHref;
      card.dataset.kidsytChecked = '1';
    }
    return;
  }

  // --- ON HOME / OTHER FEEDS ---
  var text = (card.innerText || card.textContent || '').trim();
  if (!watchLink && text.length < 5) {
    return; // Placeholder / skeleton — wait for data
  }

  // DEFAULT DENY: While subscriptions are discovering / loading,
  // do NOT allow any video from unknown / unsubscribed channels to appear!
  if (!subsLoaded) {
    hideCard(card);
    return;
  }

  if (info.name || info.url) {
    var isSub = isSubscribed(info.name, info.url);
    if (isSub) {
      showCard(card);
      if (card.dataset) {
        card.dataset.kidsytPath = pathname;
        card.dataset.kidsytVideo = currentVideoHref;
        card.dataset.kidsytChecked = '1';
      }
    } else {
      hideCard(card);
      if (card.dataset) {
        card.dataset.kidsytPath = pathname;
        card.dataset.kidsytVideo = currentVideoHref;
        card.dataset.kidsytChecked = 'blocked';
      }
      var fullVideoUrl = currentVideoHref ? (currentVideoHref.indexOf('http') === 0 ? currentVideoHref : 'https://m.youtube.com' + currentVideoHref) : '';
      var fullChannelUrl = info.url ? (info.url.indexOf('http') === 0 ? info.url : 'https://m.youtube.com' + info.url) : '';
      send({
        type: 'BLOCKED_CONTENT',
        reason: 'Unsubscribed channel',
        channelName: info.name || 'Unknown Channel',
        channelUrl: fullChannelUrl,
        videoUrl: fullVideoUrl,
        title: getCardTitle(card)
      });
    }
  }
}

function sweepExistingCards() {
  removeShortsAndClutter();

  var seen = new Set();
  var toProcess = [];

  // Method 1: Scan all watch links
  var watchLinks = document.querySelectorAll('a[href*="/watch?v="], a[href^="/watch"]');
  for (var w = 0; w < watchLinks.length; w++) {
    var c = findVideoCard(watchLinks[w]);
    if (c && !seen.has(c)) {
      seen.add(c);
      toProcess.push(c);
    }
  }

  // Method 2: Scan standard card selectors
  var cards = document.querySelectorAll(CARD_SELECTOR);
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var parentItem = card.closest('ytm-rich-item-renderer, ytd-rich-item-renderer, ytm-video-with-context-renderer');
    var target = parentItem || card;
    if (!seen.has(target)) {
      seen.add(target);
      toProcess.push(target);
    }
  }

  for (var j = 0; j < toProcess.length; j++) {
    processCard(toProcess[j]);
  }
}


// =========================================================
//  WATCH PAGE GUARD
// =========================================================
var lastGuardedUrl = '';

function guardWatchPage() {
  if (window.location.pathname.indexOf('/watch') !== 0) return;
  if (!subsLoaded) {
    try {
      var videos = document.querySelectorAll('video');
      for (var v = 0; v < videos.length; v++) videos[v].pause();
    } catch(e) {}
    return;
  }
  if (window.location.href === lastGuardedUrl) return;

  var owner = document.querySelector('ytm-slim-owner-renderer, ytd-watch-metadata #owner, #owner.ytd-watch-metadata');
  if (!owner) return;

  lastGuardedUrl = window.location.href;

  var channelName = null;
  var channelUrl = null;
  var link = owner.querySelector('a[href*="/@"], a[href*="/channel/"], a[href*="/c/"]');
  if (link) {
    channelUrl = link.getAttribute('href');
    channelName = link.textContent;
  }
  if (!channelName) {
    var nameEl = owner.querySelector('.slim-owner-channel-name, #channel-name');
    if (nameEl) channelName = nameEl.textContent;
  }

  if (channelName) channelName = channelName.trim();
  if (channelUrl) channelUrl = channelUrl.trim().toLowerCase();

  var isMulti = channelName ? isMultiChannelName(channelName) : false;

  if (isMulti || ((channelName || channelUrl) && !isSubscribed(channelName, channelUrl))) {
    try {
      var videos = document.querySelectorAll('video');
      for (var v = 0; v < videos.length; v++) videos[v].pause();
    } catch(e) {}
    var fullChUrl = channelUrl ? (channelUrl.indexOf('http') === 0 ? channelUrl : 'https://m.youtube.com' + channelUrl) : '';
    send({
      type: 'BLOCKED_WATCH',
      channelName: channelName || 'Unknown Channel',
      channelUrl: fullChUrl,
      url: window.location.href
    });
    window.location.replace('https://m.youtube.com/feed/subscriptions');
  }
}


// =========================================================
//  SPA NAVIGATION & DOM OBSERVER
// =========================================================
var _pushState    = history.pushState;
var _replaceState = history.replaceState;

history.pushState = function() {
  _pushState.apply(this, arguments);
  onNavigate();
};
history.replaceState = function() {
  _replaceState.apply(this, arguments);
  onNavigate();
};
window.addEventListener('popstate', onNavigate);
window.addEventListener('yt-navigate-finish', onNavigate);
window.addEventListener('yt-page-data-updated', onNavigate);

var lastUrl = window.location.href;
setInterval(function() {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    onNavigate();
  }
}, 400);

function onNavigate() {
  lastGuardedUrl = '';
  var pathname = window.location.pathname;
  send({ type: 'NAVIGATE', path: pathname });

  if (pathname === '/' || pathname === '') {
    window.location.replace('https://m.youtube.com/feed/subscriptions');
    return;
  }

  if (pathname.indexOf('/watch') === 0) {
    guardWatchPage();
    setTimeout(guardWatchPage, 500);
    setTimeout(guardWatchPage, 1200);
    setTimeout(guardWatchPage, 2500);
  } else if (pathname.indexOf('/feed/subscriptions') === 0) {
    scanCurrentPageSubscriptions();
    setTimeout(scanCurrentPageSubscriptions, 800);
    sweepExistingCards();
    setTimeout(sweepExistingCards, 200);
    setTimeout(sweepExistingCards, 600);
  } else {
    sweepExistingCards();
    setTimeout(sweepExistingCards, 200);
    setTimeout(sweepExistingCards, 600);
    setTimeout(sweepExistingCards, 1200);
  }
}

function processNode(node) {
  if (!node || node.nodeType !== 1) return;

  // 1. Hide Shorts elements
  for (var i = 0; i < SHORTS_SELECTORS.length; i++) {
    var sel = SHORTS_SELECTORS[i];
    if (node.matches && node.matches(sel)) {
      if (!node.closest('ytm-pivot-bar-renderer, [role="tablist"]')) {
        node.style.setProperty('display', 'none', 'important');
        var parentSection = node.closest('ytm-rich-section-renderer, ytd-rich-section-renderer, ytm-rich-shelf-renderer');
        if (parentSection) {
          parentSection.style.setProperty('display', 'none', 'important');
        }
      }
      return;
    }
  }

  // 2. Filter video cards
  if (node.matches && (node.matches(CARD_SELECTOR) || node.matches('a[href*="/watch"]'))) {
    var cNode = findVideoCard(node);
    if (cNode) processCard(cNode);
  }
  if (node.querySelectorAll) {
    var subCards = node.querySelectorAll(CARD_SELECTOR);
    for (var c = 0; c < subCards.length; c++) {
      processCard(subCards[c]);
    }
    var watchLinks = node.querySelectorAll('a[href*="/watch?v="]');
    for (var w = 0; w < watchLinks.length; w++) {
      var cw = findVideoCard(watchLinks[w]);
      if (cw) processCard(cw);
    }
  }

  // 3. Watch page guard
  if (window.location.pathname.indexOf('/watch') === 0) {
    guardWatchPage();
  }
}

var observer = new MutationObserver(function(mutations) {
  for (var m = 0; m < mutations.length; m++) {
    var added = mutations[m].addedNodes;
    for (var a = 0; a < added.length; a++) {
      processNode(added[a]);
    }
  }
});
observer.observe(document.body || document.documentElement, { childList: true, subtree: true });

// Continuous background sweep interval
setInterval(function() {
  sweepExistingCards();
}, 1000);


// =========================================================
//  FULLSCREEN ORIENTATION HANDLING
// =========================================================
document.addEventListener("fullscreenchange", function() {
  send(document.fullscreenElement ? "fullscreen-enter" : "fullscreen-exit");
});
document.addEventListener("webkitfullscreenchange", function() {
  send(document.webkitFullscreenElement ? "fullscreen-enter" : "fullscreen-exit");
});


// =========================================================
//  INIT
// =========================================================
loadCache();

if (window.location.pathname.indexOf('/feed/subscriptions') === 0) {
  scanCurrentPageSubscriptions();
  setTimeout(scanCurrentPageSubscriptions, 1000);
}

if (subsLoaded) {
  dbg('Active (' + (subscribedNames.size || subscribedUrls.size) + ' channels from cache)');
  logSubscribedChannels();
  sweepExistingCards();
} else {
  dbg('Discovering profile subscriptions...');
  sweepExistingCards(); // Hide any cards immediately while discovering (default-deny)
}

// Start immediate active-profile subscription sync
refreshSubscriptions();
setTimeout(refreshSubscriptions, 1500);

// Active discovery retry loop: retry every 3s until subscriptions are loaded (up to 10 attempts)
var _discAttempts = 0;
var _discInterval = setInterval(function() {
  if (subsLoaded || _discAttempts >= 10) {
    clearInterval(_discInterval);
    return;
  }
  _discAttempts++;
  dbg('Discovering profile subscriptions (retry ' + _discAttempts + ')...');
  refreshSubscriptions();
}, 3000);

// Periodic subscription refresh every 10 minutes
setInterval(refreshSubscriptions, 10 * 60 * 1000);

})();
true;
`;

import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import Orientation from "react-native-orientation-locker";
import type {WebView as WebViewType} from "react-native-webview";

import React, {useRef, useEffect} from "react";
import {BackHandler} from "react-native";

const handleMessage = (event: any) => {
  try {
    const rawData = event.nativeEvent.data;

    if (rawData === "fullscreen-enter") {
      Orientation.unlockAllOrientations();
      Orientation.lockToLandscape();
      return;
    }

    if (rawData === "fullscreen-exit") {
      Orientation.lockToPortrait();
      return;
    }

    let payload: any = null;
    try {
      payload = JSON.parse(rawData);
    } catch {
      console.log("[WebView]", rawData);
      return;
    }

    if (!payload || !payload.type) {
      console.log("[WebView]", rawData);
      return;
    }

    switch (payload.type) {
      case "SUBSCRIPTIONS_LIST": {
        console.log(`\n====================================================`);
        console.log(`[KidsYT] SUBSCRIBED CHANNELS (${payload.total || (payload.names && payload.names.length) || 0}):`);
        if (Array.isArray(payload.names)) {
          payload.names.forEach((name: string, idx: number) => {
            console.log(`[KidsYT]   ${String(idx + 1).padStart(2, " ")}. ${name}`);
          });
        }
        console.log(`====================================================\n`);
        break;
      }

      case "BLOCKED_CONTENT": {
        console.log(`[KidsYT] 🚫 BLOCKED CONTENT:`);
        if (payload.channelName) console.log(`[KidsYT]    Channel:     "${payload.channelName}"`);
        if (payload.channelUrl)  console.log(`[KidsYT]    Channel URL: ${payload.channelUrl}`);
        if (payload.videoUrl)    console.log(`[KidsYT]    Video URL:   ${payload.videoUrl}`);
        if (payload.title)       console.log(`[KidsYT]    Title:       "${payload.title}"`);
        if (payload.reason)      console.log(`[KidsYT]    Reason:      ${payload.reason}`);
        break;
      }

      case "BLOCKED_WATCH": {
        console.log(`[KidsYT] 🛡️ BLOCKED WATCH ATTEMPT:`);
        console.log(`[KidsYT]    Channel:     "${payload.channelName}"`);
        if (payload.channelUrl)  console.log(`[KidsYT]    Channel URL: ${payload.channelUrl}`);
        console.log(`[KidsYT]    Watch URL:   ${payload.url}`);
        console.log(`[KidsYT]    Action:      Paused & redirected to Home feed`);
        break;
      }

      case "STATUS": {
        console.log(`[KidsYT] ℹ️ ${payload.msg}`);
        break;
      }

      case "NAVIGATE": {
        console.log(`[KidsYT] 🧭 Navigated to: ${payload.path}`);
        break;
      }

      default: {
        console.log("[KidsYT]", payload);
      }
    }
  } catch (err) {
    console.warn("handleMessage error:", err);
  }
};

export default function App() {
  const webViewRef = useRef<WebViewType>(null);
  
  useEffect(() => {
    const backAction = () => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          "window.history.back(); true;"
        );
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        javaScriptEnabled
        style={{ flex: 1 }}
        source={{ uri: "https://m.youtube.com/feed/subscriptions" }}
        injectedJavaScriptBeforeContentLoaded={earlyJS}
        injectedJavaScript={injectedJS}
        mediaPlaybackRequiresUserAction={false}
        onMessage={handleMessage}
      />
    </SafeAreaView>
  );
}
