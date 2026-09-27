const GA_MEASUREMENT_ID_PATTERN = /^(?:G|GT|GTM)-[A-Z0-9]+$/;

export function safeGoogleAnalyticsId(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase();
  return normalized && GA_MEASUREMENT_ID_PATTERN.test(normalized) ? normalized : null;
}

export function safeExternalUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  // Contact settings are often entered as `www.example.com/profile` or
  // `instagram.com/profile`. Treat those as HTTPS links while keeping explicit
  // non-web schemes (javascript:, data:, etc.) rejectable below.
  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed.replace(/^\/{2}/, '')}`;

  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}
