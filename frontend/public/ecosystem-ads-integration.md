# Ecosystem Ads — Partner Site Integration Guide

**VastuCart Ecosystem Ads** is a first-party ad network that lets partner sites in the VastuCart ecosystem (blog.vastucart.in, panchang.vastucart.in, horoscope.vastucart.in, muhurta.vastucart.in, vastucart.in, etc.) display managed banners served by the VastuCart backend — and feed real-time impressions and click data back to the admin analytics dashboard.

This document is for developers integrating ad display on any partner site.

---

## How It Works (Concept)

```
Admin (VastuCart) creates banner → assigns to slot on your site
        ↓
Your site calls GET /store/ecosystem-banners/:subdomain
        ↓
Receive banner image URL, headline, CTA, slot metadata + site_id
        ↓
Render the banner in the designated slot
        ↓
Fire impression event when banner enters viewport
        ↓
Fire click event when user clicks the CTA
        ↓
Analytics dashboard updates in real time
```

No iframe, no third-party script. You own the rendering. VastuCart owns the creative management and analytics.

---

## Prerequisites

Before you integrate, the admin at VastuCart must:

1. **Add your site** in `Admin → Ecosystem Ads → Placements → Add Site`
   - Set `subdomain` to exactly match your site's domain (e.g. `blog.vastucart.in`)
2. **Create slots** on your site (e.g. Hero Banner 16:9, Sidebar 1:1)
3. **Create a banner** with a matching creative (image with same aspect ratio as the slot)
4. **Assign the banner** to the slot

Once done, the GET API will return banner data. Until all 4 steps are complete, the response is `{ site_id: "...", banners: [] }`.

---

## API Reference

### Base URL

| Environment | URL |
|-------------|-----|
| Production  | `https://sapi.vastucart.in` |
| Local dev   | `http://localhost:9000` |

### Authentication

The store APIs require a **Publishable API Key** in the request header:

```
x-publishable-api-key: pk_d521eac4b14f6628ff8f82364940864b137126a6286445cf92b9436511d8c0ec
```

This is a public, non-secret key. It is safe to use in client-side JavaScript.

---

### 1. Fetch Banners for Your Site

```
GET /store/ecosystem-banners/:subdomain
```

Replace `:subdomain` with your site's exact subdomain as registered in the admin.

**Request:**
```bash
curl "https://sapi.vastucart.in/store/ecosystem-banners/blog.vastucart.in" \
  -H "x-publishable-api-key: pk_d521eac4b14f6628ff8f82364940864b137126a6286445cf92b9436511d8c0ec"
```

**Response:**
```json
{
  "site_id": "01KJ4ES03EFQPHJ0A2JJ7B7D5X",
  "banners": [
    {
      "slot_name": "Hero Banner",
      "slot_id": "01KJ4ESM83QD4DC24H60BK0XE2",
      "ratio": "16:9",
      "banner": {
        "id": "01KJ4ER6S6S5CRPD5Y33PBPJH8",
        "headline": "Authentic Spiritual Products for Your Home",
        "cta_text": "Shop Now",
        "cta_url": "https://store.vastucart.in/collections",
        "creative_url": "https://sapi.vastucart.in/store/img-proxy/banner-file-id.jpg",
        "creative_width": 1920,
        "creative_height": 1080
      }
    }
  ]
}
```

**Fields explained:**

| Field | Description |
|-------|-------------|
| `site_id` | Your site's DB ID — **required for all tracking calls** |
| `banners[].slot_name` | Name of the ad slot (e.g. "Hero Banner", "Sidebar") |
| `banners[].slot_id` | Slot DB ID — **required for tracking** |
| `banners[].ratio` | Aspect ratio: `16:9`, `1:1`, `9:16`, `4:3`, `16:3`, `2:3` |
| `banners[].banner.id` | Banner DB ID — **required for tracking** |
| `banners[].banner.headline` | Ad headline text |
| `banners[].banner.cta_text` | Button label (e.g. "Shop Now") |
| `banners[].banner.cta_url` | Where clicking takes the user |
| `banners[].banner.creative_url` | Full HTTPS URL to the banner image |
| `banners[].banner.creative_width` | Image width in pixels |
| `banners[].banner.creative_height` | Image height in pixels |

> **Cache:** The response is cached by CDNs for 60 seconds. Do not call this on every page render — call once on load, store in memory/state.

> **Empty banners array:** Returned when the site is not registered, the slot has no active banner assigned, or the banner's creative doesn't match the slot ratio. Handle gracefully — hide the slot.

---

### 2. Track an Event (Impression or Click)

```
POST /store/ecosystem-banners/track
```

**Request body:**
```json
{
  "banner_id": "01KJ4ER6S6S5CRPD5Y33PBPJH8",
  "site_id": "01KJ4ES03EFQPHJ0A2JJ7B7D5X",
  "slot_id": "01KJ4ESM83QD4DC24H60BK0XE2",
  "event_type": "impression"
}
```

| Field | Required | Values | Source |
|-------|----------|--------|--------|
| `banner_id` | ✅ | string | `banners[].banner.id` from GET response |
| `site_id` | ✅ | string | `site_id` from GET response |
| `slot_id` | ✅ | string | `banners[].slot_id` from GET response |
| `event_type` | ✅ | `"impression"` or `"click"` | Your logic |

**Response:**
```json
{ "success": true }
```

The tracking endpoint always returns 200. If it fails silently, tracking is lost but the page continues to work. This is intentional — never let ad tracking break the page.

> ⚠️ **Critical:** `site_id` is the database ID from the GET response, NOT the subdomain string. Sending `"site": "blog.vastucart.in"` will return a 400 error. Always use `site_id` from the GET response.

---

## Integration: Vanilla JavaScript

This works on any site — plain HTML, WordPress, Ghost, etc.

```html
<!-- Place this where you want the Hero Banner -->
<div id="vastucart-banner-hero" style="width:100%; aspect-ratio:16/9;"></div>

<script>
(function() {
  const API_BASE = 'https://sapi.vastucart.in';
  const PUB_KEY = 'pk_d521eac4b14f6628ff8f82364940864b137126a6286445cf92b9436511d8c0ec';
  const SUBDOMAIN = 'blog.vastucart.in'; // ← change to your subdomain

  // ── 1. Fetch banners ──────────────────────────────────────────────────
  fetch(`${API_BASE}/store/ecosystem-banners/${SUBDOMAIN}`, {
    headers: { 'x-publishable-api-key': PUB_KEY }
  })
  .then(r => r.json())
  .then(({ site_id, banners }) => {
    if (!site_id || !banners.length) return; // nothing to show

    banners.forEach(item => {
      const container = document.querySelector(
        `[data-vastucart-slot="${item.slot_name}"]`
      );
      if (!container) return;

      renderBanner(container, site_id, item);
    });
  })
  .catch(err => console.warn('[VastuCart Ads] Failed to load:', err));

  // ── 2. Render a banner into a container ──────────────────────────────
  function renderBanner(container, site_id, item) {
    const { slot_id, banner } = item;

    // Build the ad element
    const link = document.createElement('a');
    link.href = banner.cta_url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.cssText = 'display:block; width:100%; height:100%;';

    const img = document.createElement('img');
    img.src = banner.creative_url;
    img.alt = banner.headline;
    img.style.cssText = 'width:100%; height:100%; object-fit:cover; display:block;';
    img.loading = 'lazy';

    link.appendChild(img);
    container.innerHTML = '';
    container.appendChild(link);

    // ── 3. Track impression (fires once when banner enters viewport) ──
    let impressionFired = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !impressionFired) {
          impressionFired = true;
          track(banner.id, site_id, slot_id, 'impression');
          observer.disconnect();
        }
      });
    }, { threshold: 0.5 }); // 50% visible = impression
    observer.observe(container);

    // ── 4. Track click ───────────────────────────────────────────────
    link.addEventListener('click', function() {
      track(banner.id, site_id, slot_id, 'click');
      // Navigation proceeds normally — do NOT preventDefault()
    });
  }

  // ── 5. Fire a tracking event ─────────────────────────────────────────
  function track(banner_id, site_id, slot_id, event_type) {
    // Use sendBeacon for reliability (works even as user navigates away)
    const payload = JSON.stringify({ banner_id, site_id, slot_id, event_type });
    const url = `${API_BASE}/store/ecosystem-banners/track`;

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
    } else {
      // Fallback for older browsers
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': PUB_KEY
        },
        body: payload,
        keepalive: true
      }).catch(() => {}); // silent failure
    }
  }
})();
</script>
```

### HTML slot markers

Add `data-vastucart-slot` attributes on your containers matching the slot names from admin:

```html
<!-- Matches slot named "Hero Banner" -->
<div data-vastucart-slot="Hero Banner"
     style="width:100%; aspect-ratio:16/9; overflow:hidden;">
</div>

<!-- Matches slot named "Sidebar Square" -->
<div data-vastucart-slot="Sidebar Square"
     style="width:300px; aspect-ratio:1/1; overflow:hidden;">
</div>
```

---

## Integration: React / Next.js

```tsx
// components/VastuCartBanner.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

const API_BASE = 'https://sapi.vastucart.in';
const PUB_KEY = 'pk_d521eac4b14f6628ff8f82364940864b137126a6286445cf92b9436511d8c0ec';

type BannerData = {
  slot_name: string;
  slot_id: string;
  ratio: string;
  banner: {
    id: string;
    headline: string;
    cta_text: string;
    cta_url: string;
    creative_url: string;
    creative_width: number;
    creative_height: number;
  };
};

type BannerResponse = {
  site_id: string | null;
  banners: BannerData[];
};

// ── Hook: fetch all banners once ──────────────────────────────────────────
export function useEcosystemBanners(subdomain: string) {
  const [data, setData] = useState<BannerResponse>({ site_id: null, banners: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/store/ecosystem-banners/${subdomain}`, {
      headers: { 'x-publishable-api-key': PUB_KEY },
    })
      .then(r => r.json())
      .then((res: BannerResponse) => setData(res))
      .catch(() => {}) // fail silently — ads are non-critical
      .finally(() => setLoading(false));
  }, [subdomain]);

  return { ...data, loading };
}

// ── Single slot component ─────────────────────────────────────────────────
export function EcosystemBannerSlot({
  slotName,
  subdomain,
  className,
}: {
  slotName: string;
  subdomain: string;
  className?: string;
}) {
  const { site_id, banners } = useEcosystemBanners(subdomain);
  const containerRef = useRef<HTMLDivElement>(null);
  const impressionFired = useRef(false);

  const item = banners.find(b => b.slot_name === slotName);

  // Track impression via IntersectionObserver
  useEffect(() => {
    if (!item || !site_id || !containerRef.current || impressionFired.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !impressionFired.current) {
            impressionFired.current = true;
            track(item.banner.id, site_id, item.slot_id, 'impression');
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [item, site_id]);

  if (!item || !site_id) return null;

  const { banner, slot_id } = item;

  const handleClick = () => {
    track(banner.id, site_id, slot_id, 'click');
  };

  return (
    <div ref={containerRef} className={className}>
      <a
        href={banner.cta_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <img
          src={banner.creative_url}
          alt={banner.headline}
          width={banner.creative_width}
          height={banner.creative_height}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
      </a>
    </div>
  );
}

// ── Tracking utility ──────────────────────────────────────────────────────
function track(
  banner_id: string,
  site_id: string,
  slot_id: string,
  event_type: 'impression' | 'click'
) {
  const payload = JSON.stringify({ banner_id, site_id, slot_id, event_type });
  const url = `${API_BASE}/store/ecosystem-banners/track`;

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
  } else {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUB_KEY,
      },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
}
```

**Usage in a Next.js page:**

```tsx
// app/blog/page.tsx
import { EcosystemBannerSlot } from '@/components/VastuCartBanner';

export default function BlogPage() {
  return (
    <main>
      {/* Hero banner — full width, 16:9 */}
      <EcosystemBannerSlot
        subdomain="blog.vastucart.in"
        slotName="Hero Banner"
        className="w-full aspect-video overflow-hidden rounded-lg mb-8"
      />

      <article>
        {/* Blog content... */}
      </article>

      {/* Sidebar square banner — 300×300 */}
      <aside>
        <EcosystemBannerSlot
          subdomain="blog.vastucart.in"
          slotName="Sidebar Square"
          className="w-[300px] aspect-square overflow-hidden rounded"
        />
      </aside>
    </main>
  );
}
```

---

## Aspect Ratio Reference

Configure your containers to match the slot ratio:

| Ratio | Use case | CSS aspect-ratio | Typical dimensions |
|-------|----------|-------------------|--------------------|
| `16:9` | Hero banners, headers | `aspect-video` / `16/9` | 1920×1080 |
| `1:1` | Sidebar squares, Instagram | `aspect-square` / `1/1` | 1080×1080 |
| `9:16` | Mobile stories, portrait | `9/16` | 1080×1920 |
| `16:3` | Leaderboard strips | `16/3` | 1920×360 |
| `4:3` | Content blocks | `4/3` | 1200×900 |
| `2:3` | Pinterest, vertical | `2/3` | 1000×1500 |

---

## Impression Tracking Best Practices

**When to fire:**
- ✅ When the banner is **50% visible** in the viewport (use IntersectionObserver with `threshold: 0.5`)
- ✅ **Once per page load** — do not fire on every scroll event
- ✅ On the actual ad image, not a placeholder

**When NOT to fire:**
- ❌ On page mount before checking viewport visibility
- ❌ Multiple times for the same banner instance
- ❌ For banners hidden in collapsed sections

```js
// Correct — wait for 50% visibility
const observer = new IntersectionObserver(
  ([entry]) => { if (entry.isIntersecting) { /* fire once */ } },
  { threshold: 0.5 }
);
observer.observe(bannerElement);
```

---

## Click Tracking Best Practices

**When to fire:**
- ✅ On the `click` event of the CTA link, **before** the browser navigates
- ✅ Use `navigator.sendBeacon` so the request survives page unload

```js
// Correct — sendBeacon survives navigation
link.addEventListener('click', () => {
  navigator.sendBeacon(url, blob);
  // Don't preventDefault — let the link navigate normally
});
```

---

## Verifying Analytics

After integrating, verify tracking works:

1. Open your page in a browser (or use curl as below)
2. In Admin → Ecosystem Ads → Analytics, the numbers should update within a few seconds of page refresh

**Manual test (curl):**
```bash
# Step 1: Get your site_id
curl "https://sapi.vastucart.in/store/ecosystem-banners/blog.vastucart.in" \
  -H "x-publishable-api-key: pk_d521eac4b14f6628ff8f82364940864b137126a6286445cf92b9436511d8c0ec"
# Note the "site_id", "banners[0].banner.id", "banners[0].slot_id" values

# Step 2: Fire a test impression
curl -X POST "https://sapi.vastucart.in/store/ecosystem-banners/track" \
  -H "x-publishable-api-key: pk_d521eac4b14f6628ff8f82364940864b137126a6286445cf92b9436511d8c0ec" \
  -H "Content-Type: application/json" \
  -d '{
    "banner_id": "<banner.id from step 1>",
    "site_id":   "<site_id from step 1>",
    "slot_id":   "<slot_id from step 1>",
    "event_type": "impression"
  }'
# Expected: {"success": true}

# Step 3: Fire a test click
# (same as above but event_type: "click")
```

Then refresh Admin → Ecosystem Ads → Analytics to see the updated count.

---

## Common Mistakes

### ❌ Using `site` (subdomain string) instead of `site_id`

```js
// WRONG — will return 400 error
{ "banner_id": "...", "site": "blog.vastucart.in", "slot_id": "...", "event_type": "impression" }

// CORRECT — use site_id from GET response
{ "banner_id": "...", "site_id": "01KJ4ES03EFQPHJ0A2JJ7B7D5X", "slot_id": "...", "event_type": "impression" }
```

### ❌ Firing impression on mount (not viewport entry)

```js
// WRONG — fires even if banner is below the fold, never seen
useEffect(() => { track(..., 'impression'); }, []);

// CORRECT — fires only when visible
// Use IntersectionObserver with threshold: 0.5
```

### ❌ Calling the GET API on every component render

```js
// WRONG — floods the API, wastes bandwidth
const banners = useFetch(`/store/ecosystem-banners/${subdomain}`); // runs every render

// CORRECT — fetch once per page, cache in state/context
const [banners, setBanners] = useState(null);
useEffect(() => { fetch(...).then(setBanners); }, []); // empty deps = once
```

### ❌ Not having a creative uploaded for the slot ratio

The public API returns `banners: []` if the assigned banner has no creative matching the slot's ratio. The admin must upload a creative with the matching aspect ratio. The admin dropdown allows assigning any active banner, but serving requires a matching creative.

---

## What Shows Up in Analytics

Every tracking call you send creates a row in the `banner_event` table. The Analytics tab aggregates:

| Metric | How calculated |
|--------|----------------|
| **Impressions** | Count of `event_type = "impression"` rows for this banner × site |
| **Clicks** | Count of `event_type = "click"` rows for this banner × site |
| **CTR** | `(clicks / impressions) × 100`, shown as percentage |

The banner cards on the Banners tab also show these stats in real time.

Filtering by period (month) uses the `created_at` timestamp on each event row.

---

## Slot Setup Checklist (Admin side)

Before the partner integration will return any banners, the VastuCart admin must complete:

- [ ] Site added in Placements with exact subdomain
- [ ] At least one slot created with a named placement and ratio
- [ ] Banner created with Status = `Live` and Active = toggled on
- [ ] Creative uploaded for the same ratio as the slot
- [ ] Banner assigned to the slot

The partner should verify by calling:
```
GET /store/ecosystem-banners/<their-subdomain>
```
and confirming `banners` array is non-empty.
