import type { Metadata } from "next"
import { Lora, Open_Sans, IBM_Plex_Mono } from "next/font/google"
import { AuthProvider } from "@/providers/auth-provider"
import { CartProvider } from "@/providers/cart-provider"
import { WishlistProvider } from "@/providers/wishlist-provider"
import { AnnouncementProvider } from "@/providers/announcement-provider"
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

export const metadata: Metadata = {
  title: {
    default: "VastuCart — Authentic Spiritual Products",
    template: "%s | VastuCart",
  },
  description:
    "Your trusted destination for authentic spiritual products, crystals, yantras, and Vastu Shastra tools.",
  metadataBase: new URL("https://store.vastucart.in"),
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    siteName: "VastuCart",
    title: "VastuCart — Authentic Spiritual Products",
    description:
      "Your trusted destination for authentic spiritual products, crystals, yantras, and Vastu Shastra tools.",
    url: "https://store.vastucart.in",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "VastuCart — Authentic Spiritual Products",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VastuCart — Authentic Spiritual Products",
    description:
      "Your trusted destination for authentic spiritual products, crystals, yantras, and Vastu Shastra tools.",
    images: ["/og-default.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: "/manifest.json",
  other: {
    "theme-color": "#013f47",
  },
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
