'use client';

import { useEffect, useState } from 'react';
import { BrandMark } from '@/components/ui/brand-mark';

/**
 * Full-screen "نجهز موقعك" curtain shown while the last registration
 * step finishes — account + website creation (migration 0012's trigger)
 * actually takes well under a second, so the bar climbing to ~90% is a
 * simulated perceived-progress cue (standard SaaS onboarding pattern),
 * not a real progress signal. The parent flips `done` once `register()`
 * resolves, which snaps the bar the rest of the way to 100% just before
 * navigating away.
 */
export function ProvisioningOverlay({ active, done }: { active: boolean; done: boolean }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }
    const interval = setInterval(() => {
      setProgress((current) => (current >= 90 ? current : current + Math.random() * 8 + 2));
    }, 220);
    return () => clearInterval(interval);
  }, [active]);

  useEffect(() => {
    if (done) setProgress(100);
  }, [done]);

  if (!active) return null;

  return (
    <div className="bg-surface-page fixed inset-0 z-50 flex flex-col items-center justify-center gap-8">
      <BrandMark width={130} height={33} />
      <div className="flex w-full max-w-[280px] flex-col gap-3">
        <div className="bg-surface-subtle-3 h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-brand h-full rounded-full transition-[width] duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-text-secondary text-center text-sm font-medium">نجهز موقعك...</p>
      </div>
    </div>
  );
}
