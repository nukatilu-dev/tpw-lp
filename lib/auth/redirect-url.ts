/**
 * Canonical public URL for Supabase Auth email redirects.
 * Set NEXT_PUBLIC_SITE_URL=https://tpw.my.id in production.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://tpw.my.id"

export function getAuthRedirectUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${SITE_URL}${normalizedPath}`
}
