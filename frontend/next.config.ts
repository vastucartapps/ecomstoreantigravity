import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  // Compress responses (gzip) for faster page loads
  compress: true,
  // Optimize images — allow MinIO/S3 and external domains
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.vastucart.in" },
      { protocol: "http", hostname: "minio", port: "9000" },
      { protocol: "http", hostname: "localhost", port: "9002" },
      // Allow any HTTPS host — imported products may use Amazon CDN, etc.
      { protocol: "https", hostname: "**" },
    ],
  },
  // API routing handled by src/middleware.ts — NOT rewrites.
  // Middleware can distinguish page navigation (GET, no auth) from API calls
  // (POST/PUT/DELETE or GET with Authorization header) and proxy accordingly.
  async headers() {
    return [
      {
        // Cache static assets aggressively (1 year — hashed filenames handle busting)
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache images for 1 day, revalidate in background
        source: "/_next/image/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        // Security headers on all routes
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Prevent HTTPS downgrade attacks; 1 year, include subdomains
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Permissions policy — restrict sensitive browser APIs
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()" },
          // Content Security Policy
          // Allows: our own origin, Medusa backend, MinIO, Google Fonts,
          // Razorpay, Stripe, PostHog analytics.
          // 'unsafe-inline' on styles is required by Tailwind CSS inline styles.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://js.stripe.com https://app.posthog.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://sapi.vastucart.in https://store.vastucart.in https://api.razorpay.com https://api.stripe.com https://app.posthog.com https://www.google-analytics.com wss:",
              "frame-src https://api.razorpay.com https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
