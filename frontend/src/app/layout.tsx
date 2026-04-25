import type { Metadata } from "next"
import { Lora, Open_Sans, IBM_Plex_Mono } from "next/font/google"
import { AuthProvider } from "@/providers/auth-provider"
import { CartProvider } from "@/providers/cart-provider"
import { WishlistProvider } from "@/providers/wishlist-provider"
import { AnnouncementProvider } from "@/providers/announcement-provider"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"
import "./globals.css"

const lora = Lora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const openSans = Open_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
})

/**
 * Dynamic root metadata. Reads admin's branding via SSR so changes to
 * Store Name, tagline, or favicon in admin propagate to every page's
 * <title>, <meta description>, OpenGraph siteName, Twitter card, and
 * favicon. Hard-coded BRAND_DEFAULTS only apply on first paint before
 * admin has saved (or if backend is unreachable).
 *
 * NOTE: this is intentionally NOT cached aggressively — Next.js will
 * cache the metadata response per route via the fetch revalidate, so
 * admin edits show up in SEO crawlers within ~5 minutes of save.
 */
export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  const titleDefault = `${b.storeName} — ${b.tagline}`

  return {
    title: {
      default: titleDefault,
      template: `%s | ${b.storeName}`,
    },
    description: b.tagline,
    metadataBase: new URL(b.siteUrl),
    icons: { icon: b.faviconUrl },
    openGraph: {
      siteName: b.storeName,
      title: titleDefault,
      description: b.tagline,
      url: b.siteUrl,
      type: "website",
      locale: "en_IN",
      images: [{ url: "/og-default.png", width: 500, height: 500, alt: titleDefault }],
    },
    twitter: {
      card: "summary_large_image",
      title: titleDefault,
      description: b.tagline,
      images: ["/og-default.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    manifest: "/manifest.json",
    other: { "theme-color": "#013f47" },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${lora.variable} ${openSans.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AnnouncementProvider>{children}</AnnouncementProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
