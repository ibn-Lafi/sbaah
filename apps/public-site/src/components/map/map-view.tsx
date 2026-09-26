'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { City } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { pickLocalized } from '@/lib/i18n/localized-field';
import {
  formatPrice,
  formatPriceCompact,
  getListingTypeLabel,
  getPropertyTypeLabel,
} from '@/lib/property/labels';
import type {
  MapBuildingPin,
  MapPinsResponse,
  MapProjectPin,
  MapPropertyPin,
} from '@/lib/api/public-map';

type SelectedPin =
  | { kind: 'property'; data: MapPropertyPin }
  | { kind: 'project'; data: MapProjectPin }
  | { kind: 'building'; data: MapBuildingPin };

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright';

const VIEW_LABEL: Record<Locale, string> = { ar: 'عرض التفاصيل', en: 'View details' };
const GOOGLE_MAPS_LABEL: Record<Locale, string> = {
  ar: 'فتح في خرائط قوقل',
  en: 'Open in Google Maps',
};
const KIND_LABEL: Record<Locale, Record<SelectedPin['kind'], string>> = {
  ar: { property: '', project: 'مشروع', building: 'عمارة' },
  en: { property: '', project: 'Project', building: 'Building' },
};

function googleMapsHref(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** District names aren't fetched here (would need a per-city call per pin) — the city alone is enough context for a small map card. */
function cityLabel(locale: Locale, cities: City[], cityId: string | null): string {
  const city = cities.find((c) => c.id === cityId);
  return city ? pickLocalized(locale, city.name_ar, city.name_en) : '';
}

function PropertyCardContent({
  locale,
  cities,
  property,
}: {
  locale: Locale;
  cities: City[];
  property: MapPropertyPin;
}) {
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
        <span className="text-tenant-primary text-xs font-medium">
          {property.listing_type ? getListingTypeLabel(locale, property.listing_type) : getPropertyTypeLabel(locale, property.property_type)}
        </span>
        <h3 className="truncate font-semibold text-black">{title}</h3>
        <p className="text-xs text-black/60">
          {getPropertyTypeLabel(locale, property.property_type)} ·{' '}
          {cityLabel(locale, cities, property.city_id)}
        </p>
        <p className="text-xs text-black/60">
          {property.area_sqm != null ? `${property.area_sqm} m²` : ''}
          {property.bedrooms !== null
            ? ` · ${property.bedrooms} ${locale === 'ar' ? 'غرف' : 'bd'}`
            : ''}
          {property.bathrooms !== null
            ? ` · ${property.bathrooms} ${locale === 'ar' ? 'حمامات' : 'ba'}`
            : ''}
        </p>
        {property.price != null && <p className="text-tenant-primary font-bold">{formatPrice(locale, property.price)}</p>}
        <div className="mt-2 flex gap-2">
          <a
            href={href}
            className="bg-tenant-primary flex h-9 flex-1 items-center justify-center rounded-lg text-xs font-semibold text-white hover:opacity-90"
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
      <span className="text-tenant-primary text-xs font-medium">{KIND_LABEL[locale][kind]}</span>
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

function hasValidCoordinates(pin: SelectedPin): boolean {
  const lat = Number(pin.data.lat);
  const lng = Number(pin.data.lng);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function pinCoordinates(pin: SelectedPin): [number, number] {
  return [Number(pin.data.lng), Number(pin.data.lat)];
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
    () =>
      [
        ...pins.properties.map((data): SelectedPin => ({ kind: 'property', data })),
        ...pins.projects.map((data): SelectedPin => ({ kind: 'project', data })),
        ...pins.buildings.map((data): SelectedPin => ({ kind: 'building', data })),
      ].filter(hasValidCoordinates),
    [pins],
  );

  useEffect(() => {
    if (!containerRef.current || allPins.length === 0) return;
    const mapContainer = containerRef.current;

    const bounds = new maplibregl.LngLatBounds();
    allPins.forEach((pin) => bounds.extend(pinCoordinates(pin)));

    const map = new maplibregl.Map({
      container: mapContainer,
      style: MAP_STYLE,
      center: bounds.getCenter(),
      zoom: allPins.length === 1 ? 14 : 11,
      maxZoom: 19,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.on('load', () => {
      map.resize();
      if (allPins.length > 1) {
        map.fitBounds(bounds, {
          padding: mapContainer.clientWidth < 640 ? 42 : 72,
          maxZoom: 15,
          duration: 0,
        });
      }
    });
    mapRef.current = map;

    let resizeFrame = requestAnimationFrame(() => map.resize());
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => map.resize());
    });
    resizeObserver.observe(mapContainer);

    const container = document.createElement('div');
    setPopupContainer(container);

    allPins.forEach((pin) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute(
        'aria-label',
        pin.kind === 'property'
          ? (pin.data.price != null ? formatPrice(locale, pin.data.price) : pickLocalized(locale, pin.data.title_ar, pin.data.title_en))
          : pickLocalized(locale, pin.data.name_ar, pin.data.name_en),
      );
      el.className =
        pin.kind === 'property'
          ? 'rounded-full border border-white/90 bg-tenant-primary px-3 py-1.5 text-xs font-bold text-white shadow-[0_4px_16px_rgba(0,0,0,.28)] hover:opacity-90'
          : 'flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-tenant-primary shadow-[0_4px_16px_rgba(0,0,0,.3)] hover:opacity-90';
      if (pin.kind === 'property') {
        el.textContent = pin.data.price != null ? formatPriceCompact(pin.data.price) : '⌂';
      } else {
        const center = document.createElement('span');
        center.className = 'h-2 w-2 rounded-full bg-white';
        el.append(center);
      }

      el.addEventListener('click', (event) => {
        event.stopPropagation();
        setSelected(pin);
      });

      new maplibregl.Marker({ element: el }).setLngLat(pinCoordinates(pin)).addTo(map);
    });

    return () => {
      cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
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
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: true,
      offset: 18,
      maxWidth: 'none',
      className: 'sbaah-map-popup',
    })
      .setLngLat([Number(selected.data.lng), Number(selected.data.lat)])
      .setDOMContent(popupContainer)
      .addTo(map);
    popup.on('close', () => setSelected(null));
    popupRef.current = popup;
  }, [selected, popupContainer]);

  if (allPins.length === 0) return null;

  return (
    <>
      <div ref={containerRef} className="h-[480px] w-full bg-[#e9eef2] sm:h-[560px]" />
      {popupContainer &&
        selected &&
        createPortal(
          selected.kind === 'property' ? (
            <PropertyCardContent locale={locale} cities={cities} property={selected.data} />
          ) : (
            <EntityCardContent
              locale={locale}
              cities={cities}
              kind={selected.kind}
              entity={selected.data}
            />
          ),
          popupContainer,
        )}
    </>
  );
}
