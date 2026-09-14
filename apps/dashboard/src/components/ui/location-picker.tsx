'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface LocationPickerValue {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value: LocationPickerValue | null;
  onChange: (value: LocationPickerValue | null) => void;
}

/** Riyadh — the map opens centered here until a location is picked or an existing one is loaded. */
const DEFAULT_CENTER: [number, number] = [46.6753, 24.7136];

/**
 * Free, keyless map tiles (OpenFreeMap — no API key/billing, unlike
 * Google Maps; unlike raw OSM tile servers it's explicitly built for
 * production traffic, not just low-volume personal use).
 */
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

/** Click/drag to set a lat/lng — used by property/project/building forms (all optional fields). */
export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">الموقع على الخريطة (اختياري)</span>
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
            إزالة الموقع
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        className="h-[280px] w-full overflow-hidden rounded-input border border-border-default"
      />
      <p className="text-xs text-text-secondary">انقر على الخريطة لتحديد الموقع، أو اسحب العلامة لتعديله.</p>
    </div>
  );
}
