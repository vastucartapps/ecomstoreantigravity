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
  // ─── Banner Helpers ──────────────────────────────────────────────────

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
    try {
      return JSON.parse(json)
    } catch {
      return fallback
    }
  }

  async listBannersWithStats(): Promise<ParsedBanner[]> {
    const banners = await this.listEcosystemBanners(
      {},
      { order: { created_at: "DESC" }, take: 500 }
    )

    // Fetch slots and recent events in parallel.
    // Events capped at 50K (most recent) — enough for meaningful stats without
    // loading unbounded rows. Slots capped at 1K (generous for real usage).
    const [slots, events] = await Promise.all([
      this.listEcosystemSlots({}, { take: 1000 }),
      this.listBannerEvents({}, { take: 50000, order: { created_at: "DESC" } }),
    ])

    // Group events by banner_id in a single pass
    const eventsByBanner = new Map<string, { impressions: number; clicks: number }>()
    for (const ev of events) {
      const entry = eventsByBanner.get(ev.banner_id) || { impressions: 0, clicks: 0 }
      if (ev.event_type === "impression") entry.impressions++
      else if (ev.event_type === "click") entry.clicks++
      eventsByBanner.set(ev.banner_id, entry)
    }

    // Build a slot index keyed by current_banner_id for O(1) lookup
    const slotsByBanner = new Map<string, string[]>()
    for (const s of slots as any[]) {
      if (!s.current_banner_id) continue
      const existing = slotsByBanner.get(s.current_banner_id) || []
      existing.push(s.id)
      slotsByBanner.set(s.current_banner_id, existing)
    }

    return banners.map((raw: any) => {
      const parsed = this.parseBanner(raw)
      parsed.placements = slotsByBanner.get(raw.id) || []
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

  async updateBannerStatuses(): Promise<number> {
    const now = new Date()
    let updated = 0

    // scheduled → live
    const scheduled = await this.listEcosystemBanners(
      { status: "scheduled" },
      { take: 500 }
    )
    for (const banner of scheduled) {
      if (banner.start_date && new Date(banner.start_date) <= now) {
        await this.updateEcosystemBanners({
          id: banner.id,
          status: "live",
          is_active: true,
        })
        updated++
      }
    }

    // live → expired
    const live = await this.listEcosystemBanners(
      { status: "live" },
      { take: 500 }
    )
    for (const banner of live) {
      if (banner.end_date && new Date(banner.end_date) < now) {
        await this.updateEcosystemBanners({
          id: banner.id,
          status: "expired",
          is_active: false,
        })
        updated++
      }
    }

    return updated
  }

  // ─── Site/Slot Helpers ───────────────────────────────────────────────

  async listSitesWithSlots(): Promise<any[]> {
    const sites = await this.listEcosystemSites({}, { take: 100 })
    const allSlots = await this.listEcosystemSlots({}, { take: 5000 })
    const allBanners = await this.listEcosystemBanners({}, { take: 500 })

    const bannerMap = new Map<string, string>()
    for (const b of allBanners) {
      bannerMap.set(b.id, b.name)
    }

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

  async assignSlot(
    slotId: string,
    bannerId: string
  ): Promise<{ success: boolean; error?: string }> {
    const slot = await this.retrieveEcosystemSlot(slotId)
    if (!slot) return { success: false, error: "Slot not found" }

    const banner = await this.retrieveEcosystemBanner(bannerId)
    if (!banner) return { success: false, error: "Banner not found" }

    // Validate ratio match
    const creatives = this.safeJsonParse(banner.creatives_json, [])
    const hasMatchingRatio = creatives.some(
      (cr: any) => cr.ratio === slot.ratio
    )
    if (!hasMatchingRatio) {
      return {
        success: false,
        error: `Banner doesn't have a ${slot.ratio} creative`,
      }
    }

    await this.updateEcosystemSlots({
      id: slotId,
      current_banner_id: bannerId,
    })
    return { success: true }
  }

  async removeSlotAssignment(slotId: string): Promise<void> {
    await this.updateEcosystemSlots({
      id: slotId,
      current_banner_id: null as any,
    })
  }

  // ─── Analytics ───────────────────────────────────────────────────────

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
    // Get all events, optionally filtered by period
    let events = await this.listBannerEvents({}, { take: 100000 })

    if (period) {
      // period format: "YYYY-MM"
      events = events.filter((ev: any) => {
        const evDate = new Date(ev.created_at)
        const evPeriod = `${evDate.getFullYear()}-${String(evDate.getMonth() + 1).padStart(2, "0")}`
        return evPeriod === period
      })
    }

    // Get banner and site names for display
    const banners = await this.listEcosystemBanners({}, { take: 500 })
    const sites = await this.listEcosystemSites({}, { take: 100 })
    const bannerMap = new Map<string, string>()
    const siteMap = new Map<string, string>()
    for (const b of banners) bannerMap.set(b.id, b.name)
    for (const s of sites) siteMap.set(s.id, s.subdomain)

    // Aggregate by banner + site
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
        ctr:
          stats.impressions > 0
            ? parseFloat(
                ((stats.clicks / stats.impressions) * 100).toFixed(2)
              )
            : 0,
        period: period || "all",
      })
    }

    // Sort by impressions DESC
    analytics.sort((a, b) => b.impressions - a.impressions)

    const activeBanners = banners.filter(
      (b: any) => b.is_active && b.status === "live"
    ).length

    return {
      analytics,
      summary: {
        totalImpressions,
        totalClicks,
        avgCtr:
          totalImpressions > 0
            ? parseFloat(
                ((totalClicks / totalImpressions) * 100).toFixed(2)
              )
            : 0,
        activeBanners,
      },
    }
  }

  // ─── Public Banner Serving ───────────────────────────────────────────

  async getBannersForSite(
    subdomain: string
  ): Promise<{ site_id: string | null; banners: any[] }> {
    // Find site by subdomain
    const sites = await this.listEcosystemSites(
      { subdomain },
      { take: 1 }
    )
    if (sites.length === 0) return { site_id: null, banners: [] }

    const site = sites[0]
    if (!site.is_active) return { site_id: site.id, banners: [] }

    // Get active slots for this site
    const slots = await this.listEcosystemSlots(
      { site_id: site.id, is_active: true },
      { take: 100 }
    )

    const results: any[] = []
    for (const slot of slots) {
      if (!slot.current_banner_id) continue

      try {
        const banner = await this.retrieveEcosystemBanner(
          slot.current_banner_id
        )
        if (!banner || !banner.is_active || banner.status !== "live") continue

        const creatives = this.safeJsonParse(banner.creatives_json, [])
        const matchingCreative = creatives.find(
          (cr: any) => cr.ratio === slot.ratio
        )
        if (!matchingCreative) continue

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
        // Banner may have been deleted
        continue
      }
    }

    return { site_id: site.id, banners: results }
  }

  // ─── Social Posts ────────────────────────────────────────────────────

  async listSocialPostsParsed(platform?: string): Promise<any[]> {
    const filter: any = {}
    if (platform) filter.platform = platform

    const posts = await this.listSocialPosts(filter, {
      order: { created_at: "DESC" },
      take: 100,
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
