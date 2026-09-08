/** Parses "Bearer <token>" from a raw Authorization header value. Returns null if missing or malformed. */
export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}
