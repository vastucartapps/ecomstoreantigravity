import type { NextConfig } from "next";

const backendUrl = process.env.MEDUSA_INTERNAL_URL || "http://backend:9000";

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
  async rewrites() {
    return [
      { source: "/store/:path*", destination: `${backendUrl}/store/:path*` },
      { source: "/admin/:path*", destination: `${backendUrl}/admin/:path*` },
      { source: "/auth/:path*", destination: `${backendUrl}/auth/:path*` },
      { source: "/health", destination: `${backendUrl}/health` },
      { source: "/.well-known/:path*", destination: `${backendUrl}/.well-known/:path*` },
    ];
  },
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
