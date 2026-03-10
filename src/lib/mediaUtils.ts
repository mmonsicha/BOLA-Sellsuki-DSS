/**
 * Convert any absolute media URL to a relative path that can be served by
 * the Vite dev proxy → backend media proxy → MinIO.
 *
 * Handles two URL formats that appear in the database:
 *
 * 1. ngrok / CDN URL:   https://<ngrok-host>/media/<key>
 *    → returns /media/<key>
 *
 * 2. Direct MinIO URL:  http://localhost:<port>/<bucket>/<key>
 *    → strips the bucket prefix and returns /media/<key>
 *    This format is stored in the database when MEDIA_CDN_BASE_URL is the
 *    default "http://localhost:9000/bola-media". Browsers block these from
 *    HTTPS pages (mixed content), so they must be proxied.
 *
 * Any other URL (LINE CDN, etc.) is returned unchanged.
 */
export function toDisplayUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const u = new URL(url);

    // Case 1: already routed through our proxy path (/media/...)
    if (u.pathname.startsWith("/media/")) return u.pathname;

    // Case 2: direct MinIO / local S3 URL  (http://localhost:{port}/{bucket}/{key})
    // Strip the first path segment (the bucket name) to get just the object key.
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
      const match = u.pathname.match(/^\/[^/]+\/(.+)$/);
      if (match) return `/media/${match[1]}`;
    }
  } catch {
    // url is already a relative path or otherwise unparseable — return as-is
  }
  return url;
}
