'use client';

import { useState } from 'react';
import type { PropertyMedia } from '@sbaah/shared';

/** Plain `<img>`/`<video>`, not next/image — same call as task 32/42's header logo (avoids assuming Supabase Storage's exact hostname pattern for a remote-image allowlist). */
export function PropertyGallery({ media, title }: { media: PropertyMedia[]; title: string }) {
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
          <video src={active.url} controls className="h-full w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active.url} alt={title} className="h-full w-full object-cover" />
        )}
      </div>

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {sorted.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-16 w-24 flex-none overflow-hidden rounded-lg border-2 ${
                index === activeIndex ? 'border-tenant-primary' : 'border-transparent'
              }`}
            >
              {item.media_type === 'video' ? (
                <video src={item.url} className="h-full w-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
