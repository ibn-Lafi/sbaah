'use client';

import { useEffect, useRef } from 'react';

export function HeroVideo({ src, className, style }: { src: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const playVideo = () => {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;

      if (video.paused) {
        void video.play().catch(() => undefined);
      }
    };

    playVideo();

    video.addEventListener('loadedmetadata', playVideo);
    video.addEventListener('canplay', playVideo);
    window.addEventListener('pageshow', playVideo);
    document.addEventListener('visibilitychange', playVideo);

    return () => {
      video.removeEventListener('loadedmetadata', playVideo);
      video.removeEventListener('canplay', playVideo);
      window.removeEventListener('pageshow', playVideo);
      document.removeEventListener('visibilitychange', playVideo);
    };
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      controls={false}
      className={className}
      style={style}
    />
  );
}
