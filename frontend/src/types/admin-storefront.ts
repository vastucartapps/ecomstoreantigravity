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

export interface Branding {
  storeName: string
  tagline: string
  contactEmail: string
  contactPhone: string
  address: string
  logoUrl: string
  faviconUrl: string
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
}
