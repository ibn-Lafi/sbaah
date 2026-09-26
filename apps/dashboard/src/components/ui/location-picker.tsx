'use client';

import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
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
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright';

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
    const container = containerRef.current;

    const map = new maplibregl.Map({
      container,
      style: MAP_STYLE,
      center: value ? [value.lng, value.lat] : DEFAULT_CENTER,
      zoom: value ? 14 : 5,
      maxZoom: 19,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    mapRef.current = map;

    // The picker is commonly mounted inside a wizard step in a scrollable
    // modal. Its width can settle after MapLibre's first measurement, leaving
    // blank or blurry tiles unless the canvas is resized afterwards.
    let resizeFrame = requestAnimationFrame(() => map.resize());
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => map.resize());
    });
    resizeObserver.observe(container);
    map.once('load', () => map.resize());

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
      cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !focusPoint) return;
    mapRef.current.resize();
    mapRef.current.flyTo({ center: [focusPoint.lng, focusPoint.lat], zoom: 12, duration: 800 });
  }, [focusPoint]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-text-primary text-sm font-medium">{t.locationOnMap}</span>
        {value && (
          <button
            type="button"
            onClick={() => {
              markerRef.current?.remove();
              markerRef.current = null;
              onChangeRef.current(null);
            }}
            className="text-danger text-xs font-semibold hover:underline"
          >
            {t.removeLocation}
          </button>
        )}
      </div>
      <div className="rounded-input border-border-default relative h-[260px] w-full min-w-0 overflow-hidden border bg-[#e9eef2] sm:h-[320px]">
        <div ref={containerRef} className="absolute inset-0" />
        {value && (
          <div
            dir="ltr"
            className="pointer-events-none absolute bottom-2 left-1/2 z-[2] -translate-x-1/2 rounded-full border border-black/10 bg-white/95 px-3 py-1 text-[11px] font-semibold text-black/70 shadow-sm"
          >
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </div>
        )}
      </div>
      <p className="text-text-secondary text-xs">{t.mapInstructions}</p>
    </div>
  );
}
