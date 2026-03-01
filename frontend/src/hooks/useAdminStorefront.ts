import { adminFetch } from "@/lib/medusa"
import type {
  StorefrontConfig,
  Announcement,
  Branding,
  HomepageSection,
  ContentPage,
  FooterConfig,
  HeroSlide,
  MarketingSlide,
  AboutConfig,
  ContactConfig,
} from "@/types/admin-storefront"

const DEFAULT_ANNOUNCEMENT: Announcement = {
  message: "Free shipping on orders above ₹999! Use code VASTU10 for 10% off.",
  linkText: "Shop Now",
  linkUrl: "/collections/best-sellers",
  bgColor: "#013f47",
  textColor: "#ffffff",
  isActive: false,
  schedule: { startDate: "", endDate: "" },
}

const DEFAULT_BRANDING: Branding = {
  storeName: "VastuCart",
  tagline: "Sacred Essentials for Your Spiritual Journey",
  contactEmail: "support@vastucart.com",
  contactPhone: "+91 98765 43210",
  address: "42 Temple Lane, Varanasi, Uttar Pradesh 221001, India",
  logoUrl: "/VastuCartLogo.png",
  faviconUrl: "/favicon.ico",
  socialLinks: {
    instagram: "https://instagram.com/vastucart",
    facebook: "https://facebook.com/vastucart",
    youtube: "https://youtube.com/vastucart",
  },
  gift_card_image_url: "",
}

const DEFAULT_HOMEPAGE_SECTIONS: HomepageSection[] = [
  { id: "hs-1", name: "Hero Banner", type: "hero", enabled: true, order: 1 },
  { id: "hs-2", name: "Shop by Category", type: "categories", enabled: true, order: 2 },
  { id: "hs-3", name: "Featured Products", type: "featured", enabled: true, order: 3 },
  { id: "hs-4", name: "New Arrivals", type: "new_arrivals", enabled: true, order: 4 },
  { id: "hs-5", name: "Bestsellers", type: "bestsellers", enabled: true, order: 5 },
  { id: "hs-6", name: "Deals & Offers", type: "deals", enabled: false, order: 6 },
  { id: "hs-7", name: "Customer Testimonials", type: "testimonials", enabled: true, order: 7 },
  { id: "hs-8", name: "Newsletter Signup", type: "newsletter", enabled: true, order: 8 },
]

const DEFAULT_CONTENT_PAGES: ContentPage[] = [
  {
    id: "cp-1",
    title: "About Us",
    slug: "about",
    lastUpdated: new Date().toISOString(),
    isPublished: false,
    excerpt: "Learn about VastuCart's mission to bring authentic spiritual products to every home.",
    content: "# About VastuCart\n\nVastuCart was founded with a simple mission: to make authentic spiritual and Vastu products accessible to every home across India.\n\n## Our Story\n\nWe started when our founder noticed how difficult it was to find genuine, high-quality spiritual products online. Most platforms offered replicas or imported goods lacking the authentic craftsmanship that makes these items truly special.\n\n## Our Mission\n\nWe source directly from artisans and certified manufacturers across India — from the brass workshops of Moradabad to the incense makers of Bengaluru. Every product we sell carries the quality and authenticity you deserve.\n\n## Why VastuCart?\n\n- **Authenticity Guaranteed** — Every product is verified for quality\n- **Artisan Support** — We work directly with artisans across India\n- **Vastu Expertise** — Our team includes certified Vastu consultants\n- **Secure Shopping** — 100% secure payments and data protection",
  },
  {
    id: "cp-2",
    title: "Contact Us",
    slug: "contact",
    lastUpdated: new Date().toISOString(),
    isPublished: false,
    excerpt: "Get in touch with our team for support, wholesale inquiries, or feedback.",
    content: "# Contact Us\n\nWe'd love to hear from you. Our team is available Monday–Saturday, 9am–6pm IST.\n\n## Customer Support\n\n- **Email:** support@vastucart.com\n- **Phone:** +91 98765 43210\n- **WhatsApp:** +91 98765 43210\n\n## Office Address\n\n42 Temple Lane\nVaranasi, Uttar Pradesh 221001\nIndia\n\n## Wholesale Inquiries\n\nFor bulk orders or wholesale partnerships, please write to wholesale@vastucart.com\n\n## Response Time\n\nWe typically respond to all queries within 24 hours on business days.",
  },
  {
    id: "cp-3",
    title: "Privacy Policy",
    slug: "privacy-policy",
    lastUpdated: new Date().toISOString(),
    isPublished: false,
    excerpt: "How we collect, use, and protect your personal information.",
    content: "# Privacy Policy\n\n*Last updated: January 2026*\n\nVastuCart is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.\n\n## Information We Collect\n\n- **Account Information:** Name, email address, phone number\n- **Order Information:** Delivery addresses, order history\n- **Payment Information:** Processed securely via Razorpay/Stripe — we do not store card details\n- **Usage Data:** Pages visited, products viewed (for improving your experience)\n\n## How We Use Your Information\n\n- To process and deliver your orders\n- To send order confirmations and shipping updates\n- To respond to customer support queries\n- To improve our products and services\n\n## Data Security\n\nAll personal data is encrypted in transit (HTTPS) and at rest. We follow industry-standard security practices.\n\n## Your Rights\n\nYou may request deletion of your account and associated data at any time by writing to privacy@vastucart.com.\n\n## Contact\n\nFor privacy concerns, contact: privacy@vastucart.com",
  },
  {
    id: "cp-4",
    title: "Terms & Conditions",
    slug: "terms",
    lastUpdated: new Date().toISOString(),
    isPublished: false,
    excerpt: "Terms governing your use of the VastuCart platform and purchases.",
    content: "# Terms & Conditions\n\n*Last updated: January 2026*\n\nBy using VastuCart, you agree to these terms. Please read them carefully.\n\n## Acceptance of Terms\n\nAccess to and use of the VastuCart platform constitutes acceptance of these Terms & Conditions.\n\n## Products and Pricing\n\n- All prices are in Indian Rupees (INR) unless otherwise stated\n- Prices are subject to change without notice\n- Product images are for illustrative purposes; actual products may vary slightly\n\n## Orders and Payments\n\n- Orders are confirmed only upon successful payment\n- VastuCart reserves the right to cancel orders due to stock unavailability\n- Accepted payment methods: Razorpay (UPI, cards, net banking), Stripe (international cards)\n\n## Intellectual Property\n\nAll content on VastuCart — including images, text, and branding — is protected by copyright and may not be reproduced without written consent.\n\n## Governing Law\n\nThese terms are governed by the laws of India. Disputes shall be subject to the jurisdiction of courts in Varanasi, Uttar Pradesh.\n\n## Contact\n\nFor queries: legal@vastucart.com",
  },
  {
    id: "cp-5",
    title: "Shipping Policy",
    slug: "shipping-policy",
    lastUpdated: new Date().toISOString(),
    isPublished: false,
    excerpt: "Delivery timelines, charges, and shipping partners for all orders.",
    content: "# Shipping Policy\n\nWe ship across India and internationally. All domestic orders are processed within 1–2 business days.\n\n## Domestic Shipping\n\n- **Standard:** 7–10 business days — Free on orders above ₹999, otherwise ₹49\n- **Express:** 4–7 business days — ₹99\n- **Metro Cities:** 3–5 business days\n\n## International Shipping\n\n- **Standard:** 15–30 business days — $15 USD\n- **Express:** 10–20 business days — $25 USD\n\n## Cash on Delivery\n\nCOD is available for Indian orders between ₹500 and ₹25,000 at no extra charge.\n\n## Tracking\n\nOnce shipped, you will receive a tracking number via email and SMS.\n\n## Delays\n\nOccasional delays may occur during festivals or extreme weather. We will notify you proactively.",
  },
  {
    id: "cp-6",
    title: "Refund & Returns",
    slug: "refund-policy",
    lastUpdated: new Date().toISOString(),
    isPublished: false,
    excerpt: "Our hassle-free return and refund process for damaged or incorrect items.",
    content: "# Refund & Returns Policy\n\nWe want you to be completely satisfied with your purchase. If you're not happy, we'll make it right.\n\n## Return Eligibility\n\n- Items must be returned within **7 days** of delivery\n- Items must be unused, in original packaging\n- Customised or made-to-order items cannot be returned unless defective\n\n## How to Initiate a Return\n\n1. Email returns@vastucart.com with your order number and reason\n2. Our team will respond within 24 hours with a return label\n3. Pack items securely and ship within 3 days of receiving the label\n4. Once received and inspected, refund is processed within 5–7 business days\n\n## Refund Methods\n\n- Original payment method (card/UPI/net banking)\n- VastuCart store credit (processed faster)\n\n## Damaged or Incorrect Items\n\nIf you received a damaged or wrong item, please share photos within 48 hours of delivery. We will arrange a free replacement or full refund.\n\n## Non-Returnable Items\n\n- Perishable items (flowers, offerings)\n- Digital products\n- Customised puja items\n\n## Contact\n\nreturns@vastucart.com | +91 98765 43210",
  },
]

const DEFAULT_FOOTER: FooterConfig = {
  columns: [
    {
      title: "Quick Links",
      links: [
        { label: "Home", url: "/" },
        { label: "All Products", url: "/collections" },
        { label: "Best Sellers", url: "/collections/best-sellers" },
        { label: "New Arrivals", url: "/collections/new-arrivals" },
      ],
    },
    {
      title: "Customer Care",
      links: [
        { label: "Contact Us", url: "/contact" },
        { label: "Shipping Policy", url: "/shipping-policy" },
        { label: "Refund & Returns", url: "/refund-policy" },
        { label: "FAQs", url: "/faq" },
      ],
    },
    {
      title: "About",
      links: [
        { label: "Our Story", url: "/about" },
        { label: "Privacy Policy", url: "/privacy-policy" },
        { label: "Terms & Conditions", url: "/terms" },
      ],
    },
  ],
  copyrightText: `© ${new Date().getFullYear()} VastuCart. All rights reserved.`,
  showSocialLinks: true,
}

const DEFAULT_ABOUT_CONFIG: AboutConfig = {
  heroTagline: "Bringing Sacred India to Every Home",
  heroSubtext: "Authentic spiritual products, sourced directly from artisans across India",
  stats: [
    { label: "Years of Trust", value: "10", suffix: "+" },
    { label: "Artisan Partners", value: "200", suffix: "+" },
    { label: "Products", value: "1500", suffix: "+" },
    { label: "Happy Customers", value: "50000", suffix: "+" },
  ],
  storyTitle: "Our Story",
  storyText: "VastuCart was founded with a simple mission: to make authentic spiritual and Vastu products accessible to every home across India. We started when our founder noticed how difficult it was to find genuine, high-quality spiritual products online. Most platforms offered replicas or imported goods lacking the authentic craftsmanship that makes these items truly special.\n\nToday, we source directly from over 200 artisan partners across India — from the brass workshops of Moradabad to the incense makers of Bengaluru. Every product we sell carries the quality and authenticity you deserve.",
  founderName: "Prashant Vaishnav",
  founderRole: "Founder & CEO",
  founderBio: "A Vastu practitioner with over a decade of experience, Prashant started VastuCart to bridge the gap between authentic Indian craftsmanship and modern online commerce.",
  artisanRegions: ["Moradabad", "Varanasi", "Jaipur", "Bengaluru", "Rajkot", "Pune"],
}

const DEFAULT_CONTACT_CONFIG: ContactConfig = {
  phone: "+91 98765 43210",
  email: "support@vastucart.com",
  whatsapp: "+91 98765 43210",
  wholesaleEmail: "wholesale@vastucart.com",
  address: "42 Temple Lane, Varanasi, Uttar Pradesh 221001, India",
  workingHours: {
    weekdays: "Mon \u2013 Sat: 9:00 AM \u2013 6:00 PM IST",
    weekends: "Sunday: Closed",
  },
  faqs: [
    { id: "f1", question: "How long does delivery take?", answer: "Standard delivery takes 7\u201310 business days. Express delivery is 4\u20137 business days." },
    { id: "f2", question: "Do you offer returns?", answer: "Yes, within 7 days of delivery for unused items in original packaging." },
    { id: "f3", question: "Are your products authentic?", answer: "Every product is sourced from certified artisans. We verify authenticity before listing." },
    { id: "f4", question: "Do you ship internationally?", answer: "Yes, we ship to 25+ countries. International delivery is 15\u201330 business days." },
  ],
  grievanceOfficer: {
    name: "Prashant Vaishnav",
    email: "grievance@vastucart.com",
    address: "42 Temple Lane, Varanasi, Uttar Pradesh 221001, India",
  },
}


async function readStore(): Promise<{ id: string; config: StorefrontConfig; rawMetadata: Record<string, unknown> }> {
  const res = await adminFetch<{ stores: Array<{ id: string; metadata?: Record<string, unknown> }> }>("/admin/stores")
  const store = res.stores?.[0]
  const rawMetadata: Record<string, unknown> = store?.metadata ?? {}
  const saved = rawMetadata.storefront_config as StorefrontConfig | undefined

  const config: StorefrontConfig = saved
    ? {
        announcement: { ...DEFAULT_ANNOUNCEMENT, ...saved.announcement },
        branding: { ...DEFAULT_BRANDING, ...saved.branding },
        homepageSections: saved.homepageSections?.length
          ? saved.homepageSections
          : DEFAULT_HOMEPAGE_SECTIONS,
        contentPages: saved.contentPages?.length
          ? saved.contentPages
          : DEFAULT_CONTENT_PAGES,
        footerConfig: saved.footerConfig
          ? saved.footerConfig
          : DEFAULT_FOOTER,
      }
    : {
        announcement: DEFAULT_ANNOUNCEMENT,
        branding: DEFAULT_BRANDING,
        homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
        contentPages: DEFAULT_CONTENT_PAGES,
        footerConfig: DEFAULT_FOOTER,
      }

  return { id: store?.id || "", config, rawMetadata }
}

async function writeConfig(storeId: string, config: StorefrontConfig, rawMetadata: Record<string, unknown>): Promise<void> {
  await adminFetch(`/admin/stores/${storeId}`, {
    method: "POST",
    body: { metadata: { ...rawMetadata, storefront_config: config } },
  })
}

export function useAdminStorefront() {
  async function fetchConfig(): Promise<StorefrontConfig> {
    const { config } = await readStore()
    return config
  }

  async function updateAnnouncement(announcement: Announcement): Promise<void> {
    const { id, config, rawMetadata } = await readStore()
    await writeConfig(id, { ...config, announcement }, rawMetadata)
  }

  async function updateBranding(branding: Branding): Promise<void> {
    const { id, config, rawMetadata } = await readStore()
    await writeConfig(id, { ...config, branding }, rawMetadata)
  }

  async function reorderSection(sectionId: string, direction: "up" | "down"): Promise<void> {
    const { id, config, rawMetadata } = await readStore()
    const sections = [...config.homepageSections].sort((a, b) => a.order - b.order)
    const idx = sections.findIndex((s) => s.id === sectionId)
    if (idx === -1) return
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sections.length) return

    // Swap orders
    const aOrder = sections[idx].order
    const bOrder = sections[swapIdx].order
    sections[idx] = { ...sections[idx], order: bOrder }
    sections[swapIdx] = { ...sections[swapIdx], order: aOrder }

    await writeConfig(id, { ...config, homepageSections: sections }, rawMetadata)
  }

  async function toggleSection(sectionId: string, enabled: boolean): Promise<void> {
    const { id, config, rawMetadata } = await readStore()
    const homepageSections = config.homepageSections.map((s) =>
      s.id === sectionId ? { ...s, enabled } : s
    )
    await writeConfig(id, { ...config, homepageSections }, rawMetadata)
  }

  async function editPage(pageId: string, content: string): Promise<void> {
    const { id, config, rawMetadata } = await readStore()
    const contentPages = config.contentPages.map((p) =>
      p.id === pageId
        ? { ...p, content, lastUpdated: new Date().toISOString() }
        : p
    )
    await writeConfig(id, { ...config, contentPages }, rawMetadata)
  }

  async function togglePagePublish(pageId: string, published: boolean): Promise<void> {
    const { id, config, rawMetadata } = await readStore()
    const contentPages = config.contentPages.map((p) =>
      p.id === pageId ? { ...p, isPublished: published } : p
    )
    await writeConfig(id, { ...config, contentPages }, rawMetadata)
  }

  async function updateFooter(footerConfig: FooterConfig): Promise<void> {
    const { id, config, rawMetadata } = await readStore()
    await writeConfig(id, { ...config, footerConfig }, rawMetadata)
  }

  // ── Hero Slides ────────────────────────────────────────────────────────────

  async function fetchHeroSlides(): Promise<HeroSlide[]> {
    const res = await adminFetch<{ hero_slides: HeroSlide[] }>("/admin/hero-slides")
    return res.hero_slides || []
  }

  async function createHeroSlide(data: Omit<HeroSlide, "id">): Promise<HeroSlide> {
    const res = await adminFetch<{ hero_slide: HeroSlide }>("/admin/hero-slides", {
      method: "POST",
      body: data,
    })
    return res.hero_slide
  }

  async function updateHeroSlide(id: string, data: Partial<HeroSlide>): Promise<HeroSlide> {
    const res = await adminFetch<{ hero_slide: HeroSlide }>(`/admin/hero-slides/${id}`, {
      method: "POST",
      body: data,
    })
    return res.hero_slide
  }

  async function deleteHeroSlide(id: string): Promise<void> {
    await adminFetch(`/admin/hero-slides/${id}`, { method: "DELETE" })
  }

  // ── Marketing Slides (Login page) ─────────────────────────────────────────

  async function fetchMarketingSlides(): Promise<MarketingSlide[]> {
    const res = await adminFetch<{ marketing_slides: MarketingSlide[] }>("/admin/marketing-slides")
    return res.marketing_slides || []
  }

  async function createMarketingSlide(data: Omit<MarketingSlide, "id">): Promise<MarketingSlide> {
    const res = await adminFetch<{ marketing_slide: MarketingSlide }>("/admin/marketing-slides", {
      method: "POST",
      body: data,
    })
    return res.marketing_slide
  }

  async function updateMarketingSlide(id: string, data: Partial<MarketingSlide>): Promise<MarketingSlide> {
    const res = await adminFetch<{ marketing_slide: MarketingSlide }>(`/admin/marketing-slides/${id}`, {
      method: "POST",
      body: data,
    })
    return res.marketing_slide
  }

  async function deleteMarketingSlide(id: string): Promise<void> {
    await adminFetch(`/admin/marketing-slides/${id}`, { method: "DELETE" })
  }
  // ── About Config ────────────────────────────────────────────────────────────

  async function fetchAboutConfig(): Promise<AboutConfig> {
    const { rawMetadata } = await readStore()
    const saved = rawMetadata.about_config as AboutConfig | undefined
    return saved ? { ...DEFAULT_ABOUT_CONFIG, ...saved } : DEFAULT_ABOUT_CONFIG
  }

  async function saveAboutConfig(config: AboutConfig): Promise<void> {
    const { id, rawMetadata } = await readStore()
    await adminFetch(`/admin/stores/${id}`, {
      method: "POST",
      body: { metadata: { ...rawMetadata, about_config: config } },
    })
  }

  // ── Contact Config ───────────────────────────────────────────────────────────

  async function fetchContactConfig(): Promise<ContactConfig> {
    const { rawMetadata } = await readStore()
    const saved = rawMetadata.contact_config as ContactConfig | undefined
    return saved ? { ...DEFAULT_CONTACT_CONFIG, ...saved } : DEFAULT_CONTACT_CONFIG
  }

  async function saveContactConfig(config: ContactConfig): Promise<void> {
    const { id, rawMetadata } = await readStore()
    await adminFetch(`/admin/stores/${id}`, {
      method: "POST",
      body: { metadata: { ...rawMetadata, contact_config: config } },
    })
  }

  return {
    fetchConfig,
    updateAnnouncement,
    updateBranding,
    reorderSection,
    toggleSection,
    editPage,
    togglePagePublish,
    updateFooter,
    fetchHeroSlides,
    createHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
    fetchMarketingSlides,
    createMarketingSlide,
    updateMarketingSlide,
    deleteMarketingSlide,
    fetchAboutConfig,
    saveAboutConfig,
    fetchContactConfig,
    saveContactConfig,
  }
}
