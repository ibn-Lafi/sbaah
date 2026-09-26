'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

function splitValue(value: string) {
  const match = value.trim().match(/^([^0-9]*)([0-9][0-9,.]*)(.*)$/);
  if (!match) return null;
  const rawNumber = match[2];
  if (!rawNumber) return null;
  const number = Number(rawNumber.replace(/,/g, ''));
  if (!Number.isFinite(number)) return null;
  const decimals = rawNumber.includes('.') ? rawNumber.split('.')[1]?.length ?? 0 : 0;
  return { prefix: match[1] ?? '', number, suffix: match[3] ?? '', decimals };
}

export function LavenderStatsCounter({ value }: { value: string }) {
  const parsed = useMemo(() => splitValue(value), [value]);
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!parsed || !ref.current) return;
    setDisplay(0);
    const node = ref.current;
    let frame = 0;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      const started = performance.now();
      const duration = 1100;
      const tick = (now: number) => {
        const progress = Math.min((now - started) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(progress >= 1 ? parsed.number : parsed.number * eased);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.25 });
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [parsed]);

  if (!parsed) return <span ref={ref}>{value}</span>;
  return (
    <span ref={ref}>
      {parsed.prefix}
      {display.toLocaleString(undefined, {
        minimumFractionDigits: parsed.decimals,
        maximumFractionDigits: parsed.decimals,
      })}
      {parsed.suffix}
    </span>
  );
}
