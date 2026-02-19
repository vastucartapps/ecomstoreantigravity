import type { NextConfig } from "next";

const backendUrl = process.env.MEDUSA_INTERNAL_URL || "http://backend:9000";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  async rewrites() {
    return [
      { source: "/store/:path*", destination: `${backendUrl}/store/:path*` },
      { source: "/admin/:path*", destination: `${backendUrl}/admin/:path*` },
      { source: "/auth/:path*", destination: `${backendUrl}/auth/:path*` },
      { source: "/health", destination: `${backendUrl}/health` },
      { source: "/.well-known/:path*", destination: `${backendUrl}/.well-known/:path*` },
    ];
  },
};

export default nextConfig;
