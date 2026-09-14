'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { City } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { formatPrice, formatPriceCompact, getListingTypeLabel, getPropertyTypeLabel } from '@/lib/property/labels';
import type { MapBuildingPin, MapPinsResponse, MapProjectPin, MapPropertyPin } from '@/lib/api/public-map';

type SelectedPin =
  | { kind: 'property'; data: MapPropertyPin }
  | { kind: 'project'; data: MapProjectPin }
  | { kind: 'building'; data: MapBuildingPin };

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * Without this, maplibre-gl draws Arabic place labels with each glyph in
 * the correct position but the letters themselves unshaped/unconnected
 * (reads as mirrored/broken Arabic) — this is maplibre's own documented
 * fix (see the `setRTLTextPlugin` doc comment in its .d.ts), not
 * something specific to this map style. Guarded because calling it twice
 * throws.
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

const VIEW_LABEL: Record<Locale, string> = { ar: 'عرض التفاصيل', en: 'View details' };
const GOOGLE_MAPS_LABEL: Record<Locale, string> = { ar: 'فتح في خرائط قوقل', en: 'Open in Google Maps' };
const KIND_LABEL: Record<Locale, Record<SelectedPin['kind'], string>> = {
  ar: { property: '', project: 'مشروع', building: 'عمارة' },
  en: { property: '', project: 'Project', building: 'Building' },
};

function googleMapsHref(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** District names aren't fetched here (would need a per-city call per pin) — the city alone is enough context for a small map card. */
function cityLabel(locale: Locale, cities: City[], cityId: string): string {
  const city = cities.find((c) => c.id === cityId);
  return city ? pickLocalized(locale, city.name_ar, city.name_en) : '';
}

function PropertyCardContent({ locale, cities, property }: { locale: Locale; cities: City[]; property: MapPropertyPin }) {
  const title = pickLocalized(locale, property.title_ar, property.title_en);
  const thumbnail = [...property.property_media]
    .filter((media) => media.media_type === 'image')
    .sort((a, b) => a.order_index - b.order_index)[0];
  const href = locale === 'ar' ? `/properties/${property.id}` : `/en/properties/${property.id}`;

  return (
    <div className="w-72 overflow-hidden rounded-2xl bg-white shadow-xl">
      <div className="aspect-[4/3] bg-black/5">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail.url} alt={title} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <span className="text-xs font-medium text-tenant-primary">{getListingTypeLabel(locale, property.listing_type)}</span>
        <h3 className="truncate font-semibold text-black">{title}</h3>
        <p className="text-xs text-black/60">
          {getPropertyTypeLabel(locale, property.property_type)} · {cityLabel(locale, cities, property.city_id)}
        </p>
        <p className="text-xs text-black/60">
          {property.area_sqm} m²
          {property.bedrooms !== null ? ` · ${property.bedrooms} ${locale === 'ar' ? 'غرف' : 'bd'}` : ''}
          {property.bathrooms !== null ? ` · ${property.bathrooms} ${locale === 'ar' ? 'حمامات' : 'ba'}` : ''}
        </p>
        <p className="font-bold text-tenant-primary">{formatPrice(locale, property.price)}</p>
        <div className="mt-2 flex gap-2">
          <a
            href={href}
            className="flex h-9 flex-1 items-center justify-center rounded-lg bg-tenant-primary text-xs font-semibold text-white hover:opacity-90"
          >
            {VIEW_LABEL[locale]}
          </a>
          <a
            href={googleMapsHref(property.lat, property.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 flex-1 items-center justify-center rounded-lg border border-black/10 text-xs font-semibold text-black hover:bg-black/5"
          >
            {GOOGLE_MAPS_LABEL[locale]}
          </a>
        </div>
      </div>
    </div>
  );
}

function EntityCardContent({
  locale,
  cities,
  kind,
  entity,
}: {
  locale: Locale;
  cities: City[];
  kind: 'project' | 'building';
  entity: MapProjectPin | MapBuildingPin;
}) {
  const name = pickLocalized(locale, entity.name_ar, entity.name_en);

  return (
    <div className="w-64 overflow-hidden rounded-2xl bg-white p-4 shadow-xl">
      <span className="text-xs font-medium text-tenant-primary">{KIND_LABEL[locale][kind]}</span>
      <h3 className="truncate font-semibold text-black">{name}</h3>
      <p className="text-xs text-black/60">{cityLabel(locale, cities, entity.city_id)}</p>
      <a
        href={googleMapsHref(entity.lat, entity.lng)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex h-9 items-center justify-center rounded-lg border border-black/10 text-xs font-semibold text-black hover:bg-black/5"
      >
        {GOOGLE_MAPS_LABEL[locale]}
      </a>
    </div>
  );
}

interface MapViewProps {
  locale: Locale;
  cities: City[];
  pins: MapPinsResponse;
}

/**
 * Custom HTML markers (not maplibre's default pin icon): property pins
 * show a compact price badge (matches the founder's reference — a price
 * bubble per unit, click opens a floating preview card), project/building
 * pins show a smaller dot since they carry no price. The card itself is
 * plain React state (`selected`) rendered through a portal into a DOM
 * node that a `maplibregl.Popup` owns purely for positioning/dismissal
 * (anchored to the marker, closes on an outside click) — its visual
 * chrome is fully custom (see map-view.css), not the library's default
 * white bubble.
 */
export function MapView({ locale, cities, pins }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [popupContainer, setPopupContainer] = useState<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<SelectedPin | null>(null);

  const allPins = useMemo<SelectedPin[]>(
    () => [
      ...pins.properties.map((data): SelectedPin => ({ kind: 'property', data })),
      ...pins.projects.map((data): SelectedPin => ({ kind: 'project', data })),
      ...pins.buildings.map((data): SelectedPin => ({ kind: 'building', data })),
    ],
    [pins],
  );

  useEffect(() => {
    if (!containerRef.current || allPins.length === 0) return;
    ensureRtlTextPlugin();

    const bounds = new maplibregl.LngLatBounds();
    allPins.forEach((pin) => bounds.extend([pin.data.lng, pin.data.lat]));

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: bounds.getCenter(),
      zoom: 11,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.on('load', () => {
      if (allPins.length > 1) map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 });
    });
    mapRef.current = map;

    const container = document.createElement('div');
    setPopupContainer(container);

    allPins.forEach((pin) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', pin.kind === 'property' ? formatPrice(locale, pin.data.price) : pickLocalized(locale, pin.data.name_ar, pin.data.name_en));
      el.className =
        pin.kind === 'property'
          ? 'rounded-full bg-tenant-primary px-2.5 py-1 text-xs font-bold text-white shadow-md hover:opacity-90'
          : 'flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-black/70 shadow-md hover:opacity-90';
      if (pin.kind === 'property') el.textContent = formatPriceCompact(pin.data.price);

      el.addEventListener('click', (event) => {
        event.stopPropagation();
        setSelected(pin);
      });

      new maplibregl.Marker({ element: el }).setLngLat([pin.data.lng, pin.data.lat]).addTo(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !popupContainer) return;

    if (!selected) {
      popupRef.current?.remove();
      popupRef.current = null;
      return;
    }

    popupRef.current?.remove();
    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: true, offset: 18, maxWidth: 'none', className: 'sbaah-map-popup' })
      .setLngLat([selected.data.lng, selected.data.lat])
      .setDOMContent(popupContainer)
      .addTo(map);
    popup.on('close', () => setSelected(null));
    popupRef.current = popup;
  }, [selected, popupContainer]);

  if (allPins.length === 0) return null;

  return (
    <>
      <div ref={containerRef} className="h-[480px] w-full sm:h-[560px]" />
      {popupContainer &&
        selected &&
        createPortal(
          selected.kind === 'property' ? (
            <PropertyCardContent locale={locale} cities={cities} property={selected.data} />
          ) : (
            <EntityCardContent locale={locale} cities={cities} kind={selected.kind} entity={selected.data} />
          ),
          popupContainer,
        )}
    </>
  );
}
