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
  icons: {
    icon: "/favicon.png",
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
