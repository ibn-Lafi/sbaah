/**
 * Free, keyless geocoding via OpenStreetMap's Nominatim — same "no
 * API key/billing" constraint `LocationPicker` already follows for map
 * tiles (OpenFreeMap). Used only to auto-place a newly created district
 * on the map (migration 0046) — never blocks district creation: any
 * failure (network, no match, rate limit) just means the caller falls
 * back to the city's own coordinates.
 *
 * Nominatim's usage policy requires a descriptive User-Agent and caps
 * requests at ~1/sec — both fine here since this only fires once per
 * newly created district, a rare, user-initiated action.
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const REQUEST_TIMEOUT_MS = 5_000;

export interface GeocodeResult {
  lat: number;
  lng: number;
}

export async function geocodeSaudiPlace(
  query: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GeocodeResult | null> {
  const url = new URL(NOMINATIM_BASE_URL);
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', query);
  url.searchParams.set('countrycodes', 'sa');
  url.searchParams.set('limit', '1');

  try {
    const response = await fetchImpl(url.toString(), {
      headers: {
        'User-Agent': 'sbaah-platform/1.0 (https://sbaah.app)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const results = (await response.json()) as Array<{ lat: string; lon: string }>;
    const first = results[0];
    if (!first) return null;

    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng };
  } catch {
    return null;
  }
}
