export interface AnnouncementSchedule {
  startDate: string
  endDate: string
}

export interface Announcement {
  message: string
  linkText: string
  linkUrl: string
  bgColor: string
  textColor: string
  isActive: boolean
  schedule: AnnouncementSchedule
}

export interface SocialLinks {
  instagram?: string
  facebook?: string
  youtube?: string
  twitter?: string
  pinterest?: string
}

export interface Branding {
  storeName: string
  tagline: string
  contactEmail: string
  contactPhone: string
  /** Street address / line 1+2 (e.g. "42 Temple Lane"). Schema.org: streetAddress */
  streetAddress: string
  /** City (e.g. "Varanasi"). Schema.org: addressLocality */
  addressLocality: string
  /** State or region (e.g. "Uttar Pradesh"). Schema.org: addressRegion */
  addressRegion: string
  /** Postal / ZIP code (e.g. "221001"). Schema.org: postalCode */
  postalCode: string
  /** ISO 3166-1 alpha-2 country code (e.g. "IN"). Schema.org: addressCountry */
  addressCountry: string
  logoUrl: string
  faviconUrl: string
  socialLinks: SocialLinks
  gift_card_image_url: string
}

export interface HomepageSection {
  id: string
  name: string
  type: string
  enabled: boolean
  order: number
}

export interface ContentPage {
  id: string
  title: string
  slug: string
  lastUpdated: string
  isPublished: boolean
  excerpt: string
  content: string
}

export interface FooterLink {
  label: string
  url: string
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

export interface FooterConfig {
  columns: FooterColumn[]
  copyrightText: string
  showSocialLinks: boolean
  /** Optional: heading for the Ecosystem cards section in the footer.
   *  Empty string falls back to "Explore the {storeName} Ecosystem" with
   *  brand name interpolated dynamically. */
  ecosystemTitle?: string
  /** Optional intro text below the ecosystem heading. Empty string falls
   *  back to a default that mentions the cluster site count. */
  ecosystemIntro?: string
  /** Optional title for the newsletter strip ("Stay in the loop" by default). */
  newsletterTitle?: string
  /** Optional subtitle for the newsletter strip. */
  newsletterSubtitle?: string
}

export interface HeroSlide {
  id: string
  image_url: string
  heading: string
  subtext: string
  cta_label: string
  cta_link: string
  is_active: boolean
  display_order: number
}

export interface MarketingSlide {
  id: string
  image_url: string
  quote: string
  attribution: string
  is_active: boolean
  display_order: number
}

/**
 * One sister site in the brand cluster — admin-editable so a new sub-
 * domain can be added without a deploy. Source of defaults remains
 * `frontend/src/lib/cluster-sites.ts`; admin overrides replace the array
 * wholesale when saved (admin saw the defaults pre-populated in the form).
 */
export interface ClusterSite {
  /** Stable slug — used as React key. E.g. "kundali". */
  slug: string
  /** Display name on the footer card and JSON-LD `sameAs`. */
  name: string
  /** Absolute URL — must be `https://`. */
  url: string
  /** Short blurb under the card name. */
  description: string
  /** Background hex for the card icon tile. */
  iconBg: string
  /** Optional foreground hex for the icon glyph (defaults to white). */
  iconFg?: string
  /** Single-character glyph rendered inside the icon tile. */
  glyph: string
  /** Optional badge label (e.g. "PREMIUM") next to the name. */
  badge?: string
  /** True for the current site — card opens "/" instead of opening a new tab. */
  isCurrent?: boolean
}

export interface StorefrontConfig {
  announcement: Announcement
  branding: Branding
  homepageSections: HomepageSection[]
  contentPages: ContentPage[]
  footerConfig: FooterConfig
  consultationConfig: ConsultationConfig
  /** Admin override for the brand cluster cards. Empty/missing = use the
   *  hardcoded defaults from `lib/cluster-sites.ts`. */
  clusterSites?: ClusterSite[]
}

export interface AdminStorefrontProps {
  announcement: Announcement
  branding: Branding
  homepageSections: HomepageSection[]
  contentPages: ContentPage[]
  footerConfig: FooterConfig
  clusterSites?: ClusterSite[]
  heroSlides: HeroSlide[]
  marketingSlides: MarketingSlide[]
  onUpdateAnnouncement: (a: Announcement) => Promise<void>
  onUpdateBranding: (b: Branding) => Promise<void>
  onReorderSection: (id: string, direction: "up" | "down") => Promise<void>
  onToggleSection: (id: string, enabled: boolean) => Promise<void>
  onEditPage: (id: string, content: string) => Promise<void>
  onTogglePagePublish: (id: string, published: boolean) => Promise<void>
  onUpdateFooter: (f: FooterConfig) => Promise<void>
  onUpdateClusterSites: (sites: ClusterSite[]) => Promise<void>
  onCreateHeroSlide: (data: Omit<HeroSlide, "id">) => Promise<void>
  onUpdateHeroSlide: (id: string, data: Partial<HeroSlide>) => Promise<HeroSlide>
  onDeleteHeroSlide: (id: string) => Promise<void>
  onCreateMarketingSlide: (data: Omit<MarketingSlide, "id">) => Promise<void>
  onUpdateMarketingSlide: (id: string, data: Partial<MarketingSlide>) => Promise<MarketingSlide>
  onDeleteMarketingSlide: (id: string) => Promise<void>
  aboutConfig: AboutConfig
  contactConfig: ContactConfig
  consultationConfig: ConsultationConfig
  onSaveAboutConfig: (c: AboutConfig) => Promise<void>
  onSaveContactConfig: (c: ContactConfig) => Promise<void>
  onSaveConsultationConfig: (c: ConsultationConfig) => Promise<void>
}

// ── Consultation Config ──────────────────────────────────────────────────────

export interface ConsultationConfig {
  // Master toggles
  homepageSectionEnabled: boolean
  consultationsRouteEnabled: boolean

  // Homepage CTA copy
  homepageEyebrow: string
  homepageHeadline: string
  homepageHeadlineAccent: string
  homepageSubcopy: string
  homepageBenefits: string[]
  homepagePrimaryCta: string
  homepageSecondaryCta: string
  homepageStats: Array<{ value: string; label: string }>
  homepageTestimonial: { quote: string; attribution: string }

  // Dedicated page hero copy
  pageEyebrow: string
  pageHeadline: string
  pageSubheadline: string
  pageFeatureChecklist: string[]
  pageStats: Array<{ value: string; label: string }>
  pagePrimaryCta: string
  pageSecondaryCta: string
  pageProcessSteps: Array<{ title: string; description: string }>
  pageTrustBadgeTitle: string
  pageTrustBadgeSubtitle: string
}

// ── About Page Config ────────────────────────────────────────────────────────

export interface AboutStat {
  label: string
  value: string
  suffix: string
}

export interface AboutConfig {
  heroTagline: string
  heroSubtext: string
  stats: AboutStat[]
  storyTitle: string
  storyText: string
  founderName: string
  founderRole: string
  founderBio: string
  artisanRegions: string[]
}

// ── Contact Page Config ──────────────────────────────────────────────────────

export interface WorkingHours {
  weekdays: string
  weekends: string
}

export interface FaqItem {
  id: string
  question: string
  answer: string
}

export interface GrievanceOfficer {
  name: string
  email: string
  address: string
}

/**
 * Contact-page-specific config. Phone/email previously lived here too but
 * were duplicates of `branding.contactPhone` / `branding.contactEmail`.
 * Removed to enforce single source of truth — edit canonical contact info
 * in Storefront → Branding instead. WhatsApp, wholesale, address, hours,
 * FAQs, and grievance officer remain here because they're contact-page-
 * specific concepts not duplicated elsewhere.
 */
export interface ContactConfig {
  whatsapp: string
  wholesaleEmail: string
  address: string
  workingHours: WorkingHours
  faqs: FaqItem[]
  grievanceOfficer: GrievanceOfficer
}
