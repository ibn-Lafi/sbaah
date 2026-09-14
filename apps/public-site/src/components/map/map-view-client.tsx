'use client';

import dynamic from 'next/dynamic';
import type { City } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import type { MapPinsResponse } from '@/lib/api/public-map';

/**
 * `ssr: false` requires the `dynamic()` call site to be inside a Client
 * Component (Next.js App Router restriction) — this thin wrapper exists
 * only to hold that boundary, since `MapSection` (its caller) is a
 * Server Component. maplibre-gl reads `window` at module-evaluation time,
 * so skipping SSR here isn't just a bundle-size optimization, it avoids
 * a server-render crash.
 */
const MapView = dynamic(() => import('./map-view').then((mod) => mod.MapView), { ssr: false });

interface MapViewClientProps {
  locale: Locale;
  cities: City[];
  pins: MapPinsResponse;
}

export function MapViewClient(props: MapViewClientProps) {
  return <MapView {...props} />;
}
