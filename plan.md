# YoutubeWrapper — Bug Fix & Architecture Plan

> **Goal:** Reliably block Shorts, remove UI clutter, and filter out non-subscribed video recommendations from the feed on YouTube mobile web (`m.youtube.com`).

---

## Architecture: Profile-Scoped Whitelist & Fail-Closed Filtering

### 1. Subscription Discovery (Profile-Scoped)
- The app defaults directly to `https://m.youtube.com/feed/subscriptions` on launch.
- Subscriptions are immediately scanned from the active page (`scanCurrentPageSubscriptions`), priming `kidsyt_subs_v9` instantly without delay.
- The app scopes subscriptions exclusively to the **currently active profile** in the WebView.
- Purged all legacy multi-account caches and eliminated `FEchannels` (which was querying Google Account Switcher and leaking channels across profiles).
- Subscriptions are extracted directly using the active session from `https://m.youtube.com/feed/subscriptions`:
  - **Method 1 (Primary):** Same-origin HTML fetch of `/feed/subscriptions` with balanced-brace JSON parsing (`extractJsonFromHtml`) of `ytInitialData`, plus direct regex fallback for `canonicalBaseUrl` handles and `browseId` / `channelId` UC tokens.
  - **Method 2 (Secondary):** InnerTube `FEsubscriptions` with active session delegation (`X-Goog-PageId`, `ID_TOKEN`, `VISITOR_DATA`, `SAPISIDHASH`).
  - **Method 3 (Tertiary):** Background hidden iframe to `/feed/subscriptions` with DOM and innerHTML scan.
  - **Method 4 (On-Demand / Tab Sync):** Live DOM & `ytInitialData` scan when navigating to `/feed/subscriptions`.
- **Active Discovery Retry Loop:** Retries every 3 seconds on cold start until subscriptions are fetched, and periodically every 10 minutes thereafter.
- A fresh sync replaces the whitelist completely (`replaceSubscriptions`), immediately purging unneeded or previously unsubscribed channels.

### 2. Default-Deny (Fail-Closed) Video Card Filtering
- **Target Selectors:**
  `ytm-rich-item-renderer`, `ytd-rich-item-renderer`, `ytm-video-with-context-renderer`, `yt-lockup-view-model`, `ytm-video-renderer`, `ytm-compact-video-renderer`
- **Fail-Closed Policy:**
  - If subscriptions are not yet loaded (`!subsLoaded`), `isSubscribed()` returns `false`, `processCard()` immediately calls `hideCard(card)`, and `guardWatchPage()` pauses video playback. No unsubscribed videos are allowed to display during initial startup or sync.
- **Non-Destructive DOM Lifecycle (Virtual DOM & SPA Friendly):**
  1. Detects card added to DOM via `MutationObserver`, navigation events (`yt-navigate-finish`, `popstate`), or continuous sweep.
  2. If card is Shorts $\rightarrow$ `hideCard(card)` (`display: none !important;`).
  3. If currently on Subscriptions tab (`/feed/subscriptions`) $\rightarrow$ `showCard(card)` (all videos on this tab belong to subscribed channels).
  4. If on Home feed $\rightarrow$ extracts channel handle and name from `yt-content-metadata-view-model`, anchor tags, or metadata spans.
  5. Checks against the active profile's whitelist via `isSubscribed()`.
  6. If subscribed: `showCard(card)` and records `dataset.kidsytPath` and `dataset.kidsytVideo`.
  7. If unsubscribed: `hideCard(card)` (`display: none !important;`). Elements are never removed with `.remove()` to prevent breaking Lit / Polymer virtual DOM reconciliation across tab switching.

### 3. Shorts & UI Suppression
- Pre-rendered CSS (`earlyJS`) hides all Shorts elements, links, the bottom Shorts tab, and the Home tab before paint.
- Bottom bar is cleaned to contain only **Subscriptions** and **You / Library** (split 50/50), with Home and Shorts eliminated completely.
- Any navigation attempt to Home (`/`) or taps on top YouTube logos automatically redirect to `/feed/subscriptions`.
- DOM observer and sweep unconditionally hide any section wrapper (`ytm-rich-section-renderer` / `ytm-rich-shelf-renderer`) containing Shorts or titled "Shorts".
- Watch page guard redirects away from `/watch` if the video creator is not on the whitelist.
- Debug overlay removed from DOM so the child UI is completely clean and clutter-free.

### 4. React Native Console Logging Bridge
- Subscribed channels of the active profile are formatted and printed directly to the React Metro console upon app start.
- Blocked content events stream live to the React console with Title, Channel Name, Channel URL, Video URL, and Reason.
- Watch guard block attempts and SPA navigation routes are logged in real time.
