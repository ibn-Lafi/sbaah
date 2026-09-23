/**
 * Proxies append the address they received a request from to
 * X-Forwarded-For, so only the last `TRUSTED_PROXY_HOPS` entries were
 * written by infrastructure we control; everything before them is whatever
 * the client chose to send. The first entry is therefore spoofable and must
 * never key a rate limit. Railway's edge is one hop (the default); set
 * TRUSTED_PROXY_HOPS=2 when the API is also proxied through Cloudflare.
 */
export function extractClientIp(headers: Headers, trustedProxyHops = readTrustedProxyHops()): string | null {
  const forwardedFor = headers.get('x-forwarded-for');
  if (!forwardedFor) return null;
  const hops = forwardedFor
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return hops[Math.max(0, hops.length - trustedProxyHops)] ?? null;
}

function readTrustedProxyHops(): number {
  const configured = Number(process.env.TRUSTED_PROXY_HOPS ?? 1);
  return Number.isInteger(configured) && configured >= 1 ? configured : 1;
}
