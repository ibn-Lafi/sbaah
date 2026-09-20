const GA_MEASUREMENT_ID_PATTERN = /^(?:G|GT|GTM)-[A-Z0-9]+$/;

export function safeGoogleAnalyticsId(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase();
  return normalized && GA_MEASUREMENT_ID_PATTERN.test(normalized) ? normalized : null;
}

export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}
