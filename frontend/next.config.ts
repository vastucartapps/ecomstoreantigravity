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
        ],
      },
    ];
  },
};

export default nextConfig;
