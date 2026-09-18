'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useLocale } from '@/lib/i18n/locale-context';

export interface LocationPickerValue {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value: LocationPickerValue | null;
  onChange: (value: LocationPickerValue | null) => void;
  /** Pans the map here when it changes (e.g. the form's city/district Select) — a navigation aid, does not itself set `value`. */
  focusPoint?: LocationPickerValue | null;
}

/** Riyadh — the map opens centered here until a location is picked or an existing one is loaded. */
const DEFAULT_CENTER: [number, number] = [46.6753, 24.7136];

/**
 * Free, keyless map tiles (OpenFreeMap — no API key/billing, unlike
 * Google Maps; unlike raw OSM tile servers it's explicitly built for
 * production traffic, not just low-volume personal use).
 */
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * Without this, maplibre-gl draws Arabic place labels with each glyph in
 * the correct position but the letters themselves unshaped/unconnected
 * (reads as mirrored/broken Arabic) — this is maplibre's own documented
 * fix (see the `setRTLTextPlugin` doc comment in its .d.ts), not
 * something specific to this map style. Guarded because calling it twice
 * throws, and both `LocationPicker` and the public-site map mount it.
 */
let rtlPluginRequested = false;
function ensureRtlTextPlugin() {
  if (rtlPluginRequested) return;
  rtlPluginRequested = true;
  void maplibregl.setRTLTextPlugin(
    'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js',
    true,
  );
}

/** Click/drag to set a lat/lng — used by property/project/building forms (all optional fields). */
export function LocationPicker({ value, onChange, focusPoint }: LocationPickerProps) {
  const { pages } = useLocale();
  const t = pages.common;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;
    ensureRtlTextPlugin();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: value ? [value.lng, value.lat] : DEFAULT_CENTER,
      zoom: value ? 14 : 5,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    mapRef.current = map;

    function placeMarker(lngLat: maplibregl.LngLat) {
      if (markerRef.current) {
        markerRef.current.setLngLat(lngLat);
      } else {
        markerRef.current = new maplibregl.Marker({ draggable: true, color: '#68458A' })
          .setLngLat(lngLat)
          .addTo(map);
        markerRef.current.on('dragend', () => {
          const position = markerRef.current?.getLngLat();
          if (position) onChangeRef.current({ lat: position.lat, lng: position.lng });
        });
      }
    }

    if (value) placeMarker(new maplibregl.LngLat(value.lng, value.lat));

    map.on('click', (event) => {
      placeMarker(event.lngLat);
      onChangeRef.current({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !focusPoint) return;
    mapRef.current.flyTo({ center: [focusPoint.lng, focusPoint.lat], zoom: 12, duration: 800 });
  }, [focusPoint]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">{t.locationOnMap}</span>
        {value && (
          <button
            type="button"
            onClick={() => {
              markerRef.current?.remove();
              markerRef.current = null;
              onChangeRef.current(null);
            }}
            className="text-xs font-semibold text-danger hover:underline"
          >
            {t.removeLocation}
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        className="h-[220px] w-full min-w-0 overflow-hidden rounded-input border border-border-default sm:h-[280px]"
      />
      <p className="text-xs text-text-secondary">{t.mapInstructions}</p>
    </div>
  );
}
