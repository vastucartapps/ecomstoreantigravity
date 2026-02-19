/**
 * Normalize image URLs from MinIO/S3 to go through the frontend image proxy.
 *
 * The Medusa backend stores image URLs using the S3_FILE_URL env var,
 * which typically points to an http:// MinIO URL. On HTTPS pages this causes
 * mixed-content errors. This utility rewrites such URLs to `/img-proxy/...`
 * which the Next.js API route proxies to MinIO internally.
 */
export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url) return ""
  // Only rewrite URLs that contain the MinIO bucket path
  const match = url.match(/\/medusa-uploads\/(.+)$/)
  if (match) return `/img-proxy/${match[1]}`
  return url
}
