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
      '[aria-label="Shorts"]',
      'a[href^="/shorts"]',
      'a[href*="/shorts/"]',
      '.pivot-shorts',
      'ytm-pivot-bar-item-renderer:has(a[href^="/shorts"])',
      'ytm-pivot-bar-item-renderer:has(a[href*="/shorts/"])',
      'ytm-pivot-bar-item-renderer:has(.pivot-shorts)',
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
//  COMMUNICATION & DEBUG OVERLAY
// =========================================================
function send(msg) {
  try {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  } catch(e) {}
}

var _dbgStatus = 'Active';
var _dbgChecked = 0;
var _dbgRemoved = 0;
var _dbgLastChannel = '';

function updateDebugOverlay() {
  try {
    var el = document.getElementById('kidsyt-dbg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'kidsyt-dbg';
      el.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;background:rgba(0,0,0,0.88);color:#00ff66;font-size:11px;font-family:monospace;padding:6px 10px;line-height:1.4;max-width:320px;word-break:break-word;pointer-events:none;border-bottom-right-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.4);';
      (document.documentElement || document.body).appendChild(el);
    }

    var loginText = 'YES';
    try {
      if (typeof window.ytcfg !== 'undefined' && window.ytcfg.get) {
        loginText = window.ytcfg.get('LOGGED_IN') ? 'YES' : 'NO (Tap Sign In)';
      }
    } catch(e) {}

    el.innerText = [
      '[KidsYT] Logged In: ' + loginText,
      'Subs Whitelist: ' + subscribedNames.size + ' channels',
      'Cards: ' + _dbgChecked + ' checked, ' + _dbgRemoved + ' removed',
      'Last: ' + (_dbgLastChannel || 'none')
    ].join('\\n');
  } catch(e) {}
}

function dbg(statusMsg) {
  _dbgStatus = statusMsg;
  updateDebugOverlay();
  send({ type: 'STATUS', msg: statusMsg });
}


// =========================================================
//  REMOVAL OF SHORTS & UI CLUTTER
// =========================================================
var SHORTS_SELECTORS = [
  'ytm-reel-shelf-renderer',
  'ytd-reel-shelf-renderer',
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

      // EXPLICIT PROTECTION: NEVER remove Subscriptions, Home, or Account/Library
      if (text.indexOf('subscript') !== -1 || aria.indexOf('subscript') !== -1 || href.indexOf('subscript') !== -1) continue;
      if (text.indexOf('home') !== -1 || aria.indexOf('home') !== -1 || href === '/' || href === '') continue;
      if (text.indexOf('you') !== -1 || text.indexOf('library') !== -1 || aria.indexOf('you') !== -1 || aria.indexOf('library') !== -1) continue;

      // Only match and remove Shorts
      var isShorts = t.querySelector('.pivot-shorts, a[href*="shorts"]') ||
                     aria.indexOf('shorts') !== -1 ||
                     text === 'shorts';

      if (isShorts) {
        t.style.setProperty('display', 'none', 'important');
        t.remove();
      }
    }
  } catch(e) {}
}

function removeShortsAndClutter() {
  try {
    // 1. Hide Shorts shelves and sections
    for (var i = 0; i < SHORTS_SELECTORS.length; i++) {
      var elements = document.querySelectorAll(SHORTS_SELECTORS[i]);
      for (var j = 0; j < elements.length; j++) {
        var el = elements[j];
        if (el.closest('ytm-pivot-bar-renderer, [role="tablist"]')) {
          continue; // Bottom bar handled separately
        }
        var parentSection = el.closest('ytm-rich-section-renderer, ytd-rich-section-renderer');
        if (parentSection) {
          if (!parentSection.querySelector('a[href*="/watch?v="]')) {
            parentSection.style.setProperty('display', 'none', 'important');
          } else {
            el.style.setProperty('display', 'none', 'important');
          }
        } else {
          el.style.setProperty('display', 'none', 'important');
        }
      }
    }

    // 2. Adjust bottom navigation bar to 3 items at 33.333%
    adjustBottomBarLayout();

    // 3. Hide UI clutter
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
//  SUBSCRIPTION WHITELIST — State & Storage
// =========================================================
var subscribedNames = new Set();
var subscribedUrls  = new Set();
var subsLoaded      = false;

var CACHE_KEYS = [
  'kidsyt_subscriptions_v4',
  'kidsyt_subscriptions_v5',
  'kidsyt_subscriptions_v3',
  'kidsyt_subscriptions_v2',
  'kidsyt_subscriptions'
];

function loadCache() {
  try {
    for (var k = 0; k < CACHE_KEYS.length; k++) {
      var raw = localStorage.getItem(CACHE_KEYS[k]);
      if (raw) {
        var data = JSON.parse(raw);
        if (data.names && data.names.length) {
          for (var i = 0; i < data.names.length; i++) subscribedNames.add(data.names[i]);
        }
        if (data.urls && data.urls.length) {
          for (var j = 0; j < data.urls.length; j++) subscribedUrls.add(data.urls[j]);
        }
        if (subscribedNames.size > 0) {
          subsLoaded = true;
          return true;
        }
      }
    }
  } catch(e) {}
  return false;
}

function saveCache() {
  try {
    if (subscribedNames.size === 0 && subscribedUrls.size === 0) return;
    var payload = JSON.stringify({
      names: Array.from(subscribedNames),
      urls:  Array.from(subscribedUrls)
    });
    for (var k = 0; k < CACHE_KEYS.length; k++) {
      localStorage.setItem(CACHE_KEYS[k], payload);
    }
  } catch(e) {}
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
      if (base) urlsSet.add(base.toLowerCase().trim());
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

function onSubscriptionsDiscovered(source) {
  if (subscribedNames.size === 0 && subscribedUrls.size === 0) return;
  subsLoaded = true;
  saveCache();
  dbg('Loaded ' + subscribedNames.size + ' channels (' + source + ')');
  sweepExistingCards();
  guardWatchPage();
}

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

function fetchWithBrowseId(apiKey, context, browseId, label, authHash) {
  var headers = {
    'Content-Type': 'application/json',
    'X-YouTube-Client-Name': '2',
    'X-YouTube-Client-Version': (context && context.client && context.client.clientVersion) || '2.20240101'
  };
  if (authHash) {
    headers['Authorization'] = 'SAPISIDHASH ' + authHash;
    headers['X-Origin'] = window.location.origin || 'https://m.youtube.com';
  }

  fetch('https://m.youtube.com/youtubei/v1/browse?key=' + apiKey, {
    method: 'POST',
    credentials: 'include',
    headers: headers,
    body: JSON.stringify({
      context: context,
      browseId: browseId
    })
  })
  .then(function(res) {
    if (!res.ok) return null;
    return res.json();
  })
  .then(function(data) {
    if (!data) return;
    var before = subscribedNames.size;
    collectChannelsFromObj(data, subscribedNames, subscribedUrls);
    if (subscribedNames.size > before) {
      onSubscriptionsDiscovered(label);
    }
  })
  .catch(function() {});
}

function fetchFromInnerTube() {
  if (typeof window.ytcfg === 'undefined' || !window.ytcfg.get) {
    return false;
  }

  var apiKey = window.ytcfg.get('INNERTUBE_API_KEY');
  var context = window.ytcfg.get('INNERTUBE_CONTEXT');
  if (!apiKey || !context) {
    return false;
  }

  getSApiSidHash().then(function(authHash) {
    fetchWithBrowseId(apiKey, context, 'FEchannels', 'InnerTube-FEchannels', authHash);
    fetchWithBrowseId(apiKey, context, 'FEsubscriptions', 'InnerTube-FEsubscriptions', authHash);
  });

  return true;
}

// Background iframe loader only used if cache is empty
function loadSubscriptionsViaIframe() {
  try {
    if (subsLoaded) return; // Do not run iframe if channels are already loaded
    if (document.getElementById('kidsyt-subs-frame')) return;
    var ifr = document.createElement('iframe');
    ifr.id = 'kidsyt-subs-frame';
    ifr.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    ifr.src = 'https://m.youtube.com/feed/subscriptions';

    function scanIframe() {
      try {
        var win = ifr.contentWindow;
        if (win && win.ytInitialData) {
          var beforeInit = subscribedNames.size;
          collectChannelsFromObj(win.ytInitialData, subscribedNames, subscribedUrls);
          if (subscribedNames.size > beforeInit) {
            onSubscriptionsDiscovered('iframe-ytInitialData');
          }
        }

        var doc = ifr.contentDocument || (win && win.document);
        if (doc) {
          var links = doc.querySelectorAll('a[href*="/@"], a[href*="/channel/"], a[href*="/c/"]');
          var beforeLinks = subscribedNames.size;
          for (var i = 0; i < links.length; i++) {
            var href = links[i].getAttribute('href');
            var text = (links[i].textContent || '').trim();
            if (href && (href.indexOf('/@') !== -1 || href.indexOf('/channel/') !== -1)) {
              subscribedUrls.add(href.toLowerCase());
              if (text && text.length > 1 && text.length < 80) {
                subscribedNames.add(text.toLowerCase());
              }
            }
          }
          if (subscribedNames.size > beforeLinks) {
            onSubscriptionsDiscovered('iframe-dom');
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
        if (attempts >= 10 || subscribedNames.size > 0) {
          clearInterval(pollId);
        }
      }, 600);
    };

    (document.body || document.documentElement).appendChild(ifr);
  } catch(e) {}
}


// =========================================================
//  CHANNEL MATCHING LOGIC
// =========================================================
function isSubscribed(name, url) {
  if (!subsLoaded) return true;

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
    _dbgRemoved++;
    updateDebugOverlay();
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
    _dbgChecked++;
    _dbgLastChannel = (info.name || 'sub-video') + ' [SUB-PAGE]';
    updateDebugOverlay();
    return;
  }

  // --- ON HOME / OTHER FEEDS ---
  var text = (card.innerText || card.textContent || '').trim();
  if (!watchLink && text.length < 5) {
    return; // Placeholder / skeleton — wait for data
  }

  if (!subsLoaded) {
    return; // Wait for subscriptions cache to load
  }

  _dbgChecked++;

  if (info.name || info.url) {
    var isSub = isSubscribed(info.name, info.url);
    _dbgLastChannel = (info.name || info.url) + (isSub ? ' [OK]' : ' [BLOCKED]');
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
      _dbgRemoved++;
    }
  } else {
    // Channel not identified yet — wait for Lit to render metadata
    _dbgLastChannel = 'waiting: ' + text.substring(0, 20);
  }

  updateDebugOverlay();
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
  if (!subsLoaded) return;
  if (window.location.pathname.indexOf('/watch') !== 0) return;
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
    dbg('Blocked: unsubscribed channel (' + (channelName || channelUrl) + ')');
    window.location.replace('https://m.youtube.com');
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

  if (pathname.indexOf('/watch') === 0) {
    guardWatchPage();
    setTimeout(guardWatchPage, 500);
    setTimeout(guardWatchPage, 1200);
    setTimeout(guardWatchPage, 2500);
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
        var parentSection = node.closest('ytm-rich-section-renderer, ytd-rich-section-renderer');
        if (parentSection && !parentSection.querySelector('a[href*="/watch?v="]')) {
          parentSection.style.setProperty('display', 'none', 'important');
        } else {
          node.style.setProperty('display', 'none', 'important');
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

if (subsLoaded) {
  dbg('Active (' + subscribedNames.size + ' channels)');
  sweepExistingCards();
} else {
  dbg('Discovering subscriptions...');
  tryInnerTube();
  loadSubscriptionsViaIframe();
}

sweepExistingCards();

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
    console.log("[WebView Message]", rawData);

    if (rawData === "fullscreen-enter") {
      Orientation.unlockAllOrientations();
      Orientation.lockToLandscape();
      return;
    }

    if (rawData === "fullscreen-exit") {
      Orientation.lockToPortrait();
      return;
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
        source={{ uri: "https://m.youtube.com" }}
        injectedJavaScriptBeforeContentLoaded={earlyJS}
        injectedJavaScript={injectedJS}
        mediaPlaybackRequiresUserAction={false}
        onMessage={handleMessage}
      />
    </SafeAreaView>
  );
}
