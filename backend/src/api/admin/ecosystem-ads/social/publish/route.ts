import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { ECOSYSTEM_ADS_MODULE } from "../../../../../modules/ecosystem-ads"
import { publishToSocialPlatform } from "../../../../../modules/ecosystem-ads/social-publisher"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const storeService = req.scope.resolve(Modules.STORE)
    const body = req.body as any

    const { banner_id, platform, caption, meta } = body
    if (!banner_id || !platform) {
      res.status(400).json({ message: "banner_id and platform are required" })
      return
    }

    // Get banner
    const banner = await adsService.retrieveEcosystemBanner(banner_id)
    if (!banner) {
      res.status(404).json({ message: "Banner not found" })
      return
    }

    // Get social config
    const stores = await storeService.listStores()
    const store = stores?.[0]
    const socialConfig = (store?.metadata as any)?.social_config || {}
    const platformConfig = socialConfig[platform]

    if (!platformConfig?.access_token) {
      res.status(400).json({
        message: `${platform} is not configured. Add API credentials in Social Config.`,
      })
      return
    }

    // Create pending social post record
    const socialPost = await adsService.createSocialPosts({
      banner_id,
      platform,
      post_url: "",
      status: "pending",
      published_at: null,
      caption: caption || "",
      meta_json: JSON.stringify(meta || {}),
    })

    // Get the appropriate creative
    const creatives = JSON.parse(banner.creatives_json || "[]")
    const ratioMap: Record<string, string> = {
      pinterest: "2:3",
      instagram: "1:1",
      facebook: "16:9",
      twitter: "16:9",
      threads: "1:1",
    }
    const targetRatio = ratioMap[platform] || "1:1"
    const creative = creatives.find((c: any) => c.ratio === targetRatio) || creatives[0]

    // Attempt to publish
    try {
      const result = await publishToSocialPlatform({
        platform,
        config: platformConfig,
        caption: caption || "",
        meta: meta || {},
        imageUrl: creative?.imageUrl || "",
        headline: banner.headline,
        ctaUrl: banner.cta_url,
      })

      await adsService.updateSocialPosts(socialPost.id, {
        status: result.success ? "published" : "failed",
        post_url: result.postUrl || "",
        published_at: result.success ? new Date() : null,
      })

      res.json({
        post: {
          id: socialPost.id,
          status: result.success ? "published" : "failed",
          post_url: result.postUrl || "",
          error: result.error || null,
        },
      })
    } catch (publishErr: any) {
      await adsService.updateSocialPosts(socialPost.id, {
        status: "failed",
      })
      res.json({
        post: {
          id: socialPost.id,
          status: "failed",
          error: publishErr.message,
        },
      })
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to publish" })
  }
}
