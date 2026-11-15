# YoutubeWrapper — Bug Fix & Architecture Plan

> **Goal:** Reliably block Shorts, remove UI clutter, and filter out non-subscribed video recommendations from the feed on YouTube mobile web (`m.youtube.com`).

---

## Current Status: Whitelist Successfully Extracted (69 Channels)

### 1. Subscription Discovery Milestone
- The app now successfully authenticates and extracts all **69 subscribed channels** via session cookie authorization (`SAPISIDHASH` SHA-1 digest) and native background iframe navigation (`https://m.youtube.com/feed/subscriptions`).
- All 69 channel names, handles (`/@handle`), and channel IDs (`UC...`) are cached in `localStorage` for instant offline/cold-start readiness.

### 2. Video Card Filtering Architecture
- **Target Selectors:**
  `ytm-rich-item-renderer`, `ytd-rich-item-renderer`, `ytm-video-with-context-renderer`, `yt-lockup-view-model`, `ytm-video-renderer`, `ytm-compact-video-renderer`
- **Card Processing Lifecycle:**
  1. Detects card added to DOM via `MutationObserver` or `setInterval(1000)` sweep.
  2. If card is Shorts $\rightarrow$ removed instantly.
  3. Extracts channel handle and name from `yt-content-metadata-view-model`, anchor tags, or metadata spans.
  4. Checks against the 69-channel whitelist via `isSubscribed()`.
  5. If subscribed: marks `card.dataset.kidsytChecked = '1'` (remains visible).
  6. If unsubscribed: `card.remove()` (removed from feed).

### 3. Shorts & UI Suppression
- Pre-rendered CSS (`earlyJS`) hides all Shorts elements, links, and the bottom Shorts tab before paint.
- DOM observer cleans any remaining Shorts shelves.
- Watch page guard redirects away from `/watch` if the video creator is not on the whitelist.
