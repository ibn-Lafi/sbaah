'use client';

import { useEffect, useRef, useState } from 'react';

function splitValue(value: string) {
  const match = value.trim().match(/^([^0-9]*)([0-9][0-9,.]*)(.*)$/);
  if (!match) return null;
  const rawNumber = match[2];
  if (!rawNumber) return null;
  const number = Number(rawNumber.replace(/,/g, ''));
  if (!Number.isFinite(number)) return null;
  return { prefix: match[1] ?? '', number, suffix: match[3] ?? '' };
}

export function LavenderStatsCounter({ value }: { value: string }) {
  const parsed = splitValue(value);
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!parsed || !ref.current) return;
    const node = ref.current;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      const started = performance.now();
      const duration = 1100;
      const tick = (now: number) => {
        const progress = Math.min((now - started) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(parsed.number * eased);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [parsed]);

  if (!parsed) return <span ref={ref}>{value}</span>;
  const decimals = parsed.number % 1 === 0 ? 0 : 1;
  return <span ref={ref}>{parsed.prefix}{display.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}{parsed.suffix}</span>;
}
