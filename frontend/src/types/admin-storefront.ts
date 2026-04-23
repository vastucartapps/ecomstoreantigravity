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

export interface StorefrontConfig {
  announcement: Announcement
  branding: Branding
  homepageSections: HomepageSection[]
  contentPages: ContentPage[]
  footerConfig: FooterConfig
  consultationConfig: ConsultationConfig
}

export interface AdminStorefrontProps {
  announcement: Announcement
  branding: Branding
  homepageSections: HomepageSection[]
  contentPages: ContentPage[]
  footerConfig: FooterConfig
  heroSlides: HeroSlide[]
  marketingSlides: MarketingSlide[]
  onUpdateAnnouncement: (a: Announcement) => Promise<void>
  onUpdateBranding: (b: Branding) => Promise<void>
  onReorderSection: (id: string, direction: "up" | "down") => Promise<void>
  onToggleSection: (id: string, enabled: boolean) => Promise<void>
  onEditPage: (id: string, content: string) => Promise<void>
  onTogglePagePublish: (id: string, published: boolean) => Promise<void>
  onUpdateFooter: (f: FooterConfig) => Promise<void>
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

export interface ContactConfig {
  phone: string
  email: string
  whatsapp: string
  wholesaleEmail: string
  address: string
  workingHours: WorkingHours
  faqs: FaqItem[]
  grievanceOfficer: GrievanceOfficer
}
