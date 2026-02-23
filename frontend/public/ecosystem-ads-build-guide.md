# Ecosystem Ads — Build From Scratch Guide

This document describes the complete architecture and implementation of the VastuCart Ecosystem Ads system. If you give this document to a coding agent, it should be able to rebuild the full system from scratch in one pass.

**Stack:** Medusa v2 (backend), Next.js 14 App Router (frontend), PostgreSQL (via Neon/Docker), TypeScript throughout.

---

## What This System Does

A first-party ad network that lets the store owner (VastuCart admin) manage promotional banners and distribute them across multiple partner websites in their ecosystem. Key capabilities:

- Create banners with headline, CTA, and images in 6 aspect ratios
- Register partner sites and their ad slots (by subdomain + slot name + ratio)
- Assign banners to slots
- Partner sites fetch their banners via a public API, render them, fire tracking events
- Real-time impression + click analytics in the admin
- Scheduled banner lifecycle: draft → scheduled → live → expired
- Social publishing: publish a banner's creative to Pinterest, Instagram, Facebook, Twitter, Threads

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  BACKEND (Medusa v2)                                                │
│                                                                     │
│  Module: ecosystem-ads                                              │
│  ├── Models: EcosystemBanner, EcosystemSite, EcosystemSlot,        │
│  │           BannerEvent, SocialPost                               │
│  ├── Service: EcosystemAdsService (MedusaService auto-CRUD)        │
│  └── Social publisher: platform API calls                          │
│                                                                     │
│  Admin API routes (/api/admin/ecosystem-ads/*) — JWT auth          │
│  Store API routes (/api/store/ecosystem-banners/*) — pub key       │
│                                                                     │
│  Scheduled job: ecosystem-banner-status (hourly)                   │
└─────────────────────────────────────────────────────────────────────┘
               ↕ HTTP
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND ADMIN (Next.js — /admin/ecosystem-ads)                   │
│  ├── hook: useAdminEcosystemAds.ts                                 │
│  ├── page: app/admin/ecosystem-ads/page.tsx                        │
│  └── component: components/admin/ecosystem-ads/AdminEcosystemAds   │
│      ├── Tab 1: Banners (CRUD, creative upload, toggle)            │
│      ├── Tab 2: Placements (sites, slots, assign banners)          │
│      ├── Tab 3: Analytics (summary cards + table)                  │
│      └── Tab 4: Social Publishing (post to platforms)             │
└─────────────────────────────────────────────────────────────────────┘
               ↕ HTTP
┌─────────────────────────────────────────────────────────────────────┐
│  PARTNER SITES (any stack)                                         │
│  GET /store/ecosystem-banners/:subdomain → fetch banners           │
│  POST /store/ecosystem-banners/track → send impression/click       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Create the Medusa Module

### 1.1 Directory structure

```
backend/src/modules/ecosystem-ads/
├── index.ts
├── service.ts
├── social-publisher.ts
└── models/
    ├── banner.ts
    ├── ecosystem-site.ts
    ├── ecosystem-slot.ts
    ├── banner-event.ts
    └── social-post.ts
```

### 1.2 Models

**`models/banner.ts`**
```typescript
import { model } from "@medusajs/framework/utils"

const EcosystemBanner = model.define("ecosystem_banner", {
  id: model.id().primaryKey(),
  name: model.text().searchable(),
  headline: model.text(),
  cta_text: model.text().default(""),
  cta_url: model.text().default(""),
  status: model.enum(["draft", "scheduled", "live", "expired"]).default("draft"),
  is_active: model.boolean().default(false),
  start_date: model.dateTime().nullable(),
  end_date: model.dateTime().nullable(),
  priority: model.number().default(1),
  product_ids_json: model.text().default("[]"),
  product_names_json: model.text().default("[]"),
  creatives_json: model.text().default("[]"),
})

export default EcosystemBanner
```

> **Why JSON-in-text?** Medusa v2 module models do not support native JSON/JSONB columns. Use `model.text()` with `_json` suffix convention and `JSON.parse/stringify` in the service. All complex arrays/objects must be serialized this way.

**`models/ecosystem-site.ts`**
```typescript
import { model } from "@medusajs/framework/utils"

const EcosystemSite = model.define("ecosystem_site", {
  id: model.id().primaryKey(),
  subdomain: model.text().searchable(),
  display_name: model.text(),
  is_active: model.boolean().default(true),
})

export default EcosystemSite
```

**`models/ecosystem-slot.ts`**
```typescript
import { model } from "@medusajs/framework/utils"

const EcosystemSlot = model.define("ecosystem_slot", {
  id: model.id().primaryKey(),
  site_id: model.text(),
  name: model.text(),
  ratio: model.text(),
  is_active: model.boolean().default(true),
  current_banner_id: model.text().nullable(),
})

export default EcosystemSlot
```

> Note: `current_banner_id` is a plain `text` field, not a foreign key relation, so we can set it to null without cascade. Medusa v2 handles null on `model.text().nullable()` correctly.

**`models/banner-event.ts`**
```typescript
import { model } from "@medusajs/framework/utils"

const BannerEvent = model.define("banner_event", {
  id: model.id().primaryKey(),
  banner_id: model.text(),
  site_id: model.text(),
  slot_id: model.text(),
  event_type: model.enum(["impression", "click"]),
})

export default BannerEvent
```

**`models/social-post.ts`**
```typescript
import { model } from "@medusajs/framework/utils"

const SocialPost = model.define("social_post", {
  id: model.id().primaryKey(),
  banner_id: model.text(),
  platform: model.enum(["pinterest", "instagram", "facebook", "twitter", "threads"]),
  post_url: model.text().default(""),
  status: model.enum(["published", "pending", "failed"]).default("pending"),
  published_at: model.dateTime().nullable(),
  caption: model.text().default(""),
  meta_json: model.text().default("{}"),
})

export default SocialPost
```

### 1.3 Service

**`service.ts`** — full implementation:

```typescript
import { MedusaService } from "@medusajs/framework/utils"
import EcosystemBanner from "./models/banner"
import EcosystemSite from "./models/ecosystem-site"
import EcosystemSlot from "./models/ecosystem-slot"
import SocialPost from "./models/social-post"
import BannerEvent from "./models/banner-event"

type ParsedBanner = {
  id: string
  name: string
  headline: string
  cta_text: string
  cta_url: string
  status: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
  priority: number
  product_ids: string[]
  product_names: string[]
  creatives: { ratio: string; imageUrl: string; width: number; height: number }[]
  placements: string[]
  impressions: number
  clicks: number
  created_at: string
}

class EcosystemAdsService extends MedusaService({
  EcosystemBanner,
  EcosystemSite,
  EcosystemSlot,
  SocialPost,
  BannerEvent,
}) {
  // ── Helper: parse a raw DB row into a typed banner ──────────────────
  private parseBanner(raw: any): ParsedBanner {
    return {
      id: raw.id,
      name: raw.name,
      headline: raw.headline,
      cta_text: raw.cta_text,
      cta_url: raw.cta_url,
      status: raw.status,
      is_active: raw.is_active,
      start_date: raw.start_date,
      end_date: raw.end_date,
      priority: raw.priority,
      product_ids: this.safeJsonParse(raw.product_ids_json, []),
      product_names: this.safeJsonParse(raw.product_names_json, []),
      creatives: this.safeJsonParse(raw.creatives_json, []),
      placements: [],
      impressions: 0,
      clicks: 0,
      created_at: raw.created_at,
    }
  }

  private safeJsonParse(json: string | null | undefined, fallback: any): any {
    if (!json) return fallback
    try { return JSON.parse(json) } catch { return fallback }
  }

  // ── List all banners with stats (admin) ──────────────────────────────
  async listBannersWithStats(): Promise<ParsedBanner[]> {
    const banners = await this.listEcosystemBanners(
      {}, { order: { created_at: "DESC" }, take: 500 }
    )
    const slots = await this.listEcosystemSlots({}, { take: 5000 })
    const events = await this.listBannerEvents({}, { take: 100000 })

    const eventsByBanner = new Map<string, { impressions: number; clicks: number }>()
    for (const ev of events) {
      const entry = eventsByBanner.get(ev.banner_id) || { impressions: 0, clicks: 0 }
      if (ev.event_type === "impression") entry.impressions++
      else if (ev.event_type === "click") entry.clicks++
      eventsByBanner.set(ev.banner_id, entry)
    }

    return banners.map((raw: any) => {
      const parsed = this.parseBanner(raw)
      parsed.placements = slots
        .filter((s: any) => s.current_banner_id === raw.id)
        .map((s: any) => s.id)
      const stats = eventsByBanner.get(raw.id)
      if (stats) {
        parsed.impressions = stats.impressions
        parsed.clicks = stats.clicks
      }
      return parsed
    })
  }

  async getBannerParsed(id: string): Promise<ParsedBanner | null> {
    const raw = await this.retrieveEcosystemBanner(id)
    if (!raw) return null
    return this.parseBanner(raw)
  }

  // ── Banner lifecycle management ──────────────────────────────────────
  async updateBannerStatuses(): Promise<number> {
    const now = new Date()
    let updated = 0

    const scheduled = await this.listEcosystemBanners(
      { status: "scheduled" }, { take: 500 }
    )
    for (const banner of scheduled) {
      if (banner.start_date && new Date(banner.start_date) <= now) {
        await this.updateEcosystemBanners({ id: banner.id, status: "live", is_active: true })
        updated++
      }
    }

    const live = await this.listEcosystemBanners(
      { status: "live" }, { take: 500 }
    )
    for (const banner of live) {
      if (banner.end_date && new Date(banner.end_date) < now) {
        await this.updateEcosystemBanners({ id: banner.id, status: "expired", is_active: false })
        updated++
      }
    }

    return updated
  }

  // ── Sites with their slots (admin placements view) ───────────────────
  async listSitesWithSlots(): Promise<any[]> {
    const sites = await this.listEcosystemSites({}, { take: 100 })
    const allSlots = await this.listEcosystemSlots({}, { take: 5000 })
    const allBanners = await this.listEcosystemBanners({}, { take: 500 })

    const bannerMap = new Map<string, string>()
    for (const b of allBanners) bannerMap.set(b.id, b.name)

    return sites.map((site: any) => ({
      id: site.id,
      subdomain: site.subdomain,
      display_name: site.display_name,
      is_active: site.is_active,
      created_at: site.created_at,
      slots: allSlots
        .filter((s: any) => s.site_id === site.id)
        .map((s: any) => ({
          id: s.id,
          site_id: s.site_id,
          name: s.name,
          ratio: s.ratio,
          is_active: s.is_active,
          current_banner_id: s.current_banner_id || null,
          current_banner_name: s.current_banner_id
            ? bannerMap.get(s.current_banner_id) || null
            : null,
        })),
    }))
  }

  // ── Assign/unassign banner to slot ───────────────────────────────────
  async assignSlot(
    slotId: string,
    bannerId: string
  ): Promise<{ success: boolean; error?: string }> {
    const slot = await this.retrieveEcosystemSlot(slotId)
    if (!slot) return { success: false, error: "Slot not found" }

    const banner = await this.retrieveEcosystemBanner(bannerId)
    if (!banner) return { success: false, error: "Banner not found" }

    // Validate that banner has a creative matching the slot ratio
    const creatives = this.safeJsonParse(banner.creatives_json, [])
    const hasMatchingRatio = creatives.some((cr: any) => cr.ratio === slot.ratio)
    if (!hasMatchingRatio) {
      return { success: false, error: `Banner doesn't have a ${slot.ratio} creative` }
    }

    await this.updateEcosystemSlots({ id: slotId, current_banner_id: bannerId })
    return { success: true }
  }

  async removeSlotAssignment(slotId: string): Promise<void> {
    await this.updateEcosystemSlots({ id: slotId, current_banner_id: null as any })
  }

  // ── Analytics aggregation ────────────────────────────────────────────
  async trackEvent(
    bannerId: string,
    siteId: string,
    slotId: string,
    eventType: "impression" | "click"
  ): Promise<void> {
    await this.createBannerEvents({
      banner_id: bannerId,
      site_id: siteId,
      slot_id: slotId,
      event_type: eventType,
    })
  }

  async getAnalytics(period?: string): Promise<{
    analytics: any[]
    summary: {
      totalImpressions: number
      totalClicks: number
      avgCtr: number
      activeBanners: number
    }
  }> {
    let events = await this.listBannerEvents({}, { take: 100000 })

    // Optional filter by "YYYY-MM" period
    if (period) {
      events = events.filter((ev: any) => {
        const evDate = new Date(ev.created_at)
        const evPeriod = `${evDate.getFullYear()}-${String(evDate.getMonth() + 1).padStart(2, "0")}`
        return evPeriod === period
      })
    }

    const banners = await this.listEcosystemBanners({}, { take: 500 })
    const sites = await this.listEcosystemSites({}, { take: 100 })
    const bannerMap = new Map<string, string>()
    const siteMap = new Map<string, string>()
    for (const b of banners) bannerMap.set(b.id, b.name)
    for (const s of sites) siteMap.set(s.id, s.subdomain)

    const aggMap = new Map<string, { impressions: number; clicks: number }>()
    for (const ev of events) {
      const key = `${ev.banner_id}::${ev.site_id}`
      const entry = aggMap.get(key) || { impressions: 0, clicks: 0 }
      if (ev.event_type === "impression") entry.impressions++
      else if (ev.event_type === "click") entry.clicks++
      aggMap.set(key, entry)
    }

    const analytics: any[] = []
    let totalImpressions = 0
    let totalClicks = 0

    for (const [key, stats] of aggMap.entries()) {
      const [bannerId, siteId] = key.split("::")
      totalImpressions += stats.impressions
      totalClicks += stats.clicks
      analytics.push({
        bannerId,
        bannerName: bannerMap.get(bannerId) || bannerId,
        site: siteMap.get(siteId) || siteId,
        impressions: stats.impressions,
        clicks: stats.clicks,
        ctr: stats.impressions > 0
          ? parseFloat(((stats.clicks / stats.impressions) * 100).toFixed(2))
          : 0,
        period: period || "all",
      })
    }

    analytics.sort((a, b) => b.impressions - a.impressions)

    const activeBanners = banners.filter(
      (b: any) => b.is_active && b.status === "live"
    ).length

    return {
      analytics,
      summary: {
        totalImpressions,
        totalClicks,
        avgCtr: totalImpressions > 0
          ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2))
          : 0,
        activeBanners,
      },
    }
  }

  // ── Public banner serving ────────────────────────────────────────────
  // Returns { site_id, banners[] } — site_id included for tracking calls
  async getBannersForSite(
    subdomain: string
  ): Promise<{ site_id: string | null; banners: any[] }> {
    const sites = await this.listEcosystemSites({ subdomain }, { take: 1 })
    if (sites.length === 0) return { site_id: null, banners: [] }

    const site = sites[0]
    if (!site.is_active) return { site_id: site.id, banners: [] }

    const slots = await this.listEcosystemSlots(
      { site_id: site.id, is_active: true }, { take: 100 }
    )

    const results: any[] = []
    for (const slot of slots) {
      if (!slot.current_banner_id) continue
      try {
        const banner = await this.retrieveEcosystemBanner(slot.current_banner_id)
        if (!banner || !banner.is_active || banner.status !== "live") continue

        const creatives = this.safeJsonParse(banner.creatives_json, [])
        const matchingCreative = creatives.find((cr: any) => cr.ratio === slot.ratio)
        if (!matchingCreative) continue  // must have matching creative to serve

        results.push({
          slot_name: slot.name,
          slot_id: slot.id,
          ratio: slot.ratio,
          banner: {
            id: banner.id,
            headline: banner.headline,
            cta_text: banner.cta_text,
            cta_url: banner.cta_url,
            creative_url: matchingCreative.imageUrl,
            creative_width: matchingCreative.width,
            creative_height: matchingCreative.height,
          },
        })
      } catch {
        continue  // banner may have been deleted mid-request
      }
    }

    return { site_id: site.id, banners: results }
  }

  // ── Social posts ─────────────────────────────────────────────────────
  async listSocialPostsParsed(platform?: string): Promise<any[]> {
    const filter: any = {}
    if (platform) filter.platform = platform

    const posts = await this.listSocialPosts(filter, {
      order: { created_at: "DESC" }, take: 100,
    })

    const banners = await this.listEcosystemBanners({}, { take: 500 })
    const bannerMap = new Map<string, string>()
    for (const b of banners) bannerMap.set(b.id, b.name)

    return posts.map((post: any) => ({
      id: post.id,
      banner_id: post.banner_id,
      banner_name: bannerMap.get(post.banner_id) || "Unknown",
      platform: post.platform,
      post_url: post.post_url,
      status: post.status,
      published_at: post.published_at,
      caption: post.caption,
      meta: this.safeJsonParse(post.meta_json, {}),
      created_at: post.created_at,
    }))
  }
}

export default EcosystemAdsService
```

### 1.4 Module index

**`index.ts`**
```typescript
import { Module } from "@medusajs/framework/utils"
import EcosystemAdsService from "./service"

export const ECOSYSTEM_ADS_MODULE = "ecosystemAdsModuleService"

export default Module(ECOSYSTEM_ADS_MODULE, {
  service: EcosystemAdsService,
})
```

### 1.5 Register in medusa-config.ts

```typescript
// backend/medusa-config.ts
import { ECOSYSTEM_ADS_MODULE } from "./src/modules/ecosystem-ads"

export default defineConfig({
  // ... other config
  modules: [
    // ... other modules
    {
      resolve: "./src/modules/ecosystem-ads",
      options: {},
    },
  ],
})
```

### 1.6 Run migration

After registering, generate and run the DB migration:
```bash
cd backend
npx medusa db:generate ecosystem-ads-module  # generates migration file
npx medusa db:migrate                         # applies to DB
```

---

## Step 2: Backend API Routes

### 2.1 Directory structure

```
backend/src/api/
├── admin/ecosystem-ads/
│   ├── banners/
│   │   ├── route.ts                     GET list, POST create
│   │   └── [id]/
│   │       ├── route.ts                 GET one, POST update, DELETE
│   │       └── toggle/route.ts          POST toggle is_active
│   ├── sites/
│   │   ├── route.ts                     GET list, POST create
│   │   └── [id]/
│   │       ├── route.ts                 POST update, DELETE
│   │       └── toggle/route.ts          POST toggle is_active
│   ├── slots/
│   │   ├── route.ts                     POST create
│   │   └── [id]/assign/route.ts         POST assign, DELETE unassign
│   ├── analytics/route.ts               GET analytics
│   └── social/
│       ├── accounts/route.ts            GET connected accounts
│       ├── config/route.ts              GET/POST social credentials
│       ├── posts/route.ts               GET published posts
│       └── publish/route.ts             POST publish to platform
└── store/ecosystem-banners/
    ├── [subdomain]/route.ts             GET banners for site
    └── track/route.ts                   POST track impression/click
```

### 2.2 Store API — Fetch banners

**`store/ecosystem-banners/[subdomain]/route.ts`**
```typescript
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ECOSYSTEM_ADS_MODULE } from "../../../../modules/ecosystem-ads"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const subdomain = req.params.subdomain

    const { site_id, banners } = await adsService.getBannersForSite(subdomain)

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60")
    res.json({ site_id, banners })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to get banners" })
  }
}
```

### 2.3 Store API — Track events

**`store/ecosystem-banners/track/route.ts`**
```typescript
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ECOSYSTEM_ADS_MODULE } from "../../../../modules/ecosystem-ads"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const body = req.body as any
    const { banner_id, site_id, slot_id, event_type } = body

    if (!banner_id || !site_id || !slot_id || !event_type) {
      res.status(400).json({
        message: "banner_id, site_id, slot_id, and event_type are required",
      })
      return
    }

    if (!["impression", "click"].includes(event_type)) {
      res.status(400).json({ message: "event_type must be 'impression' or 'click'" })
      return
    }

    await adsService.trackEvent(banner_id, site_id, slot_id, event_type)
    res.json({ success: true })
  } catch (err: any) {
    res.json({ success: false })  // always 200, never fail tracking
  }
}
```

### 2.4 Admin API — Banners

**`admin/ecosystem-ads/banners/route.ts`**
```typescript
export async function GET(req, res) {
  const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
  const banners = await adsService.listBannersWithStats()
  res.json({ banners })
}

export async function POST(req, res) {
  const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
  const body = req.body as any
  const banner = await adsService.createEcosystemBanners({
    name: body.name || "",
    headline: body.headline || "",
    cta_text: body.cta_text || "",
    cta_url: body.cta_url || "",
    status: body.status || "draft",
    is_active: body.is_active ?? false,
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    priority: body.priority ?? 1,
    product_ids_json: JSON.stringify(body.product_ids || []),
    product_names_json: JSON.stringify(body.product_names || []),
    creatives_json: JSON.stringify(body.creatives || []),
  })
  res.status(201).json({ banner })
}
```

**`admin/ecosystem-ads/banners/[id]/route.ts`**
- `GET` → `adsService.getBannerParsed(id)`
- `POST` → build updates object with any defined body fields, stringify JSON fields, call `updateEcosystemBanners`
- `DELETE` → first null out `current_banner_id` on all slots that reference this banner, then `deleteEcosystemBanners`

**`admin/ecosystem-ads/banners/[id]/toggle/route.ts`**
```typescript
export async function POST(req, res) {
  const banner = await adsService.retrieveEcosystemBanner(req.params.id)
  await adsService.updateEcosystemBanners(req.params.id, { is_active: !banner.is_active })
  res.json({ is_active: !banner.is_active })
}
```

### 2.5 Admin API — Sites

**`admin/ecosystem-ads/sites/route.ts`**
- `GET` → `adsService.listSitesWithSlots()`
- `POST` → `adsService.createEcosystemSites({ subdomain, display_name, is_active })`

**`admin/ecosystem-ads/sites/[id]/route.ts`**
- `POST` → update site fields
- `DELETE` → cascade delete all slots for site, then delete site

### 2.6 Admin API — Slots

**`admin/ecosystem-ads/slots/route.ts`**
- `POST` → validate `site_id`, `name`, `ratio` required, then `createEcosystemSlots`

**`admin/ecosystem-ads/slots/[id]/assign/route.ts`**
- `POST` with `{ banner_id }` → `adsService.assignSlot(slotId, bannerId)` — validates creative ratio match
- `DELETE` → `adsService.removeSlotAssignment(slotId)` — sets `current_banner_id` to null

### 2.7 Admin API — Analytics

**`admin/ecosystem-ads/analytics/route.ts`**
```typescript
export async function GET(req, res) {
  const period = req.query.period as string | undefined  // e.g. "2026-02"
  const result = await adsService.getAnalytics(period)
  res.json(result)
}
```

Response shape:
```json
{
  "analytics": [
    {
      "bannerId": "...",
      "bannerName": "VastuCart — Sacred Essentials",
      "site": "blog.vastucart.in",
      "impressions": 8,
      "clicks": 3,
      "ctr": 37.5,
      "period": "all"
    }
  ],
  "summary": {
    "totalImpressions": 8,
    "totalClicks": 3,
    "avgCtr": 37.5,
    "activeBanners": 1
  }
}
```

### 2.8 Admin API — Social Publishing

Social publishing requires credentials per platform, stored in `store.metadata.social_config`:

```json
{
  "pinterest": { "access_token": "...", "board_id": "...", "username": "..." },
  "instagram": { "access_token": "...", "ig_user_id": "...", "username": "..." },
  "facebook": { "access_token": "...", "page_id": "...", "username": "..." },
  "twitter": { "api_key": "...", "api_secret": "...", "access_token": "...", "access_secret": "..." },
  "threads": { "access_token": "...", "user_id": "...", "username": "..." }
}
```

**Routes:**
- `GET /admin/ecosystem-ads/social/accounts` — list platforms with `isConnected: boolean` (checks if `access_token` present)
- `GET /admin/ecosystem-ads/social/config` — read raw config (for settings form)
- `POST /admin/ecosystem-ads/social/config` — save credentials to `store.metadata`
- `GET /admin/ecosystem-ads/social/posts` — list published posts
- `POST /admin/ecosystem-ads/social/publish` — publish banner to platform

**`social/publish/route.ts`** flow:
1. Validate `banner_id` and `platform`
2. Retrieve banner; get its creatives
3. Read `socialConfig` from store metadata
4. Check `platformConfig.access_token` exists
5. Create `SocialPost` record with `status: "pending"`
6. Select creative by platform's preferred ratio (`pinterest=2:3`, `instagram=1:1`, `facebook=16:9`, `twitter=16:9`, `threads=1:1`)
7. Call `publishToSocialPlatform()` (see `social-publisher.ts`)
8. Update `SocialPost` status to `"published"` or `"failed"`

**`social-publisher.ts`** — implement per platform:
```typescript
export async function publishToSocialPlatform(params: {
  platform: string
  config: Record<string, any>
  caption: string
  meta: Record<string, any>
  imageUrl: string
  headline: string
  ctaUrl: string
}): Promise<{ success: boolean; postUrl?: string; error?: string }>
```

---

## Step 3: Scheduled Job

**`backend/src/jobs/ecosystem-banner-status.ts`**
```typescript
import type { MedusaContainer } from "@medusajs/framework/types"
import { ECOSYSTEM_ADS_MODULE } from "../modules/ecosystem-ads"

export default async function ecosystemBannerStatusJob(container: MedusaContainer) {
  const logger = container.resolve("logger") as any
  const adsService = container.resolve(ECOSYSTEM_ADS_MODULE) as any
  const updated = await adsService.updateBannerStatuses()
  if (updated > 0) {
    logger.info(`[ecosystem-banner-status] Updated ${updated} banner statuses`)
  }
}

export const config = {
  name: "ecosystem-banner-status",
  schedule: "0 * * * *",  // every hour
}
```

This job transitions banners:
- `scheduled` → `live` (when `start_date` ≤ now)
- `live` → `expired` (when `end_date` < now, sets `is_active: false`)

---

## Step 4: Frontend Types

**`frontend/src/types/` — add to existing types file or create `ecosystem-ads.ts`:**

```typescript
export type BannerCreative = {
  ratio: string       // "16:9" | "1:1" | "9:16" | "16:3" | "4:3" | "2:3"
  imageUrl: string
  width: number
  height: number
}

export type Banner = {
  id: string
  name: string
  headline: string
  cta_text: string
  cta_url: string
  status: "draft" | "scheduled" | "live" | "expired"
  is_active: boolean
  start_date: string | null
  end_date: string | null
  priority: number
  product_ids: string[]
  product_names: string[]
  creatives: BannerCreative[]
  placements: string[]      // slot IDs
  impressions: number
  clicks: number
  created_at: string
}

export type EcosystemSlot = {
  id: string
  site_id: string
  name: string
  ratio: string
  is_active: boolean
  current_banner_id: string | null
  current_banner_name: string | null
}

export type EcosystemSite = {
  id: string
  subdomain: string
  display_name: string
  is_active: boolean
  created_at: string
  slots: EcosystemSlot[]
}

export type BannerAnalytics = {
  bannerId: string
  bannerName: string
  site: string
  impressions: number
  clicks: number
  ctr: number
  period: string
}

export type AnalyticsSummary = {
  totalImpressions: number
  totalClicks: number
  avgCtr: number
  activeBanners: number
}

export type SocialAccount = {
  platform: string
  isConnected: boolean
  username: string
  displayName: string
  preferredRatio: string
}

export type SocialPost = {
  id: string
  banner_id: string
  banner_name: string
  platform: string
  post_url: string
  status: "published" | "pending" | "failed"
  published_at: string | null
  caption: string
  meta: Record<string, any>
  created_at: string
}

export type BannerFormData = {
  name: string
  headline: string
  cta_text: string
  cta_url: string
  status: "draft" | "scheduled" | "live" | "expired"
  is_active: boolean
  start_date?: string
  end_date?: string
  priority: number
  product_ids: string[]
  product_names: string[]
  creatives: BannerCreative[]
}

export type AdTab = "banners" | "placements" | "analytics" | "social"
```

---

## Step 5: Frontend Admin Hook

**`frontend/src/hooks/useAdminEcosystemAds.ts`**

```typescript
import { useCallback } from "react"
import type {
  Banner, BannerFormData, EcosystemSite, BannerAnalytics,
  AnalyticsSummary, SocialAccount, SocialPost
} from "@/types/ecosystem-ads"

export function useAdminEcosystemAds() {
  // All admin API calls use the admin JWT via httpOnly cookie.
  // adminFetch() adds Authorization header automatically.
  const adminFetch = useCallback(async (path: string, options?: RequestInit) => {
    const res = await fetch(`/api/admin${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `HTTP ${res.status}`)
    }
    return res.json()
  }, [])

  // ── Banners ───────────────────────────────────────────────────────
  const fetchBanners = useCallback(async (): Promise<Banner[]> => {
    const data = await adminFetch("/ecosystem-ads/banners")
    return data?.banners || []
  }, [adminFetch])

  const createBanner = useCallback(async (form: BannerFormData): Promise<Banner> => {
    const data = await adminFetch("/ecosystem-ads/banners", {
      method: "POST",
      body: JSON.stringify(form),
    })
    return data.banner
  }, [adminFetch])

  const updateBanner = useCallback(async (
    id: string, updates: Partial<BannerFormData>
  ): Promise<Banner> => {
    const data = await adminFetch(`/ecosystem-ads/banners/${id}`, {
      method: "POST",
      body: JSON.stringify(updates),
    })
    return data.banner
  }, [adminFetch])

  const deleteBanner = useCallback(async (id: string): Promise<void> => {
    await adminFetch(`/ecosystem-ads/banners/${id}`, { method: "DELETE" })
  }, [adminFetch])

  const toggleBanner = useCallback(async (
    id: string
  ): Promise<{ is_active: boolean }> => {
    return adminFetch(`/ecosystem-ads/banners/${id}/toggle`, { method: "POST" })
  }, [adminFetch])

  // ── File upload ───────────────────────────────────────────────────
  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("files", file)
    const res = await fetch("/api/admin/uploads", {
      method: "POST",
      credentials: "include",
      body: formData,
    })
    if (!res.ok) throw new Error("Upload failed")
    const data = await res.json()
    return data.files?.[0]?.url || ""
  }, [])

  // ── Sites ─────────────────────────────────────────────────────────
  const fetchSites = useCallback(async (): Promise<EcosystemSite[]> => {
    const data = await adminFetch("/ecosystem-ads/sites")
    return data?.sites || []
  }, [adminFetch])

  const createSite = useCallback(async (body: {
    subdomain: string; display_name: string; is_active?: boolean
  }) => {
    return adminFetch("/ecosystem-ads/sites", {
      method: "POST", body: JSON.stringify(body)
    })
  }, [adminFetch])

  const updateSite = useCallback(async (id: string, updates: object) => {
    return adminFetch(`/ecosystem-ads/sites/${id}`, {
      method: "POST", body: JSON.stringify(updates)
    })
  }, [adminFetch])

  const deleteSite = useCallback(async (id: string) => {
    return adminFetch(`/ecosystem-ads/sites/${id}`, { method: "DELETE" })
  }, [adminFetch])

  const toggleSite = useCallback(async (id: string) => {
    return adminFetch(`/ecosystem-ads/sites/${id}/toggle`, { method: "POST" })
  }, [adminFetch])

  // ── Slots ─────────────────────────────────────────────────────────
  const createSlot = useCallback(async (body: {
    site_id: string; name: string; ratio: string; is_active?: boolean
  }) => {
    return adminFetch("/ecosystem-ads/slots", {
      method: "POST", body: JSON.stringify(body)
    })
  }, [adminFetch])

  const assignSlot = useCallback(async (slotId: string, bannerId: string) => {
    return adminFetch(`/ecosystem-ads/slots/${slotId}/assign`, {
      method: "POST", body: JSON.stringify({ banner_id: bannerId })
    })
  }, [adminFetch])

  const unassignSlot = useCallback(async (slotId: string) => {
    return adminFetch(`/ecosystem-ads/slots/${slotId}/assign`, { method: "DELETE" })
  }, [adminFetch])

  // ── Analytics ─────────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async (
    period?: string
  ): Promise<{ analytics: BannerAnalytics[]; summary: AnalyticsSummary }> => {
    const query = period ? `?period=${encodeURIComponent(period)}` : ""
    const data = await adminFetch(`/ecosystem-ads/analytics${query}`)
    return {
      analytics: data?.analytics || [],
      summary: data?.summary || { totalImpressions: 0, totalClicks: 0, avgCtr: 0, activeBanners: 0 },
    }
  }, [adminFetch])

  // ── Social ────────────────────────────────────────────────────────
  const fetchSocialAccounts = useCallback(async (): Promise<SocialAccount[]> => {
    const data = await adminFetch("/ecosystem-ads/social/accounts")
    return data?.accounts || []
  }, [adminFetch])

  const fetchSocialConfig = useCallback(async () => {
    const data = await adminFetch("/ecosystem-ads/social/config")
    return data?.config || {}
  }, [adminFetch])

  const saveSocialConfig = useCallback(async (config: object) => {
    return adminFetch("/ecosystem-ads/social/config", {
      method: "POST", body: JSON.stringify(config)
    })
  }, [adminFetch])

  const fetchSocialPosts = useCallback(async (
    platform?: string
  ): Promise<SocialPost[]> => {
    const query = platform ? `?platform=${platform}` : ""
    const data = await adminFetch(`/ecosystem-ads/social/posts${query}`)
    return data?.posts || []
  }, [adminFetch])

  const publishToSocial = useCallback(async (body: {
    banner_id: string; platform: string; caption: string; meta?: object
  }) => {
    return adminFetch("/ecosystem-ads/social/publish", {
      method: "POST", body: JSON.stringify(body)
    })
  }, [adminFetch])

  return {
    fetchBanners, createBanner, updateBanner, deleteBanner, toggleBanner,
    uploadFile,
    fetchSites, createSite, updateSite, deleteSite, toggleSite,
    createSlot, assignSlot, unassignSlot,
    fetchAnalytics,
    fetchSocialAccounts, fetchSocialConfig, saveSocialConfig,
    fetchSocialPosts, publishToSocial,
  }
}
```

---

## Step 6: Frontend Admin Page

**`frontend/src/app/admin/ecosystem-ads/page.tsx`**

The page is a thin state container. It:
1. On mount: loads all data in parallel (`fetchBanners`, `fetchSites`, `fetchAnalytics`, `fetchSocialAccounts`, `fetchSocialPosts`)
2. Holds state: `banners`, `sites`, `analytics`, `analyticsSummary`, `socialAccounts`, `socialPosts`, `isLoading`, `toast`
3. Passes all state + handler functions to `AdminEcosystemAds` component
4. Handlers: `handleCreateBanner`, `handleEditBanner`, `handleDeleteBanner`, `handleToggleBanner`, `handleUploadFile`, `handleCreateSite`, `handleUpdateSite`, `handleDeleteSite`, `handleToggleSite`, `handleCreateSlot`, `handleAssignPlacement`, `handleUnassignPlacement`, `handleFetchAnalytics`, `handleSaveSocialConfig`, `handlePublishSocial`

---

## Step 7: Frontend Admin Component (Architecture)

**`frontend/src/components/admin/ecosystem-ads/AdminEcosystemAds.tsx`**

Large component (~2600 lines). Structure:

```
AdminEcosystemAds (main export)
├── Props: banners, sites, analytics, analyticsSummary, socialAccounts,
│         socialPosts, isLoading + all handler functions
├── State: activeTab, showBannerForm, editingBanner, showDeleteConfirm,
│         showSiteForm, showSlotForm, showSocialConfigModal, etc.
│
├── Tab: "banners"
│   ├── Filter buttons (all / live / scheduled / draft / expired)
│   ├── BannerCard (for each banner)
│   │   └── Shows: headline, status badge, creatives grid (6 ratios),
│   │              impressions/clicks/CTR chips, date range
│   │              Edit | Delete buttons, More details expand
│   └── BannerForm (create/edit)
│       └── Fields: name, headline, cta_text, cta_url, status,
│                   is_active toggle, start_date, end_date, priority,
│                   product search, creative upload per ratio
│
├── Tab: "placements"
│   ├── Site list (cards per site)
│   │   ├── Site header: subdomain, is_active toggle, delete
│   │   ├── Slot list per site
│   │   │   └── Each slot: name, ratio, current banner, assign dropdown
│   │   │       ← Dropdown filter: is_active only (any active banner)
│   │   └── Add Slot button
│   └── Add Site button / SiteForm
│
├── Tab: "analytics"
│   ├── Period selector dropdown (All Time + last 6 months)
│   ├── Summary cards: Total Impressions, Total Clicks, Avg CTR, Active Banners
│   └── Performance table: Banner | Site | Impressions | Clicks | CTR | Period
│       └── CTR ≥ 7% = green badge, < 7% = orange badge
│
└── Tab: "social"
    ├── Platform cards (Pinterest, Instagram, Facebook, Twitter, Threads)
    │   └── Each: isConnected status, post count, "Publish" button
    ├── Published posts list
    ├── SocialPublishModal: pick banner + caption → publish
    └── SocialConfigModal: input credentials per platform
```

**Key implementation details:**

1. **Creative upload per ratio:** For each of the 6 ratios, show an upload box showing current image or placeholder. On file select, call `handleUploadFile(file)` → get URL → store in `form.creatives` array.

2. **Banner assignment dropdown:** Filter `banners.filter(b => b.is_active)` — do NOT require a matching creative. The creative match is enforced server-side at assignment time (`assignSlot` service method). This allows assigning a banner before uploading all creatives.

3. **Image normalization:** All `<img src={...}>` tags for creative thumbnails must use `normalizeImageUrl(url)` to rewrite MinIO `http://localhost:9001/medusa-uploads/...` URLs to `/api/img-proxy/...` to avoid HTTPS mixed-content errors.

4. **CTR chip color:** CTR ≥ 7% shows in semantic success green, < 7% in warning orange.

---

## Step 8: Add to Admin Navigation

In `AdminShell.tsx`, add to the nav items array:
```typescript
{ label: "Ecosystem Ads", href: "/admin/ecosystem-ads", icon: Megaphone }
```

---

## Step 9: Image Proxy (if not already set up)

For MinIO-hosted images to work on HTTPS, add a Next.js API route proxy:

**`frontend/src/app/api/img-proxy/[...path]/route.ts`**
```typescript
export async function GET(
  req: Request,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/")
  const minioUrl = `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/${path}`

  const response = await fetch(minioUrl)
  if (!response.ok) return new Response("Not found", { status: 404 })

  const blob = await response.blob()
  return new Response(blob, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
```

And the normalizeImageUrl utility:
```typescript
// frontend/src/lib/image-url.ts
export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url) return ""
  const match = url.match(/\/medusa-uploads\/(.+)$/)
  if (match) return `/api/img-proxy/${match[1]}`
  return url
}
```

---

## Step 10: End-to-End Verification

After building, verify the complete flow:

```bash
# 1. Backend running
curl http://localhost:9000/health  # → {"status":"ok"}

# 2. Get admin token
TOKEN=$(curl -s -X POST http://localhost:9000/auth/user/emailpass \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@...","password":"..."}' | jq -r '.token')

# 3. Create a banner
curl -s -X POST http://localhost:9000/admin/ecosystem-ads/banners \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Banner","headline":"Test Headline","cta_text":"Shop Now",
       "cta_url":"https://store.vastucart.in","status":"live","is_active":true}'

# 4. Create a site
curl -s -X POST http://localhost:9000/admin/ecosystem-ads/sites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subdomain":"blog.vastucart.in","display_name":"VastuCart Blog","is_active":true}'

# 5. Create a slot
SITE_ID=$(curl -s http://localhost:9000/admin/ecosystem-ads/sites \
  -H "Authorization: Bearer $TOKEN" | jq -r '.sites[0].id')
curl -s -X POST http://localhost:9000/admin/ecosystem-ads/slots \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"site_id\":\"$SITE_ID\",\"name\":\"Hero Banner\",\"ratio\":\"16:9\"}"

# 6. Upload a creative to the banner (must match slot ratio)
# Use admin UI or /admin/uploads endpoint

# 7. Assign banner to slot
BANNER_ID=$(curl -s http://localhost:9000/admin/ecosystem-ads/banners \
  -H "Authorization: Bearer $TOKEN" | jq -r '.banners[0].id')
SLOT_ID=$(curl -s http://localhost:9000/admin/ecosystem-ads/sites \
  -H "Authorization: Bearer $TOKEN" | jq -r '.sites[0].slots[0].id')
curl -s -X POST http://localhost:9000/admin/ecosystem-ads/slots/$SLOT_ID/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"banner_id\":\"$BANNER_ID\"}"

# 8. Fetch as partner site (get site_id for tracking)
PUB_KEY="your-publishable-key"
RESPONSE=$(curl -s http://localhost:9000/store/ecosystem-banners/blog.vastucart.in \
  -H "x-publishable-api-key: $PUB_KEY")
echo $RESPONSE | jq .  # should show site_id + banners array

# 9. Track impression
SITE_ID=$(echo $RESPONSE | jq -r '.site_id')
B_ID=$(echo $RESPONSE | jq -r '.banners[0].banner.id')
SL_ID=$(echo $RESPONSE | jq -r '.banners[0].slot_id')
curl -s -X POST http://localhost:9000/store/ecosystem-banners/track \
  -H "x-publishable-api-key: $PUB_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"banner_id\":\"$B_ID\",\"site_id\":\"$SITE_ID\",\"slot_id\":\"$SL_ID\",\"event_type\":\"impression\"}"
# → {"success":true}

# 10. Verify analytics
curl -s http://localhost:9000/admin/ecosystem-ads/analytics \
  -H "Authorization: Bearer $TOKEN" | jq .
# → should show 1 impression
```

---

## Known Constraints and Limitations

1. **No JSONB columns** — Medusa v2 module models don't support native JSON. All complex data (creatives, product lists, social meta) is stored as serialized text with `JSON.parse` in the service. This is a current Medusa v2 limitation.

2. **No foreign key constraints** — `slot.current_banner_id` is a plain text field. Deletions must manually null it out first (done in the banner DELETE route). No cascade deletes at DB level.

3. **Analytics are append-only** — `BannerEvent` rows are never deleted. For high-traffic sites, consider adding a `created_at` index and periodic archiving.

4. **Social publishing is best-effort** — Platform APIs change frequently. Pinterest, Instagram Graph API, etc. require approved app credentials. The social publisher module is a placeholder skeleton that must be updated with current API specs per platform.

5. **Cache-Control on public API** — The `GET /store/ecosystem-banners/:subdomain` response has 60s cache headers. Banner changes take up to 60s to reflect. Reduce `max-age` for faster updates, or add cache busting.

6. **`assignSlot` validates creative ratio** — A banner can be assigned to a slot only if a matching creative (same `ratio` string) has been uploaded. The admin assignment dropdown is relaxed (shows all active banners), but the server enforces the creative match at assignment time. Plan: upload all creatives before assigning.

---

## Files Summary

| File | Lines | Purpose |
|------|-------|---------|
| `backend/src/modules/ecosystem-ads/models/banner.ts` | ~18 | Banner model |
| `backend/src/modules/ecosystem-ads/models/ecosystem-site.ts` | ~10 | Site model |
| `backend/src/modules/ecosystem-ads/models/ecosystem-slot.ts` | ~12 | Slot model |
| `backend/src/modules/ecosystem-ads/models/banner-event.ts` | ~10 | Analytics event model |
| `backend/src/modules/ecosystem-ads/models/social-post.ts` | ~14 | Social post model |
| `backend/src/modules/ecosystem-ads/service.ts` | ~410 | All business logic |
| `backend/src/modules/ecosystem-ads/index.ts` | ~7 | Module registration |
| `backend/src/modules/ecosystem-ads/social-publisher.ts` | ~285 | Social platform API calls |
| `backend/src/api/store/ecosystem-banners/[subdomain]/route.ts` | ~18 | Public fetch banners |
| `backend/src/api/store/ecosystem-banners/track/route.ts` | ~28 | Public track events |
| `backend/src/api/admin/ecosystem-ads/banners/route.ts` | ~45 | Admin banner CRUD |
| `backend/src/api/admin/ecosystem-ads/banners/[id]/route.ts` | ~70 | Admin single banner |
| `backend/src/api/admin/ecosystem-ads/banners/[id]/toggle/route.ts` | ~20 | Toggle active |
| `backend/src/api/admin/ecosystem-ads/sites/route.ts` | ~35 | Admin site CRUD |
| `backend/src/api/admin/ecosystem-ads/sites/[id]/route.ts` | ~45 | Admin single site |
| `backend/src/api/admin/ecosystem-ads/slots/route.ts` | ~28 | Create slot |
| `backend/src/api/admin/ecosystem-ads/slots/[id]/assign/route.ts` | ~35 | Assign/unassign banner |
| `backend/src/api/admin/ecosystem-ads/analytics/route.ts` | ~13 | Analytics |
| `backend/src/api/admin/ecosystem-ads/social/accounts/route.ts` | ~50 | Social accounts |
| `backend/src/api/admin/ecosystem-ads/social/config/route.ts` | ~40 | Social config |
| `backend/src/api/admin/ecosystem-ads/social/posts/route.ts` | ~15 | List posts |
| `backend/src/api/admin/ecosystem-ads/social/publish/route.ts` | ~80 | Publish to social |
| `backend/src/jobs/ecosystem-banner-status.ts` | ~18 | Hourly lifecycle job |
| `frontend/src/hooks/useAdminEcosystemAds.ts` | ~270 | Admin data hook |
| `frontend/src/app/admin/ecosystem-ads/page.tsx` | ~276 | Admin page (state) |
| `frontend/src/components/admin/ecosystem-ads/AdminEcosystemAds.tsx` | ~2600 | Full admin UI (4 tabs) |
