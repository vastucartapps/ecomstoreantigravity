/**
 * Centralized fallback image constants.
 * All Unsplash/placeholder URLs live here so they're easy to replace
 * when proper branded images are uploaded to MinIO.
 */

/** Default hero/banner fallback for category and search pages */
export const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&h=500&fit=crop"

/** Login/register page carousel images */
export const AUTH_CAROUSEL_IMAGES = [
  {
    image_url:
      "https://images.unsplash.com/photo-1600618528240-fb9fc964b853?w=1200&q=80",
    title: "Welcome to VastuCart",
    subtitle: "Discover harmony in every corner of your home",
  },
  {
    image_url:
      "https://images.unsplash.com/photo-1519750783826-e2420f4d687f?w=1200&q=80",
    title: "Curated Collections",
    subtitle: "Handpicked products aligned with Vastu principles",
  },
  {
    image_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80",
    title: "Expert Guidance",
    subtitle: "Book consultations with certified Vastu experts",
  },
] as const

/** Category tile fallback (smaller format) */
export const FALLBACK_CATEGORY_TILE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop"
