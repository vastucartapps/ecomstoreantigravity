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
  onUpdateAnnouncement: (a: Announcement) => Promise<void>
  onUpdateBranding: (b: Branding) => Promise<void>
  onReorderSection: (id: string, direction: "up" | "down") => Promise<void>
  onToggleSection: (id: string, enabled: boolean) => Promise<void>
  onEditPage: (id: string, content: string) => Promise<void>
  onTogglePagePublish: (id: string, published: boolean) => Promise<void>
  onUpdateFooter: (f: FooterConfig) => Promise<void>
}
