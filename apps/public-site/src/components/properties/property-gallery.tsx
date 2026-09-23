'use client';

import { useState } from 'react';
import type { PublicPropertyMedia } from '@/lib/api/public-properties';

/** Plain `<img>`/`<video>`, not next/image — same call as task 32/42's header logo (avoids assuming Supabase Storage's exact hostname pattern for a remote-image allowlist). */
export function PropertyGallery({ media, title }: { media: PublicPropertyMedia[]; title: string }) {
  const sorted = [...media].sort((a, b) => a.order_index - b.order_index);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex] ?? sorted[0];

  if (!active) {
    return <div className="aspect-video w-full rounded-xl bg-black/5" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black/5">
        {active.media_type === 'video' ? (
          <video src={active.url} controls preload="metadata" className="h-full w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active.url} alt={title} fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
        )}
      </div>

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {sorted.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`${title} ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={`h-16 w-24 flex-none overflow-hidden rounded-lg border-2 ${
                index === activeIndex ? 'border-tenant-primary' : 'border-transparent'
              }`}
            >
              {item.media_type === 'video' ? (
                <video src={item.url} preload="metadata" className="h-full w-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
