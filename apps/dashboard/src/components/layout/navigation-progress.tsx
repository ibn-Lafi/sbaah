'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Thin, fixed navigation progress indicator inspired by native SaaS dashboards.
 * It starts as soon as an internal link is activated, advances while the next
 * route is being prepared, and completes when App Router commits the new URL.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const finishTimer = useRef<number | null>(null);
  const trickleTimer = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (finishTimer.current !== null) window.clearTimeout(finishTimer.current);
    if (trickleTimer.current !== null) window.clearInterval(trickleTimer.current);
    finishTimer.current = null;
    trickleTimer.current = null;
  }, []);

  const start = useCallback(() => {
    clearTimers();
    setActive(true);
    setProgress(12);
    trickleTimer.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 88) return current;
        return Math.min(88, current + Math.max(1, (88 - current) * 0.12));
      });
    }, 180);
  }, [clearTimers]);

  const finish = useCallback(() => {
    clearTimers();
    setProgress(100);
    finishTimer.current = window.setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 180);
  }, [clearTimers]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const current = new URL(window.location.href);
      if (url.pathname === current.pathname && url.search === current.search) return;

      start();
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      clearTimers();
    };
  }, [start, clearTimers]);

  useEffect(() => {
    if (active) finish();
  }, [active, finish, pathname, searchParams]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]" aria-hidden="true">
      <div
        className="bg-brand h-full transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
      />
    </div>
  );
}
