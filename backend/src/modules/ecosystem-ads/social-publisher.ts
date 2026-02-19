/**
 * Social Platform Publishing Service
 *
 * Each platform uses its official API with admin-configured credentials.
 * Credentials are stored in store.metadata.social_config per platform:
 *
 * pinterest:  { access_token, username, display_name }
 * instagram:  { access_token, ig_user_id, username, display_name }
 * facebook:   { access_token, page_id, username, display_name }
 * twitter:    { api_key, api_secret, access_token, access_token_secret, username, display_name }
 * threads:    { access_token, user_id, username, display_name }
 */

interface PublishInput {
  platform: string
  config: Record<string, string>
  caption: string
  meta: Record<string, string>
  imageUrl: string
  headline: string
  ctaUrl: string
}

interface PublishResult {
  success: boolean
  postUrl?: string
  error?: string
}

export async function publishToSocialPlatform(
  input: PublishInput
): Promise<PublishResult> {
  const { platform, config, caption, meta, imageUrl, headline, ctaUrl } = input

  switch (platform) {
    case "pinterest":
      return publishToPinterest(config, caption, meta, imageUrl, ctaUrl)
    case "instagram":
      return publishToInstagram(config, caption, imageUrl)
    case "facebook":
      return publishToFacebook(config, caption, meta, imageUrl, ctaUrl)
    case "twitter":
      return publishToTwitter(config, caption, imageUrl)
    case "threads":
      return publishToThreads(config, caption, imageUrl)
    default:
      return { success: false, error: `Unknown platform: ${platform}` }
  }
}

// ─── Pinterest ─────────────────────────────────────────────────────────────

async function publishToPinterest(
  config: Record<string, string>,
  caption: string,
  meta: Record<string, string>,
  imageUrl: string,
  ctaUrl: string
): Promise<PublishResult> {
  try {
    const res = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: meta.title || caption.slice(0, 100),
        description: meta.description || caption,
        link: ctaUrl || meta.linkUrl || "",
        board_id: config.board_id || "",
        media_source: {
          source_type: "image_url",
          url: imageUrl,
        },
        alt_text: meta.altText || "",
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { success: false, error: `Pinterest API error: ${err}` }
    }

    const data = await res.json()
    return {
      success: true,
      postUrl: `https://pinterest.com/pin/${data.id}`,
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ─── Instagram (via Facebook Graph API) ────────────────────────────────────

async function publishToInstagram(
  config: Record<string, string>,
  caption: string,
  imageUrl: string
): Promise<PublishResult> {
  try {
    // Step 1: Create media container
    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${config.ig_user_id}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: config.access_token,
        }),
      }
    )

    if (!containerRes.ok) {
      const err = await containerRes.text()
      return { success: false, error: `Instagram container error: ${err}` }
    }

    const containerData = await containerRes.json()

    // Step 2: Publish container
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${config.ig_user_id}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: config.access_token,
        }),
      }
    )

    if (!publishRes.ok) {
      const err = await publishRes.text()
      return { success: false, error: `Instagram publish error: ${err}` }
    }

    const publishData = await publishRes.json()
    return {
      success: true,
      postUrl: `https://www.instagram.com/p/${publishData.id}`,
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ─── Facebook Page Post ────────────────────────────────────────────────────

async function publishToFacebook(
  config: Record<string, string>,
  caption: string,
  meta: Record<string, string>,
  imageUrl: string,
  ctaUrl: string
): Promise<PublishResult> {
  try {
    const message = caption + (ctaUrl ? `\n\n${ctaUrl}` : "")

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${config.page_id}/photos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imageUrl,
          message,
          access_token: config.access_token,
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      return { success: false, error: `Facebook API error: ${err}` }
    }

    const data = await res.json()
    return {
      success: true,
      postUrl: `https://facebook.com/${data.post_id || data.id}`,
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ─── Twitter / X ───────────────────────────────────────────────────────────

async function publishToTwitter(
  config: Record<string, string>,
  caption: string,
  _imageUrl: string
): Promise<PublishResult> {
  try {
    // Twitter v2 API — text-only post (image upload requires OAuth 1.0a media upload)
    // For a full implementation, use the media upload endpoint first
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: caption.slice(0, 280),
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { success: false, error: `Twitter API error: ${err}` }
    }

    const data = await res.json()
    return {
      success: true,
      postUrl: `https://twitter.com/i/status/${data.data?.id}`,
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ─── Threads (via Meta Threads API) ────────────────────────────────────────

async function publishToThreads(
  config: Record<string, string>,
  caption: string,
  imageUrl: string
): Promise<PublishResult> {
  try {
    // Step 1: Create media container
    const containerRes = await fetch(
      `https://graph.threads.net/v1.0/${config.user_id}/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "IMAGE",
          image_url: imageUrl,
          text: caption,
          access_token: config.access_token,
        }),
      }
    )

    if (!containerRes.ok) {
      const err = await containerRes.text()
      return { success: false, error: `Threads container error: ${err}` }
    }

    const containerData = await containerRes.json()

    // Step 2: Publish
    const publishRes = await fetch(
      `https://graph.threads.net/v1.0/${config.user_id}/threads_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: config.access_token,
        }),
      }
    )

    if (!publishRes.ok) {
      const err = await publishRes.text()
      return { success: false, error: `Threads publish error: ${err}` }
    }

    const publishData = await publishRes.json()
    return {
      success: true,
      postUrl: `https://www.threads.net/@${config.username}/post/${publishData.id}`,
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
