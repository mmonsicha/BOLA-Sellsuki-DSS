/**
 * Normalize a media URL for display in the browser.
 *
 * **Local dev** — URLs pointing to localhost (direct MinIO or local proxy)
 * are rewritten to relative `/media/<key>` paths so the Vite dev proxy can
 * forward them to the backend media proxy → MinIO.
 *
 * **Staging / Production** — URLs with a real hostname (CDN, backend proxy,
 * LINE CDN, etc.) are returned unchanged because they are already publicly
 * accessible.
 */
export function toDisplayUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const u = new URL(url);

    // Only rewrite localhost URLs — staging/prod URLs are public and usable as-is.
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
      // Already a local proxy path (/media/...)
      if (u.pathname.startsWith("/media/")) return u.pathname;

      // Direct MinIO URL (http://localhost:9000/<bucket>/<key>)
      // Strip the first path segment (bucket name) to get the object key.
      const match = u.pathname.match(/^\/[^/]+\/(.+)$/);
      if (match) return `/media/${match[1]}`;
    }
  } catch {
    // url is already a relative path or otherwise unparseable — return as-is
  }
  return url;
}

/**
 * Build a full, copyable public URL from a media URL.
 *
 * Unlike `toDisplayUrl` (which returns relative paths for `<img src>`),
 * this always returns an absolute URL suitable for pasting into a browser
 * or sharing externally.
 *
 * - Localhost MinIO URLs → `{window.location.origin}/media/<key>`
 * - Staging/prod URLs → returned as-is (already public)
 */
export function toCopyableUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const u = new URL(url);

    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
      if (u.pathname.startsWith("/media/")) {
        return `${window.location.origin}${u.pathname}`;
      }
      const match = u.pathname.match(/^\/[^/]+\/(.+)$/);
      if (match) return `${window.location.origin}/media/${match[1]}`;
    }
  } catch {
    // relative path — make it absolute
    if (url.startsWith("/")) return `${window.location.origin}${url}`;
  }
  return url;
}
