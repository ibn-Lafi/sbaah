import type { CSSProperties } from 'react';

/** Base pulsing placeholder block. Matches apps/dashboard/src/components/ui/skeleton.tsx. */
export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-md bg-surface-subtle-3 ${className}`} style={style} />;
}
