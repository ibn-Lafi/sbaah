'use client';

import { useEffect, useRef } from 'react';

/**
 * React doesn't always reflect the `muted` JSX attribute onto the DOM
 * `.muted` property in time for the browser's autoplay check on first
 * paint — when that race is lost, autoplay is silently blocked and the
 * browser shows its native play button over a frozen first frame instead
 * of the video ever moving. Setting `.muted` imperatively via a ref
 * (before calling `.play()`) closes that gap reliably.
 */
export function HeroVideo({ src, className, style }: { src: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    void video.play().catch(() => {
      // Still blocked (very rare with muted+playsInline) — video just shows its first frame; no controls/play button is ever rendered either way.
    });
  }, []);

  return <video ref={ref} src={src} autoPlay muted loop playsInline className={className} style={style} />;
}
